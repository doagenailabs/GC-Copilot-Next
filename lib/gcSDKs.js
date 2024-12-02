export async function startGCSDKs(clientId) {
  const LOG_PREFIX = 'GCCopilotNext - gcSDKs.js -';

  const log = (message, ...args) => console.log(`${LOG_PREFIX} [${new Date().toISOString()}] [INFO] ${message}`, ...args);
  const error = (message, ...args) => console.error(`${LOG_PREFIX} [${new Date().toISOString()}] [ERROR] ${message}`, ...args);
  const debug = (message, ...args) => console.debug(`${LOG_PREFIX} [${new Date().toISOString()}] [DEBUG] ${message}`, ...args);

  try {
    debug('Starting Genesys Cloud SDK initialization');

    if (typeof window === 'undefined') {
      throw new Error('Window object is not available. SDKs can only be initialized on the client side.');
    }

    debug('Waiting for SDKs to load');
    await waitForSDKsToLoad();

    if (!window.pcSDKLoaded) {
      throw new Error('SDKs not loaded. Ensure SDKLoader component is included.');
    }

    const platformClient = window.platformClient;

    if (!platformClient) {
      throw new Error('Platform Client SDK is not loaded.');
    }

    const client = platformClient.ApiClient.instance;

    // Initialize the Client App SDK
    const ClientApp = window.purecloud.apps.ClientApp;

    if (!ClientApp) {
      throw new Error('Client App SDK is not loaded. Make sure SDKLoader component is included.');
    }

    const environment = getEnvironmentFromUrl() || 'mypurecloud.com';
    debug(`Using environment: ${environment}`);

    const myClientApp = new ClientApp({
      pcEnvironment: environment,
    });

    window.myClientApp = myClientApp;
    debug('Client App SDK initialized');

    // Configure the Platform SDK
    debug('Configuring Platform SDK');
    client.setEnvironment(environment);
    client.setPersistSettings(false); // Set to false to avoid history manipulation issues

    // Authenticate using Implicit Grant
    debug('Authenticating using Implicit Grant');
    const redirectUri = window.location.origin; // Ensure this URI is whitelisted in the GC OAuth settings
    await client.loginImplicitGrant(clientId, redirectUri);
    debug('Authentication successful');

    // Get user details
    debug('Fetching user details');
    const usersApi = new platformClient.UsersApi();
    const userDetails = await usersApi.getUsersMe();
    log('User details retrieved:', userDetails);

    debug('Genesys Cloud SDKs initialized successfully');
  } catch (err) {
    error('Error during Genesys Cloud SDK initialization:', err);
    throw err; // Re-throw the error to be handled by the caller
  }
}

function getEnvironmentFromUrl() {
  try {
    const LOG_PREFIX = 'GCCopilotNext - gcSDKs.js -';
    const debug = (message, ...args) => console.debug(`${LOG_PREFIX} [${new Date().toISOString()}] [DEBUG] ${message}`, ...args);
    const error = (message, ...args) => console.error(`${LOG_PREFIX} [${new Date().toISOString()}] [ERROR] ${message}`, ...args);

    const urlParams = new URLSearchParams(window.location.search);
    const gcTargetEnv = urlParams.get('gcTargetEnv');
    if (gcTargetEnv) {
      debug(`Environment parameter found in URL: ${gcTargetEnv}`);
      // Map gcTargetEnv to actual environment domain
      const environmentMap = {
        prod: 'mypurecloud.com',
        dca: 'use2.us-gov-pure.cloud',
        aps1: 'aps1.pure.cloud',
        apne3: 'apne3.pure.cloud',
        apne2: 'apne2.pure.cloud',
        aps2: 'mypurecloud.com.au',
        apne1: 'mypurecloud.jp',
        cac1: 'cac1.pure.cloud',
        euc1: 'mypurecloud.de',
        euw1: 'mypurecloud.ie',
        euw2: 'euw2.pure.cloud',
        euc2: 'euc2.pure.cloud',
        mec1: 'mec1.pure.cloud',
        sae1: 'sae1.pure.cloud',
        usw2: 'usw2.pure.cloud',
      };

      return environmentMap[gcTargetEnv] || 'mypurecloud.com';
    } else {
      debug('No environment parameter found in URL, using default environment');
      return null;
    }
  } catch (err) {
    error('Error parsing environment from URL:', err);
    return null;
  }
}

function waitForSDKsToLoad() {
  return new Promise((resolve, reject) => {
    const LOG_PREFIX = 'GCCopilotNext - gcSDKs.js -';
    const debug = (message, ...args) => console.debug(`${LOG_PREFIX} [${new Date().toISOString()}] [DEBUG] ${message}`, ...args);

    const checkInterval = setInterval(() => {
      if (
        window.pcSDKLoaded &&
        window.platformClient &&
        window.purecloud &&
        window.purecloud.apps &&
        window.purecloud.apps.ClientApp
      ) {
        clearInterval(checkInterval);
        debug('SDKs are loaded');
        resolve();
      }
    }, 50);

    setTimeout(() => {
      clearInterval(checkInterval);
      reject(new Error('Timed out waiting for SDKs to load.'));
    }, 10000); // 10 seconds timeout
  });
}
