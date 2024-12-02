const APP_NAME = 'GC Copilot Next';
const PARAM_LANGUAGE = 'langTag';
const PARAM_GC_HOST_ORIGIN = 'gcHostOrigin';
const PARAM_ENVIRONMENT = 'gcTargetEnv';
const PARAM_CONVERSATION_ID = 'conversationId';

export function startGCSDKs(clientId) {
  return new Promise((resolve, reject) => {
    let language = '';  
    let redirectUri = process.env.NEXT_PUBLIC_VERCEL_URL ? 
      `https://${process.env.NEXT_PUBLIC_VERCEL_URL}` : 
      'https://gcdoa-copilot.vercel.app';
    let userDetails = null;
    let gcHostOrigin = '';
    let conversationId = '';
    let gcHostURL = assignConfiguration();

    console.log("GCCopilotNext - gcSDKs.js - redirectUri:", redirectUri);

    // Check if we're in a browser environment
    if (typeof window === 'undefined') {
      reject(new Error('Not in browser environment'));
      return;
    }

    let hostName;
    if (gcHostURL) {
      try {
        hostName = new URL(gcHostURL).hostname;
      } catch (error) {
        console.error("GCCopilotNext - gcSDKs.js - Invalid gcHostOrigin URL:", gcHostOrigin);
        reject(error);
        return;
      }
    } else {
      console.log("GCCopilotNext - gcSDKs.js - gcHostOrigin is not set or invalid");
      reject(new Error("GCCopilotNext - gcHostOrigin is not set or invalid"));
      return;
    }

    const parts = hostName.split('.');
    parts.shift();
    window.environment = parts.join('.'); // Example environment value = "mypurecloud.ie" 
    console.log('GCCopilotNext - gcSDKs.js - window.environment:', window.environment);

    // Wait for platformClient to be available
    const waitForPlatformClient = () => {
      if (window.platformClient) {
        initializeSDK(window.platformClient);
      } else {
        setTimeout(waitForPlatformClient, 100);
      }
    };

    const initializeSDK = (platformClient) => {
      const client = platformClient.ApiClient.instance;
      const usersApi = new platformClient.UsersApi();

      // Initialize ClientApp
      let ClientApp = window.purecloud.apps.ClientApp;
      let myClientApp = new ClientApp({
        pcEnvironment: window.environment
      });
      window.myClientApp = myClientApp;

      client.setPersistSettings(true, APP_NAME);
      client.setEnvironment(window.environment);
      client.loginImplicitGrant(clientId, redirectUri)
        .then(data => usersApi.getUsersMe())
        .then(data => {   
          userDetails = data;
        })
        .then(() => {
          resolve(platformClient);
        })
        .catch((err) => {
          console.error("GCCopilotNext - gcSDKs.js - Error during setup:", err);
          reject(err);
        });
    };

    // Start waiting for platformClient
    waitForPlatformClient();

    function assignConfiguration() {
      if (typeof window === 'undefined') return null;
      
      let browser_url = window.location.href;
      if (!browser_url) {
        console.log('GCCopilotNext - gcSDKs.js - Browser URL is null or undefined.');
        return null;
      }
      
      let searchParams;
      try {
        let url = new URL(browser_url);
        searchParams = new URLSearchParams(url.search);
      } catch (error) {
        console.error('GCCopilotNext - gcSDKs.js - Failed to parse the URL:', browser_url);
        return null;
      }
      
      console.log('GCCopilotNext - gcSDKs.js - browser_url: ', browser_url);
      console.log('GCCopilotNext - gcSDKs.js - searchParams: ', searchParams);
      
      if (searchParams.has(PARAM_CONVERSATION_ID)) {
        conversationId = searchParams.get(PARAM_CONVERSATION_ID);
        window.conversationId = conversationId; 
        console.log('GCCopilotNext - gcSDKs.js - Conversation ID set from URL parameter:', conversationId);
      }

      if (searchParams.has(PARAM_LANGUAGE)) {
        language = searchParams.get(PARAM_LANGUAGE);
        localStorage.setItem(`${APP_NAME}_language`, language);
        console.log('GCCopilotNext - gcSDKs.js - Language set from URL parameter:', language);
      } else {
        let local_lang = localStorage.getItem(`${APP_NAME}_language`);
        if (local_lang) {
          language = local_lang;
          console.log('GCCopilotNext - gcSDKs.js - Language set from localStorage:', language);
        }
      }

      if (searchParams.has(PARAM_GC_HOST_ORIGIN)) {
        gcHostOrigin = searchParams.get(PARAM_GC_HOST_ORIGIN);
        localStorage.setItem(`${APP_NAME}_gcHostOrigin`, gcHostOrigin);
        console.log('GCCopilotNext - gcSDKs.js - gcHostOrigin set from URL parameter:', gcHostOrigin);
        return gcHostOrigin;
      } else {
        let local_gcHostOrigin = localStorage.getItem(`${APP_NAME}_gcHostOrigin`);
        if (local_gcHostOrigin) {
          gcHostOrigin = local_gcHostOrigin;
          console.log('GCCopilotNext - gcSDKs.js - gcHostOrigin set from localStorage:', gcHostOrigin);
          return gcHostOrigin;
        }
        console.log('GCCopilotNext - gcSDKs.js - gcHostOrigin not found in both URL parameters and localStorage.');
        return null;
      }
    }
  });
}
