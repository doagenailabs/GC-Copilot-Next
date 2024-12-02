const LOG_PREFIX = 'GCCopilotNext - analysisStore.js -';
const log = (message, ...args) => console.log(`${LOG_PREFIX} ${message}`, ...args);
const error = (message, ...args) => console.error(`${LOG_PREFIX} ${message}`, ...args);
const debug = (message, ...args) => console.debug(`${LOG_PREFIX} ${message}`, ...args);

const listeners = new Set();
let currentAnalysis = '';

export function updateAnalysis(text) {
    try {
        if (typeof text !== 'string') {
            throw new Error('Analysis text must be a string');
        }

        debug('Updating analysis text:', text.substring(0, 100) + '...');
        currentAnalysis = text;

        const listenerCount = listeners.size;
        debug(`Notifying ${listenerCount} listeners`);

        listeners.forEach(listener => {
            try {
                listener(currentAnalysis);
            } catch (err) {
                error('Listener error:', err);
            }
        });

        log('Analysis update complete');
    } catch (err) {
        error('Failed to update analysis:', err);
    }
}

export function subscribeToAnalysis(listener) {
    try {
        if (typeof listener !== 'function') {
            throw new Error('Listener must be a function');
        }

        debug('Adding new analysis listener');
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
        error('Failed to subscribe to analysis:', err);
        // Return a no-op unsubscribe function in case of error
        return () => {};
    }
}

export function getCurrentAnalysis() {
    debug('Getting current analysis');
    return currentAnalysis;
}
