import { streamObject } from 'ai';
import { openai } from '@ai-sdk/openai';
import { jsonSchema } from '../lib/analysisSchema';
import MessageHistory from '../lib/messageHistory';
import analyzeSystemPrompt from '../lib/analyzeSystemPrompt';
import { sanitizeHtml } from '../lib/sanitizeHtml';
import { z } from 'zod';

export const config = {
  runtime: 'edge'
};

function logDebug(component, message, data = {}) {
  console.log(`[GCCopilotNext][${component}][DEBUG] ${message}`, data);
}

function logInfo(component, message, data = {}) {
  console.log(`[GCCopilotNext][${component}][INFO] ${message}`, data);
}

function logError(component, message, error) {
  console.error(`[GCCopilotNext][${component}][ERROR] ${message}`, {
    error: error.message,
    stack: error.stack,
    name: error.name,
    cause: error.cause
  });
}

const validateOpenAIParams = (params) => {
  const { model, maxTokens, temperature } = params;
  logDebug('Validation', 'Validating OpenAI parameters', { model, maxTokens, temperature });

  if (!model || typeof model !== 'string') {
    throw new Error('Invalid model parameter');
  }

  if (!Number.isInteger(maxTokens) || maxTokens < 1 || maxTokens > 4096) {
    throw new Error('Invalid maxTokens parameter');
  }

  if (typeof temperature !== 'number' || temperature < 0 || temperature > 2) {
    throw new Error('Invalid temperature parameter');
  }

  logInfo('Validation', 'OpenAI parameters validated successfully');
  return true;
};

const validateTranscriptionData = (data) => {
  logDebug('Validation', 'Starting transcription data validation', { 
    dataLength: data?.length,
    isArray: Array.isArray(data) 
  });

  if (!Array.isArray(data)) {
    throw new Error('Transcription data must be an array');
  }

  data.forEach((item, index) => {
    logDebug('Validation', 'Validating transcript item', { index, item });
    
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

  logInfo('Validation', 'Transcription data validated successfully', { itemCount: data.length });
  return true;
};

export default async function handler(req) {
  try {
    logInfo('Handler', 'Received new request', { 
      method: req.method,
      url: req.url,
      headers: Object.fromEntries(req.headers)
    });

    if (req.method !== 'POST') {
      logError('Handler', 'Method not allowed', new Error(`Invalid method: ${req.method}`));
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
    logDebug('Handler', 'Request body received', { bodyLength: text.length });
    
    const body = JSON.parse(text);
    
    if (!body?.transcriptionData) {
      throw new Error('transcriptionData is required');
    }

    logInfo('Handler', 'Parsing transcription data', { 
      dataSize: body.transcriptionData.length 
    });

    const parsedData = JSON.parse(body.transcriptionData);
    validateTranscriptionData(parsedData);

    logInfo('MessageHistory', 'Initializing message history', {
      maxMessages: process.env.MAX_HISTORY_MESSAGES || 5
    });

    const messageHistory = new MessageHistory({
      maxMessages: parseInt(process.env.MAX_HISTORY_MESSAGES, 10) || 5,
      systemPrompt: analyzeSystemPrompt,
      logger: {
        log: (msg, ...args) => logInfo('MessageHistory', msg, ...args),
        error: (msg, ...args) => logError('MessageHistory', msg, ...args),
        debug: (msg, ...args) => logDebug('MessageHistory', msg, ...args),
      },
    });

    parsedData.forEach((transcript, index) => {
      logDebug('MessageHistory', 'Processing transcript', { 
        index,
        channel: transcript.channel,
        textLength: transcript.text.length 
      });
      
      const sanitizedText = sanitizeHtml(transcript.text);
      messageHistory.addMessage(
        'user',
        sanitizedText,
        transcript.channel === 'EXTERNAL' ? 'Customer' : 'Agent'
      );
    });

    const model = process.env.OPENAI_MODEL || 'gpt-4';
    const maxTokens = parseInt(process.env.OPENAI_MAX_COMPLETION_TOKENS || '2048', 10);
    const temperature = parseFloat(process.env.OPENAI_TEMPERATURE || '0.2');

    logInfo('OpenAI', 'Initializing OpenAI parameters', { 
      model,
      maxTokens,
      temperature 
    });

    validateOpenAIParams({ model, maxTokens, temperature });

    // Convert jsonSchema to Zod schema
    const zodSchema = z.object(jsonSchema.properties);
    logDebug('Schema', 'Created Zod schema', { 
      schemaKeys: Object.keys(jsonSchema.properties) 
    });

    logInfo('OpenAI', 'Starting streamObject', {
      messageCount: messageHistory.getMessages().length
    });

    const { partialObjectStream, usage } = await streamObject({
      model: openai(model),
      schema: zodSchema,
      maxTokens,
      temperature,
      messages: messageHistory.getMessages(),
      onError: (error) => {
        logError('OpenAI', 'Streaming error occurred', error);
      },
      onFinish: ({ usage }) => {
        logInfo('OpenAI', 'Stream completed', {
          promptTokens: usage.promptTokens,
          completionTokens: usage.completionTokens,
          totalTokens: usage.totalTokens
        });
      },
      onChunk: ({ chunk }) => {
        logDebug('OpenAI', 'Received chunk', {
          chunkType: chunk.type,
          chunkSize: JSON.stringify(chunk).length
        });
      }
    });

    logInfo('Stream', 'Creating transform stream');
    const encoder = new TextEncoder();
    const transformer = new TransformStream({
      transform(chunk, controller) {
        logDebug('Stream', 'Transforming chunk', {
          chunkSize: JSON.stringify(chunk).length
        });
        const jsonString = JSON.stringify(chunk) + '\n';
        const bytes = encoder.encode(jsonString);
        controller.enqueue(bytes);
      },
    });

    logInfo('Stream', 'Piping response stream');
    const responseStream = partialObjectStream.pipeThrough(transformer);

    return new Response(responseStream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache, no-transform',
        'X-Content-Type-Options': 'nosniff',
        'Connection': 'keep-alive',
      },
    });

  } catch (err) {
    logError('Handler', 'Unhandled error in handler', err);
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
