import { updateAnalysis } from './analysisStore';
import { updateTranscriptionHistory } from './transcriptionStore';

const LOG_PREFIX = 'GCCopilotNext - websocket.js -';
const log = (message, ...args) => console.log(`${LOG_PREFIX} ${message}`, ...args);
const error = (message, ...args) => console.error(`${LOG_PREFIX} ${message}`, ...args);
const debug = (message, ...args) => console.debug(`${LOG_PREFIX} ${message}`, ...args);

const MAX_RECONNECT_ATTEMPTS = 3;
const RECONNECT_DELAY = 2000;
let reconnectAttempts = 0;

export async function initializeWebSocket() {
    debug('Initializing WebSocket');
    
    if (!window.platformClient) {
        error('Platform client not initialized');
        throw new Error('Platform client not initialized');
    }

    if (!window.conversationId) {
        error('Conversation ID not set');
        throw new Error('Conversation ID not set');
    }

    let channelId; 
    const platformClient = window.platformClient;
    debug('platformClient:', platformClient);
    debug('conversationId:', window.conversationId);
    
    try {
        const apiInstance = new platformClient.NotificationsApi();
        log('Creating notification channel');

        const response = await apiInstance.postNotificationsChannels({});
        log('Channel created:', response);

        channelId = response.id;
        debug('Channel ID:', channelId);
        debug('Connect URI:', response.connectUri);

        const ws = setupWebSocket(response.connectUri, channelId);
        return ws;
    } catch (err) {
        error('Failed to initialize WebSocket:', err);
        handleWebSocketError(err);
        throw err;
    }
}

function setupWebSocket(connectUri, channelId) {
    debug('Setting up WebSocket with URI:', connectUri);
    
    const ws = new WebSocket(connectUri);

    ws.onmessage = async (event) => {
        try {
            debug('Message received:', event.data);
            const data = JSON.parse(event.data);
            debug('Parsed message data:', data);
            
            if (data.topicName === `channel.metadata`) {
                debug('Received channel metadata message');
                return; // Ignore metadata messages
            }

            if (data.topicName === `v2.conversations.${window.conversationId}.transcription`) {
                log('Processing transcription message');
                await processTranscription(data);
            }
            
            if (data.eventBody?.disconnectType) {
                log('Disconnect message received:', data.eventBody.disconnectType);
                ws.close();
            }
        } catch (err) {
            error('Error processing message:', err);
        }
    };

    ws.onopen = () => {
        log('WebSocket connection opened');
        reconnectAttempts = 0;
        subscribeToTopic(channelId, `v2.conversations.${window.conversationId}.transcription`);
    };

    ws.onerror = (event) => {
        error('WebSocket error:', event);
        handleWebSocketError(new Error('WebSocket encountered an error'));
    };

    ws.onclose = (event) => {
        log('WebSocket connection closed:', event);
        handleWebSocketClose(event);
    };

    return ws;
}

async function processTranscription(data) {
    try {
        debug('processTranscription called with data:', data);
        const transcripts = data.eventBody?.transcripts;
        
        if (!transcripts || !transcripts.length) {
            debug('No transcripts to process');
            return;
        }

        debug('Received transcripts:', transcripts);

        // Initialize buffer if needed
        if (!window.transcriptBuffer) {
            debug('Initializing transcript buffer');
            window.transcriptBuffer = [];
        }

        // Process final transcripts
        const finalTranscripts = transcripts.filter(t => t.isFinal);
        if (finalTranscripts.length === 0) {
            debug('No final transcripts to process');
            return;
        }

        debug('Processing final transcripts:', finalTranscripts.length);

        // Process transcripts
        const transcriptionTexts = finalTranscripts.map(transcript => {
            const bestAlternative = transcript.alternatives.reduce((best, current) => 
                current.confidence > best.confidence ? current : best
            );
            return {
                text: bestAlternative.transcript,
                channel: transcript.channel,
                confidence: bestAlternative.confidence,
                timestamp: Date.now()
            };
        });

        debug('Processed transcription texts:', transcriptionTexts);

        // Update history
        transcriptionTexts.forEach(transcript => {
            updateTranscriptionHistory(transcript);
        });

        // Update buffer
        window.transcriptBuffer.push(...transcriptionTexts);

        // Clean old transcripts
        const oldestAllowedTimestamp = Date.now() - 30000;
        const recentTranscripts = window.transcriptBuffer.filter(t => t.timestamp >= oldestAllowedTimestamp);
        window.transcriptBuffer = recentTranscripts;

        await analyzeTranscripts(recentTranscripts);
    } catch (err) {
        error('Error processing transcription:', err);
    }
}

async function analyzeTranscripts(recentTranscripts) {
    try {
        debug('Sending transcripts for analysis:', recentTranscripts);
        
        const response = await fetch('/api/analyze', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                transcriptionData: JSON.stringify(recentTranscripts)
            })
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        debug('Received response from analysis API');

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let analysisText = '';

        while (true) {
            const { done, value } = await reader.read();
            
            if (done) {
                debug('Analysis stream complete');
                break;
            }

            const chunk = decoder.decode(value);
            analysisText += chunk;
            debug('Received analysis chunk:', chunk);
            updateAnalysis(analysisText);
        }
    } catch (err) {
        error('Error analyzing transcripts:', err);
    }
}

function handleWebSocketError(err) {
    error('WebSocket error occurred:', err);
    if (reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
        reconnectAttempts++;
        log(`Attempting to reconnect (${reconnectAttempts}/${MAX_RECONNECT_ATTEMPTS})`);
        setTimeout(() => {
            initializeWebSocket().catch(reconnectErr => {
                error('Reconnection attempt failed:', reconnectErr);
            });
        }, RECONNECT_DELAY);
    } else {
        error('Max reconnection attempts reached');
    }
}

function handleWebSocketClose(event) {
    if (event.code !== 1000) {
        error(`WebSocket closed abnormally with code ${event.code}`);
        handleWebSocketError(new Error(`Abnormal WebSocket closure with code ${event.code}`));
    } else {
        log('WebSocket closed normally');
    }
}

function subscribeToTopic(channelId, topicName) {
    debug('Subscribing to topic:', topicName);

    const platformClient = window.platformClient;
    const apiInstance = new platformClient.NotificationsApi();
    
    apiInstance.postNotificationsChannelSubscriptions(channelId, [{ id: topicName }])
        .then(() => {
            log('Successfully subscribed to topic:', topicName);
        })
        .catch(err => {
            error('Error during topic subscription:', err);
        });
}
