window.analysisStore = (function () {
    var listeners = new Set();
    var currentAnalysis = '';

    function updateAnalysis(text) {
        if (typeof text !== 'string') {
            window.logger.error('analysisStore', 'Analysis text must be a string');
            return;
        }
        currentAnalysis = text;
        listeners.forEach(function (listener) {
            try {
                listener(currentAnalysis);
            } catch (err) {
                window.logger.error('analysisStore', 'Listener error:', err);
            }
        });
    }

    function subscribeToAnalysis(listener) {
        if (typeof listener !== 'function') {
            window.logger.error('analysisStore', 'Listener must be a function');
            return function () { };
        }
        listeners.add(listener);
        return function () {
            listeners.delete(listener);
        };
    }

    function getCurrentAnalysis() {
        return currentAnalysis;
    }

    return {
        updateAnalysis: updateAnalysis,
        subscribeToAnalysis: subscribeToAnalysis,
        getCurrentAnalysis: getCurrentAnalysis
    };
})();
