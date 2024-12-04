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
    this.ws.onmessage = (event) => {
      try {
        const data = this.validateMessage(event.data);
        this.handlers.get('message')?.forEach(handler => handler(data));
      } catch (err) {
        console.error('Invalid message received:', err);
      }
    };

    this.ws.onclose = () => {
      if (this.retries < this.maxRetries) {
        setTimeout(() => {
          this.retries++;
          this.connect();
        }, this.retryDelay);
      }
    };
  }

  validateMessage(data) {
    const parsed = JSON.parse(data);
    // Add schema validation here
    return parsed;
  }
}
