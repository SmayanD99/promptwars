/** Maximum file size for uploads (10MB) */
export const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024;

/** Maximum text input length (characters) */
export const MAX_TEXT_LENGTH = 10000;

/** Allowed MIME types for file upload */
export const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'application/pdf',
  'text/plain',
  'text/csv',
] as const;

/** Rate limit: max requests per window */
export const RATE_LIMIT_MAX = 10;

/** Rate limit: window duration in milliseconds (1 minute) */
export const RATE_LIMIT_WINDOW_MS = 60 * 1000;

/** Gemini model to use */
export const GEMINI_MODEL = 'gemini-3-flash-preview';

/** App metadata */
export const APP_NAME = 'BridgeAI';
export const APP_DESCRIPTION =
  'Universal bridge between human intent and complex systems. Transform unstructured inputs into structured, verified actions.';
export const APP_URL = 'https://bridgeai.app';

/** Input placeholder examples */
export const INPUT_EXAMPLES = [
  'Upload a photo of medicine bottles to check for interactions',
  'Paste a weather alert to get an evacuation plan',
  'Describe symptoms in any language for triage guidance',
  'Upload a legal notice for a plain-language summary',
  'Share a transit schedule to find the best route',
  'Upload a medical bill for cost breakdown',
] as const;

/** Severity colors (HSL) */
export const SEVERITY_COLORS: Record<string, string> = {
  info: '210, 100%, 60%',
  low: '150, 70%, 50%',
  medium: '45, 100%, 55%',
  high: '25, 100%, 55%',
  critical: '0, 85%, 55%',
} as const;
