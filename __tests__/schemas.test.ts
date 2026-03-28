import { describe, it, expect } from 'vitest';
import { BridgeInputSchema, BridgeOutputSchema } from '../src/lib/schemas';

describe('BridgeInputSchema', () => {
  it('accepts valid text input', () => {
    const result = BridgeInputSchema.safeParse({
      text: 'I have a headache and fever',
      language: 'en',
    });
    expect(result.success).toBe(true);
  });

  it('accepts valid file input', () => {
    const result = BridgeInputSchema.safeParse({
      fileBase64: 'aGVsbG8=',
      fileMimeType: 'image/jpeg',
      fileName: 'test.jpg',
    });
    expect(result.success).toBe(true);
  });

  it('accepts text + file together', () => {
    const result = BridgeInputSchema.safeParse({
      text: 'What is this document about?',
      fileBase64: 'aGVsbG8=',
      fileMimeType: 'application/pdf',
      fileName: 'doc.pdf',
    });
    expect(result.success).toBe(true);
  });

  it('rejects empty input (no text or file)', () => {
    const result = BridgeInputSchema.safeParse({
      language: 'en',
    });
    expect(result.success).toBe(false);
  });

  it('rejects file without mimeType', () => {
    const result = BridgeInputSchema.safeParse({
      fileBase64: 'aGVsbG8=',
    });
    expect(result.success).toBe(false);
  });

  it('rejects unsupported MIME type', () => {
    const result = BridgeInputSchema.safeParse({
      fileBase64: 'aGVsbG8=',
      fileMimeType: 'application/zip',
    });
    expect(result.success).toBe(false);
  });

  it('rejects text over max length', () => {
    const result = BridgeInputSchema.safeParse({
      text: 'a'.repeat(10001),
    });
    expect(result.success).toBe(false);
  });

  it('accepts valid coordinates', () => {
    const result = BridgeInputSchema.safeParse({
      text: 'Find nearest hospital',
      latitude: 37.7749,
      longitude: -122.4194,
    });
    expect(result.success).toBe(true);
  });

  it('rejects invalid coordinates', () => {
    const result = BridgeInputSchema.safeParse({
      text: 'Find nearest hospital',
      latitude: 200,
      longitude: -122.4194,
    });
    expect(result.success).toBe(false);
  });
});

describe('BridgeOutputSchema', () => {
  const validOutput = {
    summary: 'Test summary',
    category: 'Medical',
    severity: 'medium' as const,
    actions: [
      {
        title: 'See a doctor',
        description: 'Visit your primary care physician',
        priority: 'high' as const,
        type: 'navigate' as const,
      },
    ],
    locations: [],
    warnings: ['This is not medical advice'],
    keyFacts: ['Fever detected'],
    sourceVerification: 'Based on general medical knowledge',
  };

  it('accepts valid output', () => {
    const result = BridgeOutputSchema.safeParse(validOutput);
    expect(result.success).toBe(true);
  });

  it('rejects missing required fields', () => {
    const { summary, ...withoutSummary } = validOutput;
    void summary;
    const result = BridgeOutputSchema.safeParse(withoutSummary);
    expect(result.success).toBe(false);
  });

  it('rejects invalid severity', () => {
    const result = BridgeOutputSchema.safeParse({
      ...validOutput,
      severity: 'extreme',
    });
    expect(result.success).toBe(false);
  });

  it('accepts output with locations', () => {
    const result = BridgeOutputSchema.safeParse({
      ...validOutput,
      locations: [
        {
          name: 'City Hospital',
          latitude: 37.7749,
          longitude: -122.4194,
          type: 'Hospital',
          address: '123 Main St',
        },
      ],
    });
    expect(result.success).toBe(true);
  });

  it('accepts output with action steps', () => {
    const result = BridgeOutputSchema.safeParse({
      ...validOutput,
      actions: [
        {
          ...validOutput.actions[0],
          steps: ['Step 1', 'Step 2'],
          url: 'https://example.com',
        },
      ],
    });
    expect(result.success).toBe(true);
  });
});
