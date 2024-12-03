export function startGCSDKs(clientId) {
  return new Promise((resolve, reject) => {
    console.log('GCCopilotNext - gcSDKs.js - startGCSDKs called with clientId:', clientId);

    if (typeof window === 'undefined' || !window.platformClient || !window.purecloud?.apps?.ClientApp) {
      reject(new Error('SDK not loaded'));
      return;
    }

    const platformClient = window.platformClient;
    const ClientApp = window.purecloud.apps.ClientApp;

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
      console.log('GCCopilotNext - gcSDKs.js - Initialized window.conversationId');
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

    const init = () => {
      // Check if SDK scripts are loaded
      if (!window.purecloud || !window.purecloud.apps) {
        console.error('GCCopilotNext - gcSDKs.js - SDK scripts not loaded properly');
        reject(new Error('SDK scripts not loaded properly'));
        return;
      }

      // Get platformClient from global scope
      const platformClient = window.platformClient;
      const ClientApp = window.purecloud.apps.ClientApp;

      // Assign configuration from URL or localStorage
      assignConfiguration();

    try {
      console.log('GCCopilotNext - gcSDKs.js - Initializing ClientApp');
      const myClientApp = new ClientApp({
        gcHostOriginQueryParam: 'gcHostOrigin',
        gcTargetEnvQueryParam: 'gcTargetEnv',
      });
      window.myClientApp = myClientApp;

      const client = platformClient.ApiClient.instance;
      const usersApi = new platformClient.UsersApi();

      client.setPersistSettings(true, appName);
      client.setEnvironment(environment);

      client
        .loginImplicitGrant(clientId, redirectUri)
        .then((data) => usersApi.getUsersMe())
        .then((data) => {
          userDetails = data;
          myClientApp.alerting.showToastPopup(
            `Hello ${userDetails.name}`,
            'Welcome to GCCopilotNext'
          );
          resolve(platformClient);
        })
        .catch((err) => reject(err));
    } catch (err) {
      reject(err);
    }
  });
}
