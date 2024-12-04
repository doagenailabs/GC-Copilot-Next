import { OpenAI } from 'openai';
import sanitizeHtml from 'sanitize-html';
import { jsonSchema } from '../lib/analysisSchema';
import MessageHistory from '../lib/messageHistory';
import analyzeSystemPrompt from '../lib/analyzeSystemPrompt';

export const runtime = 'edge';

// Input sanitization and validation functions remain the same...

export default async function handler(request) {
  const encoder = new TextEncoder();
  const log = (message, ...args) => console.log(`[GCCopilotNext] ${message}`, ...args);

  try {
    if (request.method !== 'POST') {
      return new Response(
        JSON.stringify({
          error: 'Method Not Allowed',
          timestamp: new Date().toISOString(),
        }),
        { status: 405, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const body = await request.json();
    
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
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
