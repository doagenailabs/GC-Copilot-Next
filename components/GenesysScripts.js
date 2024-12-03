'use client';

import Script from 'next/script';
import { useEffect } from 'react';
import { logger } from '../lib/logging';

const COMPONENT = 'GenesysScripts';

// Global state to track SDK loading
if (typeof window !== 'undefined') {
  window.genesysSDKsLoaded = {
    platform: false,
    clientApp: false
  };
}

export default function GenesysScripts() {
  useEffect(() => {
    logger.log(COMPONENT, 'GenesysScripts mounted');
    return () => {
      if (typeof window !== 'undefined') {
        window.genesysSDKsLoaded = {
          platform: false,
          clientApp: false
        };
      }
    };
  }, []);

  const handleScriptLoad = (scriptName) => () => {
    logger.log(COMPONENT, `${scriptName} loaded successfully`);
    if (typeof window !== 'undefined') {
      if (scriptName === 'Platform SDK') {
        window.genesysSDKsLoaded.platform = true;
      } else if (scriptName === 'Client App SDK') {
        window.genesysSDKsLoaded.clientApp = true;
      }
      logger.debug(COMPONENT, 'Current SDK loading status:', window.genesysSDKsLoaded);
    }
  };

  const handleScriptError = (scriptName) => (error) => {
    logger.error(COMPONENT, `Error loading ${scriptName}:`, error);
  };

  return (
    <>
      <Script
        src="https://sdk-cdn.mypurecloud.com/javascript/latest/purecloud-platform-client-v2.min.js"
        strategy="afterInteractive"
        id="gc-platform-sdk"
        onLoad={handleScriptLoad('Platform SDK')}
        onError={handleScriptError('Platform SDK')}
      />
      <Script
        src="https://sdk-cdn.mypurecloud.com/client-apps/2.6.7/purecloud-client-app-sdk.js"
        strategy="afterInteractive"
        id="gc-client-app-sdk"
        onLoad={handleScriptLoad('Client App SDK')}
        onError={handleScriptError('Client App SDK')}
      />
    </>
  );
}
