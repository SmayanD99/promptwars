import { GoogleGenerativeAI, Part, SchemaType } from '@google/generative-ai';
import { BridgeOutputSchema, type ValidatedBridgeInput } from './schemas';
import { GEMINI_MODEL } from './constants';
import type { BridgeOutput } from '@/types';

/**
 * System prompt that instructs Gemini to act as a universal bridge.
 * It produces structured, actionable output from any unstructured input.
 */
const SYSTEM_PROMPT = `You are BridgeAI, a universal translator between unstructured human inputs and structured, actionable intelligence. Your purpose is to take ANY input — a photo, a voice transcription, a document, a description, a URL, or raw data — and convert it into clear, verified, structured actions that can save lives, save time, or simplify complexity.

CORE PRINCIPLES:
1. UNDERSTAND: Identify what the input is about, regardless of format or language.
2. STRUCTURE: Extract key facts, identify urgency, categorize the situation.
3. VERIFY: Cross-reference facts where possible. Flag uncertainty explicitly.
4. ACT: Provide clear, prioritized, actionable steps the user should take.
5. LOCATE: If relevant, identify physical locations (hospitals, shelters, offices) with coordinates.

RULES:
- Always produce valid JSON matching the required schema.
- Be compassionate but precise. Lives may depend on your accuracy.
- If you're unsure about something, say so in the warnings field.
- Never invent medical dosages, legal advice numbers, or financial figures.
- Always suggest professional consultation for medical, legal, or financial matters.
- If the input is in a non-English language, respond in that language while keeping field names in English.
- For images: describe what you see, extract any text (OCR), and analyze context.
- severity should reflect real urgency: "critical" = immediate danger, "high" = act today, "medium" = act this week, "low" = informational, "info" = general knowledge.
- Include at least one action item, even if it's just "No immediate action required."
- For locations, provide realistic latitude/longitude coordinates based on context clues.`;

/**
 * Initialize the Gemini client.
 * Throws if GEMINI_API_KEY is not set.
 */
function getGeminiClient(): GoogleGenerativeAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error(
      'GEMINI_API_KEY environment variable is required. Get one at https://aistudio.google.com/apikey'
    );
  }
  return new GoogleGenerativeAI(apiKey);
}

/**
 * Process a bridge request through Gemini.
 * Handles text, images, and files as multimodal input.
 * Returns structured, validated output.
 */
export async function processBridgeRequest(
  input: ValidatedBridgeInput
): Promise<BridgeOutput> {
  const genAI = getGeminiClient();
  const model = genAI.getGenerativeModel({
    model: GEMINI_MODEL,
    systemInstruction: SYSTEM_PROMPT,
    generationConfig: {
      responseMimeType: 'application/json',
      responseSchema: {
        type: SchemaType.OBJECT,
        properties: {
          summary: { type: SchemaType.STRING },
          category: { type: SchemaType.STRING },
          severity: {
            type: SchemaType.STRING,
            format: 'enum',
            enum: ['info', 'low', 'medium', 'high', 'critical'],
          },
          actions: {
            type: SchemaType.ARRAY,
            items: {
              type: SchemaType.OBJECT,
              properties: {
                title: { type: SchemaType.STRING },
                description: { type: SchemaType.STRING },
                priority: {
                  type: SchemaType.STRING,
                  format: 'enum',
                  enum: ['low', 'medium', 'high', 'urgent'],
                },
                type: {
                  type: SchemaType.STRING,
                  format: 'enum',
                  enum: ['call', 'navigate', 'checklist', 'link', 'download', 'info', 'warning'],
                },
                url: { type: SchemaType.STRING },
                phone: { type: SchemaType.STRING },
                steps: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
              },
              required: ['title', 'description', 'priority', 'type'],
            },
          },
          locations: {
            type: SchemaType.ARRAY,
            items: {
              type: SchemaType.OBJECT,
              properties: {
                name: { type: SchemaType.STRING },
                latitude: { type: SchemaType.NUMBER },
                longitude: { type: SchemaType.NUMBER },
                type: { type: SchemaType.STRING },
                address: { type: SchemaType.STRING },
              },
              required: ['name', 'latitude', 'longitude', 'type'],
            },
          },
          warnings: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
          keyFacts: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
          sourceVerification: { type: SchemaType.STRING },
        },
        required: [
          'summary',
          'category',
          'severity',
          'actions',
          'locations',
          'warnings',
          'keyFacts',
          'sourceVerification',
        ],
      },
    },
  });

  // Build multimodal parts array
  const parts: Part[] = [];

  // Add text content
  if (input.text) {
    let contextualText = input.text;
    if (input.latitude && input.longitude) {
      contextualText += `\n\n[User's approximate location: ${input.latitude}, ${input.longitude}]`;
    }
    parts.push({ text: contextualText });
  }

  // Add file/image content
  if (input.fileBase64 && input.fileMimeType) {
    parts.push({
      inlineData: {
        data: input.fileBase64,
        mimeType: input.fileMimeType,
      },
    });

    // If no text provided with image, add a generic prompt
    if (!input.text) {
      parts.push({
        text: 'Analyze this input thoroughly. Extract all relevant information, identify any urgency, and provide structured actionable steps.',
      });
    }
  }

  // Call Gemini
  const result = await model.generateContent(parts);
  const response = result.response;
  const text = response.text();

  // Parse and validate the JSON response
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new Error('Gemini returned invalid JSON. Please try again.');
  }

  // Validate against our Zod schema
  const validated = BridgeOutputSchema.safeParse(parsed);

  if (!validated.success) {
    console.error('Gemini output validation failed:', validated.error.format());
    throw new Error('AI response did not match expected format. Please try again.');
  }

  return {
    ...validated.data,
    timestamp: new Date().toISOString(),
  };
}
