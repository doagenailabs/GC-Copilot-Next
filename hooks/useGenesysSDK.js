import { useState, useEffect } from 'react';

export function useGenesysSDK() {
  const [sdkReady, setSdkReady] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    function checkSDKLoaded() {
      return window.platformClient && window.purecloud?.apps?.ClientApp;
    }

    function initializeSDK() {
      if (checkSDKLoaded()) {
        setSdkReady(true);
      } else {
        const timer = setInterval(() => {
          if (checkSDKLoaded()) {
            setSdkReady(true);
            clearInterval(timer);
          }
        }, 100);

        // Clear interval after 10 seconds if SDKs haven't loaded
        setTimeout(() => {
          clearInterval(timer);
          if (!checkSDKLoaded()) {
            setError('Genesys Cloud SDKs failed to load');
          }
        }, 10000);
      }
    }

    initializeSDK();
  }, []);

  return { sdkReady, error };
}
