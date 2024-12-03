'use client';

import { useState, useEffect } from 'react';
import { GENESYS_CONFIG, getRedirectUri } from '../lib/genesysConfig';

export const useGenesysSDK = () => {
  const [clientApp, setClientApp] = useState(null);
  const [platformClient, setPlatformClient] = useState(null);
  const [userDetails, setUserDetails] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isBrowser, setIsBrowser] = useState(false);

  useEffect(() => {
    setIsBrowser(true);
  }, []);

  useEffect(() => {
    if (!isBrowser) return;

    const initializeSDKs = async () => {
      try {
        // Wait for SDKs to load
        let attempts = 0;
        const maxAttempts = 50; // 5 seconds
        
        while (!window.platformClient || !window.purecloud?.apps?.ClientApp) {
          if (attempts >= maxAttempts) {
            throw new Error('Genesys Cloud SDKs failed to load after 5 seconds');
          }
          await new Promise(resolve => setTimeout(resolve, 100));
          attempts++;
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
          getRedirectUri()
        );

        const usersApi = new platformClient.UsersApi();
        const userData = await usersApi.getUsersMe();
        
        setClientApp(myClientApp);
        setPlatformClient(client);
        setUserDetails(userData);

        // Show welcome toast
        myClientApp.alerting.showToastPopup(
          `Hello ${userData.name}`,
          'Welcome to GCCopilotNext'
        );
      } catch (err) {
        console.error('Error initializing Genesys SDKs:', err);
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    initializeSDKs();
  }, [isBrowser]);

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
