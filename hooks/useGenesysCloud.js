import { useState, useEffect } from 'react';
import platformClient from 'purecloud-platform-client-v2';
import { ClientApp } from 'purecloud-client-app-sdk';
import { GENESYS_CONFIG } from '@/lib/genesysConfig';

const RETRY_INTERVAL = 2000; // 2 seconds
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
      try {
        // Initialize Platform Client
        const client = platformClient.ApiClient.instance;
        const redirectUri = typeof window !== 'undefined' ? window.location.origin : '//';
        
        // Configure the client
        client.setPersistSettings(true, GENESYS_CONFIG.appName);
        client.setEnvironment(GENESYS_CONFIG.defaultEnvironment);

        // Initialize Client App
        const myClientApp = new ClientApp({
          gcHostOriginQueryParam: 'gcHostOrigin',
          gcTargetEnvQueryParam: 'gcTargetEnv'
        });

        // Perform login
        await client.loginImplicitGrant(
          GENESYS_CONFIG.clientId,
          redirectUri
        );

        // Get user details
        const usersApi = new platformClient.UsersApi();
        const userData = await usersApi.getUsersMe();

        if (isSubscribed) {
          setState({
            clientApp: myClientApp,
            platformClient: client,
            userDetails: userData,
            isLoading: false,
            error: null
          });

          // Show welcome notification
          myClientApp.alerting.showToastPopup(
            `Hello ${userData.name}`,
            'Welcome to GCCopilotNext'
          );
        }
      } catch (error) {
        console.error('SDK initialization error:', error);
        
        if (retryCount < MAX_RETRIES && isSubscribed) {
          retryCount++;
          retryTimeout = setTimeout(initializeSDK, RETRY_INTERVAL);
        } else if (isSubscribed) {
          setState(prev => ({
            ...prev,
            isLoading: false,
            error: error.message || 'Failed to initialize Genesys Cloud SDK'
          }));
        }
      }
    };

    initializeSDK();

    // Cleanup function
    return () => {
      isSubscribed = false;
      if (retryTimeout) {
        clearTimeout(retryTimeout);
      }
    };
  }, []);

  return state;
}
