import { describe, it, expect, beforeEach } from 'vitest';
import { rateLimiter } from '../src/lib/rate-limit';

describe('RateLimiter', () => {
  beforeEach(() => {
    rateLimiter.reset();
  });

  it('allows first request', () => {
    const result = rateLimiter.check('127.0.0.1');
    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(9);
  });

  it('allows requests under limit', () => {
    for (let i = 0; i < 9; i++) {
      const result = rateLimiter.check('127.0.0.1');
      expect(result.allowed).toBe(true);
    }
  });

  it('blocks requests over limit', () => {
    for (let i = 0; i < 10; i++) {
      rateLimiter.check('127.0.0.1');
    }
    const result = rateLimiter.check('127.0.0.1');
    expect(result.allowed).toBe(false);
    expect(result.remaining).toBe(0);
    expect(result.retryAfterMs).toBeGreaterThan(0);
  });

  it('tracks different IPs independently', () => {
    for (let i = 0; i < 10; i++) {
      rateLimiter.check('127.0.0.1');
    }
    const blockedResult = rateLimiter.check('127.0.0.1');
    expect(blockedResult.allowed).toBe(false);

    // Different IP should still be allowed
    const allowedResult = rateLimiter.check('192.168.1.1');
    expect(allowedResult.allowed).toBe(true);
  });

  it('returns correct remaining count', () => {
    const r1 = rateLimiter.check('10.0.0.1');
    expect(r1.remaining).toBe(9);

    const r2 = rateLimiter.check('10.0.0.1');
    expect(r2.remaining).toBe(8);

    const r3 = rateLimiter.check('10.0.0.1');
    expect(r3.remaining).toBe(7);
  });
});
