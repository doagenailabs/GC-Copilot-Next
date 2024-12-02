const APP_NAME = 'GC Copilot Next';
const LOG_PREFIX = 'GCCopilotNext - gcSDKs.js -';

// Utility functions for logging
const log = (message, ...args) => console.log(`${LOG_PREFIX} ${message}`, ...args);
const error = (message, ...args) => console.error(`${LOG_PREFIX} ${message}`, ...args);
const debug = (message, ...args) => console.debug(`${LOG_PREFIX} ${message}`, ...args);

// Wait for PC SDK to be loaded
function waitForPcSdk(maxAttempts = 50) {
  return new Promise((resolve, reject) => {
    let attempts = 0;
    
    const check = () => {
      attempts++;
      debug(`Checking for PC SDK (attempt ${attempts}/${maxAttempts})`);
      
      if (window.purecloud?.apps?.ClientApp) {
        debug('PC SDK found');
        resolve(window.purecloud.apps.ClientApp);
      } else if (attempts >= maxAttempts) {
        reject(new Error('PC SDK not loaded after max attempts'));
      } else {
        setTimeout(check, 100);
      }
    };
    
    check();
  });
}

// Wait for Platform Client to be loaded
function waitForPlatformClient(maxAttempts = 50) {
  return new Promise((resolve, reject) => {
    let attempts = 0;
    
    const check = () => {
      attempts++;
      debug(`Checking for Platform Client (attempt ${attempts}/${maxAttempts})`);
      
      if (window.require) {
        try {
          const platformClient = window.require('platformClient');
          debug('Platform Client found');
          resolve(platformClient);
        } catch (err) {
          debug('Error requiring platformClient:', err);
          if (attempts >= maxAttempts) {
            reject(new Error('Failed to require platformClient'));
          } else {
            setTimeout(check, 100);
          }
        }
      } else if (attempts >= maxAttempts) {
        reject(new Error('window.require not found after max attempts'));
      } else {
        setTimeout(check, 100);
      }
    };
    
    check();
  });
}

// Extract configuration from URL
function getConfigFromUrl() {
  const searchParams = new URLSearchParams(window.location.search);
  debug('URL search params:', Object.fromEntries(searchParams));
  
  return {
    gcHostOrigin: searchParams.get('gcHostOrigin'),
    gcTargetEnv: searchParams.get('gcTargetEnv')
  };
}

export async function startGCSDKs(clientId) {
  try {
    debug('Starting SDK initialization...');
    debug('Current URL:', window.location.href);

    // Wait for SDK scripts to load
    const [ClientApp, platformClient] = await Promise.all([
      waitForPcSdk(),
      waitForPlatformClient()
    ]);

    debug('SDKs loaded successfully');

    // Get config from URL
    const { gcHostOrigin, gcTargetEnv } = getConfigFromUrl();
    debug('Configuration from URL:', { gcHostOrigin, gcTargetEnv });

    if (!gcHostOrigin || !gcTargetEnv) {
      throw new Error('Missing required URL parameters: gcHostOrigin and gcTargetEnv');
    }

    // Initialize ClientApp directly with values from URL
    const myClientApp = new ClientApp({
      gcHostOrigin: gcHostOrigin,
      gcTargetEnv: gcTargetEnv
    });
    window.myClientApp = myClientApp;
    
    debug('ClientApp initialized');

    // Get environment from ClientApp
    const environment = myClientApp.gcEnvironment;
    if (!environment) {
      throw new Error('Failed to get environment from ClientApp');
    }
    debug('Environment from ClientApp:', environment);

    // Set up Platform Client
    const client = platformClient.ApiClient.instance;
    const usersApi = new platformClient.UsersApi();

    client.setPersistSettings(true, APP_NAME);
    client.setEnvironment(environment);

    debug('Starting authentication...');
    await client.loginImplicitGrant(clientId, window.location.origin);
    
    const userData = await usersApi.getUsersMe();
    debug('Authentication successful for user:', userData.name);

    return platformClient;
  } catch (err) {
    error('Error during initialization:', err);
    error('Current URL:', window.location.href);
    error('URL parameters:', Object.fromEntries(new URLSearchParams(window.location.search)));
    throw err;
  }
}
