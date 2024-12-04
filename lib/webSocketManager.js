class WebSocketManager {
    constructor(url, options = {}) {
        this.url = url;
        this.maxRetries = options.maxRetries || 3;
        this.retryDelay = options.retryDelay || 3000;
        this.retries = 0;
        this.handlers = new Map();
        this.connect();
    }

    connect() {
        this.ws = new WebSocket(this.url);
        this.setupEventHandlers();
    }

    setupEventHandlers() {
        this.ws.onmessage = this.handleMessage.bind(this);
        this.ws.onclose = this.handleClose.bind(this);
        this.ws.onerror = this.handleError.bind(this);
    }

    handleMessage(event) {
        try {
            const data = this.validateMessage(event.data);
            if (data.topicName === 'channel.metadata') {
                return;
            }
            if (data.topicName === `v2.conversations.${window.conversationId}.transcription`) {
                processTranscription(data);
            }
        } catch (err) {
            console.error('Invalid message received:', err);
        }
    }

    handleClose() {
        if (this.retries < this.maxRetries) {
            setTimeout(() => {
                this.retries++;
                this.connect();
            }, this.retryDelay);
        }
    }

    handleError(error) {
        console.error('WebSocket error:', error);
    }

    validateMessage(data) {
        const parsed = JSON.parse(data);
        // Add schema validation here if needed
        return parsed;
    }
}
