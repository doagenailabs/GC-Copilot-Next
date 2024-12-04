window.transcriptionStore = (function () {
    class TranscriptionStore extends StoreBase {
        constructor() {
            super();
            this.transcriptionHistory = [];
            this.MAX_HISTORY = 50;
        }

        updateTranscriptionHistory(transcript) {
            if (!transcript || !transcript.text || !transcript.channel) {
                throw new Error('Invalid transcript');
            }
            this.transcriptionHistory.push(transcript);
            if (this.transcriptionHistory.length > this.MAX_HISTORY) {
                this.transcriptionHistory.shift();
            }
            this.notifyListeners(this.transcriptionHistory);
        }

        getCurrentTranscriptionHistory() {
            return [...this.transcriptionHistory];
        }
    }

    const store = new TranscriptionStore();
    return {
        updateTranscriptionHistory: store.updateTranscriptionHistory.bind(store),
        subscribeToTranscriptions: store.addListener.bind(store),
        getCurrentTranscriptionHistory: store.getCurrentTranscriptionHistory.bind(store)
    };
})();
