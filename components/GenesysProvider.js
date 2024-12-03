'use client';

import React, { createContext, useContext } from 'react';
import { useGenesysCloud } from '../hooks/useGenesysCloud';
import { logger } from '../lib/logging';

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
  logger.debug(COMPONENT, 'Initializing GenesysProvider');
  const sdkState = useGenesysCloud();

  logger.debug(COMPONENT, 'Current SDK state:', {
    isLoading: sdkState.isLoading,
    hasError: !!sdkState.error,
    hasClientApp: !!sdkState.clientApp,
    hasPlatformClient: !!sdkState.platformClient,
    hasUserDetails: !!sdkState.userDetails
  });

  return (
    <GenesysContext.Provider value={sdkState}>
      {children}
    </GenesysContext.Provider>
  );
}
