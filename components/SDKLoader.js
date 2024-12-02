'use client';

import React, { useEffect } from 'react';

const LOG_PREFIX = 'GCCopilotNext - SDKLoader -';
const debug = (message, ...args) => console.debug(`${LOG_PREFIX} ${message}`, ...args);

function loadScript(src) {
  return new Promise((resolve, reject) => {
    if (document.querySelector(`script[src="${src}"]`)) {
      debug(`Script already loaded: ${src}`);
      resolve();
      return;
    }

    const script = document.createElement('script');
    script.src = src;
    script.async = true; // Changed to true for better loading
    
    script.onload = () => {
      debug(`Script loaded successfully: ${src}`);
      resolve();
    };
    
    script.onerror = () => {
      debug(`Error loading script: ${src}`);
      reject(new Error(`Failed to load script: ${src}`));
    };
    
    document.head.appendChild(script);
  });
}

export default function SDKLoader() {
  useEffect(() => {
    async function loadSDKs() {
      try {
        debug('Starting SDK script loading');
        
        // Load Platform SDK first and wait for it
        await loadScript('https://sdk-cdn.mypurecloud.com/javascript/latest/purecloud-platform-client-v2.min.js');
        debug('Platform SDK loaded');
        
        // Then load Client App SDK and wait for it
        await loadScript('https://sdk-cdn.mypurecloud.com/client-apps/2.6.3/purecloud-client-app-sdk.min.js');
        debug('Client App SDK loaded');
        
        // Set the loaded flag only after both scripts are loaded
        window.pcSDKLoaded = true;
        window.dispatchEvent(new Event('sdksLoaded'));
        debug('All SDKs loaded successfully');
      } catch (err) {
        debug('Error loading SDKs:', err);
        window.pcSDKLoaded = false;
      }
    }

    loadSDKs();
  }, []);

  return null;
}
