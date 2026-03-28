import { GoogleGenerativeAI, Part, SchemaType, Tool } from '@google/generative-ai';
import { BridgeOutputSchema, type ValidatedBridgeInput } from './schemas';
import { GEMINI_MODEL } from './constants';
import type { BridgeOutput } from '@/types';
import { pulseBridgeTools, get_nearest_hospitals, get_route_traffic } from './tools';

/**
 * PulseBridge Emergency Dispatch Agent system prompt.
 * Powered by Gemini — bridges messy real-world input into structured life-saving action.
 */
const SYSTEM_PROMPT = `You are the PulseBridge Emergency Dispatch Agent. Your goal is to bridge the gap between "Messy Real-World Input" and "Structured Life-Saving Action." Do not just describe the situation; SOLVE IT.

CORE DIRECTIVES:
1. MULTIMODAL ANALYSIS: Analyze images (medical reports, crash sites, leaks), audio transcriptions (distressed voice), or text instantly. Identify the Emergency Category.
2. CONTEXTUAL GROUNDING: Use GPS coordinates and local time. Always use your 'get_nearest_hospitals' function if medical facilities are needed, using real coordinates.
3. AGENTIC REASONING (PARALLEL TOOLS):
   - If the user is injured → Call get_nearest_hospitals AND get_route_traffic simultaneously if you know a general destination (e.g., 'Hospital, City Name').
   - If the user speaks a non-native language → Detect it and provide translation natively in the handover card
   - If a medical report is uploaded → Extract vitals, history, and medications into structured data

OUTPUT PROTOCOL (MANDATORY JSON):

STATUS: Must be "Urgent", "Critical", or "Informational"

IMMEDIATE INSTRUCTION: Maximum 10 words. A direct command the user can act on RIGHT NOW.

SERVICE PROVIDERS: Real service providers resulting from your tool calls. Include:
- Name, Specialty, realistic ETA (use get_route_traffic traffic_duration), Contact number, Verification Status

HANDOVER CARD: A structured data summary for the professional arriving on scene:
- emergencyType: What kind of emergency
- detectedLanguage: What language the user communicated in
- translatedSummary: English translation of the situation
- entityData: Key-value pairs of relevant data (age, injury type, pipe material, medication, vitals, etc.)

RULES:
- NEVER give generic advice. Be specific and actionable.
- Always use the tools provided to find real facilities.
- Always use Google Search grounding for real-world awareness (traffic checks, news, hours).
- severity maps: "critical" = call emergency services NOW, "high" = act within the hour, "medium" = act today, "low" = schedule action, "info" = informational only.
- For the handoverCard timestamp, use ISO 8601 format.`;

/**
 * Initialize the Gemini client.
 */
function getGeminiClient(): GoogleGenerativeAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error(
      'GEMINI_API_KEY environment variable is required. Get one at https://aistudio.google.com/apikey'
    );
  }
  return new GoogleGenerativeAI(apiKey);
}

/**
 * Process a bridge request through Gemini via an Agentic Loop.
 */
