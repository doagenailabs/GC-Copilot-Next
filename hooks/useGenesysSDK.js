'use client';

import { useState, useEffect } from 'react';
import { GENESYS_CONFIG, getRedirectUri } from '../lib/genesysConfig';
import { logger } from '../lib/logging';

const COMPONENT = 'useGenesysSDK';

export const useGenesysSDK = () => {
  const [clientApp, setClientApp] = useState(null);
  const [platformClient, setPlatformClient] = useState(null);
  const [userDetails, setUserDetails] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isBrowser, setIsBrowser] = useState(false);

  useEffect(() => {
    logger.log(COMPONENT, 'Initial mount, setting isBrowser');
    setIsBrowser(true);
  }, []);

  useEffect(() => {
    if (!isBrowser) {
      logger.log(COMPONENT, 'Not in browser environment, skipping initialization');
      return;
    }

    const checkSDKs = () => {
      const hasPlatformClient = !!window.platformClient;
      const hasClientApp = !!window.purecloud?.apps?.ClientApp;
      logger.debug(COMPONENT, 'Checking SDKs availability:', {
        hasPlatformClient,
        hasClientApp,
        platformClientType: typeof window.platformClient,
        pureCloudApps: window.purecloud?.apps
      });
      return hasPlatformClient && hasClientApp;
    };

    const initializeSDKs = async () => {
      logger.log(COMPONENT, 'Starting SDK initialization');
      
      try {
        // Wait for SDKs to load
        let attempts = 0;
        const maxAttempts = 50; // 5 seconds
        
        while (!checkSDKs()) {
          if (attempts >= maxAttempts) {
            throw new Error('Genesys Cloud SDKs failed to load after 5 seconds');
          }
          logger.debug(COMPONENT, `Waiting for SDKs to load (attempt ${attempts + 1}/${maxAttempts})`);
          await new Promise(resolve => setTimeout(resolve, 100));
          attempts++;
        }

        logger.log(COMPONENT, 'SDKs loaded successfully, proceeding with initialization');

        // Get environment and language from URL or localStorage
        const config = await getConfiguration();
        logger.debug(COMPONENT, 'Configuration retrieved:', config);
        
        // Initialize Client App SDK
        logger.log(COMPONENT, 'Initializing Client App SDK');
        const ClientApp = window.purecloud.apps.ClientApp;
        const myClientApp = new ClientApp({
          gcHostOriginQueryParam: 'gcHostOrigin',
          gcTargetEnvQueryParam: 'gcTargetEnv'
        });
        logger.debug(COMPONENT, 'Client App SDK initialized');
        
        // Initialize Platform SDK
        logger.log(COMPONENT, 'Initializing Platform SDK');
        const platformClient = window.platformClient;
        const client = platformClient.ApiClient.instance;
        
        client.setPersistSettings(true, GENESYS_CONFIG.appName);
        client.setEnvironment(config.environment);
        logger.debug(COMPONENT, 'Platform SDK configured with environment:', config.environment);

        logger.log(COMPONENT, 'Starting implicit grant login');
        await client.loginImplicitGrant(
          GENESYS_CONFIG.clientId,
          getRedirectUri()
        );
        logger.log(COMPONENT, 'Login successful');

        const usersApi = new platformClient.UsersApi();
        logger.log(COMPONENT, 'Fetching user details');
        const userData = await usersApi.getUsersMe();
        logger.debug(COMPONENT, 'User details retrieved:', userData);
        
        setClientApp(myClientApp);
        setPlatformClient(client);
        setUserDetails(userData);

        // Show welcome toast
        logger.log(COMPONENT, 'Showing welcome toast');
        myClientApp.alerting.showToastPopup(
          `Hello ${userData.name}`,
          'Welcome to GCCopilotNext'
        );

        logger.log(COMPONENT, 'SDK initialization complete');
      } catch (err) {
        logger.error(COMPONENT, 'Error during SDK initialization:', err);
        logger.error(COMPONENT, 'Error details:', {
          message: err.message,
          stack: err.stack,
          name: err.name
        });
        setError(err.message);
      } finally {
        setIsLoading(false);
        logger.log(COMPONENT, 'Initialization process finished');
      }
    };

    initializeSDKs();
  }, [isBrowser]);

  return { clientApp, platformClient, userDetails, isLoading, error };
};

// Helper function to get configuration
const getConfiguration = async () => {
  logger.log(COMPONENT, 'Getting configuration');
  const url = new URL(window.location);
  const searchParams = new URLSearchParams(url.search);
  const appName = GENESYS_CONFIG.appName;

  let environment = GENESYS_CONFIG.defaultEnvironment;
  let language = GENESYS_CONFIG.defaultLanguage;
  let conversationId = '';

  logger.debug(COMPONENT, 'URL search params:', searchParams.toString());

  // Check URL parameters first
  if (searchParams.has('gcHostOrigin')) {
    const gcHostOrigin = searchParams.get('gcHostOrigin');
    environment = gcHostOrigin.replace('https://apps.', '');
    localStorage.setItem(`${appName}_environment`, environment);
    logger.debug(COMPONENT, 'Environment set from URL:', environment);
  } else {
    const storedEnv = localStorage.getItem(`${appName}_environment`);
    if (storedEnv) {
      environment = storedEnv;
      logger.debug(COMPONENT, 'Environment retrieved from localStorage:', environment);
    }
  }

  if (searchParams.has('langTag')) {
    language = searchParams.get('langTag');
    localStorage.setItem(`${appName}_language`, language);
    logger.debug(COMPONENT, 'Language set from URL:', language);
  } else {
    const storedLang = localStorage.getItem(`${appName}_language`);
    if (storedLang) {
      language = storedLang;
      logger.debug(COMPONENT, 'Language retrieved from localStorage:', language);
    }
  }

  if (searchParams.has('conversationId')) {
    conversationId = searchParams.get('conversationId');
    window.conversationId = conversationId;
    logger.debug(COMPONENT, 'ConversationId set from URL:', conversationId);
  }

  const config = { environment, language, conversationId };
  logger.debug(COMPONENT, 'Final configuration:', config);
  return config;
};
