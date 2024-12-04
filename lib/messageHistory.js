class MessageHistory {
    constructor(options = {}) {
        const isBrowser = typeof window !== 'undefined';
        const maxMessages = parseInt(options.maxMessages) || 5;
        const systemPrompt = options.systemPrompt || '';
        const logger = options.logger || {
            log: (...args) => console.log('messageHistory', ...args),
            error: (...args) => console.error('messageHistory', ...args),
            debug: (...args) => console.debug('messageHistory', ...args),
        };

        this.maxMessages = maxMessages;
        this.messages = [{ 
            role: "system", 
            content: systemPrompt,
            timestamp: Date.now()
        }];
        this.userMessages = [];
        this.assistantMessages = [];
        this.logger = logger;

        // Start cleanup interval if in browser
        if (isBrowser) {
            this.startCleanupInterval();
        }
        
        this.logger.log(`MessageHistory initialized with maxMessages: ${maxMessages}`);
    }

    startCleanupInterval() {
        // Cleanup old messages every hour
        setInterval(() => this.cleanup(), 3600000);
    }

    cleanup() {
        const oldestAllowed = Date.now() - (24 * 60 * 60 * 1000); // 24 hours

        this.userMessages = this.userMessages.filter(msg => msg.timestamp > oldestAllowed);
        this.assistantMessages = this.assistantMessages.filter(msg => msg.timestamp > oldestAllowed);
        
        this.rebuildMessageArray();
        this.logger.debug('Cleanup completed');
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
        try {
            this.validateMessage(role, content);
            this.logger.debug('Adding message:', { role, contentLength: content.length, prefix });

            const message = {
                role,
                content: prefix ? `${prefix}: ${content}` : content,
                timestamp: Date.now()
            };

            if (role === 'user') {
                this.userMessages.push(message);
                if (this.userMessages.length > this.maxMessages) {
                    this.userMessages.shift();
                    this.logger.debug('Oldest user message removed');
                }
            } else if (role === 'assistant') {
                this.assistantMessages.push(message);
                if (this.assistantMessages.length > this.maxMessages) {
                    this.assistantMessages.shift();
                    this.logger.debug('Oldest assistant message removed');
                }
            }

            this.rebuildMessageArray();
            this.logger.log('Message added successfully');
        } catch (err) {
            this.logger.error('Error adding message:', err);
            throw err;
        }
    }

    rebuildMessageArray() {
        this.messages = [
            this.messages[0], // Keep the system message
            ...this.userMessages,
            ...this.assistantMessages
        ];

        this.logger.debug('Message array rebuilt. Total messages:', this.messages.length);
    }

    getMessages() {
        this.logger.debug('Retrieving all messages. Count:', this.messages.length);
        return [...this.messages]; // Return a copy to prevent external modification
    }

    clear() {
        this.userMessages = [];
        this.assistantMessages = [];
        this.messages = [{
            role: "system",
            content: this.messages[0].content, // Keep the system prompt
            timestamp: Date.now()
        }];
        
        this.logger.log('Message history cleared successfully');
    }
}

module.exports = MessageHistory;
