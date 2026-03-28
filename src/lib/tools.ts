import { Client, TextSearchRequest } from '@googlemaps/google-maps-services-js';
import { FunctionDeclaration, SchemaType } from '@google/generative-ai';

const mapsClient = new Client({});

/**
 * Agentic tool function to find nearby hospitals, clinics, or trauma centers.
 * This is exposed to Gemini as a callable function.
 * Since the user has a demo API key, we use textSearch which is generally well-supported.
 */
export async function get_nearest_hospitals({
  latitude,
  longitude,
  query = 'hospital',
  radius = 5000,
}: {
  latitude: number;
  longitude: number;
  query?: string;
  radius?: number;
}) {
  const apiKey = process.env.GOOGLE_MAPS_SERVER_API_KEY || process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  
  if (!apiKey) {
    return {
      error: 'Google Maps API key not configured on server (GOOGLE_MAPS_SERVER_API_KEY).',
    };
  }

  try {
    const request: TextSearchRequest = {
      params: {
        query,
        location: { lat: latitude, lng: longitude },
        radius,
        key: apiKey,
      },
    };

    const response = await mapsClient.textSearch(request);
    
    // Transform output to be concise for Gemini Context
    if (response.data.results && response.data.results.length > 0) {
      return {
        success: true,
        results: response.data.results.slice(0, 5).map((place) => ({
          name: place.name,
          address: place.formatted_address,
          latitude: place.geometry?.location.lat,
          longitude: place.geometry?.location.lng,
          rating: place.rating,
          open_now: place.opening_hours?.open_now,
        })),
      };
    } else {
      return {
        success: true,
        results: [],
        message: 'No medical facilities found nearby.',
      };
    }

  } catch (error) {
    console.error('Google Maps API Tool Error:', error);
    return {
      success: false,
      error: 'Failed to fetch places from Google Maps API due to an internal error or quota issue.',
    };
  }
}

const getNearestHospitalsDecl: FunctionDeclaration = {
  name: 'get_nearest_hospitals',
  description: 'Finds nearby hospitals, clinics, or trauma centers based on latitude and longitude coordinates. Call this when you need real, specific medical facilities to dispatch the user to.',
  parameters: {
    type: SchemaType.OBJECT,
    properties: {
      latitude: {
        type: SchemaType.NUMBER,
        description: 'Latitude coordinate of the emergency',
      },
      longitude: {
        type: SchemaType.NUMBER,
        description: 'Longitude coordinate of the emergency',
      },
      query: {
        type: SchemaType.STRING,
        description: 'The type of facility to search for (e.g., "Level 1 Trauma Center", "Emergency Vet", "Hospital")',
      },
      radius: {
        type: SchemaType.NUMBER,
        description: 'Radius in meters (default 5000)',
      },
    },
    required: ['latitude', 'longitude'],
  },
};

/**
 * Definitions to pass to Gemini's `tools` array
 */
export const pulseBridgeTools = [
  {
    functionDeclarations: [getNearestHospitalsDecl],
  },
  { googleSearch: {} }
];
