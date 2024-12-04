import { OpenAI } from 'openai';
import sanitizeHtml from 'sanitize-html';
import { jsonSchema } from '../lib/analysisSchema';
import MessageHistory from '../lib/messageHistory';
import analyzeSystemPrompt from '../lib/analyzeSystemPrompt';

export const runtime = 'edge';

// Input sanitization
const sanitizeInput = (text) => {
  return sanitizeHtml(text, {
    allowedTags: [],
    allowedAttributes: {},
    disallowedTagsMode: 'recursiveEscape',
  });
};

const validateOpenAIParams = (params) => {
  const { model, maxTokens, temperature } = params;

  if (!model || typeof model !== 'string') {
    throw new Error('Invalid model parameter');
  }

  if (!Number.isInteger(maxTokens) || maxTokens < 1 || maxTokens > 4096) {
    throw new Error('Invalid maxTokens parameter');
  }

  if (typeof temperature !== 'number' || temperature < 0 || temperature > 2) {
    throw new Error('Invalid temperature parameter');
  }

  return true;
};

const validateTranscriptionData = (data) => {
  if (!Array.isArray(data)) {
    throw new Error('Transcription data must be an array');
  }

  data.forEach((item, index) => {
    if (!item.text || typeof item.text !== 'string') {
      throw new Error(`Invalid text in transcription data at index ${index}`);
    }
    if (!item.channel || !['EXTERNAL', 'INTERNAL'].includes(item.channel)) {
      throw new Error(`Invalid channel in transcription data at index ${index}`);
    }
    if (typeof item.confidence !== 'number') {
      throw new Error(`Invalid confidence in transcription data at index ${index}`);
    }
    if (typeof item.timestamp !== 'number') {
      throw new Error(`Invalid timestamp in transcription data at index ${index}`);
    }
  });

  return true;
};

export default async function handler(req) {
  const log = (message, ...args) => console.log(`[GCCopilotNext] ${message}`, ...args);

  try {
    if (req.method !== 'POST') {
      return new Response(
        JSON.stringify({
          error: 'Method Not Allowed',
          timestamp: new Date().toISOString(),
        }),
        { 
          status: 405, 
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    const text = await req.text();
    const body = JSON.parse(text);
    
    if (!body?.transcriptionData) {
      throw new Error('transcriptionData is required');
    }

    log('Received transcription data:', body.transcriptionData);

    const parsedData = JSON.parse(body.transcriptionData);
    validateTranscriptionData(parsedData);

    const messageHistory = new MessageHistory({
      maxMessages: parseInt(process.env.MAX_HISTORY_MESSAGES, 10) || 5,
      systemPrompt: analyzeSystemPrompt,
      logger: {
        log: (message, ...args) => console.log('messageHistory', message, ...args),
        error: (message, ...args) => console.error('messageHistory', message, ...args),
        debug: (message, ...args) => console.debug('messageHistory', message, ...args),
      },
    });

    parsedData.forEach((transcript) => {
      const sanitizedText = sanitizeInput(transcript.text);
      messageHistory.addMessage(
        'user',
        sanitizedText,
        transcript.channel === 'EXTERNAL' ? 'Customer' : 'Agent'
      );
    });

    const model = process.env.OPENAI_MODEL || 'gpt-4';
    const maxTokens = parseInt(process.env.OPENAI_MAX_COMPLETION_TOKENS || '2048', 10);
    const temperature = parseFloat(process.env.OPENAI_TEMPERATURE || '0.2');

    validateOpenAIParams({ model, maxTokens, temperature });

    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    const completion = await openai.chat.completions.create({
      model,
      messages: messageHistory.getMessages(),
      max_tokens: maxTokens,
      temperature,
      response_format: {
        type: 'json_schema',
        schema: jsonSchema,
      },
      stream: true,
    });

    const stream = new ReadableStream({
      start(controller) {
        const reader = completion.body.getReader();

        function push() {
          reader.read().then(({ done, value }) => {
            if (done) {
              controller.close();
              return;
            }
            controller.enqueue(value);
            push();
          });
        }

        push();
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache, no-transform',
        'X-Content-Type-Options': 'nosniff',
        'Connection': 'keep-alive',
      },
    });
  } catch (err) {
    log('Error processing API request:', err.message);

    return new Response(
      JSON.stringify({
        error: 'Internal Server Error',
        message: err.message,
        timestamp: new Date().toISOString(),
      }),
      { 
        status: 500, 
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}
