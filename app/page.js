'use client';

import { useEffect, useState } from 'react';
import { useGenesysSDK } from '../hooks/useGenesysSDK';
import AnalysisDisplay from '../components/AnalysisDisplay';
import { startGCSDKs } from '../lib/gcSDKs';
import { initializeWebSocket } from '../lib/websocket';

export default function Home() {
  const [initError, setInitError] = useState(null);
  const [isInitializing, setIsInitializing] = useState(true);
  const { sdkReady, error: sdkError } = useGenesysSDK();

  useEffect(() => {
    if (!sdkReady) return;

    async function start() {
      try {
        if (!process.env.NEXT_PUBLIC_GC_OAUTH_CLIENT_ID) {
          throw new Error('OAuth Client ID not configured');
        }

        const platformClient = await startGCSDKs(process.env.NEXT_PUBLIC_GC_OAUTH_CLIENT_ID);
        const ws = await initializeWebSocket();
        setIsInitializing(false);
      } catch (err) {
        console.error('GCCopilotNext - page.js - Error during initialization:', err);
        setInitError(err.message);
        setIsInitializing(false);
      }
    }

    start();
  }, [sdkReady]);

  if (sdkError || initError) {
    return (
      <main className="min-h-screen font-['Open_Sans'] text-center pt-12 bg-gray-100">
        <div className="text-2xl text-red-600">
          Error: {sdkError || initError}
        </div>
      </main>
    );
  }

  if (!sdkReady || isInitializing) {
    return (
      <main className="min-h-screen font-['Open_Sans'] text-center pt-12 bg-gray-100">
        <div className="text-2xl text-gray-600">Initializing...</div>
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
