import { updateAnalysis } from '@/lib/analysisStore';

export async function initializeWebSocket() {
    let channelId; 
    const platformClient = window.platformClient;
    const apiInstance = new platformClient.NotificationsApi();

    console.log("websocket.js - About to call postNotificationsChannels...");

    try {
        const response = await apiInstance.postNotificationsChannels({});
        console.log("websocket.js - Received response from postNotificationsChannels:", response);

        channelId = response.id;
        const ws = new WebSocket(response.connectUri);

        ws.onmessage = async (event) => {
            console.log("websocket.js - WebSocket message received:", event.data);
            const data = JSON.parse(event.data);
            
            if (data.topicName === `v2.conversations.${window.conversationId}.transcription`) {
                await processTranscription(data);
            }
            
            if (data.eventBody.disconnectType) {
                console.log("websocket.js - Received disconnectType in WebSocket message. Closing WebSocket.");
                ws.close();
            }
        };

        ws.onopen = () => {
            console.log("websocket.js - WebSocket connection opened.");
            subscribeToTopic(channelId, `v2.conversations.${window.conversationId}.transcription`);
        };

        ws.onerror = (error) => {
            console.log("websocket.js - WebSocket encountered an error:", error);
        };

        ws.onclose = (event) => {
            console.log("websocket.js - WebSocket connection closed:", event);
        };
    } catch (err) {
        console.error("websocket.js - Error during postNotificationsChannels call:", err);
        throw err;
    }
}

async function processTranscription(data) {
    const { transcripts } = data.eventBody;
    
    if (!transcripts?.length) return;

    // Create a buffer to accumulate transcripts
    if (!window.transcriptBuffer) {
        window.transcriptBuffer = [];
    }

    // Only process final transcripts
    const finalTranscripts = transcripts.filter(t => t.isFinal);
    if (finalTranscripts.length === 0) return;

    // Get the most confident alternative for each transcript
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

    // Add to buffer
    window.transcriptBuffer.push(...transcriptionTexts);

    // If we have more than 30 seconds of conversation, analyze it
    const oldestAllowedTimestamp = Date.now() - 30000;
    const recentTranscripts = window.transcriptBuffer.filter(t => t.timestamp >= oldestAllowedTimestamp);
    window.transcriptBuffer = recentTranscripts;

    try {
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
            throw new Error(\`HTTP error! status: \${response.status}\`);
        }

        // Create a text decoder for the streaming response
        const reader = response.body.getReader();
        const decoder = new TextDecoder();

        // Initialize analysis text
        let analysisText = '';

        while (true) {
            const { done, value } = await reader.read();
            
            if (done) {
                break;
            }

            // Decode the chunk and update the analysis
            const chunk = decoder.decode(value);
            analysisText += chunk;
            updateAnalysis(analysisText);
        }
    } catch (error) {
        console.error('Error analyzing transcription:', error);
    }
}

function subscribeToTopic(channelId, topicName) {
    console.log("websocket.js - Attempting to subscribe to topic:", topicName);

    const platformClient = window.platformClient;
    let apiInstance = new platformClient.NotificationsApi();
    
    apiInstance.postNotificationsChannelSubscriptions(channelId, [topicName])
        .then(() => {
            console.log("websocket.js - Successfully subscribed to topic:", topicName);
        })
        .catch(err => {
            console.error("websocket.js - Error during topic subscription:", err);
        });
}
