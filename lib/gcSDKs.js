const APP_NAME = 'GC Copilot Next';
const LOG_PREFIX = 'GCCopilotNext - gcSDKs.js -';

const log = (message, ...args) => console.log(`${LOG_PREFIX} ${message}`, ...args);
const error = (message, ...args) => console.error(`${LOG_PREFIX} ${message}`, ...args);
const debug = (message, ...args) => console.debug(`${LOG_PREFIX} ${message}`, ...args);

// Wait for an object to be available in the window scope
function waitForObject(objectPath, timeout = 5000) {
  const parts = objectPath.split('.');
  return new Promise((resolve, reject) => {
    const startTime = Date.now();

    function checkObject() {
      let current = window;
      for (const part of parts) {
        if (!current[part]) {
          if (Date.now() - startTime > timeout) {
            reject(new Error(`Timeout waiting for ${objectPath}`));
            return;
          }
          setTimeout(checkObject, 100);
          return;
        }
        current = current[part];
      }
      resolve(current);
    }
    checkObject();
  });
}

export function startGCSDKs(clientId) {
  return new Promise(async (resolve, reject) => {
    try {
      debug('Waiting for Genesys Cloud SDKs to load...');
      
      // Wait for both SDKs to be available
      const [ClientApp, platformClient] = await Promise.all([
        waitForObject('purecloud.apps.ClientApp'),
        waitForObject('platformClient')
      ]);

      debug('SDKs loaded successfully');

      // Initialize ClientApp first with minimal configuration
      const myClientApp = new ClientApp({
        gcHostOriginQueryParam: 'gcHostOrigin',
        gcTargetEnvQueryParam: 'gcTargetEnv'
      });
      window.myClientApp = myClientApp;

      // Get environment from ClientApp
      const environment = myClientApp.gcEnvironment;
      debug('Environment:', environment);

      // Configure platform client
      const client = platformClient.ApiClient.instance;
      const usersApi = new platformClient.UsersApi();

      // Set up client with environment from ClientApp
      client.setPersistSettings(true, APP_NAME);
      client.setEnvironment(environment);

      debug('Starting authentication...');
      
      // Perform authentication
      await client.loginImplicitGrant(clientId, window.location.origin);
      const userData = await usersApi.getUsersMe();
      debug('Authentication successful for user:', userData.name);

      resolve(platformClient);
    } catch (err) {
      error('Error during initialization:', err);
      reject(err);
    }
  });
}
