(function() {
    const AnalysisStore = class extends window.StoreBase {
        constructor() {
            super();
            this.currentAnalysis = '';
        }

        updateAnalysis(text) {
            if (typeof text !== 'string') {
                console.error('Analysis text must be a string');
                return;
            }
            this.currentAnalysis = text;
            this.notifyListeners(this.currentAnalysis);
        }

        getCurrentAnalysis() {
            return this.currentAnalysis;
        }
    };

    const store = new AnalysisStore();
    
    window.analysisStore = {
        updateAnalysis: store.updateAnalysis.bind(store),
        subscribeToAnalysis: store.addListener.bind(store),
        getCurrentAnalysis: store.getCurrentAnalysis.bind(store)
    };

    Object.freeze(window.analysisStore);
})();
