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

    // Wait for scripts to be fully loaded
    if (document.readyState === 'complete') {
      initializeSDK();
    } else {
      window.addEventListener('load', initializeSDK);
    }

    function initializeSDK() {
      let gcHostURL = assignConfiguration();
      if (!gcHostURL) {
        reject(new Error("gcHostOrigin is not set or invalid"));
        return;
      }

      let hostName;
      try {
        hostName = new URL(gcHostURL).hostname;
        debug('Host name parsed:', hostName);
      } catch (err) {
        error('Invalid gcHostOrigin URL:', gcHostOrigin);
        reject(err);
        return;
      }

      const parts = hostName.split('.');
      parts.shift(); // Remove the subdomain
      const environment = parts.join('.'); // e.g., "mypurecloud.ie"
      window.environment = environment;
      log('Environment set to:', environment);

      try {
        debug('Before platformClient initialization');
        let platformClient;
        
        // Try window.require specifically
        if (typeof window.require === 'function') {
          debug('Window.require is available, attempting to use it');
          try {
            platformClient = window.require('platformClient');
            debug('Successfully required platformClient through window.require');
          } catch (err) {
            debug('Failed to window.require platformClient:', err);
          }
        }
        
        // Fallback to window.platformClient
        if (!platformClient && window.platformClient) {
          debug('Using window.platformClient instead');
          platformClient = window.platformClient;
        }

        if (!platformClient) {
          throw new Error('Unable to initialize platformClient');
        }

        const client = platformClient.ApiClient.instance;
        const usersApi = new platformClient.UsersApi();

        // Initialize ClientApp with correct configuration
        const ClientApp = window.purecloud.apps.ClientApp;
        window.myClientApp = new ClientApp({
          pcEnvironment: environment,
          pcOrigin: gcHostOrigin,
          gcHostOriginQueryParam: PARAM_GC_HOST_ORIGIN,
          gcTargetEnvQueryParam: PARAM_ENVIRONMENT
        });

        debug('ClientApp initialized with:', {
          pcEnvironment: environment,
          pcOrigin: gcHostOrigin
        });

        client.setPersistSettings(true, APP_NAME);
        client.setEnvironment(environment);

        client.loginImplicitGrant(clientId, redirectUri)
          .then(() => usersApi.getUsersMe())
          .then(data => {
            userDetails = data;
            resolve(platformClient);
          })
          .catch((err) => {
            error('Error during setup:', err);
            reject(err);
          });

      } catch (err) {
        error('Error initializing SDKs:', err);
        debug('Error stack:', err.stack);
        reject(err);
      }
    }

    function assignConfiguration() {
      if (typeof window === 'undefined') {
        error('Window undefined in assignConfiguration');
        return null;
      }
      
      let browser_url = window.location.href;
      if (!browser_url) {
        error('Browser URL is null or undefined');
        return null;
      }
      
      let searchParams;
      try {
        let url = new URL(browser_url);
        searchParams = new URLSearchParams(url.search);
        debug('URL params parsed successfully');
      } catch (err) {
        error('Failed to parse URL:', browser_url, err);
        return null;
      }
      
      debug('Browser URL:', browser_url);
      debug('Search params:', Object.fromEntries(searchParams));
      
      if (searchParams.has(PARAM_CONVERSATION_ID)) {
        conversationId = searchParams.get(PARAM_CONVERSATION_ID);
        window.conversationId = conversationId;
        log('Conversation ID set:', conversationId);
      }

      if (searchParams.has(PARAM_LANGUAGE)) {
        language = searchParams.get(PARAM_LANGUAGE);
        localStorage.setItem(`${APP_NAME}_language`, language);
        debug('Language set from URL:', language);
      } else {
        let local_lang = localStorage.getItem(`${APP_NAME}_language`);
        if (local_lang) {
          language = local_lang;
          debug('Language set from localStorage:', language);
        }
      }

      if (searchParams.has(PARAM_GC_HOST_ORIGIN)) {
        gcHostOrigin = searchParams.get(PARAM_GC_HOST_ORIGIN);
        localStorage.setItem(`${APP_NAME}_gcHostOrigin`, gcHostOrigin);
        log('Host origin set from URL:', gcHostOrigin);
        return gcHostOrigin;
      } else {
        let local_gcHostOrigin = localStorage.getItem(`${APP_NAME}_gcHostOrigin`);
        if (local_gcHostOrigin) {
          gcHostOrigin = local_gcHostOrigin;
          debug('Host origin set from localStorage:', gcHostOrigin);
          return local_gcHostOrigin;
        }
        error('Host origin not found in URL parameters or localStorage');
        return null;
      }
    }
  });
}
