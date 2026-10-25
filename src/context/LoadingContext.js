import React, { createContext, useContext, useState, useCallback, useEffect, useMemo, useRef } from 'react';
import { CircularProgress, Box } from '@mui/material';

// El estado (isLoading) y las acciones (setLoading/runLoading) viajan en contextos distintos:
// las acciones son estables, así que quien solo dispara cargas no se re-renderiza en cada petición.
const LoadingActionsContext = createContext({
  setLoading: () => {},
  runLoading: async (task) => task(),
});
const LoadingStateContext = createContext(false);

// Las peticiones más rápidas que este umbral no muestran indicador (evita parpadeos)
const INDICATOR_DELAY_MS = 300;

function LoadingIndicator() {
  const isLoading = useContext(LoadingStateContext);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!isLoading) {
      setVisible(false);
      return undefined;
    }
    const timer = setTimeout(() => setVisible(true), INDICATOR_DELAY_MS);
    return () => clearTimeout(timer);
  }, [isLoading]);

  if (!visible) return null;
  return (
    <Box
      role="status"
      aria-live="polite"
      sx={{ position: 'fixed', top: 20, right: 20, zIndex: 9999 }}
    >
      <CircularProgress size={30} aria-label="Cargando" />
    </Box>
  );
}

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

  const actions = useMemo(() => ({ setLoading, runLoading }), [setLoading, runLoading]);

  return (
    <LoadingActionsContext.Provider value={actions}>
      <LoadingStateContext.Provider value={isLoading}>
        {children}
        <LoadingIndicator />
      </LoadingStateContext.Provider>
    </LoadingActionsContext.Provider>
  );
};

/** Acciones de carga (estables). Para leer el estado usar useIsLoading(). */
export const useLoading = () => useContext(LoadingActionsContext);

export const useIsLoading = () => useContext(LoadingStateContext);
