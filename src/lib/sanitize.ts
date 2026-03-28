import { ALLOWED_MIME_TYPES, MAX_FILE_SIZE_BYTES, MAX_TEXT_LENGTH } from './constants';

/**
 * Sanitize text input by stripping HTML tags and trimming length.
 * This is a server-side sanitization layer.
 */
export function sanitizeTextInput(input: string): string {
  // Strip HTML tags
  let cleaned = input.replace(/<[^>]*>/g, '');

  // Remove null bytes
  cleaned = cleaned.replace(/\0/g, '');

  // Trim whitespace
  cleaned = cleaned.trim();

  // Enforce length limit
  if (cleaned.length > MAX_TEXT_LENGTH) {
    cleaned = cleaned.slice(0, MAX_TEXT_LENGTH);
  }

  return cleaned;
}

/**
 * Validate a file upload.
 * Returns an error message if invalid, or null if valid.
 */
export function validateFileUpload(
  base64: string,
  mimeType: string
): string | null {
  // Check MIME type
  if (!ALLOWED_MIME_TYPES.includes(mimeType as (typeof ALLOWED_MIME_TYPES)[number])) {
    return `Unsupported file type: ${mimeType}. Allowed: ${ALLOWED_MIME_TYPES.join(', ')}`;
  }

  // Check file size (estimate from base64)
  const estimatedSize = Math.ceil((base64.length * 3) / 4);
  if (estimatedSize > MAX_FILE_SIZE_BYTES) {
    return `File too large (${(estimatedSize / (1024 * 1024)).toFixed(1)}MB). Maximum: ${MAX_FILE_SIZE_BYTES / (1024 * 1024)}MB`;
  }

  // Validate base64 encoding
  const base64Regex = /^[A-Za-z0-9+/]*={0,2}$/;
  if (!base64Regex.test(base64)) {
    return 'Invalid file encoding';
  }

  return null;
}

/**
 * Sanitize a URL input.
 * Returns sanitized URL or null if invalid.
 */
export function sanitizeUrl(url: string): string | null {
  try {
    const parsed = new URL(url);
    // Only allow http and https
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      return null;
    }
    return parsed.toString();
  } catch {
    return null;
  }
}
