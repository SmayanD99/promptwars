'use client';

import { useState, useCallback } from 'react';

interface UseGeolocationReturn {
  latitude: number | null;
  longitude: number | null;
  isLoading: boolean;
  error: string | null;
  requestLocation: () => void;
}

/**
 * Hook for requesting user geolocation via the browser Geolocation API.
 */
export function useGeolocation(): UseGeolocationReturn {
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const requestLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser');
      return;
    }

    setIsLoading(true);
    setError(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLatitude(position.coords.latitude);
        setLongitude(position.coords.longitude);
        setIsLoading(false);
      },
      (err) => {
        setError(`Location access denied: ${err.message}`);
        setIsLoading(false);
      },
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 300000 }
    );
  }, []);

  return { latitude, longitude, isLoading, error, requestLocation };
}
