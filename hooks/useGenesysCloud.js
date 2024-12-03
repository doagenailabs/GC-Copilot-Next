import { useState, useEffect } from 'react';
import { ClientApp } from 'purecloud-client-app-sdk';
import { GENESYS_CONFIG } from '../lib/genesysConfig';
import { logger } from '../lib/logging';

const COMPONENT = 'useGenesysCloud';
const RETRY_INTERVAL = 2000;
const MAX_RETRIES = 5;

let globalPlatformClient = null;

export function useGenesysCloud() {
  const [state, setState] = useState({
    clientApp: null,
    platformClient: null,
    userDetails: null,
    isLoading: true,
    error: null
  });

  useEffect(() => {
    let retryCount = 0;
    let retryTimeout;
    let isSubscribed = true;

    const initializeSDK = async () => {
      logger.log(COMPONENT, 'Starting SDK initialization');
      
      try {
        // Only load the module once globally
        if (!globalPlatformClient) {
          logger.debug(COMPONENT, 'Loading Platform Client module');
          const platformClientModule = await import('purecloud-platform-client-v2');
          globalPlatformClient = platformClientModule;
          logger.debug(COMPONENT, 'Platform Client module loaded:', globalPlatformClient);
        }

        // Log the available properties
        logger.debug(COMPONENT, 'Platform Client properties:', Object.keys(globalPlatformClient));

        // Try different ways to access the ApiClient
        let ApiClient;
        if (globalPlatformClient.ApiClient) {
          ApiClient = globalPlatformClient.ApiClient;
        } else if (globalPlatformClient.default?.ApiClient) {
          ApiClient = globalPlatformClient.default.ApiClient;
        } else {
          throw new Error('ApiClient not found in platform client module');
        }

        // Create a new API client instance
        const client = new ApiClient();
        const redirectUri = typeof window !== 'undefined' ? window.location.origin : '//';
        
        logger.debug(COMPONENT, 'Configuring Platform Client', {
          environment: GENESYS_CONFIG.defaultEnvironment,
          redirectUri,
          clientId: GENESYS_CONFIG.clientId
        });

        // Configure the client
        client.setPersistSettings(true, GENESYS_CONFIG.appName);
        client.setEnvironment(GENESYS_CONFIG.defaultEnvironment);

        // Initialize Client App
        logger.debug(COMPONENT, 'Initializing Client App');
        const myClientApp = new ClientApp({
          gcHostOriginQueryParam: 'gcHostOrigin',
          gcTargetEnvQueryParam: 'gcTargetEnv'
        });

        // Perform login
        logger.log(COMPONENT, 'Starting implicit grant login');
        await client.loginImplicitGrant(
          GENESYS_CONFIG.clientId,
          redirectUri
        );
        logger.log(COMPONENT, 'Login successful');

        // Get user details
        logger.debug(COMPONENT, 'Creating UsersApi instance');
        const UsersApi = globalPlatformClient.UsersApi || globalPlatformClient.default.UsersApi;
        const usersApi = new UsersApi();
        
        logger.debug(COMPONENT, 'Fetching user details');
        const userData = await usersApi.getUsersMe();
        logger.debug(COMPONENT, 'User details retrieved:', userData);

        if (isSubscribed) {
          setState({
            clientApp: myClientApp,
            platformClient: client,
            userDetails: userData,
            isLoading: false,
            error: null
          });

          // Show welcome notification
          logger.log(COMPONENT, 'Showing welcome notification');
          myClientApp.alerting.showToastPopup(
            `Hello ${userData.name}`,
            'Welcome to GCCopilotNext'
          );
          
          logger.log(COMPONENT, 'SDK initialization complete');
        }
      } catch (error) {
        logger.error(COMPONENT, 'SDK initialization error:', error);
        logger.error(COMPONENT, 'Error details:', {
          message: error.message,
          stack: error.stack,
          name: error.name,
          platformClientAvailable: !!globalPlatformClient,
          platformClientKeys: globalPlatformClient ? Object.keys(globalPlatformClient) : []
        });
        
        if (retryCount < MAX_RETRIES && isSubscribed) {
          retryCount++;
          logger.warn(COMPONENT, `Retrying initialization (attempt ${retryCount}/${MAX_RETRIES})`);
          retryTimeout = setTimeout(initializeSDK, RETRY_INTERVAL);
        } else if (isSubscribed) {
          logger.error(COMPONENT, 'Max retries reached, giving up');
          setState(prev => ({
            ...prev,
            isLoading: false,
            error: error.message || 'Failed to initialize Genesys Cloud SDK'
          }));
        }
      }
    };

    // Start initialization
    initializeSDK();

    // Cleanup function
    return () => {
      logger.debug(COMPONENT, 'Cleaning up hook resources');
      isSubscribed = false;
      if (retryTimeout) {
        clearTimeout(retryTimeout);
      }
    };
  }, []);

  return state;
}
