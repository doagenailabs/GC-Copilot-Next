'use client'

import { useEffect } from 'react'
import { startGCSDKs } from '../lib/gcSDKs'
import { initializeWebSocket } from '../lib/websocket'
import AnalysisDisplay from '../components/AnalysisDisplay'

export default function Home() {
  useEffect(() => {
    async function start() {
      try {
        console.log("page.js - start");
        const platformClient = await startGCSDKs(process.env.NEXT_PUBLIC_GC_OAUTH_CLIENT_ID);
        window.platformClient = platformClient;
        console.log("page.js - SDK started");
        await initializeWebSocket();                    
      } catch (error) {
        console.error('Error occurred:', error);
      }
    }

    start();
  }, []);

  return (
    <main className="min-h-screen font-['Open_Sans'] text-center pt-12 bg-gray-100">
      <h1 className="text-4xl text-gray-800 mb-5 py-5 px-5 bg-white inline-block shadow-md rounded-lg">
        Conversation Analysis
      </h1>
      <AnalysisDisplay />
    </main>
  )
}
