(function() {
    const TranscriptionStore = class extends window.StoreBase {
        constructor() {
            super();
            this.transcriptionHistory = [];
            this.MAX_HISTORY = 50;
        }

        updateTranscriptionHistory(transcript) {
            if (!transcript || !transcript.text || !transcript.channel) {
                console.error('Invalid transcript');
                return;
            }
            this.transcriptionHistory.push(transcript);
            if (this.transcriptionHistory.length > this.MAX_HISTORY) {
                this.transcriptionHistory.shift();
            }
            this.notifyListeners([...this.transcriptionHistory]);
        }

        getCurrentTranscriptionHistory() {
            return [...this.transcriptionHistory];
        }
    };

    const store = new TranscriptionStore();
    
    window.transcriptionStore = {
        updateTranscriptionHistory: store.updateTranscriptionHistory.bind(store),
        subscribeToTranscriptions: store.addListener.bind(store),
        getCurrentTranscriptionHistory: store.getCurrentTranscriptionHistory.bind(store)
    };

    Object.freeze(window.transcriptionStore);
})();
