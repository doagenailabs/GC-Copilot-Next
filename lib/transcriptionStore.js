const LOG_PREFIX = 'GCCopilotNext - transcriptionStore.js -';
const log = (message, ...args) => console.log(`${LOG_PREFIX} ${message}`, ...args);
const error = (message, ...args) => console.error(`${LOG_PREFIX} ${message}`, ...args);
const debug = (message, ...args) => console.debug(`${LOG_PREFIX} ${message}`, ...args);

const MAX_HISTORY = 50;
const listeners = new Set();
let transcriptionHistory = [];

export function updateTranscriptionHistory(transcript) {
    try {
        if (!transcript) {
            throw new Error('Transcript is required');
        }

        debug('Updating transcription history with new transcript');
        
        // Validate transcript structure
        if (!transcript.text || !transcript.channel) {
            throw new Error('Invalid transcript structure');
        }

        transcriptionHistory = [...transcriptionHistory, transcript].slice(-MAX_HISTORY);
        debug(`Transcription history updated. Current count: ${transcriptionHistory.length}`);

        const listenerCount = listeners.size;
        debug(`Notifying ${listenerCount} listeners`);

        listeners.forEach(listener => {
            try {
                listener(transcriptionHistory);
            } catch (err) {
                error('Listener error:', err);
            }
        });

        log('Transcription history update complete');
    } catch (err) {
        error('Failed to update transcription history:', err);
        throw err;
    }
}

export function subscribeToTranscriptions(listener) {
    try {
        if (typeof listener !== 'function') {
            throw new Error('Listener must be a function');
        }

        debug('Adding new transcription listener');
        listeners.add(listener);
        log('Listener added successfully');

        return () => {
            try {
                listeners.delete(listener);
                debug('Listener removed successfully');
            } catch (err) {
                error('Failed to remove listener:', err);
            }
        };
    } catch (err) {
        error('Failed to subscribe to transcriptions:', err);
        // Return a no-op unsubscribe function in case of error
        return () => {};
    }
}

export function getCurrentTranscriptionHistory() {
    debug('Getting current transcription history. Count:', transcriptionHistory.length);
    return transcriptionHistory;
}
