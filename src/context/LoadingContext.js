import React, { createContext, useContext, useState, useCallback, useRef } from 'react';
import { CircularProgress, Box } from '@mui/material';

const LoadingContext = createContext({
  isLoading: false,
  setLoading: (loading) => {},
  runLoading: async (task) => task(),
});

export const LoadingProvider = ({ children }) => {
  const [isLoading, setIsLoading] = useState(false);
  const pendingOperations = useRef(0);

  const setLoading = useCallback((loading) => {
    if (loading) {
      pendingOperations.current += 1;
    } else {
      pendingOperations.current = Math.max(0, pendingOperations.current - 1);
    }
    setIsLoading(pendingOperations.current > 0);
  }, []);

  const runLoading = useCallback(async (task) => {
    setLoading(true);
    try {
      return await task();
    } finally {
      setLoading(false);
    }
  }, [setLoading]);

  return (
    <LoadingContext.Provider value={{ isLoading, setLoading, runLoading }}>
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
