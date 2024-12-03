'use client';

import { GenesysProvider } from './GenesysProvider';

export function AppProvider({ children }) {
  return (
    <GenesysProvider>
      {children}
    </GenesysProvider>
  );
}
