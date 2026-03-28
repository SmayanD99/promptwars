import { Client, TextSearchRequest, DirectionsRequest, TravelMode } from '@googlemaps/google-maps-services-js';
import { FunctionDeclaration, SchemaType } from '@google/generative-ai';

const mapsClient = new Client({});

/**
 * Agentic tool function to find nearby hospitals, clinics, or trauma centers.
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
      error: 'Failed to fetch places from Google Maps API.',
    };
  }
}

/**
 * Agentic tool function to calculate ETAs and traffic.
 */
export async function get_route_traffic({
  origin_lat,
  origin_lng,
  destination_name,
}: {
  origin_lat: number;
  origin_lng: number;
  destination_name: string;
}) {
  const apiKey = process.env.GOOGLE_MAPS_SERVER_API_KEY || process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  
  if (!apiKey) {
    return { error: 'Google Maps API key not configured.' };
  }

  try {
    const request: DirectionsRequest = {
      params: {
        origin: `${origin_lat},${origin_lng}`,
        destination: destination_name,
        mode: TravelMode.driving,
        departure_time: 'now',
        key: apiKey,
      },
    };

    const response = await mapsClient.directions(request);

    if (response.data.routes && response.data.routes.length > 0) {
      const route = response.data.routes[0];
      const leg = route.legs[0];
      return {
        success: true,
        destination: destination_name,
        distance: leg.distance.text,
        standard_duration: leg.duration.text,
        traffic_duration: leg.duration_in_traffic ? leg.duration_in_traffic.text : 'Unknown',
        warnings: route.warnings,
      };
    } else {
      return { success: false, message: 'No routes found.' };
    }
  } catch (error) {
    console.error('Google Maps Traffic Tool Error:', error);
    return { success: false, error: 'Failed to fetch directions/traffic.' };
  }
}

/**
 * Agentic tool function to fetch current weather context based on coordinates.
 */
export async function get_weather_info({ latitude, longitude }: { latitude: number; longitude: number; }) {
  try {
    const res = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,wind_speed_10m,precipitation,weather_code&timezone=auto`);
    if (!res.ok) throw new Error('API Response not ok');
    const data = await res.json();
    return { success: true, current: data.current };
  } catch (e) {
    return { success: false, error: 'Could not fetch weather data.' };
  }
}

/**
 * Agentic tool function to search news and critical alerts online.
 * Relies on the Google Search functionality by returning an instruction.
 */
export async function search_news_alerts({ query }: { query: string; }) {
  return {
    success: true,
    message: `For news and crisis alerts regarding "${query}", the agent should synthesize information from its native Google Search Grounding. No direct API call needed here, this is a marker for the agent's internal reasoning to use Search.`
  };
}

// ----- DECLARATIONS -----

const getNearestHospitalsDecl: FunctionDeclaration = {
  name: 'get_nearest_hospitals',
  description: 'Finds nearby hospitals, clinics, or trauma centers based on latitude and longitude coordinates. Call this when you need real, specific medical facilities.',
  parameters: {
    type: SchemaType.OBJECT,
    properties: {
      latitude: { type: SchemaType.NUMBER, description: 'Latitude coordinate of the emergency' },
      longitude: { type: SchemaType.NUMBER, description: 'Longitude coordinate of the emergency' },
      query: { type: SchemaType.STRING, description: 'The type of facility to search for (e.g., "Level 1 Trauma Center", "Emergency Vet", "Hospital")' },
      radius: { type: SchemaType.NUMBER, description: 'Radius in meters (default 5000)' },
    },
    required: ['latitude', 'longitude'],
  },
};

const getRouteTrafficDecl: FunctionDeclaration = {
  name: 'get_route_traffic',
  description: 'Calculates the real-time driving traffic ETA. Use this in PARALLEL with get_nearest_hospitals if you know a general destination.',
  parameters: {
    type: SchemaType.OBJECT,
    properties: {
      origin_lat: { type: SchemaType.NUMBER, description: 'Latitude of the user or emergency' },
      origin_lng: { type: SchemaType.NUMBER, description: 'Longitude of the user or emergency' },
      destination_name: { type: SchemaType.STRING, description: 'Name or address of the destination' },
    },
    required: ['origin_lat', 'origin_lng', 'destination_name'],
  },
};

const getWeatherInfoDecl: FunctionDeclaration = {
  name: 'get_weather_info',
  description: 'Fetches real-time weather information for the specified coordinates. Highly relevant for natural disasters, fires, or exposure cases.',
  parameters: {
    type: SchemaType.OBJECT,
    properties: {
      latitude: { type: SchemaType.NUMBER, description: 'Latitude coordinate' },
      longitude: { type: SchemaType.NUMBER, description: 'Longitude coordinate' },
    },
    required: ['latitude', 'longitude'],
  },
};

const searchNewsAlertsDecl: FunctionDeclaration = {
  name: 'search_news_alerts',
  description: 'Signals the need to fetch latest news, crisis alerts, or conflict information for a region.',
  parameters: {
    type: SchemaType.OBJECT,
    properties: {
      query: { type: SchemaType.STRING, description: 'Search query for the news or alerts (e.g., "War zone updates in X")' },
    },
    required: ['query'],
  },
};

/**
 * Definitions to pass to Gemini's `tools` array
 */
export const pulseBridgeTools = [
  {
    functionDeclarations: [getNearestHospitalsDecl, getRouteTrafficDecl, getWeatherInfoDecl, searchNewsAlertsDecl],
  },
  { googleSearch: {} } // Enable native Google web search capabilities
];

export const agenticToolsRegistry: Record<string, Function> = {
  get_nearest_hospitals: get_nearest_hospitals as Function,
  get_route_traffic: get_route_traffic as Function,
  get_weather_info: get_weather_info as Function,
  search_news_alerts: search_news_alerts as Function,
};
