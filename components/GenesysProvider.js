'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { logger } from '../lib/logging';
import { useGenesysCloud } from '../hooks/useGenesysCloud';

const COMPONENT = 'GenesysProvider';
const GenesysContext = createContext({});

export const useGenesys = () => {
  const context = useContext(GenesysContext);
  if (context === undefined) {
    logger.error(COMPONENT, 'useGenesys must be used within a GenesysProvider');
    throw new Error('useGenesys must be used within a GenesysProvider');
  }
  return context;
};

export function GenesysProvider({ children }) {
  const sdkState = useGenesysCloud();

  useEffect(() => {
    if (!sdkState.clientApp || !sdkState.platformClient) {
      logger.warn(COMPONENT, 'Genesys SDKs are not fully initialized yet.');
    }
  }, [sdkState.clientApp, sdkState.platformClient]);

  return (
    <GenesysContext.Provider value={sdkState}>
      {children}
    </GenesysContext.Provider>
  );
}
