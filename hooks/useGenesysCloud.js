import { useState, useEffect } from 'react';
import { ClientApp } from 'purecloud-client-app-sdk';
import platformClient from 'purecloud-platform-client-v2';
import { GENESYS_CONFIG } from '../lib/genesysConfig';
import { logger } from '../lib/logging';

const COMPONENT = 'useGenesysCloud';
const RETRY_INTERVAL = 2000;
const MAX_RETRIES = 5;

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
        // Log the platformClient object
        logger.debug(COMPONENT, 'Platform Client import:', {
          type: typeof platformClient,
          keys: Object.keys(platformClient),
          hasApiClient: !!platformClient.ApiClient,
          hasUsersApi: !!platformClient.UsersApi,
          prototype: Object.getPrototypeOf(platformClient),
          constructors: Object.entries(platformClient)
            .filter(([_, value]) => typeof value === 'function')
            .map(([key]) => key)
        });

        if (!platformClient?.ApiClient) {
          throw new Error('Platform Client module loaded but ApiClient not found');
        }

        // Create API client instance
        const client = new platformClient.ApiClient();
        const redirectUri = typeof window !== 'undefined' ? window.location.origin : '//';
        
        logger.debug(COMPONENT, 'Created API client instance', {
          clientType: typeof client,
          clientMethods: Object.keys(client),
          configParams: {
            environment: GENESYS_CONFIG.defaultEnvironment,
            redirectUri,
            clientId: GENESYS_CONFIG.clientId
          }
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
        if (!platformClient.UsersApi) {
          throw new Error('UsersApi not found in platform client');
        }
        const usersApi = new platformClient.UsersApi();
        
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
          platformClientState: {
            type: typeof platformClient,
            available: !!platformClient,
            hasApiClient: !!platformClient?.ApiClient,
            hasUsersApi: !!platformClient?.UsersApi,
            keys: platformClient ? Object.keys(platformClient) : [],
            methods: platformClient ? Object.entries(platformClient)
              .filter(([_, value]) => typeof value === 'function')
              .map(([key]) => key) : []
          }
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

    initializeSDK();

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
