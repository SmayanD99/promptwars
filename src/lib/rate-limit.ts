import { RATE_LIMIT_MAX, RATE_LIMIT_WINDOW_MS } from './constants';

interface RateLimitEntry {
  timestamps: number[];
}

/**
 * In-memory sliding window rate limiter.
 * Tracks request timestamps per IP and rejects if limit exceeded.
 */
class RateLimiter {
  private store: Map<string, RateLimitEntry> = new Map();
  private cleanupInterval: ReturnType<typeof setInterval> | null = null;

  constructor() {
    // Periodically clean up expired entries
    this.cleanupInterval = setInterval(() => this.cleanup(), RATE_LIMIT_WINDOW_MS * 2);
  }

  /**
   * Check if a request from the given IP is allowed.
   * Returns { allowed, remaining, retryAfterMs }
   */
  check(ip: string): {
    allowed: boolean;
    remaining: number;
    retryAfterMs: number;
  } {
    const now = Date.now();
    const entry = this.store.get(ip);

    if (!entry) {
      this.store.set(ip, { timestamps: [now] });
      return { allowed: true, remaining: RATE_LIMIT_MAX - 1, retryAfterMs: 0 };
    }

    // Filter out timestamps outside the current window
    entry.timestamps = entry.timestamps.filter(
      (ts) => now - ts < RATE_LIMIT_WINDOW_MS
    );

    if (entry.timestamps.length >= RATE_LIMIT_MAX) {
      const oldestInWindow = entry.timestamps[0];
      const retryAfterMs = RATE_LIMIT_WINDOW_MS - (now - oldestInWindow);
      return {
        allowed: false,
        remaining: 0,
        retryAfterMs: Math.max(0, retryAfterMs),
      };
    }

    entry.timestamps.push(now);
    return {
      allowed: true,
      remaining: RATE_LIMIT_MAX - entry.timestamps.length,
      retryAfterMs: 0,
    };
  }

  /** Remove entries that have no timestamps in the current window */
  private cleanup(): void {
    const now = Date.now();
    for (const [ip, entry] of this.store.entries()) {
      entry.timestamps = entry.timestamps.filter(
        (ts) => now - ts < RATE_LIMIT_WINDOW_MS
      );
      if (entry.timestamps.length === 0) {
        this.store.delete(ip);
      }
    }
  }

  /** For testing: reset all entries */
  reset(): void {
    this.store.clear();
  }

  /** For cleanup */
  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
  }
}

// Singleton instance
export const rateLimiter = new RateLimiter();
