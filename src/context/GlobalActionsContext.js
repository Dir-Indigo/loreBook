import React, { createContext, useContext, useState } from 'react';

const GlobalActionsContext = createContext();

export function GlobalActionsProvider({ children }) {
  const [eventModalOpen, setEventModalOpen] = useState(false);
  const [charModalOpen, setCharModalOpen] = useState(false);
  
  // Estos estados permitirán pasar parámetros a los modales si es necesario
  const [eventModalConfig, setEventModalConfig] = useState(null);
  const [charModalConfig, setCharModalConfig] = useState(null);

  const openCreateEvent = (config = null) => {
    setEventModalConfig(config);
    setEventModalOpen(true);
  };

  const closeCreateEvent = () => {
    setEventModalOpen(false);
    setEventModalConfig(null);
  };

  const openCreateChar = (config = null) => {
    setCharModalConfig(config);
    setCharModalOpen(true);
  };

  const closeCreateChar = () => {
    setCharModalOpen(false);
    setCharModalConfig(null);
  };

  return (
    <GlobalActionsContext.Provider value={{
      openCreateEvent,
      closeCreateEvent,
      eventModalOpen,
      eventModalConfig,
      openCreateChar,
      closeCreateChar,
      charModalOpen,
      charModalConfig
    }}>
      {children}
    </GlobalActionsContext.Provider>
  );
}

export const useGlobalActions = () => useContext(GlobalActionsContext);
