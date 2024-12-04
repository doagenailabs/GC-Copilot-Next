(function() {
    const MessageHistory = require('./messageHistory');

    const messageHistoryInstance = new MessageHistory({
        maxMessages: parseInt(window.maxHistoryMessages) || 5,
        systemPrompt: window.systemPrompt || '',
        logger: {
            log: (message, ...args) => window.logger.log('messageHistory', message, ...args),
            error: (message, ...args) => window.logger.error('messageHistory', message, ...args),
            debug: (message, ...args) => window.logger.debug('messageHistory', message, ...args)
        }
    });

    Object.freeze(messageHistoryInstance);

    // Expose instance through read-only property
    Object.defineProperty(window, 'messageHistory', {
        value: messageHistoryInstance,
        writable: false,
        configurable: false
    });
})();
