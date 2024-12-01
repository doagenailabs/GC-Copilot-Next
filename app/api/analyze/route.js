export const runtime = 'edge';

const textEncoder = new TextEncoder();
const textDecoder = new TextDecoder();

// Configuration validation
const validateConfig = () => {
  const requiredEnvVars = [
    'OPENAI_API_KEY',
    'OPENAI_MAX_COMPLETION_TOKENS',
    'OPENAI_MODEL',
    'OPENAI_TEMPERATURE'
  ];

  const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
  if (missingVars.length > 0) {
    throw new Error(`Missing required environment variables: ${missingVars.join(', ')}`);
  }

  // Validate numeric values
  const temperature = parseFloat(process.env.OPENAI_TEMPERATURE);
  if (isNaN(temperature) || temperature < 0 || temperature > 2) {
    throw new Error('OPENAI_TEMPERATURE must be a number between 0 and 2');
  }

  const maxTokens = parseInt(process.env.OPENAI_MAX_COMPLETION_TOKENS);
  if (isNaN(maxTokens) || maxTokens <= 0) {
    throw new Error('OPENAI_MAX_COMPLETION_TOKENS must be a positive integer');
  }

  return {
    apiKey: process.env.OPENAI_API_KEY,
    model: process.env.OPENAI_MODEL,
    temperature,
    maxCompletionTokens: maxTokens
  };
};

export async function POST(req) {
  try {
    // Validate configuration first
    const config = validateConfig();
    
    const { transcriptionData } = await req.json();

    const stream = new ReadableStream({
      async start(controller) {
        try {
          const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${config.apiKey}`,
            },
            body: JSON.stringify({
              model: config.model,
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
              max_completion_tokens: config.maxCompletionTokens,
              temperature: config.temperature,
              stream: true,
            }),
          });

          if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`OpenAI API error: ${response.status} - ${errorText}`);
          }

          const reader = response.body.getReader();

          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            // Process the chunk
            const chunk = textDecoder.decode(value);
            const lines = chunk.split('\\n').filter(line => line.trim() !== '');

            for (const line of lines) {
              if (line.startsWith('data: ')) {
                const data = line.slice(6);
                if (data === '[DONE]') break;

                try {
                  const parsed = JSON.parse(data);
                  const content = parsed.choices[0]?.delta?.content || '';
                  if (content) {
                    controller.enqueue(textEncoder.encode(content));
                  }
                } catch (e) {
                  console.error('Error parsing JSON:', e);
                }
              }
            }
          }
        } catch (error) {
          // Log the error details but send a sanitized error message
          console.error('Error in OpenAI stream:', error);
          controller.error(new Error('Analysis service error'));
        } finally {
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-cache, no-transform',
        'X-Content-Type-Options': 'nosniff',
      },
    });
  } catch (error) {
    console.error('API route error:', error);
    
    // Return appropriate error responses based on the error type
    if (error.message.includes('Missing required environment variables')) {
      return new Response(
        JSON.stringify({ error: 'Service configuration error' }),
        { 
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }
    
    if (error.message.includes('OPENAI_TEMPERATURE') || error.message.includes('OPENAI_MAX_COMPLETION_TOKENS')) {
      return new Response(
        JSON.stringify({ error: 'Invalid configuration value' }),
        { 
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Internal Server Error' }), 
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}
