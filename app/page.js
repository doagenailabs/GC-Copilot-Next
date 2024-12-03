'use client';

import { useGenesys } from '../components/GenesysProvider';
import AnalysisDisplay from '../components/AnalysisDisplay';
import { initializeWebSocket } from '../lib/websocket';
import { useEffect } from 'react';

export default function Home() {
  const { clientApp, userDetails, isLoading, error } = useGenesys();

  useEffect(() => {
    if (clientApp && userDetails && window.conversationId) {
      initializeWebSocket().catch(console.error);
    }
  }, [clientApp, userDetails]);

  if (isLoading) {
    return (
      <main className="min-h-screen font-['Open_Sans'] text-center pt-12 bg-gray-100">
        <div className="text-2xl text-gray-600">Initializing...</div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="min-h-screen font-['Open_Sans'] text-center pt-12 bg-gray-100">
        <div className="text-2xl text-red-600">
          Error: {error}
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen font-['Open_Sans'] text-center pt-12 bg-gray-100">
      <h1 className="text-4xl text-gray-800 mb-5 py-5 px-5 bg-white inline-block shadow-md rounded-lg">
        Conversation Analysis
      </h1>
      {userDetails && (
        <div className="mb-4">
          <p>Welcome, {userDetails.name}!</p>
        </div>
      )}
      <AnalysisDisplay />
    </main>
  );
}
