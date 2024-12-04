window.analysisStore = (function () {
    class AnalysisStore extends StoreBase {
        constructor() {
            super();
            this.currentAnalysis = '';
        }

        updateAnalysis(text) {
            if (typeof text !== 'string') {
                throw new Error('Analysis text must be a string');
            }
            this.currentAnalysis = text;
            this.notifyListeners(this.currentAnalysis);
        }

        getCurrentAnalysis() {
            return this.currentAnalysis;
        }
    }

    const store = new AnalysisStore();
    return {
        updateAnalysis: store.updateAnalysis.bind(store),
        subscribeToAnalysis: store.addListener.bind(store),
        getCurrentAnalysis: store.getCurrentAnalysis.bind(store)
    };
})();
