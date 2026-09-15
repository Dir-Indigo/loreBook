import React, { createContext, useContext, useState, useCallback } from 'react';

const WorkspaceContext = createContext(null);

const EMPTY_WORKSPACE = {
  characters: [],
  relationships: [],
  events: [],
  allEvents: [],
  eventConnections: [],
  boards: [],
  activeBoardId: null,
};

export const WorkspaceProvider = ({ children }) => {
  const [characters, setCharacters] = useState(EMPTY_WORKSPACE.characters);
  const [relationships, setRelationships] = useState(EMPTY_WORKSPACE.relationships);
  const [events, setEvents] = useState(EMPTY_WORKSPACE.events);
  const [allEvents, setAllEvents] = useState(EMPTY_WORKSPACE.allEvents);
  const [eventConnections, setEventConnections] = useState(EMPTY_WORKSPACE.eventConnections);
  const [boards, setBoards] = useState(EMPTY_WORKSPACE.boards);
  const [activeBoardId, setActiveBoardId] = useState(EMPTY_WORKSPACE.activeBoardId);

  const resetWorkspace = useCallback(() => {
    setCharacters([]);
    setRelationships([]);
    setEvents([]);
    setAllEvents([]);
    setEventConnections([]);
    setBoards([]);
    setActiveBoardId(null);
  }, []);

  return (
    <WorkspaceContext.Provider value={{
      characters,
      setCharacters,
      relationships,
      setRelationships,
      events,
      setEvents,
      allEvents,
      setAllEvents,
      eventConnections,
      setEventConnections,
      boards,
      setBoards,
      activeBoardId,
      setActiveBoardId,
      resetWorkspace,
    }}>
      {children}
    </WorkspaceContext.Provider>
  );
};

export const useWorkspace = () => {
  const workspace = useContext(WorkspaceContext);
  if (!workspace) {
    throw new Error('useWorkspace must be used inside WorkspaceProvider');
  }
  return workspace;
};
