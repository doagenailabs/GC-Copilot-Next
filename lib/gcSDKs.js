const LOG_PREFIX = 'GCCopilotNext - gcSDKs.js -';
const log = (message, ...args) => console.log(`${LOG_PREFIX} ${message}`, ...args);
const error = (message, ...args) => console.error(`${LOG_PREFIX} ${message}`, ...args);
const debug = (message, ...args) => console.debug(`${LOG_PREFIX} ${message}`, ...args);

export async function startGCSDKs(clientId) {
  if (typeof window === 'undefined') {
    throw new Error('Window is undefined. This function should only be called on the client side.');
  }

  try {
    // Wait until SDKs are loaded
    await waitForSDKsToLoad();
    log('Genesys Cloud SDKs are loaded');

    const appName = 'GC Copilot Next';
    const qParamLanguage = 'langTag';
    const qParamGcHostOrigin = 'gcHostOrigin';
    const qParamConversationId = 'conversationId';
    let language = 'en-us';
    let redirectUri = window.location.origin; // Use the current origin
    let userDetails = null;
    let environment = 'mypurecloud.ie'; // Default environment

    assignConfiguration();

    log(`Environment after assignConfiguration: ${environment}`);
    log(`Language after assignConfiguration: ${language}`);
    log(`ConversationId after assignConfiguration: ${window.conversationId}`);

    // Ensure the SDKs are loaded properly
    if (!window.platformClient || !window.purecloud || !window.purecloud.apps) {
      throw new Error('Genesys Cloud SDKs not loaded');
    }

    const platformClient = window.platformClient;
    const client = platformClient.ApiClient.instance;

    const ClientApp = window.purecloud.apps.ClientApp;

    const myClientApp = new ClientApp({
      pcEnvironment: environment
    });

    client.setPersistSettings(true, appName);
    client.setEnvironment(environment);

    log('Attempting to login via Implicit Grant');
    await client.loginImplicitGrant(clientId, redirectUri);
    log('Login successful');

    const usersApi = new platformClient.UsersApi();
    userDetails = await usersApi.getUsersMe();

    myClientApp.alerting.showToastPopup(
      `Hello ${userDetails.name}`,
      'Welcome to GC Copilot Next'
    );

    log('Finished SDK initialization');

  } catch (err) {
    error('Error during SDK initialization:', err);
    throw err;
  }

  function assignConfiguration() {
    let url = new URL(window.location);
    let searchParams = new URLSearchParams(url.search);

    if (searchParams.has(qParamLanguage)) {
      language = searchParams.get(qParamLanguage);
      localStorage.setItem(`${appName}_language`, language);
    } else {
      let local_lang = localStorage.getItem(`${appName}_language`);
      if (local_lang) language = local_lang;
    }

    if (searchParams.has(qParamGcHostOrigin)) {
      let gcHostOrigin = searchParams.get(qParamGcHostOrigin);
      environment = gcHostOrigin.replace('https://apps.', '');
      localStorage.setItem(`${appName}_environment`, environment);
    } else {
      let local_env = localStorage.getItem(`${appName}_environment`);
      if (local_env) environment = local_env;
    }

    if (searchParams.has(qParamConversationId)) {
      window.conversationId = searchParams.get(qParamConversationId);
    }
  }

  function waitForSDKsToLoad() {
    return new Promise((resolve, reject) => {
      if (window.pcSDKLoaded) {
        resolve();
      } else {
        const maxRetries = 50;
        let retries = 0;

        const interval = setInterval(() => {
          if (window.pcSDKLoaded) {
            clearInterval(interval);
            resolve();
          } else {
            retries++;
            if (retries > maxRetries) {
              clearInterval(interval);
              reject(new Error('Genesys Cloud SDKs failed to load'));
            }
          }
        }, 100);
      }
    });
  }
}
