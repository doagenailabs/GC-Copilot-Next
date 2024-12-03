import { useState, useEffect } from 'react';
import { ClientApp } from 'purecloud-client-app-sdk';
import { GENESYS_CONFIG } from '../lib/genesysConfig';
import { logger } from '../lib/logging';

const COMPONENT = 'useGenesysCloud';
const RETRY_INTERVAL = 2000;
const MAX_RETRIES = 5;

// Helper function to deeply inspect an object's structure
function inspectObject(obj, prefix = '') {
  if (!obj) return 'null or undefined';
  if (typeof obj !== 'object') return typeof obj;

  return Object.keys(obj).reduce((acc, key) => {
    const value = obj[key];
    acc[key] = {
      type: typeof value,
      isConstructor: typeof value === 'function' && /^[A-Z]/.test(key),
      hasPrototype: value && typeof value === 'object' && Object.getPrototypeOf(value) !== Object.prototype,
      ownProperties: value && typeof value === 'object' ? Object.keys(value) : undefined,
      stringValue: typeof value === 'function' ? value.toString().slice(0, 100) + '...' : undefined
    };
    return acc;
  }, {});
}

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
          
          // Log detailed module structure
          logger.debug(COMPONENT, 'Platform Client module structure:', {
            moduleType: typeof platformClientModule,
            hasDefault: 'default' in platformClientModule,
            defaultType: typeof platformClientModule.default,
            keys: Object.keys(platformClientModule),
            detailed: inspectObject(platformClientModule),
            defaultDetailed: platformClientModule.default ? inspectObject(platformClientModule.default) : 'no default'
          });

          // Examine require object if available
          if (typeof require !== 'undefined') {
            logger.debug(COMPONENT, 'Require cache:', {
              hasPlatformClient: require.cache['purecloud-platform-client-v2'],
              cacheKeys: Object.keys(require.cache)
            });
          }
        }

        // Detailed examination of globalPlatformClient
        logger.debug(COMPONENT, 'Current Platform Client state:', {
          hasGlobalClient: !!globalPlatformClient,
          globalClientType: typeof globalPlatformClient,
          constructors: Object.keys(globalPlatformClient).filter(key => /^[A-Z]/.test(key)),
          prototype: globalPlatformClient ? Object.getPrototypeOf(globalPlatformClient) : 'none',
          detailed: inspectObject(globalPlatformClient)
        });

        // Try to identify ApiClient location
        const locations = {
          direct: !!globalPlatformClient?.ApiClient,
          onDefault: !!globalPlatformClient?.default?.ApiClient,
          onPrototype: !!Object.getPrototypeOf(globalPlatformClient)?.ApiClient,
          constructorNames: Object.keys(globalPlatformClient).filter(k => /Client/.test(k))
        };
        logger.debug(COMPONENT, 'ApiClient possible locations:', locations);

        // Attempt to get ApiClient constructor
        let ApiClient;
        if (locations.direct) {
          ApiClient = globalPlatformClient.ApiClient;
          logger.debug(COMPONENT, 'Found ApiClient directly on module');
        } else if (locations.onDefault) {
          ApiClient = globalPlatformClient.default.ApiClient;
          logger.debug(COMPONENT, 'Found ApiClient on default export');
        } else {
          throw new Error('ApiClient not found in platform client module');
        }

        logger.debug(COMPONENT, 'ApiClient details:', {
          type: typeof ApiClient,
          prototype: ApiClient.prototype ? Object.keys(ApiClient.prototype) : 'no prototype',
          constructor: ApiClient.toString().slice(0, 100)
        });

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
          platformClientKeys: globalPlatformClient ? Object.keys(globalPlatformClient) : [],
          moduleState: globalPlatformClient ? inspectObject(globalPlatformClient) : 'no module'
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
