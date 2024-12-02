const APP_NAME = 'GC Copilot Next';
const LOG_PREFIX = 'GCCopilotNext - gcSDKs.js -';

// Utility functions for logging with timestamps
const getTimestamp = () => new Date().toISOString();
const log = (message, ...args) => console.log(`${LOG_PREFIX} [${getTimestamp()}] ${message}`, ...args);
const error = (message, ...args) => console.error(`${LOG_PREFIX} [${getTimestamp()}] ${message}`, ...args);
const debug = (message, ...args) => console.debug(`${LOG_PREFIX} [${getTimestamp()}] ${message}`, ...args);

// Debug window state
function debugWindowState() {
  const state = {
    pcSDKLoaded: window.pcSDKLoaded || false,
    hasPurecloud: !!window.purecloud,
    hasClientApp: !!(window.purecloud?.apps?.ClientApp),
    hasRequire: typeof window.require === 'function',
    hasScriptTags: Array.from(document.querySelectorAll('script')).map(s => ({
      src: s.src,
      async: s.async,
      defer: s.defer,
      loaded: s.complete,
      error: !!s.error
    })),
    windowKeys: Object.keys(window),
    readyState: document.readyState
  };

  debug('Current window state:', state);
  return state;
}

function waitForPcSdk(maxAttempts = 100) {
  return new Promise((resolve, reject) => {
    let attempts = 0;
    const startTime = Date.now();
    
    const check = () => {
      attempts++;
      const elapsedTime = Date.now() - startTime;
      debug(`[PC SDK Check ${attempts}/${maxAttempts}] Elapsed time: ${elapsedTime}ms`);
      
      if (attempts % 10 === 0) {
        const state = debugWindowState();
        debug('Current window state:', state);
      }
      
      if (window.pcSDKLoaded && window.purecloud?.apps?.ClientApp) {
        debug('PC SDK found and verified:', {
          pcSDKLoaded: window.pcSDKLoaded,
          clientApp: !!window.purecloud?.apps?.ClientApp,
          fullState: debugWindowState()
        });
        resolve(window.purecloud.apps.ClientApp);
      } else if (attempts >= maxAttempts) {
        const state = debugWindowState();
        error('PC SDK load timeout. Final state:', state);
        reject(new Error(`PC SDK not loaded after max attempts (${maxAttempts}). Elapsed time: ${elapsedTime}ms`));
      } else {
        if (!window.pcSDKLoaded) {
          debug('window.pcSDKLoaded flag not set');
        }
        if (!window.purecloud) {
          debug('window.purecloud not found');
        } else if (!window.purecloud.apps) {
          debug('window.purecloud.apps not found');
        } else if (!window.purecloud.apps.ClientApp) {
          debug('window.purecloud.apps.ClientApp not found');
        }
        setTimeout(check, 200);
      }
    };
    
    debug('Starting PC SDK check...');
    check();
  });
}

// Wait for Platform Client to be loaded
function waitForPlatformClient(maxAttempts = 50) {
  return new Promise((resolve, reject) => {
    let attempts = 0;
    const startTime = Date.now();
    
    const check = () => {
      attempts++;
      const elapsedTime = Date.now() - startTime;
      debug(`[Platform Client Check ${attempts}/${maxAttempts}] Elapsed time: ${elapsedTime}ms`);
      
      // Debug current state
      const state = debugWindowState();
      
      if (window.require) {
        try {
          const platformClient = window.require('platformClient');
          if (!platformClient) {
            debug('platformClient is null after require');
            if (attempts >= maxAttempts) {
              reject(new Error('platformClient is null after require'));
            } else {
              setTimeout(check, 100);
            }
            return;
          }
          if (!platformClient.ApiClient) {
            debug('platformClient.ApiClient not found');
            if (attempts >= maxAttempts) {
              reject(new Error('platformClient.ApiClient not found'));
            } else {
              setTimeout(check, 100);
            }
            return;
          }
          debug('Platform Client found and verified:', {
            hasApiClient: !!platformClient.ApiClient,
            hasUsersApi: !!platformClient.UsersApi
          });
          resolve(platformClient);
        } catch (err) {
          debug(`Error requiring platformClient: ${err.message}`);
          if (attempts >= maxAttempts) {
            error('Failed to require platformClient:', err);
            reject(new Error(`Failed to require platformClient: ${err.message}`));
          } else {
            setTimeout(check, 100);
          }
        }
      } else if (attempts >= maxAttempts) {
        error('window.require not found. Final state:', state);
        reject(new Error(`window.require not found after ${maxAttempts} attempts. Elapsed time: ${elapsedTime}ms`));
      } else {
        setTimeout(check, 100);
      }
    };
    
    debug('Starting Platform Client check...');
    check();
  });
}

export async function startGCSDKs(clientId) {
  debug('Starting SDK initialization with client ID:', clientId);
  debug('Initial window state:');
  debugWindowState();
  
  try {
    debug('Starting SDK loading checks...');
    
    // Wait for both SDKs to be loaded
    const [ClientApp, platformClient] = await Promise.all([
      waitForPcSdk(),
      waitForPlatformClient()
    ]);

    debug('Both SDKs loaded successfully');

    // Initialize the ClientApp with minimal config
    debug('Initializing ClientApp...');
    const clientAppConfig = {
      gcHostOriginQueryParam: 'gcHostOrigin',
      gcTargetEnvQueryParam: 'gcTargetEnv'
    };
    debug('ClientApp config:', clientAppConfig);
    
    const myClientApp = new ClientApp(clientAppConfig);
    window.myClientApp = myClientApp;
    
    debug('ClientApp instance created');

    // Get environment from ClientApp
    const environment = myClientApp.gcEnvironment;
    debug('Raw environment value:', environment);
    
    if (!environment) {
      const currentUrl = window.location.href;
      const urlParams = new URLSearchParams(window.location.search);
      error('Failed to get environment from ClientApp. Current state:', {
        currentUrl,
        searchParams: Object.fromEntries(urlParams),
        clientAppInstance: myClientApp
      });
      throw new Error('Failed to get environment from ClientApp');
    }
    debug('Environment from ClientApp:', environment);

    // Set up Platform Client
    debug('Setting up Platform Client...');
    const client = platformClient.ApiClient.instance;
    const usersApi = new platformClient.UsersApi();

    client.setPersistSettings(true, APP_NAME);
    client.setEnvironment(environment);
    debug('Platform Client configured with environment');

    debug('Starting authentication...');
    const redirectUri = window.location.origin;
    debug('Using redirect URI:', redirectUri);
    
    await client.loginImplicitGrant(clientId, redirectUri);
    debug('Implicit grant successful');
    
    const userData = await usersApi.getUsersMe();
    debug('Authentication successful for user:', userData.name);

    debug('SDK initialization complete');
    return platformClient;
  } catch (err) {
    error('Error during initialization:', err);
    error('Error details:', {
      name: err.name,
      message: err.message,
      stack: err.stack,
      windowState: debugWindowState()
    });
    throw err;
  }
}
