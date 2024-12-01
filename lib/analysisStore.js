const listeners = new Set();

let currentAnalysis = '';

export function updateAnalysis(text) {
    currentAnalysis = text;
    // Notify all listeners of the update
    listeners.forEach(listener => listener(currentAnalysis));
}

export function subscribeToAnalysis(listener) {
    listeners.add(listener);
    // Return unsubscribe function
    return () => listeners.delete(listener);
}

export function getCurrentAnalysis() {
    return currentAnalysis;
}
