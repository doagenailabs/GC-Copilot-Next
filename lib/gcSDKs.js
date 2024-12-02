import platformClient from 'purecloud-platform-client-v2';
import ClientApp from 'purecloud-client-app-sdk';

export function startGCSDKs(clientId) {
  return new Promise((resolve, reject) => {
    // Ensure that we are in a browser environment
    if (typeof window === 'undefined') {
      console.error('GCCopilotNext - gcSDKs.js - startGCSDKs must be called in a browser environment');
      reject(new Error('startGCSDKs must be called in a browser environment'));
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

      if (searchParams.has(qParamLanguage)) {
        language = searchParams.get(qParamLanguage);
        window.localStorage.setItem(`${appName}_language`, language);
      } else {
        let local_lang = window.localStorage.getItem(`${appName}_language`);
        if (local_lang) language = local_lang;
      }

      if (searchParams.has(qParamGcHostOrigin)) {
        let gcHostOrigin = searchParams.get(qParamGcHostOrigin);
        environment = gcHostOrigin.replace('https://apps.', '');
        window.localStorage.setItem(`${appName}_environment`, environment);
      } else {
        let local_env = window.localStorage.getItem(`${appName}_environment`);
        if (local_env) environment = local_env;
      }

      if (searchParams.has(qParamConversationId)) {
        window.conversationId = searchParams.get(qParamConversationId);
      }
    }

    // Assign configuration from URL or localStorage
    assignConfiguration();

    console.log(`GCCopilotNext - gcSDKs.js - environment: ${environment}`);
    console.log(`GCCopilotNext - gcSDKs.js - language: ${language}`);
    console.log(`GCCopilotNext - gcSDKs.js - conversationId: ${window.conversationId}`);

    const client = platformClient.ApiClient.instance;
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

    client.setPersistSettings(true, appName);
    client.setEnvironment(environment);

    client
      .loginImplicitGrant(clientId, redirectUri)
      .then(() => {
        console.log('GCCopilotNext - gcSDKs.js - Successfully logged in');
        return usersApi.getUsersMe();
      })
      .then((data) => {
        userDetails = data;
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
