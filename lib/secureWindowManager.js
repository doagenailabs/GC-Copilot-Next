(function() {
    const privateStore = new WeakMap();
    const PROTECTED_PROPERTIES = new Set();
    
    function defineSecureProperty(obj, prop, value, writable = false) {
        // Skip if property already exists to prevent conflicts with SDKs
        if (obj[prop] !== undefined) {
            window.logger.warn('SecureWindowManager', `Property ${prop} already exists, skipping secure definition`);
            return;
        }
        
        if (PROTECTED_PROPERTIES.has(prop)) {
            throw new Error(`Property ${prop} is already defined and protected`);
        }
        
        Object.defineProperty(obj, prop, {
            value: Object.freeze(value),
            writable: writable,
            configurable: false,
            enumerable: true
        });
        
        PROTECTED_PROPERTIES.add(prop);
    }
    
    // Core store management
    class SecureStore {
        constructor() {
            privateStore.set(this, new Map());
        }
        
        get(key) {
            return privateStore.get(this).get(key);
        }
        
        set(key, value) {
            if (typeof value === 'object' && value !== null) {
                value = Object.freeze(value);
            }
            privateStore.get(this).set(key, value);
        }
    }
    
    // Initialize secure store
    const secureStore = new SecureStore();
    
    // Define SecureWindowManager on the window object
    window.SecureWindowManager = {
        initializeStores() {
            // Only define StoreBase if it doesn't already exist
            if (!window.StoreBase) {
                defineSecureProperty(window, 'StoreBase', class StoreBase {
                    constructor() {
                        this.listeners = new Set();
                        this.maxListeners = 100;
                        Object.freeze(this);
                    }

                    addListener(listener) {
                        if (this.listeners.size >= this.maxListeners) {
                            throw new Error('Maximum listener limit reached');
                        }
                        this.listeners.add(listener);
                        return () => this.listeners.delete(listener);
                    }

                    notifyListeners(data) {
                        this.listeners.forEach(listener => {
                            try {
                                listener(data);
                            } catch (err) {
                                window.logger.error('StoreBase', 'Listener error:', err);
                            }
                        });
                    }

                    cleanup() {
                        this.listeners.clear();
                    }
                });
            }
        },

        defineConfig(config) {
            // Allow overwriting of GENESYS_CONFIG
            if (window.GENESYS_CONFIG) {
                window.logger.debug('SecureWindowManager', 'Updating existing GENESYS_CONFIG');
                Object.assign(window.GENESYS_CONFIG, config);
            } else {
                defineSecureProperty(window, 'GENESYS_CONFIG', config);
            }
        },

        defineSafeDOM() {
            if (!window.safeDOM) {
                defineSecureProperty(window, 'safeDOM', {
                    createText: (text) => document.createTextNode(text),
                    setText: (element, text) => {
                        element.textContent = text;
                        return element;
                    },
                    sanitizeHTML: (html) => {
                        const template = document.createElement('template');
                        template.innerHTML = html.trim();
                        return template.content.firstChild;
                    }
                });
            }
        },

        defineUIComponents() {
            if (!window.uiCard) {
                defineSecureProperty(window, 'uiCard', {
                    createCard: (className = "", content = "") => {
                        const cardDiv = document.createElement('div');
                        cardDiv.className = `rounded-lg border bg-card text-card-foreground shadow-sm ${className}`;
                        cardDiv.innerHTML = content;
                        return cardDiv;
                    },
                    createCardContent: (className = "", content = "") => {
                        const contentDiv = document.createElement('div');
                        contentDiv.className = `p-6 pt-0 ${className}`;
                        contentDiv.innerHTML = content;
                        return contentDiv;
                    }
                });
            }
        }
    };

    // Freeze the SecureWindowManager but allow its methods to be modified
    Object.freeze(window.SecureWindowManager);
})();
