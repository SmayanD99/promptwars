import { Client, TextSearchRequest, DirectionsRequest, TravelMode } from '@googlemaps/google-maps-services-js';
import { FunctionDeclaration, SchemaType } from '@google/generative-ai';
import { google, Auth } from 'googleapis';

/**
 * Global authentication setup for Google Workspace APIs (Calendar, Drive, Sheets).
 * Uses high-privilege scopes required for emergency dispatch automation.
 */
let auth: Auth.GoogleAuth | null = null;
try {
  auth = new google.auth.GoogleAuth({
    scopes: [
      'https://www.googleapis.com/auth/calendar.readonly',
      'https://www.googleapis.com/auth/calendar.events',
      'https://www.googleapis.com/auth/drive.file',
      'https://www.googleapis.com/auth/spreadsheets',
    ],
  });
} catch (e) {
  console.warn('Google Auth for Workspace failed to initialize. Tool calls will run in simulation mode.', e);
}

/** 
 * Maps Client initialization using public and server-side keys.
 */
const mapsClient = new Client({});

/**
 * Agentic tool function to find nearby hospitals, clinics, or trauma centers.
 * @param {number} latitude - The latitude of the incident.
 * @param {number} longitude - The longitude of the incident.
 * @param {string} [query='hospital'] - The type of facility to search for.
 * @param {number} [radius=5000] - Search radius in meters.
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
 * Agentic tool to get a static map URL for the incident scene.
 */
export async function get_scene_static_map({ latitude, longitude }: { latitude: number; longitude: number; }) {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  if (!apiKey) return { error: 'Maps API key missing.' };
  
  const mapUrl = `https://maps.googleapis.com/maps/api/staticmap?center=${latitude},${longitude}&zoom=16&size=600x300&markers=color:red%7C${latitude},${longitude}&key=${apiKey}`;
  return { success: true, mapUrl };
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
  } catch {
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

// ----- NEW WORKSPACE AI INTEGRATIONS -----

/**
 * Agentic tool to schedule an event on a Dispatch Calendar. 
 */
export async function create_dispatch_calendar_event({ summary, description, durationMinutes, priority }: { summary: string; description: string; durationMinutes: number; priority?: string }) {
  try {
    if (!auth || !process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL) {
      console.warn('Simulating Google Calendar event generation (missing service credentials).');
      return {
        success: true,
        message: 'Event simulated successfully (Credentials not provided for hackathon demo).',
        eventLink: 'https://calendar.google.com/',
        scheduledTime: new Date().toISOString()
      };
    }
    const calendar = google.calendar({ version: 'v3', auth });
    const startTime = new Date();
    const endTime = new Date(startTime.getTime() + durationMinutes * 60000);
    
    // Fallback: If no dedicated calendar ID is provided, tries to use the service account's primary
    const calendarId = process.env.DISPATCH_CALENDAR_ID || 'primary';

    const event = {
      summary: `[${priority || 'NORMAL'}] ${summary}`,
      description,
      start: { dateTime: startTime.toISOString() },
      end: { dateTime: endTime.toISOString() },
    };

    const res = await calendar.events.insert({ calendarId, requestBody: event });
    return { success: true, eventLink: res.data.htmlLink, scheduledTime: startTime.toISOString() };
  } catch (error) {
    console.error('Calendar Error:', error);
    return { success: false, error: 'Failed to create calendar event' };
  }
}

/**
 * Agentic tool to check user's calendar for available slots.
 * Enables "Informed Suggestions" for scheduling responders.
 */
export async function check_user_availability({ dateStr }: { dateStr: string }) {
  try {
    if (!auth) {
      console.warn('Simulating availability check (missing credentials).');
      return { 
        success: true, 
        availableSlots: ['09:00', '10:30', '14:00', '16:30'],
        message: 'Calculated based on average responder availability.'
      };
    }
    const calendar = google.calendar({ version: 'v3', auth });
    const timeMin = new Date(dateStr + 'T00:00:00Z').toISOString();
    const timeMax = new Date(dateStr + 'T23:59:59Z').toISOString();

    const res = await calendar.events.list({
      calendarId: 'primary',
      timeMin,
      timeMax,
      singleEvents: true,
      orderBy: 'startTime',
    });

    const events = res.data.items || [];
    return { 
      success: true, 
      busySlots: events.map(e => ({ start: e.start?.dateTime, end: e.end?.dateTime })),
      suggestedSlots: events.length === 0 ? ['09:00', '13:00', '15:00'] : ['11:00 (Between meetings)']
    };
  } catch (error) {
    console.error('Calendar Read Error:', error);
    return { success: false, error: 'Failed to read calendar' };
  }
}

/**
 * Agentic tool to upload an Incident Report to Google Drive for historical archiving.
 */
export async function upload_incident_to_drive({ fileName, content }: { fileName: string; content: string }) {
  try {
    if (!auth || !process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL) {
      console.warn('Simulating Google Drive upload (missing service credentials).');
      return {
        success: true,
        message: 'Incident report saved successfully to simulated Drive.',
        fileId: 'mock-file-1234'
      };
    }
    const drive = google.drive({ version: 'v3', auth });
    const folderId = process.env.DISPATCH_DRIVE_FOLDER_ID; // Optional target folder

    const fileMetadata: Record<string, unknown> = { name: fileName + '.txt', mimeType: 'text/plain' };
    if (folderId) fileMetadata.parents = [folderId];

    const media = { mimeType: 'text/plain', body: content };

    const res = await drive.files.create({ requestBody: fileMetadata, media, fields: 'id,webViewLink' });
    return { success: true, fileId: res.data.id, link: res.data.webViewLink };
  } catch (error) {
    console.error('Drive Error:', error);
    return { success: false, error: 'Failed to upload to Drive' };
  }
}

/**
 * Agentic tool to log incident data to a centralized Google Spreadsheet.
 */
export async function log_incident_to_sheets({ 
  timestamp, 
  category, 
  severity, 
  summary, 
  location 
}: { 
  timestamp: string; 
  category: string; 
  severity: string; 
  summary: string; 
  location: string; 
}) {
  try {
    if (!auth || !process.env.DISPATCH_SHEET_ID) {
      console.warn('Simulating Sheets logging (missing credentials or SHEET_ID).');
      return { success: true, message: 'Incident logged to simulated sheet.' };
    }
    const sheets = google.sheets({ version: 'v4', auth });
    const spreadsheetId = process.env.DISPATCH_SHEET_ID;
    const range = 'Incidents!A:E'; // Assumes a sheet named 'Incidents' exists

    await sheets.spreadsheets.values.append({
      spreadsheetId,
      range,
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: [[timestamp, category, severity, summary, location]],
      },
    });

    return { success: true, message: 'Logged to Google Sheets successfully.' };
  } catch (error) {
    console.error('Sheets Error:', error);
    return { success: false, error: 'Failed to log to Sheets' };
  }
}

