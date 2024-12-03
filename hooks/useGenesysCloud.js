import { useState, useEffect } from 'react';
import * as platformClientPackage from 'purecloud-platform-client-v2';
import { ClientApp } from 'purecloud-client-app-sdk';
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
        // Initialize Platform Client
        logger.debug(COMPONENT, 'Setting up Platform Client');
        logger.debug(COMPONENT, 'Platform Client Package:', platformClient);

        // Create a new ApiClient instance if it doesn't exist
        const client = platformClient?.ApiClient?.instance || new platformClient.ApiClient();
        const redirectUri = typeof window !== 'undefined' ? window.location.origin : '//';
        
        logger.debug(COMPONENT, 'Configuring Platform Client', {
          environment: GENESYS_CONFIG.defaultEnvironment,
          redirectUri,
          client: !!client
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
          redirectUri,
          { state: 'optional-state-value' }
        );
        logger.log(COMPONENT, 'Login successful');

        // Get user details
        logger.debug(COMPONENT, 'Creating UsersApi instance');
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
          platformClientAvailable: !!platformClient,
          apiClientAvailable: !!platformClient?.ApiClient
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

    // Wait a short moment to ensure module is loaded
    const initTimeout = setTimeout(() => {
      if (platformClient) {
        logger.debug(COMPONENT, 'Platform Client package loaded, starting initialization');
        initializeSDK();
      } else {
        logger.error(COMPONENT, 'Platform Client package not available after initial delay');
      }
    }, 100);

    // Cleanup function
    return () => {
      logger.debug(COMPONENT, 'Cleaning up hook resources');
      isSubscribed = false;
      clearTimeout(initTimeout);
      if (retryTimeout) {
        clearTimeout(retryTimeout);
      }
    };
  }, []);

  return state;
}
