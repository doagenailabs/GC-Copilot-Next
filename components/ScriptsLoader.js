'use client';

import Script from 'next/script';
import { useState, useEffect } from 'react';

export default function ScriptsLoader({ onScriptsLoaded }) {
  const [scriptsLoadedCount, setScriptsLoadedCount] = useState(0);

  const handleScriptLoad = () => {
    setScriptsLoadedCount((prevCount) => prevCount + 1);
  };

  useEffect(() => {
    if (scriptsLoadedCount === 2) {
      onScriptsLoaded();
    }
  }, [scriptsLoadedCount, onScriptsLoaded]);

  return (
    <>
      <Script
        src="https://sdk-cdn.mypurecloud.com/javascript/latest/purecloud-platform-client-v2.min.js"
        strategy="beforeInteractive"
        onLoad={handleScriptLoad}
      />
      <Script
        src="https://sdk-cdn.mypurecloud.com/client-apps/2.6.7/purecloud-client-app-sdk.min.js"
        strategy="beforeInteractive"
        onLoad={handleScriptLoad}
      />
    </>
  );
}
