const OpenAI = require('openai');
const { messageHistory } = require('../lib/messageHistory');
const { jsonSchema } = require('../lib/analysisSchema');
const { csrfProtection } = require('./middleware/csrfProtection');
const rateLimit = require('express-rate-limit');
const sanitizeHtml = require('sanitize-html');

// Rate limiting middleware
const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100 // limit each IP to 100 requests per windowMs
});

// Input sanitization
const sanitizeInput = (text) => {
    return sanitizeHtml(text, {
        allowedTags: [], // Strip all HTML
        allowedAttributes: {},
        disallowedTagsMode: 'recursiveEscape'
    });
};

// Input validation
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
        if (!item.confidence || typeof item.confidence !== 'number') {
            throw new Error(`Invalid confidence in transcription data at index ${index}`);
        }
        if (!item.timestamp || typeof item.timestamp !== 'number') {
            throw new Error(`Invalid timestamp in transcription data at index ${index}`);
        }
    });

    return true;
};

module.exports = [apiLimiter, csrfProtection, async (req, res) => {
    const LOG_PREFIX = 'GCCopilotNext - api/analyze.js -';
    const log = (message, ...args) => window.logger.log('analyze', message, ...args);
    const error = (message, ...args) => window.logger.error('analyze', message, ...args);
    const debug = (message, ...args) => window.logger.debug('analyze', message, ...args);

    try {
        debug('Processing POST request');

        // Validate request method
        if (req.method !== 'POST') {
            return res.status(405).json({ 
                error: 'Method Not Allowed',
                timestamp: new Date().toISOString()
            });
        }

        // Validate request body
        if (!req.body?.transcriptionData) {
            throw new Error('transcriptionData is required');
        }

        debug('Received transcription data:', req.body.transcriptionData);

        // Process transcription data
        try {
            const parsedData = JSON.parse(req.body.transcriptionData);
            validateTranscriptionData(parsedData);
            debug('Transcription data parsed and validated successfully');

            // Add messages to history with proper sanitization
            parsedData.forEach(transcript => {
                const sanitizedText = sanitizeInput(transcript.text);
                messageHistory.addMessage('user', sanitizedText,
                    transcript.channel === 'EXTERNAL' ? 'Customer' : 'Agent');
            });
            debug('Messages added to history');

            // Prepare and validate OpenAI request parameters
            const model = process.env.OPENAI_MODEL || 'gpt-4';
            const maxTokens = parseInt(process.env.OPENAI_MAX_COMPLETION_TOKENS || '2048');
            const temperature = parseFloat(process.env.OPENAI_TEMPERATURE || '0.2');

            validateOpenAIParams({ model, maxTokens, temperature });
            debug('OpenAI request parameters validated:', { model, maxTokens, temperature });

            // Initialize OpenAI client with error handling
            const openai = new OpenAI({
                apiKey: process.env.OPENAI_API_KEY,
                timeout: 30000, // 30 second timeout
                maxRetries: 3
            });

            // Create completion with enhanced error handling
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

            // Set security headers
            res.setHeader('Content-Type', 'text/event-stream');
            res.setHeader('Cache-Control', 'no-cache, no-transform');
            res.setHeader('X-Content-Type-Options', 'nosniff');
            res.setHeader('Connection', 'keep-alive');
            res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
            res.setHeader('X-Frame-Options', 'DENY');
            res.setHeader('X-XSS-Protection', '1; mode=block');

            // Handle stream errors
            completion.body.on('error', (streamError) => {
                error('Stream error:', streamError);
                res.end();
            });

            completion.body.pipe(res);

        } catch (parseError) {
            error('Error processing transcription data:', parseError);
            res.status(400).json({
                error: 'Invalid transcription data format',
                message: parseError.message,
                timestamp: new Date().toISOString()
            });
        }

    } catch (err) {
        error('API route error:', err);

        const errorResponse = {
            error: 'Internal Server Error',
            message: err instanceof Error ? err.message : 'Unknown error',
            timestamp: new Date().toISOString(),
            requestId: require('crypto').randomUUID()
        };

        if (process.env.NODE_ENV === 'development' && err instanceof Error && err.cause) {
            errorResponse.cause = err.cause;
        }

        res.status(500).json(errorResponse);
    }
}];
