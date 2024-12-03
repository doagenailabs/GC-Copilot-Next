window.showToast = function(message, toastId, duration = 5000) {
    const LOG_PREFIX = 'GCCopilotNext - toast.js -';
    const log = (message, ...args) => console.log(`${LOG_PREFIX} ${message}`, ...args);
    const error = (message, ...args) => console.error(`${LOG_PREFIX} ${message}`, ...args);
    const debug = (message, ...args) => console.debug(`${LOG_PREFIX} ${message}`, ...args);

    function getURLParameter(name) {
        const params = new URLSearchParams(window.location.search);
        const value = params.get(name);
        debug(`URL parameter ${name}:`, value);
        return value;
    }

    try {
        debug('Showing toast with:', { message, toastId, duration });

        if (!message) {
            throw new Error('Toast message is required');
        }

        // Check if the toast is being shown in a Salesforce environment
        const isSalesforce = getURLParameter('sf') === 'true';
        log('Environment:', isSalesforce ? 'Salesforce' : 'Genesys Cloud');

        if (isSalesforce) {
            log('Creating custom toast for Salesforce LWC');
            createCustomToast(message, toastId, duration);
        } else {
            log('Using clientApp SDK toast logic');

            if (!window.myClientApp) {
                throw new Error('ClientApp not initialized');
            }

            if (!window.myClientApp.alerting?.showToastPopup) {
                throw new Error('Toast functionality not available');
            }

            var options = {
                id: toastId,
                timeout: duration,
                showCloseButton: true
            };
            debug('Toast options:', options);

            window.myClientApp.alerting.showToastPopup(toastId, message, options);
            log('Toast shown successfully');
        }
    } catch (err) {
        error('Failed to show toast:', err);
        // Fallback to console in case of error
        console.warn(`Toast message (failed to display): ${message}`);
    }

    function createCustomToast(message, toastId, duration) {
        try {
            debug('Creating custom toast with:', { message, toastId, duration });

            // Post message to the parent window (Salesforce LWC)
            const payload = {
                type: 'SHOW_TOAST',
                detail: {
                    message: message,
                    toastId: toastId,
                    duration: duration
                }
            };

            debug('Posting message to parent:', payload);
            window.parent.postMessage(payload, '*');
            log('Custom toast message posted to parent window');
        } catch (err) {
            error('Failed to create custom toast:', err);
        }
    }
};
