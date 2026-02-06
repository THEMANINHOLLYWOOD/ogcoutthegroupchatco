import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface LocationData {
  city: string | null;
  state: string | null;
  country: string | null;
  countryCode: string | null;
}

interface UseLocationDetectionReturn {
  location: LocationData | null;
  isLoading: boolean;
  error: string | null;
  detectLocation: () => Promise<void>;
  reset: () => void;
}

export const useLocationDetection = (): UseLocationDetectionReturn => {
  const [location, setLocation] = useState<LocationData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const detectLocation = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Check if geolocation is supported
      if (!navigator.geolocation) {
        throw new Error('Geolocation is not supported by your browser');
      }

      // Get current position
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: false,
          timeout: 10000,
          maximumAge: 300000, // Cache for 5 minutes
        });
      });

      const { latitude, longitude } = position.coords;
      console.log('Got coordinates:', latitude, longitude);

      // Call edge function for reverse geocoding
      const { data, error: fnError } = await supabase.functions.invoke('reverse-geocode', {
        body: { latitude, longitude },
      });

      if (fnError) {
        throw new Error(fnError.message || 'Failed to determine your location');
      }

      if (data.error) {
        throw new Error(data.error);
      }

      setLocation({
        city: data.city,
        state: data.state,
        country: data.country,
        countryCode: data.countryCode,
      });
    } catch (err) {
      console.error('Location detection error:', err);
      
      if (err instanceof GeolocationPositionError) {
        switch (err.code) {
          case err.PERMISSION_DENIED:
            setError('Location permission was denied. You can add places manually.');
            break;
          case err.POSITION_UNAVAILABLE:
            setError('Location information is unavailable.');
            break;
          case err.TIMEOUT:
            setError('Location request timed out. Please try again.');
            break;
          default:
            setError('An unknown error occurred.');
        }
      } else {
        setError(err instanceof Error ? err.message : 'Failed to detect location');
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  const reset = useCallback(() => {
    setLocation(null);
    setError(null);
    setIsLoading(false);
  }, []);

  return {
    location,
    isLoading,
    error,
    detectLocation,
    reset,
  };
};
