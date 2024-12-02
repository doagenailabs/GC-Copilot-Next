const APP_NAME = 'GC Copilot Next';
const PARAM_LANGUAGE = 'langTag';
const PARAM_GC_HOST_ORIGIN = 'gcHostOrigin';
const PARAM_ENVIRONMENT = 'gcTargetEnv';
const PARAM_CONVERSATION_ID = 'conversationId';
const LOG_PREFIX = 'GCCopilotNext - gcSDKs.js -';

// Utility functions for logging
const log = (message, ...args) => console.log(`${LOG_PREFIX} ${message}`, ...args);
const error = (message, ...args) => console.error(`${LOG_PREFIX} ${message}`, ...args);
const debug = (message, ...args) => console.debug(`${LOG_PREFIX} ${message}`, ...args);

export function startGCSDKs(clientId) {
  return new Promise((resolve, reject) => {
    let language = '';  
    let redirectUri = process.env.NEXT_PUBLIC_VERCEL_URL ? 
      `https://${process.env.NEXT_PUBLIC_VERCEL_URL}` : 
      'https://gcdoa-copilot.vercel.app';
    let userDetails = null;
    let gcHostOrigin = '';
    let conversationId = '';
    
    debug('Starting SDK initialization');
    debug('Client ID:', clientId);
    debug('Redirect URI:', redirectUri);

    // Wait for DOMContentLoaded
    const initializeSDK = () => {
      try {
        if (!window.purecloud?.apps?.ClientApp) {
          throw new Error('Required ClientApp SDK not loaded');
        }

        // First initialize the basic ClientApp with query param names only
        const ClientApp = window.purecloud.apps.ClientApp;
        const myClientApp = new ClientApp({
          gcHostOriginQueryParam: PARAM_GC_HOST_ORIGIN,
          gcTargetEnvQueryParam: PARAM_ENVIRONMENT
        });
        window.myClientApp = myClientApp;

        // Then get platformClient and proceed with authentication
        const platformClient = window.require('platformClient');
        const client = platformClient.ApiClient.instance;
        const usersApi = new platformClient.UsersApi();

        // Let environment be handled by ClientApp
        const env = myClientApp.gcEnvironment;
        debug('Environment from ClientApp:', env);

        client.setPersistSettings(true, APP_NAME);
        client.setEnvironment(env);

        client.loginImplicitGrant(clientId, redirectUri)
          .then(() => usersApi.getUsersMe())
          .then(data => {
            userDetails = data;
            debug('User authenticated:', userDetails.name);
            resolve(platformClient);
          })
          .catch(err => {
            error('Error during setup:', err);
            reject(err);
          });

      } catch (err) {
        error('Error initializing SDKs:', err);
        debug('Error stack:', err.stack);
        reject(err);
      }
    };

    // Check if DOM is already loaded
    if (document.readyState === 'complete' || document.readyState === 'interactive') {
      initializeSDK();
    } else {
      document.addEventListener('DOMContentLoaded', initializeSDK);
    }

  });
}
