export function startGCSDKs(clientId) {
  return new Promise((resolve, reject) => {
    const appName = 'Monitor alerts';
    const qParamLanguage = 'langTag';
    const qParamGcHostOrigin = 'gcHostOrigin';
    const qParamEnvironment = 'gcTargetEnv';
    const qParamConversationId = 'conversationId';
    let language = '';  
    let redirectUri = process.env.NEXT_PUBLIC_VERCEL_URL ? 
      `https://${process.env.NEXT_PUBLIC_VERCEL_URL}` : 
      'http://gcdoa-copilot.vercel.app';
    let userDetails = null;
    let gcHostOrigin = '';
    let conversationId = '';
    let gcHostURL = assignConfiguration();

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
        console.error("gcSDKs.js - Invalid gcHostOrigin URL:", gcHostOrigin);
        reject(error);
        return;
      }
    } else {
      console.log("GCCopilotNext - gcSDKs.js - gcHostOrigin is not set or invalid");
      reject(new Error("gcHostOrigin is not set or invalid"));
      return;
    }

    const parts = hostName.split('.');
    parts.shift();
    window.environment = parts.join('.'); // Example environment value = "mypurecloud.ie" 
    console.log('gcSDKs.js - window.environment:', window.environment);

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

      client.setPersistSettings(true, appName);
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
          console.error("gcSDKs.js - Error during setup:", err);
          reject(err);
        });
    };

    // Start waiting for platformClient
    waitForPlatformClient();
  });

  function assignConfiguration() {
    if (typeof window === 'undefined') return null;
    
    let browser_url = window.location.href;
    if (!browser_url) {
      console.log('gcSDKs.js - Browser URL is null or undefined.');
      return null;
    }
    
    let searchParams;
    try {
      let url = new URL(browser_url);
      searchParams = new URLSearchParams(url.search);
    } catch (error) {
      console.error('gcSDKs.js - Failed to parse the URL:', browser_url);
      return null;
    }
    
    console.log('gcSDKs.js - browser_url: ', browser_url);
    console.log('gcSDKs.js - searchParams: ', searchParams);
    
    if (searchParams.has(qParamConversationId)) {
      conversationId = searchParams.get(qParamConversationId);
      window.conversationId = conversationId; 
      console.log('gcSDKs.js - Conversation ID set from URL parameter:', conversationId);
    }

    if (searchParams.has(qParamLanguage)) {
      language = searchParams.get(qParamLanguage);
      localStorage.setItem(`${appName}_language`, language);
      console.log('gcSDKs.js - Language set from URL parameter:', language);
    } else {
      let local_lang = localStorage.getItem(`${appName}_language`);
      if (local_lang) {
        language = local_lang;
        console.log('gcSDKs.js - Language set from localStorage:', language);
      }
    }

    if (searchParams.has(qParamGcHostOrigin)) {
      gcHostOrigin = searchParams.get(qParamGcHostOrigin);
      localStorage.setItem(`${appName}_gcHostOrigin`, gcHostOrigin);
      console.log('gcSDKs.js - gcHostOrigin set from URL parameter:', gcHostOrigin);
      return gcHostOrigin;
    } else {
      let local_gcHostOrigin = localStorage.getItem(`${appName}_gcHostOrigin`);
      if (local_gcHostOrigin) {
        gcHostOrigin = local_gcHostOrigin;
        console.log('gcSDKs.js - gcHostOrigin set from localStorage:', gcHostOrigin);
        return gcHostOrigin;
      }
      console.log('gcSDKs.js - gcHostOrigin not found in both URL parameters and localStorage.');
      return null;
    }
  }
}
