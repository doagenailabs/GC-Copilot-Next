import OpenAI from 'openai';
import { messageHistory } from '../../../lib/messageHistory';
import { jsonSchema } from '../../../lib/analysisSchema';

export const runtime = 'edge';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req) {
  try {
    const { transcriptionData } = await req.json();
    messageHistory.addMessage('user', transcriptionData.text, 
      transcriptionData.channel === 'EXTERNAL' ? 'Customer' : 'Agent');

    const completion = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
      messages: messageHistory.getMessages(),
      max_tokens: parseInt(process.env.OPENAI_MAX_COMPLETION_TOKENS || '2048'),
      temperature: parseFloat(process.env.OPENAI_TEMPERATURE || '0.2'),
      response_format: { 
        type: "json_schema", 
        schema: jsonSchema 
      },
      stream: true,
    });

    return new Response(completion.body, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  } catch (error) {
    console.error('API route error:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Internal Server Error',
        message: error instanceof Error ? error.message : 'Unknown error'
      }), 
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}
