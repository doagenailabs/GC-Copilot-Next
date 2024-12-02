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

    // Check if we're in a browser environment
    if (typeof window === 'undefined') {
      const err = new Error('Not in browser environment');
      error('Browser environment check failed:', err);
      reject(err);
      return;
    }

    let gcHostURL = assignConfiguration();
    if (!gcHostURL) {
      const err = new Error('Failed to get host URL from configuration');
      error('Host URL configuration failed:', err);
      reject(err);
      return;
    }

    let hostName;
    try {
      hostName = new URL(gcHostURL).hostname;
      debug('Host name parsed:', hostName);
    } catch (err) {
      error('Invalid gcHostOrigin URL:', gcHostOrigin, err);
      reject(err);
      return;
    }

    const parts = hostName.split('.');
    parts.shift();
    window.environment = parts.join('.'); 
    log('Environment set to:', window.environment);

    let attempts = 0;
    const maxAttempts = 50; // 5 seconds maximum wait
    
    // Enhanced platformClient check with timeout
    const waitForPlatformClient = () => {
      attempts++;
      if (window.platformClient) {
        debug('PlatformClient found after', attempts, 'attempts');
        initializeSDK(window.platformClient);
      } else if (attempts >= maxAttempts) {
        const err = new Error('PlatformClient not available after maximum attempts');
        error('PlatformClient timeout:', err);
        reject(err);
      } else {
        setTimeout(waitForPlatformClient, 100);
      }
    };

    const initializeSDK = async (platformClient) => {
      try {
        debug('Initializing SDK with platform client');
        
        if (!platformClient.ApiClient?.instance) {
          throw new Error('ApiClient instance not available');
        }

        const client = platformClient.ApiClient.instance;
        const usersApi = new platformClient.UsersApi();

        debug('Initializing ClientApp');
        if (!window.purecloud?.apps?.ClientApp) {
          throw new Error('ClientApp not available');
        }

        let ClientApp = window.purecloud.apps.ClientApp;
        let myClientApp = new ClientApp({
          pcEnvironment: window.environment
        });
        window.myClientApp = myClientApp;
        debug('ClientApp initialized successfully');

        client.setPersistSettings(true, APP_NAME);
        client.setEnvironment(window.environment);
        debug('Environment and persist settings configured');

        try {
          const loginData = await client.loginImplicitGrant(clientId, redirectUri);
          debug('Login successful:', loginData);

          const userData = await usersApi.getUsersMe();
          debug('User data retrieved:', userData);
          userDetails = userData;

          resolve(platformClient);
        } catch (err) {
          error('Authentication or user data retrieval failed:', err);
          reject(err);
        }
      } catch (err) {
        error('SDK initialization failed:', err);
        reject(err);
      }
    };

    // Start waiting for platformClient
    waitForPlatformClient();

    function assignConfiguration() {
      debug('Starting configuration assignment');
      
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
      
      log('Browser URL:', browser_url);
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
          debug('Host origin set from localStorage:', local_gcHostOrigin);
          return local_gcHostOrigin;
        }
        error('Host origin not found in URL parameters or localStorage');
        return null;
      }
    }
  });
}
