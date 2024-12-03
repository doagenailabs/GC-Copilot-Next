const APP_PREFIX = 'GC Copilot Next';
const isLoggingEnabled = process.env.NEXT_PUBLIC_LOGS_ENABLED === 'true';

export const logger = {
  log: (component, message, ...args) => {
    if (!isLoggingEnabled) return;
    console.log(`${APP_PREFIX} - ${component} - ${message}`, ...args);
  },
  
  error: (component, message, ...args) => {
    if (!isLoggingEnabled) return;
    console.error(`${APP_PREFIX} - ${component} - ${message}`, ...args);
  },
  
  debug: (component, message, ...args) => {
    if (!isLoggingEnabled) return;
    console.debug(`${APP_PREFIX} - ${component} - ${message}`, ...args);
  },
  
  warn: (component, message, ...args) => {
    if (!isLoggingEnabled) return;
    console.warn(`${APP_PREFIX} - ${component} - ${message}`, ...args);
  },

  info: (component, message, ...args) => {
    if (!isLoggingEnabled) return;
    console.info(`${APP_PREFIX} - ${component} - ${message}`, ...args);
  }
};
