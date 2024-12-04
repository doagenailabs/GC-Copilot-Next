(function() {
    // Use a WeakMap for private variables
    const privateStore = new WeakMap();

    class MessageHistory {
        constructor() {
            const maxMessages = parseInt(window.maxHistoryMessages) || 5;
            
            // Initialize private store
            privateStore.set(this, {
                maxMessages,
                messages: [{ 
                    role: "system", 
                    content: window.systemPrompt,
                    timestamp: Date.now()
                }],
                userMessages: [],
                assistantMessages: [],
                logger: {
                    log: (message, ...args) => console.log(`GCCopilotNext - messageHistory.js - ${message}`, ...args),
                    error: (message, ...args) => console.error(`GCCopilotNext - messageHistory.js - ${message}`, ...args),
                    debug: (message, ...args) => console.debug(`GCCopilotNext - messageHistory.js - ${message}`, ...args)
                }
            });

            // Start cleanup interval
            this.startCleanupInterval();
            
            privateStore.get(this).logger.log(`MessageHistory initialized with maxMessages: ${maxMessages}`);
        }

        startCleanupInterval() {
            // Cleanup old messages every hour
            setInterval(() => this.cleanup(), 3600000);
        }

        cleanup() {
            const store = privateStore.get(this);
            const oldestAllowed = Date.now() - (24 * 60 * 60 * 1000); // 24 hours

            store.userMessages = store.userMessages.filter(msg => msg.timestamp > oldestAllowed);
            store.assistantMessages = store.assistantMessages.filter(msg => msg.timestamp > oldestAllowed);
            
            this.rebuildMessageArray();
            store.logger.debug('Cleanup completed');
        }

        validateMessage(role, content) {
            if (!role || !content) {
                throw new Error('Role and content are required');
            }

            if (!['user', 'assistant'].includes(role)) {
                throw new Error(`Invalid role: ${role}`);
            }

            if (typeof content !== 'string' || content.length === 0) {
                throw new Error('Content must be a non-empty string');
            }

            return true;
        }

        addMessage(role, content, prefix = '') {
            const store = privateStore.get(this);
            
            try {
                this.validateMessage(role, content);
                store.logger.debug('Adding message:', { role, contentLength: content.length, prefix });

                const message = {
                    role,
                    content: prefix ? `${prefix}: ${content}` : content,
                    timestamp: Date.now()
                };

                if (role === 'user') {
                    store.userMessages.push(message);
                    if (store.userMessages.length > store.maxMessages) {
                        store.userMessages.shift();
                        store.logger.debug('Oldest user message removed');
                    }
                } else if (role === 'assistant') {
                    store.assistantMessages.push(message);
                    if (store.assistantMessages.length > store.maxMessages) {
                        store.assistantMessages.shift();
                        store.logger.debug('Oldest assistant message removed');
                    }
                }

                this.rebuildMessageArray();
                store.logger.log('Message added successfully');
            } catch (err) {
                store.logger.error('Error adding message:', err);
                throw err;
            }
        }

        rebuildMessageArray() {
            const store = privateStore.get(this);
            
            store.messages = [
                { role: "system", content: window.systemPrompt },
                ...store.userMessages,
                ...store.assistantMessages
            ];

            store.logger.debug('Message array rebuilt. Total messages:', store.messages.length);
        }

        getMessages() {
            const store = privateStore.get(this);
            store.logger.debug('Retrieving all messages. Count:', store.messages.length);
            return [...store.messages]; // Return a copy to prevent external modification
        }

        clear() {
            const store = privateStore.get(this);
            
            store.userMessages = [];
            store.assistantMessages = [];
            store.messages = [{
                role: "system",
                content: window.systemPrompt,
                timestamp: Date.now()
            }];
            
            store.logger.log('Message history cleared successfully');
        }
    }

    // Create singleton instance
    const messageHistoryInstance = new MessageHistory();
    Object.freeze(messageHistoryInstance);

    // Expose instance through read-only property
    Object.defineProperty(window, 'messageHistory', {
        value: messageHistoryInstance,
        writable: false,
        configurable: false
    });
})();
