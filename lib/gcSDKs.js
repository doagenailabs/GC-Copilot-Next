const APP_NAME = 'GC Copilot Next';
const LOG_PREFIX = 'GCCopilotNext - gcSDKs.js -';

// Enhanced logging utilities with timestamps and log levels
const getTimestamp = () => new Date().toISOString();
const log = (message, ...args) => console.log(`${LOG_PREFIX} [${getTimestamp()}] [INFO] ${message}`, ...args);
const error = (message, ...args) => console.error(`${LOG_PREFIX} [${getTimestamp()}] [ERROR] ${message}`, ...args);
const debug = (message, ...args) => console.debug(`${LOG_PREFIX} [${getTimestamp()}] [DEBUG] ${message}`, ...args);
const warn = (message, ...args) => console.warn(`${LOG_PREFIX} [${getTimestamp()}] [WARN] ${message}`, ...args);

// Debug utility to dump the complete state
function dumpState() {
  try {
    const state = {
      url: window.location.href,
      hash: window.location.hash,
      search: window.location.search,
      searchParams: Object.fromEntries(new URLSearchParams(window.location.search)),
      hashParams: Object.fromEntries(new URLSearchParams(window.location.hash.replace('#', '?'))),
      localStorage: {
        ...localStorage
      },
      sdkState: {
        hasPurecloud: !!window.purecloud,
        hasPurecloudApps: !!(window.purecloud?.apps),
        hasClientApp: !!(window.purecloud?.apps?.ClientApp),
        hasRequire: typeof window.require === 'function',
        myClientApp: !!window.myClientApp,
        gcEnvironment: window.myClientApp?.gcEnvironment
      },
      scriptTags: Array.from(document.getElementsByTagName('script')).map(s => ({
        src: s.src,
        async: s.async,
        defer: s.defer,
        loaded: s.complete,
        error: !!s.error
      })),
      readyState: document.readyState
    };
    debug('Current state:', state);
    return state;
  } catch (err) {
    error('Error dumping state:', err);
    return null;
  }
}

// Enhanced URL parameter extraction with fallback mechanisms
function getUrlParameters() {
  try {
    const url = new URL(window.location.href);
    debug('Parsing URL:', url.toString());

    // Try search params first
    const searchParams = new URLSearchParams(url.search);
    const params = Object.fromEntries(searchParams);
    debug('Search parameters:', params);

    // If no search params, try hash params
    if (!params.gcHostOrigin || !params.gcTargetEnv) {
      const hashParams = new URLSearchParams(url.hash.replace('#', '?'));
      const hashParamsObj = Object.fromEntries(hashParams);
      debug('Hash parameters:', hashParamsObj);
      
      // Merge hash params with search params, search params take precedence
      Object.assign(params, hashParamsObj);
    }

    // Try localStorage as last resort
    if (!params.gcHostOrigin) {
      params.gcHostOrigin = localStorage.getItem(`${APP_NAME}_gcHostOrigin`);
      debug('Found gcHostOrigin in localStorage:', params.gcHostOrigin);
    }
    if (!params.gcTargetEnv) {
      params.gcTargetEnv = localStorage.getItem(`${APP_NAME}_gcTargetEnv`);
      debug('Found gcTargetEnv in localStorage:', params.gcTargetEnv);
    }

    return params;
  } catch (err) {
    error('Error parsing URL parameters:', err);
    dumpState();
    return {};
  }
}

// Wait for PC SDK with enhanced error handling
function waitForPcSdk(maxAttempts = 50) {
  return new Promise((resolve, reject) => {
    let attempts = 0;
    const startTime = Date.now();
    
    const check = () => {
      attempts++;
      const elapsedTime = Date.now() - startTime;
      debug(`[PC SDK Check ${attempts}/${maxAttempts}] Elapsed: ${elapsedTime}ms`);
      
      if (window.purecloud?.apps?.ClientApp) {
        debug('PC SDK found successfully');
        resolve(window.purecloud.apps.ClientApp);
      } else if (attempts >= maxAttempts) {
        const state = dumpState();
        reject(new Error(`PC SDK not loaded after ${attempts} attempts (${elapsedTime}ms). Current state: ${JSON.stringify(state)}`));
      } else {
        // Log what's missing
        if (!window.purecloud) {
          debug('Missing window.purecloud');
        } else if (!window.purecloud.apps) {
          debug('Missing window.purecloud.apps');
        } else if (!window.purecloud.apps.ClientApp) {
          debug('Missing window.purecloud.apps.ClientApp');
        }
        setTimeout(check, 100);
      }
    };
    
    check();
  });
}

