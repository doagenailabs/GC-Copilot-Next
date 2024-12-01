'use client'

import { useEffect } from 'react'
import { startGCSDKs } from '@/lib/gcSDKs'
import { initializeWebSocket } from '@/lib/websocket'

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
    <main>
      <h1>Monitor alerts</h1>
    </main>
  )
}
