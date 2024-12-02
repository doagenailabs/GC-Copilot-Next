import { systemPrompt } from './systemPrompt';

const LOG_PREFIX = 'GCCopilotNext - messageHistory.js -';
const log = (message, ...args) => console.log(`${LOG_PREFIX} ${message}`, ...args);
const error = (message, ...args) => console.error(`${LOG_PREFIX} ${message}`, ...args);
const debug = (message, ...args) => console.debug(`${LOG_PREFIX} ${message}`, ...args);

class MessageHistory {
  constructor(maxMessages = parseInt(process.env.NEXT_PUBLIC_CONVERSATION_HISTORY_MESSAGES_NUMBER || '5')) {
    try {
      debug('Initializing MessageHistory with max messages:', maxMessages);
      
      if (isNaN(maxMessages) || maxMessages <= 0) {
        error('Invalid maxMessages value, defaulting to 5');
        maxMessages = 5;
      }

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
    } catch (err) {
      error('Error initializing MessageHistory:', err);
      throw err;
    }
  }

  addMessage(role, content, prefix = '') {
    try {
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
        debug('User message added');

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
        debug('Assistant message added');

        if (this.assistantMessages.length > this.maxMessages) {
          this.assistantMessages.shift();
          debug('Oldest assistant message removed');
        }
      }

      this.rebuildMessageArray();
      log('Message added successfully');
    } catch (err) {
      error('Error adding message:', err);
      throw err;
    }
  }

  rebuildMessageArray() {
    try {
      debug('Rebuilding message array');
      this.messages = [
        { role: "system", content: systemPrompt },
        ...this.userMessages,
        ...this.assistantMessages
      ];
      debug('Message array rebuilt. Total messages:', this.messages.length);
    } catch (err) {
      error('Error rebuilding message array:', err);
      throw err;
    }
  }

  getMessages() {
    debug('Getting messages. Count:', this.messages.length);
    return this.messages;
  }

  clear() {
    try {
      debug('Clearing message history');
      this.userMessages = [];
      this.assistantMessages = [];
      this.messages = [
        {
          role: "system",
          content: systemPrompt
        }
      ];
      log('Message history cleared successfully');
    } catch (err) {
      error('Error clearing message history:', err);
      throw err;
    }
  }
}

// Create a singleton instance
const messageHistory = new MessageHistory();
debug('Singleton MessageHistory instance created');
export { messageHistory };
