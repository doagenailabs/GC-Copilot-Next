const listeners = new Set();
let transcriptionHistory = [];

export function updateTranscriptionHistory(transcript) {
    transcriptionHistory = [...transcriptionHistory, transcript].slice(-50); // Keep last 50 messages
    listeners.forEach(listener => listener(transcriptionHistory));
}

export function subscribeToTranscriptions(listener) {
    listeners.add(listener);
    return () => listeners.delete(listener);
}

export function getCurrentTranscriptionHistory() {
    return transcriptionHistory;
}
