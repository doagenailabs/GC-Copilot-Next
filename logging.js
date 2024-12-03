(function() {
    const APP_PREFIX = 'GC Copilot Next';
    const isLoggingEnabled = window.logsEnabled === 'true';

    window.logger = {
        log: function(component, message, ...args) {
            if (!isLoggingEnabled) return;
            console.log(`${APP_PREFIX} - ${component} - ${message}`, ...args);
        },
        error: function(component, message, ...args) {
            if (!isLoggingEnabled) return;
            console.error(`${APP_PREFIX} - ${component} - ${message}`, ...args);
        },
        debug: function(component, message, ...args) {
            if (!isLoggingEnabled) return;
            console.debug(`${APP_PREFIX} - ${component} - ${message}`, ...args);
        },
        warn: function(component, message, ...args) {
            if (!isLoggingEnabled) return;
            console.warn(`${APP_PREFIX} - ${component} - ${message}`, ...args);
        },
        info: function(component, message, ...args) {
            if (!isLoggingEnabled) return;
            console.info(`${APP_PREFIX} - ${component} - ${message}`, ...args);
        }
    };
})();
