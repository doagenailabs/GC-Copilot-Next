import OpenAI from 'openai';
import { OpenAIStream, StreamingTextResponse } from 'ai';

export const runtime = 'edge';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: Request) {
  try {
    const { transcriptionData } = await req.json();

    const response = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
      max_tokens: parseInt(process.env.OPENAI_MAX_COMPLETION_TOKENS || '2048'),
      temperature: parseFloat(process.env.OPENAI_TEMPERATURE || '0.1'),
      messages: [
        {
          role: 'system',
          content: `You are an AI assistant analyzing real-time contact center conversations.
                   Analyze the conversation for:
                   - Customer sentiment
                   - Key issues or requests
                   - Potential escalation points
                   - Compliance concerns
                   Be concise and focus on actionable insights.`
        },
        {
          role: 'user',
          content: `Analyze this conversation segment: ${transcriptionData}`
        }
      ],
      stream: true,
    });

    // Create a stream using the vercel ai package
    const stream = OpenAIStream(response);

    // Return a StreamingTextResponse, which sets the correct headers
    return new StreamingTextResponse(stream);
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
