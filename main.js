function initializeWebSocket(platformClient) {
    return new Promise((resolve, reject) => {
        let channelId;

        const apiInstance = new platformClient.NotificationsApi();

        apiInstance.postNotificationsChannels({})
            .then(response => {
                channelId = response.id;
                const ws = new WebSocket(response.connectUri);
                window.wsInstance = ws;

                ws.onmessage = async (event) => {
                    try {
                        const data = JSON.parse(event.data);

                        if (data.topicName === 'channel.metadata') {
                            return;
                        }

                        if (data.topicName === `v2.conversations.${window.conversationId}.transcription`) {
                            await processTranscription(data);
                        }

                        if (data.eventBody && data.eventBody.disconnectType) {
                            ws.close();
                        }
                    } catch (err) {
                        console.error('WebSocket message processing error:', err);
                    }
                };

                ws.onopen = () => {
                    subscribeToTopic(channelId, `v2.conversations.${window.conversationId}.transcription`, platformClient);
                    resolve();
                };

                ws.onerror = (error) => {
                    console.error("WebSocket encountered an error:", error);
                    reject(error);
                };

                ws.onclose = (event) => {
                    console.log("WebSocket connection closed:", event);
                };
            })
            .catch(err => {
                console.error("Error during postNotificationsChannels call:", err);
                reject(err);
            });
    });
}

function subscribeToTopic(channelId, topicName, platformClient) {
    const apiInstance = new platformClient.NotificationsApi();

    apiInstance.postNotificationsChannelSubscriptions(channelId, [{ id: topicName }])
        .then(() => {
            console.log("Successfully subscribed to topic:", topicName);
        })
        .catch(err => {
            console.error("Error during topic subscription:", err);
        });
}

async function processTranscription(data) {
    try {
        const transcripts = data.eventBody.transcripts;

        if (!transcripts || !transcripts.length) {
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

        transcriptionTexts.forEach(transcript => {
            window.transcriptionStore.updateTranscriptionHistory(transcript);
        });

        window.transcriptBuffer.push(...transcriptionTexts);

        const oldestAllowedTimestamp = Date.now() - 30000;
        const recentTranscripts = window.transcriptBuffer.filter(t => t.timestamp >= oldestAllowedTimestamp);
        window.transcriptBuffer = recentTranscripts;

        await analyzeTranscripts(recentTranscripts);
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
            },
            body: JSON.stringify({
                transcriptionData: JSON.stringify(recentTranscripts)
            })
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

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
            window.analysisStore.updateAnalysis(analysisText);
        }
    } catch (err) {
        console.error('Error analyzing transcripts:', err);
    }
}
