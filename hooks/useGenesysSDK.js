import { useState, useEffect } from 'react';
import { GENESYS_CONFIG } from '../lib/genesysConfig';

export const useGenesysSDK = () => {
  const [clientApp, setClientApp] = useState(null);
  const [platformClient, setPlatformClient] = useState(null);
  const [userDetails, setUserDetails] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const initializeSDKs = async () => {
      try {
        if (typeof window === 'undefined') return;

        // Wait for SDKs to load
        while (!window.platformClient || !window.purecloud?.apps?.ClientApp) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }

        // Get environment and language from URL or localStorage
        const config = await getConfiguration();
        
        // Initialize Client App SDK
        const ClientApp = window.purecloud.apps.ClientApp;
        const myClientApp = new ClientApp({
          gcHostOriginQueryParam: 'gcHostOrigin',
          gcTargetEnvQueryParam: 'gcTargetEnv'
        });
        
        // Initialize Platform SDK
        const platformClient = window.platformClient;
        const client = platformClient.ApiClient.instance;
        
        client.setPersistSettings(true, GENESYS_CONFIG.appName);
        client.setEnvironment(config.environment);

        await client.loginImplicitGrant(
          GENESYS_CONFIG.clientId,
          GENESYS_CONFIG.redirectUri
        );

        const usersApi = new platformClient.UsersApi();
        const userData = await usersApi.getUsersMe();
        
        setClientApp(myClientApp);
        setPlatformClient(client);
        setUserDetails(userData);
        setIsLoading(false);

        // Show welcome toast
        myClientApp.alerting.showToastPopup(
          `Hello ${userData.name}`,
          'Welcome to GCCopilotNext'
        );
      } catch (err) {
        console.error('Error initializing Genesys SDKs:', err);
        setError(err.message);
        setIsLoading(false);
      }
    };

    initializeSDKs();
  }, []);

  return { clientApp, platformClient, userDetails, isLoading, error };
};

// Helper function to get configuration
const getConfiguration = async () => {
  const url = new URL(window.location);
  const searchParams = new URLSearchParams(url.search);
  const appName = GENESYS_CONFIG.appName;

  let environment = GENESYS_CONFIG.defaultEnvironment;
  let language = GENESYS_CONFIG.defaultLanguage;
  let conversationId = '';

  // Check URL parameters first
  if (searchParams.has('gcHostOrigin')) {
    const gcHostOrigin = searchParams.get('gcHostOrigin');
    environment = gcHostOrigin.replace('https://apps.', '');
    localStorage.setItem(`${appName}_environment`, environment);
  } else {
    const storedEnv = localStorage.getItem(`${appName}_environment`);
    if (storedEnv) environment = storedEnv;
  }

  if (searchParams.has('langTag')) {
    language = searchParams.get('langTag');
    localStorage.setItem(`${appName}_language`, language);
  } else {
    const storedLang = localStorage.getItem(`${appName}_language`);
    if (storedLang) language = storedLang;
  }

  if (searchParams.has('conversationId')) {
    conversationId = searchParams.get('conversationId');
    window.conversationId = conversationId;
  }

  return { environment, language, conversationId };
};
