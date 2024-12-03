'use client';

import Script from 'next/script';
import { logger } from '../lib/logging';

const COMPONENT = 'GenesysScripts';

export default function GenesysScripts() {
  const handleScriptLoad = (scriptName) => () => {
    logger.log(COMPONENT, `${scriptName} loaded successfully`);
  };

  const handleScriptError = (scriptName) => (error) => {
    logger.error(COMPONENT, `Error loading ${scriptName}:`, error);
  };

  return (
    <>
      <Script
        src="https://sdk-cdn.mypurecloud.com/javascript/latest/purecloud-platform-client-v2.min.js"
        strategy="beforeInteractive"
        id="gc-platform-sdk"
        onLoad={handleScriptLoad('Platform SDK')}
        onError={handleScriptError('Platform SDK')}
      />
      <Script
        src="https://sdk-cdn.mypurecloud.com/client-apps/2.6.7/purecloud-client-app-sdk.js"
        strategy="beforeInteractive"
        id="gc-client-app-sdk"
        onLoad={handleScriptLoad('Client App SDK')}
        onError={handleScriptError('Client App SDK')}
      />
    </>
  );
}
