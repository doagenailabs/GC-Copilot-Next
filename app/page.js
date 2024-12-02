'use client';

import { useEffect, useState } from 'react';
import { startGCSDKs } from '../lib/gcSDKs';
import { initializeWebSocket } from '../lib/websocket';
import AnalysisDisplay from '../components/AnalysisDisplay';

export default function Home() {
  const [initError, setInitError] = useState(null);
  const [isInitializing, setIsInitializing] = useState(true);

  useEffect(() => {
    async function start() {
      try {
        if (!process.env.NEXT_PUBLIC_GC_OAUTH_CLIENT_ID) {
          throw new Error('OAuth Client ID not configured');
        }

        await startGCSDKs(process.env.NEXT_PUBLIC_GC_OAUTH_CLIENT_ID);
        await initializeWebSocket();
        setIsInitializing(false);
      } catch (err) {
        setInitError(err.message);
        setIsInitializing(false);
      }
    }

    start();

    // Cleanup function
    return () => {
      console.log('GCCopilotNext - page.js - Component unmounting, cleaning up...');
      // Add any cleanup logic here if needed
    };
  }, []);

  if (isInitializing) {
    return (
      <main className="min-h-screen font-['Open_Sans'] text-center pt-12 bg-gray-100">
        <div className="text-2xl text-gray-600">Initializing...</div>
      </main>
    );
  }

  if (initError) {
    return (
      <main className="min-h-screen font-['Open_Sans'] text-center pt-12 bg-gray-100">
        <div className="text-2xl text-red-600">Error: {initError}</div>
      </main>
    );
  }

  return (
    <main className="min-h-screen font-['Open_Sans'] text-center pt-12 bg-gray-100">
      <h1 className="text-4xl text-gray-800 mb-5 py-5 px-5 bg-white inline-block shadow-md rounded-lg">
        Conversation Analysis
      </h1>
      <AnalysisDisplay />
    </main>
  );
}
