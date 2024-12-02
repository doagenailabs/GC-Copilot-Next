'use client';

import { useEffect, useState } from 'react';
import AnalysisDisplay from '../components/AnalysisDisplay';
import { startGCSDKs } from '../lib/gcSDKs';
import { initializeWebSocket } from '../lib/websocket';
import ScriptsLoader from '../components/ScriptsLoader';

export default function Home() {
  const [initError, setInitError] = useState(null);
  const [isInitializing, setIsInitializing] = useState(true);
  const [scriptsLoaded, setScriptsLoaded] = useState(false);

  const handleScriptsLoaded = () => {
    setScriptsLoaded(true);
  };

  useEffect(() => {
    if (!scriptsLoaded) return;

    console.log('GCCopilotNext - page.js - SDK scripts loaded');

    async function start() {
      console.log('GCCopilotNext - page.js - start function called');
      try {
        if (!process.env.NEXT_PUBLIC_GC_OAUTH_CLIENT_ID) {
          throw new Error('OAuth Client ID not configured');
        }

        console.log(
          'GCCopilotNext - page.js - OAuth Client ID:',
          process.env.NEXT_PUBLIC_GC_OAUTH_CLIENT_ID
        );

        const platformClient = await startGCSDKs(process.env.NEXT_PUBLIC_GC_OAUTH_CLIENT_ID);
        console.log('GCCopilotNext - page.js - startGCSDKs completed', platformClient);

        const ws = await initializeWebSocket();
        console.log('GCCopilotNext - page.js - initializeWebSocket completed', ws);

        setIsInitializing(false);
        console.log('GCCopilotNext - page.js - Initialization complete');
      } catch (err) {
        console.error('GCCopilotNext - page.js - Error during initialization:', err);
        setInitError(err.message);
        setIsInitializing(false);
      }
    }

    start();
  }, [scriptsLoaded]);

  if (isInitializing) {
    console.log('GCCopilotNext - page.js - isInitializing is true, rendering loading message');
    return (
      <main className="min-h-screen font-['Open_Sans'] text-center pt-12 bg-gray-100">
        <ScriptsLoader onScriptsLoaded={handleScriptsLoaded} />
        <div className="text-2xl text-gray-600">Initializing...</div>
      </main>
    );
  }

  if (initError) {
    console.log('GCCopilotNext - page.js - initError detected:', initError);
    return (
      <main className="min-h-screen font-['Open_Sans'] text-center pt-12 bg-gray-100">
        <div className="text-2xl text-red-600">Error: {initError}</div>
      </main>
    );
  }

  console.log('GCCopilotNext - page.js - Rendering main content');

  return (
    <main className="min-h-screen font-['Open_Sans'] text-center pt-12 bg-gray-100">
      <h1 className="text-4xl text-gray-800 mb-5 py-5 px-5 bg-white inline-block shadow-md rounded-lg">
        Conversation Analysis
      </h1>
      <AnalysisDisplay />
    </main>
  );
}
