'use client'

import { useEffect, useState } from 'react'
import { startGCSDKs } from '../lib/gcSDKs'
import { initializeWebSocket } from '../lib/websocket'
import AnalysisDisplay from '../components/AnalysisDisplay'

const LOG_PREFIX = 'GCCopilotNext - page.js -';
const log = (message, ...args) => console.log(`${LOG_PREFIX} ${message}`, ...args);
const error = (message, ...args) => console.error(`${LOG_PREFIX} ${message}`, ...args);
const debug = (message, ...args) => console.debug(`${LOG_PREFIX} ${message}`, ...args);

export default function Home() {
  const [initError, setInitError] = useState(null);
  const [isInitializing, setIsInitializing] = useState(true);

  useEffect(() => {
    async function start() {
      debug('Starting application initialization');
      
      try {
        // Validate environment variables
        if (!process.env.NEXT_PUBLIC_GC_OAUTH_CLIENT_ID) {
          throw new Error('OAuth Client ID not configured');
        }

        log('Initializing Genesys Cloud SDKs');
        await startGCSDKs(process.env.NEXT_PUBLIC_GC_OAUTH_CLIENT_ID);
        debug('SDKs initialized successfully');

        log('Initializing WebSocket connection');
        await initializeWebSocket();
        log('WebSocket initialized successfully');

        setIsInitializing(false);
        debug('Application initialization complete');
      } catch (err) {
        error('Initialization error:', err);
        setInitError(err.message);
        setIsInitializing(false);
      }
    }

    start();

    // Cleanup function
    return () => {
      debug('Component unmounting, cleaning up...');
      // Add any cleanup logic here if needed
    };
  }, []);

  if (isInitializing) {
    return (
      <main className="min-h-screen font-['Open_Sans'] text-center pt-12 bg-gray-100">
        <div className="text-2xl text-gray-600">
          Initializing...
        </div>
      </main>
    );
  }

  if (initError) {
    return (
      <main className="min-h-screen font-['Open_Sans'] text-center pt-12 bg-gray-100">
        <div className="text-2xl text-red-600">
          Error: {initError}
        </div>
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
  )
}