export async function processBridgeRequest(
  input: ValidatedBridgeInput
): Promise<BridgeOutput> {
  const genAI = getGeminiClient();
  const model = genAI.getGenerativeModel({
    model: GEMINI_MODEL,
    systemInstruction: SYSTEM_PROMPT,
    tools: pulseBridgeTools as Tool[],
    generationConfig: {
      responseMimeType: 'application/json',
      responseSchema: {
        type: SchemaType.OBJECT,
        properties: {
          status: {
            type: SchemaType.STRING,
            format: 'enum',
            enum: ['Urgent', 'Critical', 'Informational'],
          },
          immediateInstruction: { type: SchemaType.STRING },
          summary: { type: SchemaType.STRING },
          category: { type: SchemaType.STRING },
          severity: {
            type: SchemaType.STRING,
            format: 'enum',
            enum: ['info', 'low', 'medium', 'high', 'critical'],
          },
          actions: {
            type: SchemaType.ARRAY,
            items: {
              type: SchemaType.OBJECT,
              properties: {
                title: { type: SchemaType.STRING },
                description: { type: SchemaType.STRING },
                priority: {
                  type: SchemaType.STRING,
                  format: 'enum',
                  enum: ['low', 'medium', 'high', 'urgent'],
                },
                type: {
                  type: SchemaType.STRING,
                  format: 'enum',
                  enum: ['call', 'navigate', 'checklist', 'link', 'download', 'info', 'warning'],
                },
                url: { type: SchemaType.STRING },
                phone: { type: SchemaType.STRING },
                steps: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
              },
              required: ['title', 'description', 'priority', 'type'],
            },
          },
          serviceProviders: {
            type: SchemaType.ARRAY,
            items: {
              type: SchemaType.OBJECT,
              properties: {
                name: { type: SchemaType.STRING },
                specialty: { type: SchemaType.STRING },
                eta: { type: SchemaType.STRING },
                contact: { type: SchemaType.STRING },
                verificationStatus: { type: SchemaType.STRING },
                latitude: { type: SchemaType.NUMBER },
                longitude: { type: SchemaType.NUMBER },
                address: { type: SchemaType.STRING },
              },
              required: ['name', 'specialty', 'eta', 'contact', 'verificationStatus'],
            },
          },
          locations: {
            type: SchemaType.ARRAY,
            items: {
              type: SchemaType.OBJECT,
              properties: {
                name: { type: SchemaType.STRING },
                latitude: { type: SchemaType.NUMBER },
                longitude: { type: SchemaType.NUMBER },
                type: { type: SchemaType.STRING },
                address: { type: SchemaType.STRING },
              },
              required: ['name', 'latitude', 'longitude', 'type'],
            },
          },
          handoverCard: {
            type: SchemaType.OBJECT,
            properties: {
              emergencyType: { type: SchemaType.STRING },
              detectedLanguage: { type: SchemaType.STRING },
              translatedSummary: { type: SchemaType.STRING },
              entityData: {
                type: SchemaType.OBJECT,
                properties: {},
              },
              timestamp: { type: SchemaType.STRING },
            },
            required: ['emergencyType', 'detectedLanguage', 'translatedSummary', 'entityData', 'timestamp'],
          },
          warnings: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
          keyFacts: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
          sourceVerification: { type: SchemaType.STRING },
        },
        required: [
          'status',
          'immediateInstruction',
          'summary',
          'category',
          'severity',
          'actions',
          'serviceProviders',
          'locations',
          'handoverCard',
          'warnings',
          'keyFacts',
          'sourceVerification',
        ],
      },
    },
  });

  // Build multimodal parts array for initial prompt
  const initialParts: Part[] = [];

  if (input.text) {
    let contextualText = input.text;
    if (input.latitude && input.longitude) {
      contextualText += `\n\n[User's approximate location: ${input.latitude}, ${input.longitude}]`;
    }
    contextualText += `\n\n[Current time: ${new Date().toISOString()}]`;
    initialParts.push({ text: contextualText });
  }

  if (input.fileBase64 && input.fileMimeType) {
    initialParts.push({
      inlineData: {
        data: input.fileBase64,
        mimeType: input.fileMimeType,
      },
    });

    if (!input.text) {
      initialParts.push({
        text: `Analyze this input as the PulseBridge Emergency Dispatch Agent. Identify the emergency category, extract all relevant data, call local tools if necessary, and finally return the structured JSON dispatch. Current time: ${new Date().toISOString()}`,
      });
    }
  }

  const MAX_RETRIES = 3;
  let lastError: Error | null = null;

  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      // Start an Agentic Chat Loop
      const chat = model.startChat();
      
      // Send initial prompt
      let result = await chat.sendMessage(initialParts);
      
      // Handle Function Calls (Multi-turn Tool Loop)
      let functionCalls = result.response.functionCalls();
      
      // Simple loop to handle up to 3 sequential tool calls
      let loopCount = 0;
      while (functionCalls && functionCalls.length > 0 && loopCount < 3) {
        loopCount++;
        
        // Execute the tools in parallel
        const functionResponses = await Promise.all(
          functionCalls.map(async (call) => {
            let funcResponseData;
            try {
              if (call.name === 'get_nearest_hospitals') {
                const args = call.args as { latitude: number; longitude: number; query?: string; radius?: number };
                funcResponseData = await get_nearest_hospitals(args);
              } else if (call.name === 'get_route_traffic') {
                const args = call.args as { origin_lat: number; origin_lng: number; destination_name: string };
                funcResponseData = await get_route_traffic(args);
              } else {
                funcResponseData = { error: 'Unknown function' };
              }
            } catch (err) {
              funcResponseData = { error: String(err) };
            }

            return {
              functionResponse: {
                name: call.name,
                response: funcResponseData as Record<string, any>,
              },
            };
          })
        );
        
        // Send tool results back to Gemini
        result = await chat.sendMessage(functionResponses);
        functionCalls = result.response.functionCalls();
      }

      // Final structured output
      const text = result.response.text();

      // Parse and validate the JSON response
      let parsed: unknown;
      try {
        parsed = JSON.parse(text);
      } catch {
        throw new Error('Gemini returned invalid JSON. Please try again.');
      }

      const validated = BridgeOutputSchema.safeParse(parsed);

      if (!validated.success) {
        console.error('Gemini output validation failed:', validated.error.format());
        throw new Error('AI response did not match expected format. Please try again.');
      }

      return {
        ...validated.data,
        timestamp: new Date().toISOString(),
      } as BridgeOutput;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      const msg = lastError.message;
      if (msg.includes('429') || msg.includes('quota') || msg.includes('Too Many Requests')) {
        if (msg.includes('limit: 0') || msg.includes('FreeTier')) {
          throw new Error(
            'Gemini API free tier quota exhausted. Please enable billing or update your API key.'
          );
        }

        if (attempt < MAX_RETRIES - 1) {
          const delayMs = Math.pow(2, attempt + 1) * 1000;
          console.warn(`Rate limited. Retrying in ${delayMs}ms (attempt ${attempt + 1}/${MAX_RETRIES})...`);
          await new Promise((resolve) => setTimeout(resolve, delayMs));
          continue;
        }
      }

      throw lastError;
    }
  }

  throw lastError || new Error('Unexpected error after retries');
}

