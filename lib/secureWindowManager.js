const SecureWindowManager = (function() {
    const privateStore = new WeakMap();
    const PROTECTED_PROPERTIES = new Set();
    
    function defineSecureProperty(obj, prop, value, writable = false) {
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
    
    return {
        initializeStores() {
            // Define StoreBase securely
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
                            console.error('Listener error:', err);
                        }
                    });
                }

                cleanup() {
                    this.listeners.clear();
                }
            });
        },

        defineConfig(config) {
            defineSecureProperty(window, 'GENESYS_CONFIG', config);
        },

        defineSafeDOM() {
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
        },

        defineUIComponents() {
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
    };
})();

export default SecureWindowManager;
