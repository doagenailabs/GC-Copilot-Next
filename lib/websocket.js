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

        if (!response.ok) throw new Error('Analysis request failed');

        const reader = response.body.getReader();
        const decoder = new TextDecoder();

        let analysisText = '';
        while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            
            const chunk = decoder.decode(value);
            analysisText += chunk;
            displayAnalysis(analysisText);
        }
    } catch (error) {
        console.error('Error analyzing transcription:', error);
    }
}
