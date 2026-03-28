import { z } from 'zod';
import { MAX_FILE_SIZE_BYTES, MAX_TEXT_LENGTH, ALLOWED_MIME_TYPES } from './constants';

/**
 * Schema for validating incoming bridge request input.
 * At least one of text or file must be provided.
 */
export const BridgeInputSchema = z
  .object({
    text: z
      .string()
      .max(MAX_TEXT_LENGTH, `Text must be under ${MAX_TEXT_LENGTH} characters`)
      .optional(),
    fileBase64: z.string().optional(),
    fileMimeType: z
      .enum(ALLOWED_MIME_TYPES as unknown as [string, ...string[]])
      .optional(),
    fileName: z.string().max(255).optional(),
    language: z.string().max(10).default('en'),
    latitude: z.number().min(-90).max(90).optional(),
    longitude: z.number().min(-180).max(180).optional(),
  })
  .refine(
    (data) => data.text || data.fileBase64,
    'At least one of text or file must be provided'
  )
  .refine(
    (data) => {
      if (data.fileBase64) {
        const sizeBytes = Math.ceil((data.fileBase64.length * 3) / 4);
        return sizeBytes <= MAX_FILE_SIZE_BYTES;
      }
      return true;
    },
    `File must be under ${MAX_FILE_SIZE_BYTES / (1024 * 1024)}MB`
  )
  .refine(
    (data) => {
      if (data.fileBase64 && !data.fileMimeType) return false;
      return true;
    },
    'fileMimeType is required when fileBase64 is provided'
  );

/** Schema for an individual action item from Gemini output */
export const ActionItemSchema = z.object({
  title: z.string(),
  description: z.string(),
  priority: z.enum(['low', 'medium', 'high', 'urgent']),
  type: z.enum(['call', 'navigate', 'checklist', 'link', 'download', 'info', 'warning']),
  url: z.string().optional(),
  phone: z.string().optional(),
  steps: z.array(z.string()).optional(),
});

/** Schema for a location marker */
export const LocationMarkerSchema = z.object({
  name: z.string(),
  latitude: z.number(),
  longitude: z.number(),
  type: z.string(),
  address: z.string().optional(),
});

/**
 * Schema for validating the structured output from Gemini.
 * This is used both as the JSON schema sent to Gemini and to validate its response.
 */
export const BridgeOutputSchema = z.object({
  summary: z.string().describe('A clear, concise summary of the input and situation'),
  category: z
    .string()
    .describe('Category of the request, e.g. Medical, Legal, Transit, Weather, Finance, General'),
  severity: z
    .enum(['info', 'low', 'medium', 'high', 'critical'])
    .describe('Severity/urgency level of the situation'),
  actions: z
    .array(ActionItemSchema)
    .describe('Ordered list of recommended actions the user should take'),
  locations: z
    .array(LocationMarkerSchema)
    .describe('Relevant locations to show on a map (hospitals, shelters, etc.). Can be empty.'),
  warnings: z
    .array(z.string())
    .describe('Important warnings or caveats about the information provided'),
  keyFacts: z
    .array(z.string())
    .describe('Key facts extracted from the input'),
  sourceVerification: z
    .string()
    .describe('Statement about how the information was verified or its reliability'),
});

export type ValidatedBridgeInput = z.infer<typeof BridgeInputSchema>;
export type ValidatedBridgeOutput = z.infer<typeof BridgeOutputSchema>;
