const platformClient = require('platformClient');

function initializeWebSocket() {
    window.logger.debug('main', 'Initializing WebSocket connection');
    return new Promise((resolve, reject) => {
        const apiInstance = new platformClient.NotificationsApi();
        window.logger.debug('main', 'Created NotificationsApi instance');

        apiInstance.postNotificationsChannels({})
            .then(response => {
                window.logger.debug('main', 'Notifications channel created:', { channelId: response.id });
                const channelId = response.id;
                
                // Initialize WebSocket manager with custom handlers
                window.logger.debug('main', 'Initializing WebSocket manager with config:', {
                    maxRetries: 3,
                    retryDelay: 3000
                });

                const wsManager = new WebSocketManager(response.connectUri, {
                    maxRetries: 3,
                    retryDelay: 3000,
                    handlers: {
                        onOpen: () => {
                            window.logger.info('main', 'WebSocket connection opened successfully');
                            subscribeToTopic(channelId, `v2.conversations.${window.conversationId}.transcription`);
                            resolve();
                        },
                        onMessage: async (data) => {
                            window.logger.debug('main', 'Received WebSocket message:', { topicName: data.topicName });
                            
                            if (data.topicName === 'channel.metadata') {
                                window.logger.debug('main', 'Skipping metadata message');
                                return;
                            }

                            if (data.topicName === `v2.conversations.${window.conversationId}.transcription`) {
                                window.logger.debug('main', 'Processing transcription message');
                                await processTranscription(data);
                            }

                            if (data.eventBody?.disconnectType) {
                                window.logger.info('main', 'Disconnect event received, closing WebSocket');
                                wsManager.close();
                            }
                        },
                        onError: (error) => {
                            window.logger.error('main', 'WebSocket encountered an error:', error);
                            reject(error);
                        },
                        onClose: (event) => {
                            window.logger.info('main', 'WebSocket connection closed:', { code: event.code, reason: event.reason });
                        }
                    }
                });

                // Store manager reference for potential cleanup
                window.wsManager = wsManager;
                window.logger.debug('main', 'WebSocket manager stored in window object');
            })
            .catch(err => {
                window.logger.error('main', 'Error during postNotificationsChannels call:', err);
                reject(err);
            });   
    });
}

function subscribeToTopic(channelId, topicName) {
    window.logger.debug('main', 'Subscribing to topic:', { channelId, topicName });
    const apiInstance = new platformClient.NotificationsApi();

    return apiInstance.postNotificationsChannelSubscriptions(channelId, [{ id: topicName }])
        .then(() => {
            window.logger.info('main', 'Successfully subscribed to topic:', topicName);
        })
        .catch(err => {
            window.logger.error('main', 'Error during topic subscription:', err);
            throw err; // Propagate error for handling
        });
}

async function processTranscription(data) {
    try {
        window.logger.debug('main', 'Starting transcription processing');
        const transcripts = data.eventBody.transcripts;

        if (!transcripts?.length) {
            window.logger.debug('main', 'No transcripts to process, returning');
            return;
        }

        if (!window.transcriptBuffer) {
            window.logger.debug('main', 'Initializing transcript buffer');
            window.transcriptBuffer = [];
        }

        const finalTranscripts = transcripts.filter(t => t.isFinal);
        window.logger.debug('main', 'Filtered final transcripts:', { count: finalTranscripts.length });

        if (finalTranscripts.length === 0) {
            window.logger.debug('main', 'No final transcripts to process, returning');
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

        window.logger.debug('main', 'Mapped transcription texts:', { 
            count: transcriptionTexts.length,
            samples: transcriptionTexts.map(t => ({ 
                channel: t.channel,
                confidence: t.confidence,
                textLength: t.text.length 
            }))
        });

        // Use store from StoreBase
        transcriptionTexts.forEach(transcript => {
            window.logger.debug('main', 'Updating transcription history:', {
                channel: transcript.channel,
                confidence: transcript.confidence
            });
            window.transcriptionStore.updateTranscriptionHistory(transcript);
        });

        window.transcriptBuffer.push(...transcriptionTexts);
        window.logger.debug('main', 'Updated transcript buffer size:', window.transcriptBuffer.length);

        // Clean up old transcripts
        const oldestAllowedTimestamp = Date.now() - 30000;
        const originalLength = window.transcriptBuffer.length;
        window.transcriptBuffer = window.transcriptBuffer.filter(t => 
            t.timestamp >= oldestAllowedTimestamp
        );
        window.logger.debug('main', 'Cleaned transcript buffer:', {
            originalSize: originalLength,
            newSize: window.transcriptBuffer.length,
            removed: originalLength - window.transcriptBuffer.length
        });

        window.logger.debug('main', 'Starting transcript analysis');
        await analyzeTranscripts(window.transcriptBuffer);
    } catch (err) {
        window.logger.error('main', 'Error processing transcription:', err);
    }
}

async function analyzeTranscripts(recentTranscripts) {
    try {
        window.logger.debug('main', 'Initiating transcript analysis:', { 
            transcriptCount: recentTranscripts.length 
        });

        const response = await fetch('/api/analyze', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-csrf-token': window.csrfToken
            },
            body: JSON.stringify({
                transcriptionData: JSON.stringify(recentTranscripts)
            })
        });

        if (!response.ok) {
            const errorData = await response.json();
            window.logger.error('main', 'Analysis API response error:', { 
                status: response.status,
                statusText: response.statusText,
                errorData 
            });
            throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
        }

        window.logger.debug('main', 'Starting stream processing of analysis response');
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let analysisText = '';
        let chunkCount = 0;

        while (true) {
            const { done, value } = await reader.read();

            if (done) {
                window.logger.debug('main', 'Completed stream processing', { 
                    totalChunks: chunkCount,
                    finalTextLength: analysisText.length 
                });
                break;
            }

            const chunk = decoder.decode(value);
            analysisText += chunk;
            chunkCount++;
            
            window.logger.debug('main', 'Processing analysis chunk:', { 
                chunkNumber: chunkCount,
                chunkSize: chunk.length,
                totalSize: analysisText.length 
            });
            
            window.analysisStore.updateAnalysis(analysisText);
        }

        window.logger.info('main', 'Analysis completed successfully', {
            totalChunks: chunkCount,
            totalSize: analysisText.length
        });
    } catch (err) {
        window.logger.error('main', 'Error analyzing transcripts:', err);
    }
}
