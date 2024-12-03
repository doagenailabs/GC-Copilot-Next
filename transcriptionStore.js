window.transcriptionStore = (function () {
    var listeners = new Set();
    var transcriptionHistory = [];
    var MAX_HISTORY = 50;

    function updateTranscriptionHistory(transcript) {
        if (!transcript || !transcript.text || !transcript.channel) {
            window.logger.error('transcriptionStore', 'Invalid transcript');
            return;
        }
        transcriptionHistory.push(transcript);
        if (transcriptionHistory.length > MAX_HISTORY) {
            transcriptionHistory.shift();
        }
        listeners.forEach(function (listener) {
            try {
                listener(transcriptionHistory);
            } catch (err) {
                window.logger.error('transcriptionStore', 'Listener error:', err);
            }
        });
    }

    function subscribeToTranscriptions(listener) {
        if (typeof listener !== 'function') {
            window.logger.error('transcriptionStore', 'Listener must be a function');
            return function () { };
        }
        listeners.add(listener);
        return function () {
            listeners.delete(listener);
        };
    }

    function getCurrentTranscriptionHistory() {
        return transcriptionHistory;
    }

    return {
        updateTranscriptionHistory: updateTranscriptionHistory,
        subscribeToTranscriptions: subscribeToTranscriptions,
        getCurrentTranscriptionHistory: getCurrentTranscriptionHistory
    };
})();
