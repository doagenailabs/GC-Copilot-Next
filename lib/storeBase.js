window.StoreBase = class StoreBase {
    constructor() {
        this.listeners = new Set();
        this.maxListeners = 100;
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
};
