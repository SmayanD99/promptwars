/**
 * Application-wide constants for PulseBridge / BridgeAI.
 * Centralized for production-grade maintainability and hackathon configuration.
 */

/** Maximum text input length in characters */
export const MAX_TEXT_LENGTH = 10000;

/** Maximum file upload size in bytes (10MB) */
export const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024;

/** Allowed MIME types for file uploads */
export const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'application/pdf',
  'text/plain',
] as const;

/** Rate limit: max requests per window */
export const RATE_LIMIT_MAX_REQUESTS = 10;
export const RATE_LIMIT_WINDOW_MS = 60 * 1000;

/** Gemini model to use - Gemini 3 Flash is specifically requested for performance */
export const GEMINI_MODEL = 'gemini-3-flash-preview';

/** App metadata */
export const APP_NAME = 'BridgeAI';
export const APP_DESCRIPTION =
  'Emergency Dispatch Agent — Transform messy real-world inputs into structured, life-saving actions powered by Gemini 3 Flash.';

/** Example inputs for quick use */
export const INPUT_EXAMPLES = [
  'I fell off my bike and my arm is bent at an odd angle. I\'m bleeding from my knee.',
  'There is a major water leak in my basement. Water is spraying from a pipe near the heater.',
  'I see smoke coming from the apartment next door and I smell burning plastic.',
  'Car accident on highway, two vehicles involved, one person is not responding.',
  'My elderly mother\'s blood pressure report shows 180/110 and she\'s complaining of headache.',
  'Power lines are down on my street after the storm. Sparks are visible.',
];

/**
 * Modern Design System Theme Constants.
 * Centralizing colors, icons, and status labels for UI consistency and maintainability.
 */
export const THEME = {
  status: {
    Critical: { color: '#ef4444', icon: '🚨', bgClass: 'bg-critical' },
    Urgent: { color: '#f97316', icon: '⚠️', bgClass: 'bg-urgent' },
    Informational: { color: '#60a5fa', icon: 'ℹ️', bgClass: 'bg-info' },
  },
  priorities: {
    urgent: { color: '#ef4444', icon: '🔴', bg: 'rgba(239, 68, 68, 0.15)' },
    high: { color: '#f97316', icon: '🟠', bg: 'rgba(249, 115, 22, 0.15)' },
    medium: { color: '#fbbf24', icon: '🟡', bg: 'rgba(251, 191, 36, 0.15)' },
    low: { color: '#60a5fa', icon: '🔵', bg: 'rgba(96, 165, 250, 0.15)' },
  },
  actionTypes: {
    call: '📞',
    navigate: '🗺️',
    checklist: '✅',
    link: '🔗',
    download: '📥',
    info: 'ℹ️',
    warning: '⚠️',
  },
} as const;
