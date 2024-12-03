'use client';

import React, { createContext, useContext } from 'react';
import { useGenesysSDK } from '../hooks/useGenesysCloud';

const GenesysContext = createContext({});

export const useGenesys = () => useContext(GenesysContext);

export const GenesysProvider = ({ children }) => {
  const sdkState = useGenesysSDK();

  return (
    <GenesysContext.Provider value={sdkState}>
      {children}
    </GenesysContext.Provider>
  );
};
