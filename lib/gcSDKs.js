export function startGCSDKs(clientId) {
  return new Promise(async (resolve, reject) => {
    // Ensure that we are in a browser environment
    if (typeof window === 'undefined') {
      console.error('GCCopilotNext - gcSDKs.js - startGCSDKs must be called in a browser environment');
      reject(new Error('startGCSDKs must be called in a browser environment'));
      return;
    }

    // Dynamically import modules to avoid SSR issues
    let platformClient, ClientApp;
    try {
      platformClient = await import('purecloud-platform-client-v2');
      ClientApp = (await import('purecloud-client-app-sdk')).default;
      console.log('GCCopilotNext - gcSDKs.js - Successfully imported Genesys Cloud SDKs');
    } catch (e) {
      console.error('GCCopilotNext - gcSDKs.js - Error importing SDK modules:', e);
      reject(e);
      return;
    }

    const console = window.console;
    const appName = 'GCCopilotNext';
    const qParamLanguage = 'langTag';
    const qParamGcHostOrigin = 'gcHostOrigin';
    const qParamConversationId = 'conversationId';
    let language = 'en-us';
    let redirectUri = window.location.origin + window.location.pathname;
    let userDetails = null;
    let environment = 'mypurecloud.ie';

    // Initialize conversationId on window if not already set
    if (typeof window.conversationId === 'undefined') {
      window.conversationId = '';
    }

    function assignConfiguration() {
      let url = new URL(window.location);
      let searchParams = new URLSearchParams(url.search);

      console.log('GCCopilotNext - gcSDKs.js - URL search params:', searchParams.toString());

      if (searchParams.has(qParamLanguage)) {
        language = searchParams.get(qParamLanguage);
        window.localStorage.setItem(`${appName}_language`, language);
        console.log(`GCCopilotNext - gcSDKs.js - Set language from URL: ${language}`);
      } else {
        let local_lang = window.localStorage.getItem(`${appName}_language`);
        if (local_lang) {
          language = local_lang;
          console.log(`GCCopilotNext - gcSDKs.js - Retrieved language from localStorage: ${language}`);
        } else {
          console.log(`GCCopilotNext - gcSDKs.js - Using default language: ${language}`);
        }
      }

      if (searchParams.has(qParamGcHostOrigin)) {
        let gcHostOrigin = searchParams.get(qParamGcHostOrigin);
        environment = gcHostOrigin.replace('https://apps.', '');
        window.localStorage.setItem(`${appName}_environment`, environment);
        console.log(`GCCopilotNext - gcSDKs.js - Set environment from URL: ${environment}`);
      } else {
        let local_env = window.localStorage.getItem(`${appName}_environment`);
        if (local_env) {
          environment = local_env;
          console.log(`GCCopilotNext - gcSDKs.js - Retrieved environment from localStorage: ${environment}`);
        } else {
          console.log(`GCCopilotNext - gcSDKs.js - Using default environment: ${environment}`);
        }
      }

      if (searchParams.has(qParamConversationId)) {
        window.conversationId = searchParams.get(qParamConversationId);
        console.log(`GCCopilotNext - gcSDKs.js - Set conversationId from URL: ${window.conversationId}`);
      } else {
        console.log(`GCCopilotNext - gcSDKs.js - conversationId remains as: ${window.conversationId}`);
      }
    }

    // Assign configuration from URL or localStorage
    assignConfiguration();

    console.log(`GCCopilotNext - gcSDKs.js - environment: ${environment}`);
    console.log(`GCCopilotNext - gcSDKs.js - language: ${language}`);
    console.log(`GCCopilotNext - gcSDKs.js - conversationId: ${window.conversationId}`);
    console.log(`GCCopilotNext - gcSDKs.js - redirectUri: ${redirectUri}`);

    const client = platformClient.ApiClient.instance;
    console.log('GCCopilotNext - gcSDKs.js - platformClient.ApiClient.instance:', client);

    let myClientApp;

    try {
      myClientApp = new ClientApp({
        gcHostOriginQueryParam: 'gcHostOrigin',
        gcTargetEnvQueryParam: 'gcTargetEnv',
      });
      const region = myClientApp.gcEnvironment;
      console.log(`GCCopilotNext - gcSDKs.js - ClientApp initialized with region: ${region}`);
    } catch (e) {
      console.error('GCCopilotNext - gcSDKs.js - Error initializing ClientApp:', e);
      reject(e);
      return;
    }

    const usersApi = new platformClient.UsersApi();
    console.log('GCCopilotNext - gcSDKs.js - usersApi initialized:', usersApi);

    console.log('GCCopilotNext - gcSDKs.js - Setting persist settings');
    client.setPersistSettings(true, appName);
    client.setEnvironment(environment);

    console.log('GCCopilotNext - gcSDKs.js - Starting loginImplicitGrant with clientId:', clientId, 'redirectUri:', redirectUri);

    client
      .loginImplicitGrant(clientId, redirectUri)
      .then((data) => {
        console.log('GCCopilotNext - gcSDKs.js - Successfully logged in, data:', data);
        return usersApi.getUsersMe();
      })
      .then((data) => {
        userDetails = data;
        console.log('GCCopilotNext - gcSDKs.js - Retrieved user details:', userDetails);

        myClientApp.alerting.showToastPopup(
          `Hello ${userDetails.name}`,
          'Welcome to GCCopilotNext'
        );
      })
      .then(() => {
        console.log('GCCopilotNext - gcSDKs.js - Finished setup.');
        resolve(platformClient);
      })
      .catch((err) => {
        console.error('GCCopilotNext - gcSDKs.js - Error during setup:', err);
        reject(err);
      });
  });
}
