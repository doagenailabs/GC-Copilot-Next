'use client';

import Script from 'next/script';
import { useEffect } from 'react';
import { logger } from '../lib/logging';

const COMPONENT = 'GenesysScripts';

export default function GenesysScripts() {
  useEffect(() => {
    // Initialize the tracking object only after the component mounts
    if (typeof window !== 'undefined') {
      window.genesysSDKsLoaded = {
        platform: false,
        clientApp: false,
        ready: false
      };
    }

    logger.log(COMPONENT, 'GenesysScripts mounted');

    return () => {
      if (typeof window !== 'undefined') {
        window.genesysSDKsLoaded = undefined;
      }
    };
  }, []);

  const handleScriptLoad = (scriptName) => () => {
    if (typeof window === 'undefined') return;

    logger.log(COMPONENT, `${scriptName} loaded successfully`);
    logger.debug(COMPONENT, 'Window objects state:', {
      hasPlatformClient: !!window.platformClient,
      hasPurecloud: !!window.purecloud,
      hasApps: !!window.purecloud?.apps,
      hasClientApp: !!window.purecloud?.apps?.ClientApp
    });
    
    if (scriptName === 'Platform SDK') {
      window.genesysSDKsLoaded.platform = true;
    } else if (scriptName === 'Client App SDK') {
      window.genesysSDKsLoaded.clientApp = true;
    }

    // Check if both SDKs are loaded and the objects are available
    if (window.genesysSDKsLoaded.platform && 
        window.genesysSDKsLoaded.clientApp && 
        window.platformClient && 
        window.purecloud?.apps?.ClientApp) {
      window.genesysSDKsLoaded.ready = true;
      logger.log(COMPONENT, 'All SDKs loaded and objects available');
    }
  };

  const handleScriptError = (scriptName) => (error) => {
    logger.error(COMPONENT, `Error loading ${scriptName}:`, error);
  };

  return (
    <>
      <Script
        src="https://sdk-cdn.mypurecloud.com/javascript/latest/purecloud-platform-client-v2.min.js"
        strategy="lazyOnload"
        id="gc-platform-sdk"
        onLoad={handleScriptLoad('Platform SDK')}
        onError={handleScriptError('Platform SDK')}
      />
      <Script
        src="https://sdk-cdn.mypurecloud.com/client-apps/2.6.7/purecloud-client-app-sdk.js"
        strategy="lazyOnload"
        id="gc-client-app-sdk"
        onLoad={handleScriptLoad('Client App SDK')}
        onError={handleScriptError('Client App SDK')}
      />
    </>
  );
}
