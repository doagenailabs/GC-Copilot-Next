'use client';

import * as platformClient from 'purecloud-platform-client-v2';
import { ClientApp } from 'purecloud-client-app-sdk';
import { useState, useEffect } from 'react';
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
    error: null,
  });

  useEffect(() => {
    let retryCount = 0;
    let retryTimeout;
    let isSubscribed = true;

    const initializeSDK = async () => {
      logger.log(COMPONENT, 'Starting SDK initialization');

      try {
        if (typeof window === 'undefined') {
          throw new Error('window is undefined');
        }

        // Check if ApiClient is available
        if (!platformClient || !platformClient.ApiClient) {
          console.log('platformClient:', platformClient);
          throw new Error('Platform Client module loaded but ApiClient not found');
        }

        // Use the singleton instance
        const client = platformClient.ApiClient.instance;
        const redirectUri = window.location.origin;

        // Configure the client
        client.setPersistSettings(true, GENESYS_CONFIG.appName);
        client.setEnvironment(GENESYS_CONFIG.defaultEnvironment);

        // Initialize Client App
        const myClientApp = new ClientApp({
          gcHostOriginQueryParam: 'gcHostOrigin',
          gcTargetEnvQueryParam: 'gcTargetEnv',
        });

        // Perform login
        await client.loginImplicitGrant(GENESYS_CONFIG.clientId, redirectUri);

        // Get user details
        const usersApi = new platformClient.UsersApi();
        const userData = await usersApi.getUsersMe();

        if (isSubscribed) {
          setState({
            clientApp: myClientApp,
            platformClient: client,
            userDetails: userData,
            isLoading: false,
            error: null,
          });

          // Show welcome notification
          myClientApp.alerting.showToastPopup(
            `Hello ${userData.name}`,
            'Welcome to GCCopilotNext'
          );
        }
      } catch (error) {
        logger.error(COMPONENT, 'SDK initialization error:', error);

        if (retryCount < MAX_RETRIES && isSubscribed) {
          retryCount++;
          logger.warn(
            COMPONENT,
            `Retrying initialization (attempt ${retryCount}/${MAX_RETRIES})`
          );
          retryTimeout = setTimeout(initializeSDK, RETRY_INTERVAL);
        } else if (isSubscribed) {
          logger.error(COMPONENT, 'Max retries reached, giving up');
          setState((prev) => ({
            ...prev,
            isLoading: false,
            error: error.message || 'Failed to initialize Genesys Cloud SDK',
          }));
        }
      }
    };

    if (typeof window !== 'undefined') {
      initializeSDK();
    }

    return () => {
      isSubscribed = false;
      if (retryTimeout) {
        clearTimeout(retryTimeout);
      }
    };
  }, []);

  return state;
}