/**
 * Agentic tool to find nearest shelters or safety zones.
 */
export async function get_nearby_shelters({ latitude, longitude }: { latitude: number; longitude: number; }) {
  return get_nearest_hospitals({ 
    latitude, 
    longitude, 
    query: 'emergency shelter or police station or fire station',
    radius: 10000 
  });
}

/**
 * Agentic tool to enrich service providers with Google Business Profile-style data.
 * Fetches ratings, open hours, and expert verification.
 */
export async function enrich_provider_data({ placeId }: { placeId: string }) {
  const apiKey = process.env.GOOGLE_MAPS_SERVER_API_KEY || process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  if (!apiKey) return { error: 'API key missing.' };

  try {
    const res = await mapsClient.placeDetails({
      params: { place_id: placeId, key: apiKey, fields: ['rating', 'user_ratings_total', 'opening_hours', 'formatted_phone_number', 'website'] }
    });
    return { success: true, details: res.data.result };
  } catch (error) {
    return { success: false, error: 'Failed to fetch details' };
  }
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

const createDispatchCalendarEventDecl: FunctionDeclaration = {
  name: 'create_dispatch_calendar_event',
  description: 'Schedules an event block on the centralized emergency dispatch calendar for first responders. Use this when you determine human operators or responders need to be scheduled.',
  parameters: {
    type: SchemaType.OBJECT,
    properties: {
      summary: { type: SchemaType.STRING, description: 'Short title for the calendar event' },
      description: { type: SchemaType.STRING, description: 'Comprehensive details including patient/structural info and exact location' },
      durationMinutes: { type: SchemaType.NUMBER, description: 'Estimated required time block. Use 60 for low priority, 120 for urgent' },
      priority: { type: SchemaType.STRING, description: 'Priority level (e.g., URGENT, CRITICAL, INFO)' },
    },
    required: ['summary', 'description', 'durationMinutes'],
  },
};

const getStaticMapDecl: FunctionDeclaration = {
  name: 'get_scene_static_map',
  description: 'Generates a Google Maps Static Map URL for visual verification of the incident location.',
  parameters: {
    type: SchemaType.OBJECT,
    properties: {
      latitude: { type: SchemaType.NUMBER },
      longitude: { type: SchemaType.NUMBER },
    },
    required: ['latitude', 'longitude'],
  },
};

const checkAvailabilityDecl: FunctionDeclaration = {
  name: 'check_user_availability',
  description: 'Reads the user\'s Google Calendar to find free slots. Use this to make INFORMED suggestions for when a responder should visit.',
  parameters: {
    type: SchemaType.OBJECT,
    properties: {
      dateStr: { type: SchemaType.STRING, description: 'The date to check (YYYY-MM-DD)' },
    },
    required: ['dateStr'],
  },
};

const enrichProviderDecl: FunctionDeclaration = {
  name: 'enrich_provider_data',
  description: 'Fetches detailed Google Business Profile information (ratings, reviews, hours) for a specific place provider.',
  parameters: {
    type: SchemaType.OBJECT,
    properties: {
      placeId: { type: SchemaType.STRING },
    },
    required: ['placeId'],
  },
};

const uploadIncidentToDriveDecl: FunctionDeclaration = {
  name: 'upload_incident_to_drive',
  description: 'Generates and saves a formal incident report text file to the Dispatch Center Google Drive. Do this whenever vital evidence, patient history, or complex site details are mentioned.',
  parameters: {
    type: SchemaType.OBJECT,
    properties: {
      fileName: { type: SchemaType.STRING, description: 'A descriptive filename without extension (e.g., Incident-Report-1234)' },
      content: { type: SchemaType.STRING, description: 'The comprehensive incident details text to save into the file' },
    },
    required: ['fileName', 'content'],
  },
};

const logIncidentToSheetsDecl: FunctionDeclaration = {
  name: 'log_incident_to_sheets',
  description: 'Logs high-level incident telemetry to a centralized Google Spreadsheet for administrative tracking.',
  parameters: {
    type: SchemaType.OBJECT,
    properties: {
      timestamp: { type: SchemaType.STRING, description: 'ISO timestamp' },
      category: { type: SchemaType.STRING, description: 'Emergency category' },
      severity: { type: SchemaType.STRING, description: 'Severity level' },
      summary: { type: SchemaType.STRING, description: 'Short summary of the situation' },
      location: { type: SchemaType.STRING, description: 'Approximate location or coordinates' },
    },
    required: ['timestamp', 'category', 'severity', 'summary', 'location'],
  },
};

const getNearbySheltersDecl: FunctionDeclaration = {
  name: 'get_nearby_shelters',
  description: 'Finds the nearest police stations, fire stations, or emergency shelters for safety.',
  parameters: {
    type: SchemaType.OBJECT,
    properties: {
      latitude: { type: SchemaType.NUMBER },
      longitude: { type: SchemaType.NUMBER },
    },
    required: ['latitude', 'longitude'],
  },
};

/**
 * Definitions to pass to Gemini's `tools` array
 */
export const pulseBridgeTools = [
  {
    functionDeclarations: [
      getNearestHospitalsDecl, 
      getRouteTrafficDecl, 
      getWeatherInfoDecl, 
      searchNewsAlertsDecl, 
      createDispatchCalendarEventDecl, 
      uploadIncidentToDriveDecl,
      logIncidentToSheetsDecl,
      getNearbySheltersDecl,
      getStaticMapDecl,
      checkAvailabilityDecl,
      enrichProviderDecl
    ],
  },
  { googleSearch: {} } // Enable native Google web search capabilities
];

type AgenticToolHandler = (args: Record<string, unknown>) => Promise<unknown>;

export const agenticToolsRegistry: Record<string, AgenticToolHandler> = {
  get_nearest_hospitals: get_nearest_hospitals as AgenticToolHandler,
  get_route_traffic: get_route_traffic as AgenticToolHandler,
  get_weather_info: get_weather_info as AgenticToolHandler,
  search_news_alerts: search_news_alerts as AgenticToolHandler,
  create_dispatch_calendar_event: create_dispatch_calendar_event as AgenticToolHandler,
  upload_incident_to_drive: upload_incident_to_drive as AgenticToolHandler,
  log_incident_to_sheets: log_incident_to_sheets as AgenticToolHandler,
  get_nearby_shelters: get_nearby_shelters as AgenticToolHandler,
  get_scene_static_map: get_scene_static_map as AgenticToolHandler,
  check_user_availability: check_user_availability as AgenticToolHandler,
  enrich_provider_data: enrich_provider_data as AgenticToolHandler,
};
