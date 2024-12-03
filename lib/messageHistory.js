(function() {
    const systemPrompt = window.systemPrompt;

    const LOG_PREFIX = 'GCCopilotNext - messageHistory.js -';
    const log = (message, ...args) => console.log(`${LOG_PREFIX} ${message}`, ...args);
    const error = (message, ...args) => console.error(`${LOG_PREFIX} ${message}`, ...args);
    const debug = (message, ...args) => console.debug(`${LOG_PREFIX} ${message}`, ...args);

    class MessageHistory {
        constructor() {
            // Use the maxHistoryMessages from the window configuration or default to 5
            this.maxMessages = parseInt(window.maxHistoryMessages) || 5;
            this.messages = [
                {
                    role: "system",
                    content: systemPrompt
                }
            ];
            this.userMessages = [];
            this.assistantMessages = [];
            log(`MessageHistory initialized with maxMessages: ${this.maxMessages}`);
        }

        addMessage(role, content, prefix = '') {
            if (!role || !content) {
                throw new Error('Role and content are required');
            }

            if (!['user', 'assistant'].includes(role)) {
                throw new Error(`Invalid role: ${role}`);
            }

            debug('Adding message:', { role, contentLength: content.length, prefix });

            if (role === 'user') {
                const message = {
                    role: 'user',
                    content: prefix ? `${prefix}: ${content}` : content
                };
                this.userMessages.push(message);

                if (this.userMessages.length > this.maxMessages) {
                    this.userMessages.shift();
                    debug('Oldest user message removed');
                }
            } else if (role === 'assistant') {
                const message = {
                    role: 'assistant',
                    content
                };
                this.assistantMessages.push(message);

                if (this.assistantMessages.length > this.maxMessages) {
                    this.assistantMessages.shift();
                    debug('Oldest assistant message removed');
                }
            }

            this.rebuildMessageArray();
            log('Message added successfully');
        }

        rebuildMessageArray() {
            this.messages = [
                { role: "system", content: systemPrompt },
                ...this.userMessages,
                ...this.assistantMessages
            ];
            debug('Message array rebuilt. Total messages:', this.messages.length);
        }

        getMessages() {
            debug('Retrieving all messages. Count:', this.messages.length);
            return this.messages;
        }

        clear() {
            this.userMessages = [];
            this.assistantMessages = [];
            this.messages = [
                {
                    role: "system",
                    content: systemPrompt
                }
            ];
            log('Message history cleared successfully');
        }
    }

    window.messageHistory = new MessageHistory();
})();
