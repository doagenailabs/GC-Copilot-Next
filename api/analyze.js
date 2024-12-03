const OpenAI = require('openai');
const { messageHistory } = require('../lib/messageHistory');
const { jsonSchema } = require('../lib/analysisSchema');

module.exports = async (req, res) => {
    const LOG_PREFIX = 'GCCopilotNext - analyze.js -';
    const log = (message, ...args) => console.log(`${LOG_PREFIX} ${message}`, ...args);
    const error = (message, ...args) => console.error(`${LOG_PREFIX} ${message}`, ...args);
    const debug = (message, ...args) => console.debug(`${LOG_PREFIX} ${message}`, ...args);

    try {
        debug('Processing POST request');

        // Validate request method
        if (req.method !== 'POST') {
            res.status(405).json({ error: 'Method Not Allowed' });
            return;
        }

        // Validate request body
        if (!req.body) {
            throw new Error('Request body is empty');
        }

        const data = req.body;

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
            const model = process.env.OPENAI_MODEL || 'gpt-4';
            const maxTokens = parseInt(process.env.OPENAI_MAX_COMPLETION_TOKENS || '2048');
            const temperature = parseFloat(process.env.OPENAI_TEMPERATURE || '0.2');

            debug('OpenAI request parameters:', { model, maxTokens, temperature });

            // Initialize OpenAI client
            const openai = new OpenAI({
                apiKey: process.env.OPENAI_API_KEY,
            });

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
            res.setHeader('Content-Type', 'text/event-stream');
            res.setHeader('Cache-Control', 'no-cache');
            res.setHeader('Connection', 'keep-alive');
            completion.body.pipe(res);

        } catch (parseError) {
            error('Error processing transcription data:', parseError);
            res.status(400).json({ error: 'Invalid transcription data format' });
        }

    } catch (err) {
        error('API route error:', err);

        // Prepare error response with detailed information
        const errorResponse = {
            error: 'Internal Server Error',
            message: err instanceof Error ? err.message : 'Unknown error',
            timestamp: new Date().toISOString(),
            requestId: require('crypto').randomUUID()
        };

        if (err instanceof Error && err.cause) {
            errorResponse.cause = err.cause;
        }

        res.status(500).json(errorResponse);
    }
};
