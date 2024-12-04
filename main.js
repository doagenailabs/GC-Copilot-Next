function initializeWebSocket() {
    window.logger.debug('main', 'Initializing WebSocket connection');
    return new Promise((resolve, reject) => {
        window.logger.debug('main', 'Creating NotificationsApi instance');
        const apiInstance = new platformClient.NotificationsApi();

        window.logger.debug('main', 'Making postNotificationsChannels request');
        apiInstance.postNotificationsChannels({})
            .then(response => {
                window.logger.info('main', 'Notifications channel created successfully:', {
                    channelId: response.id,
                    connectUri: response.connectUri
                });
                const channelId = response.id;

                window.logger.info('main', 'Using conversationId for subscription:', { conversationId: window.conversationId });

                const wsManager = new WebSocketManager(response.connectUri, {
                    maxRetries: 3,
                    retryDelay: 3000,
                    handlers: {
                        onOpen: () => {
                            window.logger.info('main', 'WebSocket connection opened successfully');
                            window.logger.debug('main', 'Attempting to subscribe to transcription topic:', { conversationId: window.conversationId });

                            subscribeToTopic(channelId, `v2.conversations.${window.conversationId}.transcription`)
                                .then(() => {
                                    window.logger.info('main', 'Topic subscription successful');
                                    resolve();
                                })
                                .catch(error => {
                                    window.logger.error('main', 'Failed to subscribe to topic:', error);
                                    reject(error);
                                });
                        },
                        onMessage: async (data) => {
                            window.logger.debug('main', 'Received WebSocket message:', { 
                                topicName: data.topicName,
                                messageType: data.eventBody?.metadata?.type || 'unknown',
                                messageSize: JSON.stringify(data).length
                            });
                            
                            if (data.topicName === 'channel.metadata') {
                                window.logger.debug('main', 'Received metadata message, skipping processing');
                                return;
                            }

                            if (data.topicName === `v2.conversations.${window.conversationId}.transcription`) {
                                window.logger.debug('main', 'Processing transcription message');
                                try {
                                    await processTranscription(data);
                                    window.logger.debug('main', 'Transcription processing completed successfully');
                                } catch (error) {
                                    window.logger.error('main', 'Error during transcription processing:', error);
                                }
                            }

                            if (data.eventBody?.disconnectType) {
                                window.logger.warn('main', 'Disconnect event received:', {
                                    type: data.eventBody.disconnectType,
                                    reason: data.eventBody.disconnectReason || 'No reason provided'
                                });
                                wsManager.close();
                            }
                        },
                        onError: (error) => {
                            window.logger.error('main', 'WebSocket error:', {
                                message: error.message,
                                type: error.type,
                                code: error.code
                            });
                            reject(error);
                        },
                        onClose: (event) => {
                            window.logger.warn('main', 'WebSocket connection closed:', {
                                code: event.code,
                                reason: event.reason,
                                wasClean: event.wasClean
                            });
                        }
                    }
                });

                window.wsManager = wsManager;
                window.logger.info('main', 'WebSocket manager initialized and stored');
            })
            .catch(err => {
                window.logger.error('main', 'Failed to create notifications channel:', {
                    error: err.message,
                    stack: err.stack,
                    code: err.code
                });
                reject(err);
            });   
    });
}

function subscribeToTopic(channelId, topicName) {
    window.logger.debug('main', 'Attempting to subscribe to topic:', { 
        channelId, 
        topicName 
    });
    
    const apiInstance = new platformClient.NotificationsApi();
    const subscriptionBody = [{ id: topicName }];

    window.logger.debug('main', 'Making subscription request with body:', subscriptionBody);

    return apiInstance.postNotificationsChannelSubscriptions(channelId, subscriptionBody)
        .then(() => {
            window.logger.info('main', 'Successfully subscribed to topic:', {
                channelId,
                topicName
            });
        })
        .catch(err => {
            window.logger.error('main', 'Topic subscription failed:', {
                error: err.message,
                stack: err.stack,
                channelId,
                topicName
            });
            throw err;
        });
}

async function processTranscription(data) {
    try {
        window.logger.debug('main', 'Starting transcription processing', {
            eventType: data.eventBody?.metadata?.type,
            messageId: data.eventBody?.metadata?.messageId
        });

        const transcripts = data.eventBody.transcripts;
        window.logger.debug('main', 'Received transcripts array:', {
            count: transcripts?.length || 0
        });

        if (!transcripts?.length) {
            window.logger.debug('main', 'No transcripts to process, returning early');
            return;
        }

        if (!window.transcriptBuffer) {
            window.logger.debug('main', 'Initializing transcript buffer');
            window.transcriptBuffer = [];
        }

        const finalTranscripts = transcripts.filter(t => t.isFinal);
        window.logger.debug('main', 'Filtered final transcripts:', { 
            totalCount: transcripts.length,
            finalCount: finalTranscripts.length 
        });

        if (finalTranscripts.length === 0) {
            window.logger.debug('main', 'No final transcripts to process, skipping');
            return;
        }

        const transcriptionTexts = finalTranscripts.map(transcript => {
            const bestAlternative = transcript.alternatives.reduce((best, current) =>
                current.confidence > best.confidence ? current : best
            );
            
            window.logger.debug('main', 'Processing transcript:', {
                channel: transcript.channel,
                confidence: bestAlternative.confidence,
                length: bestAlternative.transcript.length
            });

            return {
                text: bestAlternative.transcript,
                channel: transcript.channel,
                confidence: bestAlternative.confidence,
                timestamp: Date.now()
            };
        });

        window.logger.info('main', 'Processed transcription texts:', {
            count: transcriptionTexts.length,
            channels: transcriptionTexts.map(t => t.channel)
        });

        transcriptionTexts.forEach(transcript => {
            window.logger.debug('main', 'Updating transcription store:', {
                channel: transcript.channel,
                textLength: transcript.text.length,
                confidence: transcript.confidence
            });
            window.transcriptionStore.updateTranscriptionHistory(transcript);
        });

        window.transcriptBuffer.push(...transcriptionTexts);
        window.logger.debug('main', 'Updated transcript buffer:', {
            newSize: window.transcriptBuffer.length
        });

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

        window.logger.info('main', 'Starting analysis of transcripts');
        await analyzeTranscripts(window.transcriptBuffer);
        window.logger.debug('main', 'Completed transcript processing cycle');

    } catch (err) {
        window.logger.error('main', 'Error in processTranscription:', {
            error: err.message,
            stack: err.stack
        });
        throw err;
    }
}

async function analyzeTranscripts(recentTranscripts) {
    try {
        window.logger.debug('main', 'Starting transcript analysis:', {
            transcriptCount: recentTranscripts.length,
            oldestTimestamp: Math.min(...recentTranscripts.map(t => t.timestamp))
        });

        const requestBody = JSON.stringify({
            transcriptionData: JSON.stringify(recentTranscripts)
        });

        window.logger.debug('main', 'Making analysis API request:', {
            endpoint: '/api/analyze',
            payloadSize: requestBody.length
        });

        const response = await fetch('/api/analyze', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-csrf-token': window.csrfToken
            },
            body: requestBody
        });

        if (!response.ok) {
            const errorData = await response.json();
            window.logger.error('main', 'Analysis API error response:', {
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
                window.logger.info('main', 'Completed stream processing:', {
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

        window.logger.info('main', 'Analysis completed successfully:', {
            totalChunks: chunkCount,
            finalSize: analysisText.length
        });

    } catch (err) {
        window.logger.error('main', 'Error in analyzeTranscripts:', {
            error: err.message,
            stack: err.stack
        });
        throw err;
    }
}
