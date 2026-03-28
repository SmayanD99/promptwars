'use client';

import { useState, useCallback, useRef, useEffect, useSyncExternalStore } from 'react';

/* eslint-disable @typescript-eslint/no-explicit-any */
interface SpeechRecognitionLike {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: ((event: any) => void) | null;
  onerror: ((event: any) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
  abort: () => void;
}
/* eslint-enable @typescript-eslint/no-explicit-any */

function getSpeechRecognitionSupport(): boolean {
  if (typeof window === 'undefined') return false;
  const win = window as unknown as Record<string, unknown>;
  return !!(win.SpeechRecognition || win.webkitSpeechRecognition);
}

interface UseVoiceInputReturn {
  isListening: boolean;
  transcript: string;
  isSupported: boolean;
  startListening: () => void;
  stopListening: () => void;
  resetTranscript: () => void;
  error: string | null;
}

/**
 * Hook for Web Speech API voice input.
 * Provides start/stop controls and real-time transcript.
 */
export function useVoiceInput(): UseVoiceInputReturn {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [error, setError] = useState<string | null>(null);
  const isSupported = useSyncExternalStore(
    () => () => {},
    getSpeechRecognitionSupport,
    () => false
  );
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);

  useEffect(() => {
    const win = window as unknown as Record<string, unknown>;
    const SpeechRecognitionCtor = win.SpeechRecognition || win.webkitSpeechRecognition;

    if (SpeechRecognitionCtor) {
      const Ctor = SpeechRecognitionCtor as new () => SpeechRecognitionLike;
      const recognition = new Ctor();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      recognition.onresult = (event: any) => {
        let finalTranscript = '';
        let interimTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const result = event.results[i];
          if (result.isFinal) {
            finalTranscript += result[0].transcript;
          } else {
            interimTranscript += result[0].transcript;
          }
        }

        setTranscript((prev) => {
          if (finalTranscript) {
            return prev + finalTranscript;
          }
          return prev + interimTranscript;
        });
      };

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      recognition.onerror = (event: any) => {
        setError(`Voice recognition error: ${event.error}`);
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
    };
  }, []);

  const startListening = useCallback(() => {
    if (recognitionRef.current && !isListening) {
      setError(null);
      setTranscript('');
      try {
        recognitionRef.current.start();
        setIsListening(true);
      } catch (e) {
        setError(
          `Could not start voice input: ${e instanceof Error ? e.message : 'Unknown error'}`
        );
      }
    }
  }, [isListening]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    }
  }, [isListening]);

  const resetTranscript = useCallback(() => {
    setTranscript('');
  }, []);

  return {
    isListening,
    transcript,
    isSupported,
    startListening,
    stopListening,
    resetTranscript,
    error,
  };
}
