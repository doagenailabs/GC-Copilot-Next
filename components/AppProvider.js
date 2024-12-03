'use client';

import dynamic from 'next/dynamic';
import { GenesysProvider } from './GenesysProvider';

// Dynamically import GenesysScripts with no SSR
const GenesysScripts = dynamic(
  () => import('./GenesysScripts'),
  { ssr: false }
);

export function AppProvider({ children }) {
  return (
    <>
      <GenesysScripts />
      <GenesysProvider>
        {children}
      </GenesysProvider>
    </>
  );
}
