import { systemPrompt } from './systemPrompt';

class MessageHistory {
  constructor(maxMessages = parseInt(process.env.NEXT_PUBLIC_CONVERSATION_HISTORY_MESSAGES_NUMBER || '5')) {
    this.maxMessages = maxMessages;
    this.messages = [
      {
        role: "system",
        content: systemPrompt
      }
    ];
    this.userMessages = [];
    this.assistantMessages = [];
  }

  addMessage(role, content, prefix = '') {
    if (role === 'user') {
      this.userMessages.push({
        role: 'user',
        content: prefix ? `${prefix}: ${content}` : content
      });

      // Keep only the last N user messages
      if (this.userMessages.length > this.maxMessages) {
        this.userMessages.shift();
      }
    } else if (role === 'assistant') {
      this.assistantMessages.push({
        role: 'assistant',
        content
      });

      // Keep only the last N assistant messages
      if (this.assistantMessages.length > this.maxMessages) {
        this.assistantMessages.shift();
      }
    }

    // Rebuild the complete message array
    this.messages = [
      // System message always first
      {
        role: "system",
        content: systemPrompt
      },
      // Then interleave user and assistant messages
      ...this.userMessages,
      ...this.assistantMessages
    ];
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
  }
}

// Create a singleton instance
export const messageHistory = new MessageHistory();
