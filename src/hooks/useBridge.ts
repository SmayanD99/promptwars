'use client';

import { useState, useCallback, useRef } from 'react';
import type { BridgeInput, BridgeOutput } from '@/types';

interface UseBridgeReturn {
  isLoading: boolean;
  error: string | null;
  result: BridgeOutput | null;
  sendRequest: (input: BridgeInput) => Promise<void>;
  reset: () => void;
}

/**
 * Hook for interacting with the /api/bridge endpoint.
 * Manages loading, error, and result state.
 */
export function useBridge(): UseBridgeReturn {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<BridgeOutput | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const sendRequest = useCallback(async (input: BridgeInput) => {
    // Abort any in-flight request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    const controller = new AbortController();
    abortControllerRef.current = controller;

    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch('/api/bridge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
        signal: controller.signal,
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(
          data.error || `Request failed with status ${response.status}`
        );
      }

      const data: BridgeOutput = await response.json();
      setResult(data);
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        return; // Silently ignore aborted requests
      }
      setError(
        err instanceof Error ? err.message : 'An unexpected error occurred'
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  const reset = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    setIsLoading(false);
    setError(null);
    setResult(null);
  }, []);

  return { isLoading, error, result, sendRequest, reset };
}
