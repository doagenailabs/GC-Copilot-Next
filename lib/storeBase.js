class StoreBase {
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
}
