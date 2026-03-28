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

/** Schema for service provider in the Action Table */
export const ServiceProviderSchema = z.object({
  name: z.string(),
  specialty: z.string(),
  eta: z.string(),
  contact: z.string(),
  verificationStatus: z.string(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  address: z.string().optional(),
});

/** Schema for the handover card */
export const HandoverCardSchema = z.object({
  emergencyType: z.string(),
  detectedLanguage: z.string(),
  translatedSummary: z.string(),
  entityData: z.record(z.string(), z.string()),
  timestamp: z.string(),
});

/**
 * Schema for validating the structured output from Gemini.
 * PulseBridge Emergency Dispatch format: STATUS → IMMEDIATE INSTRUCTION → ACTION TABLE → HANDOVER CARD
 */
export const BridgeOutputSchema = z.object({
  status: z.enum(['Urgent', 'Critical', 'Informational']).describe('Emergency status level'),
  immediateInstruction: z.string().describe('Max 10 words: immediate action to take NOW'),
  summary: z.string().describe('Clear situation summary with detected emergency category'),
  category: z.string().describe('Emergency category: Medical, Road Accident, Fire, Critical Infrastructure, Plumbing, Electric, or General'),
  severity: z.enum(['info', 'low', 'medium', 'high', 'critical']).describe('Severity/urgency level'),
  actions: z.array(ActionItemSchema).describe('Ordered list of recommended actions'),
  serviceProviders: z.array(ServiceProviderSchema).describe('Nearby service providers with contact, specialty, ETA, and verification'),
  locations: z.array(LocationMarkerSchema).describe('Relevant locations for the map (hospitals, stations, etc.)'),
  handoverCard: HandoverCardSchema.describe('Structured entity data for responders arriving on scene'),
  warnings: z.array(z.string()).describe('Important warnings or caveats'),
  keyFacts: z.array(z.string()).describe('Key facts extracted from the input'),
  sourceVerification: z.string().describe('How the information was verified'),
});

export type ValidatedBridgeInput = z.infer<typeof BridgeInputSchema>;
export type ValidatedBridgeOutput = z.infer<typeof BridgeOutputSchema>;
