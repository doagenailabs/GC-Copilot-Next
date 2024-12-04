function initializeWebSocket(platformClient) {
    return new Promise((resolve, reject) => {
        const apiInstance = new platformClient.NotificationsApi();

        apiInstance.postNotificationsChannels({})
            .then(response => {
                const channelId = response.id;
                
                // Initialize WebSocket manager with custom handlers
                const wsManager = new WebSocketManager(response.connectUri, {
                    maxRetries: 3,
                    retryDelay: 3000,
                    handlers: {
                        onOpen: () => {
                            subscribeToTopic(channelId, `v2.conversations.${window.conversationId}.transcription`, platformClient);
                            resolve();
                        },
                        onMessage: async (data) => {
                            if (data.topicName === 'channel.metadata') {
                                return;
                            }

                            if (data.topicName === `v2.conversations.${window.conversationId}.transcription`) {
                                await processTranscription(data);
                            }

                            if (data.eventBody?.disconnectType) {
                                wsManager.close();
                            }
                        },
                        onError: (error) => {
                            console.error("WebSocket encountered an error:", error);
                            reject(error);
                        },
                        onClose: (event) => {
                            console.log("WebSocket connection closed:", event);
                        }
                    }
                });

                // Store manager reference for potential cleanup
                window.wsManager = wsManager;
            })
            .catch(err => {
                console.error("Error during postNotificationsChannels call:", err);
                reject(err);
            });
    });
}

function subscribeToTopic(channelId, topicName, platformClient) {
    const apiInstance = new platformClient.NotificationsApi();

    return apiInstance.postNotificationsChannelSubscriptions(channelId, [{ id: topicName }])
        .then(() => {
            console.log("Successfully subscribed to topic:", topicName);
        })
        .catch(err => {
            console.error("Error during topic subscription:", err);
            throw err; // Propagate error for handling
        });
}

async function processTranscription(data) {
    try {
        const transcripts = data.eventBody.transcripts;

        if (!transcripts?.length) {
            return;
        }

        if (!window.transcriptBuffer) {
            window.transcriptBuffer = [];
        }

        const finalTranscripts = transcripts.filter(t => t.isFinal);

        if (finalTranscripts.length === 0) {
            return;
        }

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

        // Use store from StoreBase
        transcriptionTexts.forEach(transcript => {
            window.transcriptionStore.updateTranscriptionHistory(transcript);
        });

        window.transcriptBuffer.push(...transcriptionTexts);

        // Clean up old transcripts
        const oldestAllowedTimestamp = Date.now() - 30000;
        window.transcriptBuffer = window.transcriptBuffer.filter(t => 
            t.timestamp >= oldestAllowedTimestamp
        );

        await analyzeTranscripts(window.transcriptBuffer);
    } catch (err) {
        console.error('Error processing transcription:', err);
    }
}

async function analyzeTranscripts(recentTranscripts) {
    try {
        const response = await fetch('/api/analyze', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-csrf-token': window.csrfToken // Add CSRF token
            },
            body: JSON.stringify({
                transcriptionData: JSON.stringify(recentTranscripts)
            })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
        }

        // Use streams API for efficient processing
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let analysisText = '';

        while (true) {
            const { done, value } = await reader.read();

            if (done) {
                break;
            }

            const chunk = decoder.decode(value);
            analysisText += chunk;
            
            // Use store from StoreBase
            window.analysisStore.updateAnalysis(analysisText);
        }
    } catch (err) {
        console.error('Error analyzing transcripts:', err);
        // Could add retry logic here if needed
    }
}