// Wait for Platform Client with enhanced error handling
function waitForPlatformClient(maxAttempts = 50) {
  return new Promise((resolve, reject) => {
    let attempts = 0;
    const startTime = Date.now();
    
    const check = () => {
      attempts++;
      const elapsedTime = Date.now() - startTime;
      debug(`[Platform Client Check ${attempts}/${maxAttempts}] Elapsed: ${elapsedTime}ms`);
      
      if (window.require) {
        try {
          const platformClient = window.require('platformClient');
          if (platformClient && platformClient.ApiClient) {
            debug('Platform Client loaded successfully');
            resolve(platformClient);
          } else {
            debug('Platform Client require succeeded but invalid instance:', platformClient);
            if (attempts >= maxAttempts) {
              const state = dumpState();
              reject(new Error('Invalid Platform Client instance'));
            } else {
              setTimeout(check, 100);
            }
          }
        } catch (err) {
          debug(`Error requiring platformClient: ${err.message}`);
          if (attempts >= maxAttempts) {
            const state = dumpState();
            reject(new Error(`Failed to require platformClient: ${err.message}`));
          } else {
            setTimeout(check, 100);
          }
        }
      } else if (attempts >= maxAttempts) {
        const state = dumpState();
        reject(new Error(`window.require not found after ${attempts} attempts (${elapsedTime}ms)`));
      } else {
        setTimeout(check, 100);
      }
    };
    
    check();
  });
}

// Main initialization function with enhanced error handling
export async function startGCSDKs(clientId) {
  debug('Starting SDK initialization...');
  debug('Initial state:');
  const initialState = dumpState();

  try {
    // Wait for both SDKs with a longer timeout
    debug('Waiting for SDKs to load...');
    const [ClientApp, platformClient] = await Promise.all([
      waitForPcSdk(100),  // Increased max attempts
      waitForPlatformClient(100)
    ]);
    debug('SDKs loaded successfully');

    // Get configuration with enhanced error handling
    const params = getUrlParameters();
    debug('Extracted parameters:', params);

    // Validate required parameters
    if (!params.gcHostOrigin || !params.gcTargetEnv) {
      error('Missing required parameters:', {
        gcHostOrigin: params.gcHostOrigin,
        gcTargetEnv: params.gcTargetEnv
      });
      warn('Dumping complete state for troubleshooting...');
      dumpState();
      throw new Error(`Missing required URL parameters: gcHostOrigin and gcTargetEnv`);
    }

    // Store parameters in localStorage for persistence
    localStorage.setItem(`${APP_NAME}_gcHostOrigin`, params.gcHostOrigin);
    localStorage.setItem(`${APP_NAME}_gcTargetEnv`, params.gcTargetEnv);

    // Initialize ClientApp with direct parameters
    debug('Initializing ClientApp with params:', params);
    const myClientApp = new ClientApp({
      gcHostOrigin: params.gcHostOrigin,
      gcTargetEnv: params.gcTargetEnv
    });
    window.myClientApp = myClientApp;
    debug('ClientApp initialized successfully');

    // Verify environment
    const environment = myClientApp.gcEnvironment;
    if (!environment) {
      error('Failed to get environment from ClientApp');
      dumpState();
      throw new Error('Failed to get environment from ClientApp');
    }
    debug('Environment configured:', environment);

    // Set up Platform Client
    debug('Configuring Platform Client...');
    const client = platformClient.ApiClient.instance;
    const usersApi = new platformClient.UsersApi();

    client.setPersistSettings(true, APP_NAME);
    client.setEnvironment(environment);

    // Authenticate
    debug('Starting authentication flow...');
    const redirectUri = window.location.origin;
    debug('Using redirect URI:', redirectUri);

    await client.loginImplicitGrant(clientId, redirectUri);
    debug('Authentication successful');

    // Verify authentication
    const userData = await usersApi.getUsersMe();
    debug('Successfully retrieved user data:', userData.name);

    return platformClient;
  } catch (err) {
    error('Error during initialization:', {
      message: err.message,
      stack: err.stack,
      name: err.name
    });
    error('Final state dump:');
    dumpState();
    throw err;
  }
}
