import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';

const GlobalActionsContext = createContext();

export function GlobalActionsProvider({ children }) {
  const [eventModalOpen, setEventModalOpen] = useState(false);
  const [charModalOpen, setCharModalOpen] = useState(false);
  
  // Estos estados permitirán pasar parámetros a los modales si es necesario
  const [eventModalConfig, setEventModalConfig] = useState(null);
  const [charModalConfig, setCharModalConfig] = useState(null);

  const openCreateEvent = useCallback((config = null) => {
    setEventModalConfig(config);
    setEventModalOpen(true);
  }, []);

  const closeCreateEvent = useCallback(() => {
    setEventModalOpen(false);
    setEventModalConfig(null);
  }, []);

  const openCreateChar = useCallback((config = null) => {
    setCharModalConfig(config);
    setCharModalOpen(true);
  }, []);

  const closeCreateChar = useCallback(() => {
    setCharModalOpen(false);
    setCharModalConfig(null);
  }, []);

  const value = useMemo(() => ({
      openCreateEvent,
      closeCreateEvent,
      eventModalOpen,
      eventModalConfig,
      openCreateChar,
      closeCreateChar,
      charModalOpen,
      charModalConfig,
  }), [
      openCreateEvent,
      closeCreateEvent,
      eventModalOpen,
      eventModalConfig,
      openCreateChar,
      closeCreateChar,
      charModalOpen,
      charModalConfig,
  ]);

  return (
    <GlobalActionsContext.Provider value={value}>
      {children}
    </GlobalActionsContext.Provider>
  );
}

export const useGlobalActions = () => useContext(GlobalActionsContext);
