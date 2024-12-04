class WebSocketManager {
    constructor(url, options = {}) {
        window.logger.debug('webSocket', 'Initializing WebSocketManager:', {
            url,
            maxRetries: options.maxRetries || 3,
            retryDelay: options.retryDelay || 3000
        });

        this.url = url;
        this.maxRetries = options.maxRetries || 3;
        this.retryDelay = options.retryDelay || 3000;
        this.retries = 0;
        this.handlers = options.handlers || {};
        this.connectionAttempts = 0;
        this.isConnecting = false;
        this.backoffFactor = 1.5;
        this.maxRetryDelay = 30000;

        this.connect();
    }

    connect() {
        if (this.isConnecting) {
            window.logger.warn('webSocket', 'Connection attempt already in progress, skipping');
            return;
        }

        this.isConnecting = true;
        this.connectionAttempts++;

        window.logger.info('webSocket', 'Initiating WebSocket connection:', {
            attempt: this.connectionAttempts,
            url: this.url,
            retries: this.retries
        });

        try {
            this.ws = new WebSocket(this.url);
            this.setupEventHandlers();
        } catch (error) {
            window.logger.error('webSocket', 'Failed to create WebSocket instance:', {
                error: error.message,
                stack: error.stack
            });
            this.handleError(error);
        }
    }

    setupEventHandlers() {
        window.logger.debug('webSocket', 'Setting up WebSocket event handlers');

        this.ws.onopen = (event) => {
            window.logger.info('webSocket', 'WebSocket connection established:', {
                attempt: this.connectionAttempts,
                timestamp: new Date().toISOString()
            });

            this.isConnecting = false;
            this.retries = 0; // Reset retry counter on successful connection
            
            if (this.handlers.onOpen) {
                try {
                    this.handlers.onOpen(event);
                } catch (error) {
                    window.logger.error('webSocket', 'Error in onOpen handler:', {
                        error: error.message,
                        stack: error.stack
                    });
                }
            }
        };

        this.ws.onmessage = (event) => {
            window.logger.debug('webSocket', 'Received WebSocket message:', {
                dataSize: event.data.length,
                timestamp: new Date().toISOString()
            });

            try {
                const data = this.validateMessage(event.data);
                
                if (this.handlers.onMessage) {
                    this.handlers.onMessage(data);
                }
            } catch (error) {
                window.logger.error('webSocket', 'Error processing WebSocket message:', {
                    error: error.message,
                    stack: error.stack,
                    rawData: event.data.slice(0, 200) + '...' // Log first 200 chars for debugging
                });
            }
        };

        this.ws.onclose = (event) => {
            this.isConnecting = false;
            const closeInfo = {
                code: event.code,
                reason: event.reason || 'No reason provided',
                wasClean: event.wasClean,
                timestamp: new Date().toISOString()
            };

            window.logger.warn('webSocket', 'WebSocket connection closed:', closeInfo);

            if (this.handlers.onClose) {
                try {
                    this.handlers.onClose(event);
                } catch (error) {
                    window.logger.error('webSocket', 'Error in onClose handler:', {
                        error: error.message,
                        stack: error.stack
                    });
                }
            }

            this.handleReconnection(closeInfo);
        };

        this.ws.onerror = (error) => {
            window.logger.error('webSocket', 'WebSocket error occurred:', {
                error: error.message,
                stack: error.stack,
                timestamp: new Date().toISOString()
            });

            this.handleError(error);
        };
    }

    handleReconnection(closeInfo) {
        if (this.retries >= this.maxRetries) {
            window.logger.error('webSocket', 'Maximum retry attempts reached:', {
                maxRetries: this.maxRetries,
                attempts: this.connectionAttempts,
                lastCloseCode: closeInfo.code
            });
            return;
        }

        // Calculate delay with exponential backoff
        const delay = Math.min(
            this.retryDelay * Math.pow(this.backoffFactor, this.retries),
            this.maxRetryDelay
        );

        window.logger.info('webSocket', 'Scheduling reconnection attempt:', {
            retryNumber: this.retries + 1,
            delayMs: delay,
            maxRetries: this.maxRetries
        });

        this.retries++;
        setTimeout(() => {
            window.logger.debug('webSocket', 'Attempting reconnection:', {
                attempt: this.retries,
                previousCloseCode: closeInfo.code
            });
            this.connect();
        }, delay);
    }

    handleError(error) {
        window.logger.error('webSocket', 'WebSocket error being handled:', {
            error: error.message,
            stack: error.stack,
            retries: this.retries,
            connectionAttempts: this.connectionAttempts
        });

        if (this.handlers.onError) {
            try {
                this.handlers.onError(error);
            } catch (handlerError) {
                window.logger.error('webSocket', 'Error in error handler:', {
                    error: handlerError.message,
                    stack: handlerError.stack
                });
            }
        }
    }

    validateMessage(data) {
        window.logger.debug('webSocket', 'Validating WebSocket message:', {
            dataType: typeof data,
            dataSize: data.length
        });

        try {
            const parsed = JSON.parse(data);
            
            window.logger.debug('webSocket', 'Message validation successful:', {
                topicName: parsed.topicName || 'unknown',
                hasEventBody: !!parsed.eventBody,
                metadata: parsed.eventBody?.metadata || {}
            });

            return parsed;
        } catch (error) {
            window.logger.error('webSocket', 'Message validation failed:', {
                error: error.message,
                data: data.slice(0, 200) + '...' // Log first 200 chars of invalid data
            });
            throw new Error(`Invalid message format: ${error.message}`);
        }
    }

    send(data) {
        if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
            window.logger.error('webSocket', 'Cannot send message - connection not open:', {
                readyState: this.ws ? this.ws.readyState : 'no connection',
                dataSize: JSON.stringify(data).length
            });
            throw new Error('WebSocket is not connected');
        }

        try {
            window.logger.debug('webSocket', 'Sending WebSocket message:', {
                dataSize: JSON.stringify(data).length,
                timestamp: new Date().toISOString()
            });

            this.ws.send(JSON.stringify(data));
        } catch (error) {
            window.logger.error('webSocket', 'Error sending message:', {
                error: error.message,
                stack: error.stack,
                dataSize: JSON.stringify(data).length
            });
            throw error;
        }
    }

    close(code = 1000, reason = 'Normal closure') {
        if (this.ws) {
            window.logger.info('webSocket', 'Closing WebSocket connection:', {
                code,
                reason,
                currentState: this.ws.readyState
            });

            try {
                this.ws.close(code, reason);
            } catch (error) {
                window.logger.error('webSocket', 'Error closing WebSocket:', {
                    error: error.message,
                    stack: error.stack
                });
            }
        }
    }

    getState() {
        if (!this.ws) {
            return 'CLOSED';
        }

        const states = {
            [WebSocket.CONNECTING]: 'CONNECTING',
            [WebSocket.OPEN]: 'OPEN',
            [WebSocket.CLOSING]: 'CLOSING',
            [WebSocket.CLOSED]: 'CLOSED'
        };

        return states[this.ws.readyState] || 'UNKNOWN';
    }
}
