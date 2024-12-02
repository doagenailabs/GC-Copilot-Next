import OpenAI from 'openai';
import { messageHistory } from '../../../lib/messageHistory';
import { jsonSchema } from '../../../lib/analysisSchema';

const LOG_PREFIX = 'GCCopilotNext - analyze/route.js -';
const log = (message, ...args) => console.log(`${LOG_PREFIX} ${message}`, ...args);
const error = (message, ...args) => console.error(`${LOG_PREFIX} ${message}`, ...args);
const debug = (message, ...args) => console.debug(`${LOG_PREFIX} ${message}`, ...args);

export const runtime = 'edge';

// Initialize OpenAI with error handling
let openai;
try {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('OpenAI API key is not configured');
  }
  openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });
  debug('OpenAI client initialized');
} catch (err) {
  error('Failed to initialize OpenAI client:', err);
  throw err;
}

export async function POST(req) {
  try {
    debug('Processing POST request');

    // Validate request body
    if (!req.body) {
      throw new Error('Request body is empty');
    }

    const data = await req.json();
    
    if (!data.transcriptionData) {
      throw new Error('transcriptionData is required');
    }

    debug('Received transcription data:', data.transcriptionData);

    // Process transcription data
    try {
      const parsedData = JSON.parse(data.transcriptionData);
      if (!Array.isArray(parsedData)) {
        throw new Error('Invalid transcription data format');
      }
      debug('Transcription data parsed successfully');

      // Add messages to history
      parsedData.forEach(transcript => {
        messageHistory.addMessage('user', transcript.text, 
          transcript.channel === 'EXTERNAL' ? 'Customer' : 'Agent');
      });
      debug('Messages added to history');

      // Prepare OpenAI request
      const model = process.env.OPENAI_MODEL || 'gpt-4o-mini';
      const maxTokens = parseInt(process.env.OPENAI_MAX_COMPLETION_TOKENS || '2048');
      const temperature = parseFloat(process.env.OPENAI_TEMPERATURE || '0.2');

      debug('OpenAI request parameters:', { model, maxTokens, temperature });

      // Create completion
      const completion = await openai.chat.completions.create({
        model,
        messages: messageHistory.getMessages(),
        max_tokens: maxTokens,
        temperature,
        response_format: { 
          type: "json_schema", 
          schema: jsonSchema 
        },
        stream: true,
      });

      debug('OpenAI stream created successfully');

      // Return streaming response
      return new Response(completion.body, {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
        },
      });

    } catch (parseError) {
      error('Error processing transcription data:', parseError);
      throw new Error('Invalid transcription data format');
    }

  } catch (err) {
    error('API route error:', err);
    
    // Prepare error response with detailed information
    const errorResponse = {
      error: 'Internal Server Error',
      message: err instanceof Error ? err.message : 'Unknown error',
      timestamp: new Date().toISOString(),
      requestId: crypto.randomUUID()
    };

    if (err instanceof Error && err.cause) {
      errorResponse.cause = err.cause;
    }

    return new Response(
      JSON.stringify(errorResponse), 
      { 
        status: 500,
        headers: { 
          'Content-Type': 'application/json',
          'X-Error-ID': errorResponse.requestId
        }
      }
    );
  }
}
