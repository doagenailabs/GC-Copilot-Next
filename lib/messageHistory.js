(function() {
    const systemPrompt = window.systemPrompt;

    const LOG_PREFIX = 'GCCopilotNext - messageHistory.js -';
    const log = (message, ...args) => console.log(`${LOG_PREFIX} ${message}`, ...args);
    const error = (message, ...args) => console.error(`${LOG_PREFIX} ${message}`, ...args);
    const debug = (message, ...args) => console.debug(`${LOG_PREFIX} ${message}`, ...args);

    class MessageHistory {
        constructor(maxMessages = 5) {
            this.maxMessages = maxMessages;
            this.messages = [
                {
                    role: "system",
                    content: systemPrompt
                }
            ];
            this.userMessages = [];
            this.assistantMessages = [];
            log('MessageHistory initialized successfully');
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
                }
            } else if (role === 'assistant') {
                const message = {
                    role: 'assistant',
                    content
                };
                this.assistantMessages.push(message);

                if (this.assistantMessages.length > this.maxMessages) {
                    this.assistantMessages.shift();
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

    // Create a singleton instance
    window.messageHistory = new MessageHistory();
})();
