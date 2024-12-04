(function() {
    const APP_PREFIX = 'GC Copilot Next';
    
    window.logger = {
        log: function(component, message, ...args) {
            if (window.logsEnabled !== 'true') return;
            console.log(`${APP_PREFIX} - ${component} - ${message}`, ...args);
        },
        error: function(component, message, ...args) {
            if (window.logsEnabled !== 'true') return;
            console.error(`${APP_PREFIX} - ${component} - ${message}`, ...args);
        },
        debug: function(component, message, ...args) {
            if (window.logsEnabled !== 'true') return;
            console.debug(`${APP_PREFIX} - ${component} - ${message}`, ...args);
        },
        warn: function(component, message, ...args) {
            if (window.logsEnabled !== 'true') return;
            console.warn(`${APP_PREFIX} - ${component} - ${message}`, ...args);
        },
        info: function(component, message, ...args) {
            if (window.logsEnabled !== 'true') return;
            console.info(`${APP_PREFIX} - ${component} - ${message}`, ...args);
        }
    };

    console.debug(`${APP_PREFIX} - logger - Logger initialized, waiting for config`);
})();
