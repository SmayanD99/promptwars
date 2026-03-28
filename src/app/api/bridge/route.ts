import { NextRequest, NextResponse } from 'next/server';
import { BridgeInputSchema } from '@/lib/schemas';
import { sanitizeTextInput, validateFileUpload } from '@/lib/sanitize';
import { rateLimiter } from '@/lib/rate-limit';
import { processBridgeRequest } from '@/lib/gemini';

/**
 * POST /api/bridge
 * Main AI processing endpoint.
 * Accepts multimodal input and returns structured actions.
 */
export async function POST(request: NextRequest) {
  try {
    // --- Rate Limiting ---
    const ip =
      request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
      request.headers.get('x-real-ip') ||
      'unknown';

    const rateCheck = rateLimiter.check(ip);
    if (!rateCheck.allowed) {
      return NextResponse.json(
        {
          error: 'Too many requests. Please wait before trying again.',
          retryAfterMs: rateCheck.retryAfterMs,
        },
        {
          status: 429,
          headers: {
            'Retry-After': String(Math.ceil(rateCheck.retryAfterMs / 1000)),
            'X-RateLimit-Remaining': '0',
          },
        }
      );
    }

    // --- Parse Body ---
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: 'Invalid JSON in request body' },
        { status: 400 }
      );
    }

    // --- Validate Input ---
    const validation = BridgeInputSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        {
          error: 'Invalid input',
          details: validation.error.issues.map((i) => i.message),
        },
        { status: 400 }
      );
    }

    const input = validation.data;

    // --- Sanitize ---
    if (input.text) {
      input.text = sanitizeTextInput(input.text);
    }

    if (input.fileBase64 && input.fileMimeType) {
      const fileError = validateFileUpload(input.fileBase64, input.fileMimeType);
      if (fileError) {
        return NextResponse.json({ error: fileError }, { status: 400 });
      }
    }

    // --- Process with Gemini ---
    const result = await processBridgeRequest(input);

    return NextResponse.json(result, {
      status: 200,
      headers: {
        'X-RateLimit-Remaining': String(rateCheck.remaining),
        'Cache-Control': 'no-store',
      },
    });
  } catch (error) {
    console.error('Bridge API error:', error);

    const message =
      error instanceof Error ? error.message : 'An unexpected error occurred';

    // Don't leak internal errors to client
    const isGeminiKeyError = message.includes('GEMINI_API_KEY');
    const clientMessage = isGeminiKeyError
      ? 'Service configuration error. Please contact the administrator.'
      : message;

    return NextResponse.json(
      { error: clientMessage },
      { status: isGeminiKeyError ? 503 : 500 }
    );
  }
}
