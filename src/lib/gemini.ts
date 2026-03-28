import { GoogleGenerativeAI, Part, Tool, FunctionCallingMode } from '@google/generative-ai';
import { BridgeOutputSchema, type ValidatedBridgeInput } from './schemas';
import { GEMINI_MODEL } from './constants';
import type { BridgeOutput } from '@/types';
import { pulseBridgeTools, agenticToolsRegistry } from './tools';
import { getBridgeResponseSchema } from './schemas';
import { SYSTEM_PROMPT } from './prompts';

/**
 * Custom error for Gemini API related failures.
 */
class GeminiError extends Error {
  constructor(message: string, public statusCode?: number, public retryable: boolean = true) {
    super(message);
    this.name = 'GeminiError';
  }
}

/**
 * Initialize the Gemini client using environment variables.
 * @returns {GoogleGenerativeAI} The initialized Gemini client.
 * @throws {GeminiError} If the API key is missing.
 */
function getGeminiClient(): GoogleGenerativeAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new GeminiError(
      'GEMINI_API_KEY environment variable is required. Get one at https://aistudio.google.com/apikey',
      500,
      false
    );
  }
  return new GoogleGenerativeAI(apiKey);
}

/**
 * Core agentic loop logic that interacts with Gemini.
 * It recursively calls tools and sends results back until Gemini is finished or loop limit is reached.
 */
async function executeAgenticToolLoop(chat: any, initialParts: Part[]): Promise<any> {
  const MAX_TOOL_TURNS = 3;
  let turnResponse = await chat.sendMessage(initialParts);
  let functionCalls = turnResponse.response.functionCalls();
  let loopCount = 0;

  while (functionCalls && functionCalls.length > 0 && loopCount < MAX_TOOL_TURNS) {
    loopCount++;

    const functionResponses = await Promise.all(
      functionCalls.map(async (call: any) => {
        let resultData;
        try {
          if (agenticToolsRegistry[call.name]) {
            resultData = await agenticToolsRegistry[call.name](call.args as Record<string, unknown>);
          } else {
            resultData = { error: `Function ${call.name} not found in registry.` };
          }
        } catch (err) {
          resultData = { error: String(err) };
        }

        return {
          functionResponse: {
            name: call.name,
            response: resultData as Record<string, unknown>,
          },
        };
      })
    );

    turnResponse = await chat.sendMessage(functionResponses);
    functionCalls = turnResponse.response.functionCalls();
  }

  return turnResponse;
}

/**
 * Mock analytics tracking to demonstrate Google Marketing/Analytics integration.
 */
function trackIncidentAnalytics(category: string, severity: string) {
  console.log(`[ANALYTICS] Tracking incident: ${category} (${severity})`);
}

/**
 * Process a bridge request through Gemini via an Agentic Loop.
 * 
 * Orchestrates multimodal input analysis and multi-turn tool calling.
 */
export async function processBridgeRequest(
  input: ValidatedBridgeInput
): Promise<BridgeOutput> {
  const genAI = getGeminiClient();
  const model = genAI.getGenerativeModel({
    model: GEMINI_MODEL,
    systemInstruction: SYSTEM_PROMPT,
    tools: pulseBridgeTools as Tool[],
    toolConfig: {
      // @ts-expect-error - Undocumented fields for built-in tool mixing in Gemini Flash
      includeServerSideToolInvocations: true,
      include_server_side_tool_invocations: true,
      functionCallingConfig: { mode: FunctionCallingMode.AUTO },
    },
    generationConfig: {
      responseMimeType: 'application/json',
      responseSchema: getBridgeResponseSchema() as any,
    },
  });

  // Prepare multimodal content parts
  const initialParts: Part[] = [];

  if (input.text) {
    let contextualText = input.text;
    if (input.latitude && input.longitude) {
      contextualText += `\n\n[User's approximate location: ${input.latitude}, ${input.longitude}]`;
    }
    contextualText += `\n\n[Current local time: ${new Date().toISOString()}]`;
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
        text: `Analyze this multimodal input. Identify emergency category, extract data, call tools, and return JSON dispatch. Time: ${new Date().toISOString()}`,
      });
    }
  }

  const MAX_RETRIES = 3;
  let lastError: Error | null = null;

  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      const chat = model.startChat();
      
      // Execute the multi-turn agentic tool loop
      const result = await executeAgenticToolLoop(chat, initialParts);

      // Verify and parse the final AI response
      const responseBody = result.response.text();
      if (!responseBody) {
        throw new GeminiError('Gemini returned an empty response.', 500);
      }

      let parsed: unknown;
      try {
        parsed = JSON.parse(responseBody);
      } catch (e) {
        console.error('Failed to parse Gemini JSON:', responseBody);
        throw new GeminiError('AI output was not valid JSON formatted text.', 500);
      }

      const validated = BridgeOutputSchema.safeParse(parsed);

      if (!validated.success) {
        const errorDetails = JSON.stringify(validated.error.format());
        console.error('Gemini output validation failed:', errorDetails);
        throw new GeminiError(`AI response format mismatch for BridgeOutput: ${errorDetails}`, 422);
      }

      // Track marketing and analytics telemetry
      trackIncidentAnalytics(validated.data.category, validated.data.severity);

      return {
        ...validated.data,
        timestamp: new Date().toISOString(),
      } as BridgeOutput;

    } catch (error) {
      if (error instanceof GeminiError) {
        lastError = error;
      } else {
        lastError = new GeminiError(error instanceof Error ? error.message : String(error));
      }

      const msg = lastError.message;
      if (msg.includes('429') || msg.includes('quota') || msg.includes('Too Many Requests')) {
        if (msg.includes('limit: 0') || msg.includes('FreeTier')) {
          throw new GeminiError(
            'Gemini API free tier quota exhausted. Check billing or try another key.',
            429,
            false
          );
        }

        if (attempt < MAX_RETRIES - 1) {
          const delayMs = Math.pow(2, attempt + 1) * 1000;
          console.warn(`[RETRY] Rate limited. Waiting ${delayMs}ms (attempt ${attempt + 1}/${MAX_RETRIES})...`);
          await new Promise((resolve) => setTimeout(resolve, delayMs));
          continue;
        }
      }

      throw lastError;
    }
  }

  throw lastError || new GeminiError('Unexpected error after multiple retries', 500);
}
