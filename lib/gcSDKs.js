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

    const environmentHost = getEnvironmentHostFromUrl();
    if (!environmentHost) {
      throw new Error('Environment host could not be determined from the URL.');
    }
    debug(`Using environment host: ${environmentHost}`);

    const myClientApp = new ClientApp({
      pcEnvironment: environmentHost,
    });

    window.myClientApp = myClientApp;
    debug('Client App SDK initialized');

    // Configure the Platform SDK
    debug('Configuring Platform SDK');
    client.setEnvironment(environmentHost);
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

function getEnvironmentHostFromUrl() {
  try {
    const LOG_PREFIX = 'GCCopilotNext - gcSDKs.js -';
    const debug = (message, ...args) => console.debug(`${LOG_PREFIX} [${new Date().toISOString()}] [DEBUG] ${message}`, ...args);

    const urlParams = new URLSearchParams(window.location.search);
    const gcHostOrigin = urlParams.get('gcHostOrigin');
    if (gcHostOrigin) {
      debug(`Environment host origin found in URL: ${gcHostOrigin}`);
      return gcHostOrigin;
    } else {
      debug('No environment host origin found in URL, using default host');
      return 'https://login.mypurecloud.com'; // Default host
    }
  } catch (err) {
    console.error(`${LOG_PREFIX} Error parsing environment host from URL:`, err);
    return 'https://login.mypurecloud.com'; // Fallback default host
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
