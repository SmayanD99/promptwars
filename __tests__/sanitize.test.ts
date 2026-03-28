import { describe, it, expect } from 'vitest';
import { sanitizeTextInput, validateFileUpload, sanitizeUrl } from '../src/lib/sanitize';

describe('sanitizeTextInput', () => {
  it('strips HTML tags', () => {
    expect(sanitizeTextInput('<script>alert("xss")</script>Hello')).toBe('alert("xss")Hello');
  });

  it('strips nested HTML', () => {
    expect(sanitizeTextInput('<div><p>Text</p></div>')).toBe('Text');
  });

  it('removes null bytes', () => {
    expect(sanitizeTextInput('Hello\0World')).toBe('HelloWorld');
  });

  it('trims whitespace', () => {
    expect(sanitizeTextInput('  hello  ')).toBe('hello');
  });

  it('enforces max length', () => {
    const long = 'a'.repeat(20000);
    expect(sanitizeTextInput(long).length).toBe(10000);
  });

  it('returns empty string for empty input', () => {
    expect(sanitizeTextInput('')).toBe('');
  });

  it('preserves normal text', () => {
    expect(sanitizeTextInput('My head hurts and I feel dizzy')).toBe(
      'My head hurts and I feel dizzy'
    );
  });
});

describe('validateFileUpload', () => {
  it('accepts valid JPEG', () => {
    expect(validateFileUpload('aGVsbG8=', 'image/jpeg')).toBeNull();
  });

  it('accepts valid PNG', () => {
    expect(validateFileUpload('aGVsbG8=', 'image/png')).toBeNull();
  });

  it('accepts valid PDF', () => {
    expect(validateFileUpload('aGVsbG8=', 'application/pdf')).toBeNull();
  });

  it('rejects unsupported MIME type', () => {
    const error = validateFileUpload('aGVsbG8=', 'application/zip');
    expect(error).toBeTruthy();
    expect(error).toContain('Unsupported file type');
  });

  it('rejects oversized file', () => {
    // 15MB in base64 (roughly)
    const largeBase64 = 'a'.repeat(15 * 1024 * 1024 * 4 / 3);
    const error = validateFileUpload(largeBase64, 'image/jpeg');
    expect(error).toBeTruthy();
    expect(error).toContain('too large');
  });
});

describe('sanitizeUrl', () => {
  it('accepts valid HTTPS URL', () => {
    expect(sanitizeUrl('https://example.com')).toBe('https://example.com/');
  });

  it('accepts valid HTTP URL', () => {
    expect(sanitizeUrl('http://example.com/path')).toBe(
      'http://example.com/path'
    );
  });

  it('rejects javascript: URLs', () => {
    expect(sanitizeUrl('javascript:alert(1)')).toBeNull();
  });

  it('rejects data: URLs', () => {
    expect(sanitizeUrl('data:text/html,<h1>hi</h1>')).toBeNull();
  });

  it('rejects invalid URLs', () => {
    expect(sanitizeUrl('not a url')).toBeNull();
  });

  it('rejects ftp: URLs', () => {
    expect(sanitizeUrl('ftp://example.com')).toBeNull();
  });
});
