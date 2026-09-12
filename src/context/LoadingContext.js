import React, { createContext, useContext, useState, useCallback } from 'react';
import { CircularProgress, Box } from '@mui/material';

const LoadingContext = createContext({
  isLoading: false,
  setLoading: (loading) => {},
});

export const LoadingProvider = ({ children }) => {
  const [isLoading, setIsLoading] = useState(false);

  const setLoading = useCallback((loading) => {
    setIsLoading(loading);
  }, []);

  return (
    <LoadingContext.Provider value={{ isLoading, setLoading }}>
      {children}
      {isLoading && (
        <Box
          sx={{
            position: 'fixed',
            top: 20,
            right: 20,
            zIndex: 9999,
          }}
        >
          <CircularProgress size={30} />
        </Box>
      )}
    </LoadingContext.Provider>
  );
};

export const useLoading = () => useContext(LoadingContext);
