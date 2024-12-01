'use client'
import { useEffect } from 'react';
import { initializeWebSocket } from '@/lib/websocket';
import { startGCSDKs } from '@/lib/gcSdks';
import styles from './page.module.css';

export default function Home() {
  useEffect(() => {
    const start = async () => {
      try {
        const clientId = process.env.NEXT_PUBLIC_GC_OAUTH_CLIENT_ID;
        const platformClient = await startGCSDKs(clientId);
        window.platformClient = platformClient;
        await initializeWebSocket();
      } catch (error) {
        console.error('Error occurred:', error);
      }
    };

    start();
  }, []);

  return (
    <main className={styles.main}>
      <h1>Monitor alerts</h1>
    </main>
  );
}
