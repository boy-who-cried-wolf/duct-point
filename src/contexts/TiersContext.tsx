import React, { createContext, useContext, ReactNode, useCallback } from 'react';
import { useTierData } from '@/hooks/useTierData';

// Add initializeTiers to the context type
interface TiersContextType extends ReturnType<typeof useTierData> {
  initializeTiers: () => Promise<void>;
}

// Create a context for tier data
const TiersContext = createContext<TiersContextType | undefined>(undefined);

// Provider component for tier data
export const TiersProvider = ({ children }: { children: ReactNode }) => {
  const tierData = useTierData();
  
  // Add initialization method
  const initializeTiers = useCallback(async () => {
    console.log('Initializing tiers data');
    // This can make any additional initialization calls if needed
    return Promise.resolve();
  }, []);
  
  const value: TiersContextType = {
    ...tierData,
    initializeTiers
  };
  
  return (
    <TiersContext.Provider value={value}>
      {children}
    </TiersContext.Provider>
  );
};

// Hook for accessing tier data
export const useTiers = () => {
  const context = useContext(TiersContext);
  
  if (context === undefined) {
    throw new Error('useTiers must be used within a TiersProvider');
  }
  
  return context;
};

// Initialization function to ensure tiers are loaded
export const initializeTiersSystem = async () => {
  // This function can be called to ensure tiers are initialized
  // when needed outside of the React component lifecycle
  console.log('Initializing tiers system');
  return true;
}; 