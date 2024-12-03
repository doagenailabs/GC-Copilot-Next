'use client';

import React, { createContext, useContext } from 'react';
import { useGenesysCloud } from '../hooks/useGenesysCloud';

const GenesysContext = createContext({});

export const useGenesys = () => useContext(GenesysContext);

export function GenesysProvider({ children }) {
  const sdkState = useGenesysCloud();

  return (
    <GenesysContext.Provider value={sdkState}>
      {children}
    </GenesysContext.Provider>
  );
}
