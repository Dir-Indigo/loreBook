import React, { createContext, useContext, useState, useCallback, useEffect, useMemo, useRef } from 'react';
import { ApiService } from '../utils/ApiService';
import { useStory } from './StoryContext';

const WorkspaceDataContext = createContext(null);
const WorkspaceActionsContext = createContext(null);

const EMPTY_WORKSPACE = {
  characters: [],
  relationships: [],
  characterFolders: [],
  characterTags: [],
  customArchetypes: [],
  events: [],
  allEvents: [],
  eventConnections: [],
  boards: [],
  activeBoardId: null,
};

const PRIMARY_BOARD_DEFAULTS = {
  name: 'Línea principal',
  parent_board_id: null,
  position: 0,
  color: '#8c6d53',
};

const createPrimaryBoard = (storyId, setLoading) => (
  ApiService.boards.create({ story_id: storyId, ...PRIMARY_BOARD_DEFAULTS }, setLoading)
);

const getNextOrderIndex = (events) => (
  events.length > 0 ? Math.max(...events.map((event) => Number(event.order_index) || 0)) + 1 : 1
);

const getEventCharacterIds = (event) => (
  (event.event_characters || [])
    .map((eventCharacter) => eventCharacter.character?.id || eventCharacter.character_id)
    .filter(Boolean)
);

const buildDuplicateEventData = (original, storyId, orderIndex, offsetX, offsetY) => ({
  story_id: storyId,
  title: `${original.title} (Copia)`,
  summary: original.summary || '',
  details: original.details || '',
  color_tag: original.color_tag || '#8d7b68',
  importance_level: original.importance_level || 'medium',
  order_index: orderIndex,
  pos_x: (Number(original.pos_x) || 120) + offsetX,
  pos_y: (Number(original.pos_y) || 100) + offsetY,
});

// Agrega a la lista global los eventos del tablero que todavía no están en ella
const appendMissingEvents = (current, boardEvents) => current.concat(
  (boardEvents || []).filter((event) => !current.some((item) => item.id === event.id))
);

export const WorkspaceProvider = ({ children }) => {
  const { activeStoryId } = useStory();
  const loadedStoryIdRef = useRef(null);
  const isFetchingStoryIdRef = useRef(null);
  const [dataLoading, setDataLoading] = useState(false);
  // Última historia cuya carga terminó (con o sin error); permite saber si los datos ya corresponden a activeStoryId
  const [settledStoryId, setSettledStoryId] = useState(null);

  const [characters, setCharacters] = useState(EMPTY_WORKSPACE.characters);
  const [relationships, setRelationships] = useState(EMPTY_WORKSPACE.relationships);
  const [characterFolders, setCharacterFolders] = useState(EMPTY_WORKSPACE.characterFolders);
  const [characterTags, setCharacterTags] = useState(EMPTY_WORKSPACE.characterTags);
  const [customArchetypes, setCustomArchetypes] = useState(EMPTY_WORKSPACE.customArchetypes);
  const [events, setEvents] = useState(EMPTY_WORKSPACE.events);
  const [allEvents, setAllEvents] = useState(EMPTY_WORKSPACE.allEvents);
  const [eventConnections, setEventConnections] = useState(EMPTY_WORKSPACE.eventConnections);
  const [boards, setBoards] = useState(EMPTY_WORKSPACE.boards);
  const [activeBoardId, setActiveBoardId] = useState(EMPTY_WORKSPACE.activeBoardId);

  // Último estado visible para las acciones: así mantienen identidad estable sin quedar con datos viejos
  const latestRef = useRef({});
  latestRef.current = { activeStoryId, boards, events, activeBoardId, eventConnections, characters };

  const resetWorkspace = useCallback(() => {
    setCharacters(EMPTY_WORKSPACE.characters);
    setRelationships(EMPTY_WORKSPACE.relationships);
    setCharacterFolders(EMPTY_WORKSPACE.characterFolders);
    setCharacterTags(EMPTY_WORKSPACE.characterTags);
    setCustomArchetypes(EMPTY_WORKSPACE.customArchetypes);
    setEvents(EMPTY_WORKSPACE.events);
    setAllEvents(EMPTY_WORKSPACE.allEvents);
    setEventConnections(EMPTY_WORKSPACE.eventConnections);
    setBoards(EMPTY_WORKSPACE.boards);
    setActiveBoardId(EMPTY_WORKSPACE.activeBoardId);
  }, []);

  const loadStoryData = useCallback(async ({ storyId, boardId = null, setLoading, setDataLoading }) => {
    if (!storyId) {
      resetWorkspace();
      if (setDataLoading) setDataLoading(false);
      return { data: null, error: null };
    }

    if (setDataLoading) setDataLoading(true);

    try {
      const [charsRes, relsRes, boardsRes, treeEventsRes, connsRes, foldersRes, tagsRes, archetypesRes] = await Promise.all([
        ApiService.characters.getAll(storyId, setLoading),
        ApiService.relationships.getAll(storyId, setLoading),
        ApiService.boards.getAll(storyId, setLoading),
        ApiService.events.getTree(storyId, setLoading),
        ApiService.events.getConnections(storyId, setLoading),
        ApiService.characterFolders.getAll(storyId, setLoading).catch(() => ({ data: [] })),
        ApiService.characterTags.getAll(storyId, setLoading).catch(() => ({ data: [] })),
        ApiService.characterArchetypes.getAll(storyId, setLoading).catch(() => ({ data: [] })),
      ]);

      const existingBoards = boardsRes.data || [];
      const loadedEvents = treeEventsRes.data || [];
      let targetBoardId = boardId || existingBoards.find((b) => !b.parent_board_id)?.id || null;

      if (!targetBoardId) {
        const { data: createdBoard, error } = await createPrimaryBoard(storyId, setLoading);

        if (!error && createdBoard) {
          existingBoards.push(createdBoard);
          targetBoardId = createdBoard.id;
        }
      }

      setCharacters(charsRes.data || []);
      setRelationships(relsRes.data || []);
      setCharacterFolders(foldersRes?.data || []);
      setCharacterTags(tagsRes?.data || []);
      setCustomArchetypes(archetypesRes?.data || []);
      setBoards(existingBoards);
      setAllEvents(loadedEvents);
      setEventConnections(connsRes.data || []);
      setActiveBoardId(targetBoardId);

      const { data: activeEvents } = await ApiService.events.getAll(storyId, targetBoardId, setLoading);
      setEvents(activeEvents || []);

      loadedStoryIdRef.current = storyId;
      return { data: { boards: existingBoards, activeBoardId: targetBoardId, events: activeEvents || [] }, error: null };
    } catch (error) {
      console.error('Failed to load story data:', error);
      return { data: null, error };
    } finally {
      setSettledStoryId(storyId);
      if (setDataLoading) setDataLoading(false);
    }
  }, [resetWorkspace]);

  // Auto-sync story data whenever activeStoryId changes or on initial mount (with caching)
  useEffect(() => {
    if (!activeStoryId) {
      if (loadedStoryIdRef.current) {
        resetWorkspace();
        loadedStoryIdRef.current = null;
      }
      return;
    }

    // Skip if already loaded for this story or currently loading
    if (loadedStoryIdRef.current === activeStoryId || isFetchingStoryIdRef.current === activeStoryId) {
      return;
    }

    isFetchingStoryIdRef.current = activeStoryId;
    loadStoryData({ storyId: activeStoryId, setDataLoading }).then((res) => {
      if (!res?.error) {
        loadedStoryIdRef.current = activeStoryId;
      }
    }).finally(() => {
      isFetchingStoryIdRef.current = null;
    });
  }, [activeStoryId, loadStoryData, resetWorkspace]);

  const reloadStoryData = useCallback(async ({ force = true, setLoading } = {}) => {
    const { activeStoryId } = latestRef.current;
    if (!activeStoryId) return { data: null, error: null };
    if (force) {
      loadedStoryIdRef.current = null;
    }
    return loadStoryData({ storyId: activeStoryId, setLoading, setDataLoading });
  }, [loadStoryData]);

  const ensurePrimaryBoard = useCallback(async ({ storyId, setLoading }) => {
    if (!storyId) return null;

    const primaryBoard = latestRef.current.boards.find((board) => !board.parent_board_id) || null;
    if (primaryBoard) {
      setActiveBoardId(primaryBoard.id);
      return primaryBoard.id;
    }

    const { data, error } = await createPrimaryBoard(storyId, setLoading);

    if (error || !data) return null;

    setBoards((prev) => [...prev, data]);
    setActiveBoardId(data.id);
    return data.id;
  }, []);

  const selectBoard = useCallback(async ({ storyId, boardId, setLoading, reloadConnections = true }) => {
    if (!storyId || !boardId) return { data: [], error: null };

    setActiveBoardId(boardId);

    const [{ data: eventsData }, { data: connsData }] = await Promise.all([
      ApiService.events.getAll(storyId, boardId, setLoading),
      reloadConnections ? ApiService.events.getConnections(storyId, setLoading) : Promise.resolve({ data: latestRef.current.eventConnections }),
    ]);

    setEvents(eventsData || []);
    if (reloadConnections) {
      setEventConnections(connsData || []);
    }

    return { data: eventsData || [], error: null };
  }, []);

  const createBoard = useCallback(async ({ storyId, name, parentBoardId = null, position, color = '#8c6d53', setLoading }) => {
    if (!storyId || !name) return { data: null, error: new Error('Story ID and name are required') };

    const { data, error } = await ApiService.boards.create({
      story_id: storyId,
      name,
      parent_board_id: parentBoardId,
      position,
      color,
    }, setLoading);

    if (error || !data) return { data: null, error };

    setBoards((prev) => [...prev, data]);
    setActiveBoardId(data.id);

    const { data: eventsData } = await ApiService.events.getAll(storyId, data.id, setLoading);
    setEvents(eventsData || []);

    return { data, error: null };
  }, []);

  const updateBoard = useCallback(async ({ boardId, patch, setLoading }) => {
    if (!boardId) return { data: null, error: new Error('Board ID is required') };

    const { data, error } = await ApiService.boards.update(boardId, patch, setLoading);
    if (error || !data) return { data: null, error };

    setBoards((prev) => prev.map((board) => (board.id === boardId ? data : board)));
    return { data, error: null };
  }, []);

  const refreshBoardEvents = useCallback(async ({ storyId, boardId, setLoading }) => {
    if (!storyId || !boardId) {
      setEvents([]);
      return { data: [], error: null };
    }

    const { data: boardEvents, error } = await ApiService.events.getAll(storyId, boardId, setLoading);
    if (error) {
      return { data: [], error };
    }

    setEvents(boardEvents || []);
    return { data: boardEvents || [], error: null };
  }, []);

  const deleteBoard = useCallback(async ({ storyId, boardId, setLoading }) => {
    if (!storyId || !boardId) return { data: null, error: new Error('Story ID and board ID are required') };

    const { data, error } = await ApiService.boards.delete(boardId, setLoading);
    if (error) return { data: null, error };

    const { boards, activeBoardId } = latestRef.current;
    const remainingBoards = boards.filter((board) => board.id !== boardId);
    setBoards(remainingBoards);
    setAllEvents((current) => current.filter((event) => event.board_id !== boardId));

    if (activeBoardId !== boardId) return { data, error: null };

    const fallbackBoard = remainingBoards.find((board) => !board.parent_board_id);
    const fallbackId = fallbackBoard?.id || await ensurePrimaryBoard({ storyId, setLoading });

    if (fallbackId) {
      setActiveBoardId(fallbackId);
      await refreshBoardEvents({ storyId, boardId: fallbackId, setLoading });
    } else {
      setActiveBoardId(null);
      setEvents([]);
    }

    return { data, error: null };
  }, [ensurePrimaryBoard, refreshBoardEvents]);

  const createConnection = useCallback(async ({ storyId, sourceEventId, targetEventId, setLoading }) => {
    if (!storyId) return { data: null, error: new Error('Story ID is required') };

    const temporaryId = `temp-${Date.now()}`;
    const optimisticConnection = {
      id: temporaryId,
      story_id: storyId,
      source_event_id: sourceEventId,
      target_event_id: targetEventId,
    };
    setEventConnections((current) => [...current, optimisticConnection]);

    const result = await ApiService.events.createConnection(storyId, sourceEventId, targetEventId, setLoading);
    if (result.error || !result.data) {
      setEventConnections((current) => current.filter((connection) => connection.id !== temporaryId));
      return result;
    }

    setEventConnections((current) => current.map((connection) => (
      connection.id === temporaryId ? result.data : connection
    )));
    return result;
  }, []);

  const deleteConnection = useCallback(async ({ storyId, sourceEventId, targetEventId, setLoading }) => {
    if (!storyId) return { data: null, error: new Error('Story ID is required') };

    setEventConnections((current) => current.filter((connection) => (
      connection.source_event_id !== sourceEventId || connection.target_event_id !== targetEventId
    )));
    return ApiService.events.deleteConnection({ storyId, source: sourceEventId, target: targetEventId }, setLoading);
  }, []);

  const saveEvent = useCallback(async ({ storyId, eventData, characterIds, createBackup, backupNote, selectedEventId, setLoading }) => {
    if (!storyId) return { data: null, error: new Error('Story ID is required') };

    let resolvedBoardId = latestRef.current.activeBoardId;
    if (!resolvedBoardId) {
      resolvedBoardId = await ensurePrimaryBoard({ storyId, setLoading });
    }
    if (!resolvedBoardId) return { data: null, error: new Error('A primary board is required') };

    const result = selectedEventId
      ? await ApiService.events.update(selectedEventId, eventData, characterIds, createBackup, backupNote, setLoading)
      : await ApiService.events.create({ ...eventData, story_id: storyId }, characterIds, resolvedBoardId, setLoading);

    if (result.error) return result;

    setActiveBoardId(resolvedBoardId);
    const { data: boardEvents } = await refreshBoardEvents({ storyId, boardId: resolvedBoardId, setLoading });
    setAllEvents((current) => selectedEventId
      ? current.map((event) => event.id === selectedEventId ? { ...event, ...eventData } : event)
      : appendMissingEvents(current, boardEvents));

    return result;
  }, [ensurePrimaryBoard, refreshBoardEvents]);

  const deleteEvent = useCallback(async ({ storyId, boardId, eventId, setLoading = null }) => {
    if (!storyId || !eventId) return { data: null, error: new Error('Story ID and event ID are required') };

    // 1. Optimistic removal: remove immediately from active board events, allEvents, and connections
    setEvents((current) => current.filter((event) => event.id !== eventId));
    setAllEvents((current) => current.filter((event) => event.id !== eventId));
    setEventConnections((current) => current.filter((conn) => conn.source_event_id !== eventId && conn.target_event_id !== eventId));

    // 2. Perform API delete in the background
    const result = await ApiService.events.delete(eventId, setLoading);
    if (result.error) {
      // Revert if delete failed
      if (storyId && boardId) {
        await refreshBoardEvents({ storyId, boardId, setLoading });
      }
      return result;
    }

    return result;
  }, [refreshBoardEvents]);

  const duplicateEvent = useCallback(async ({ storyId, boardId, originalEvent, offset = { x: 50, y: 40 }, setLoading }) => {
    if (!storyId || !boardId || !originalEvent) return { data: null, error: null, ids: [] };

    const eventData = buildDuplicateEventData(
      originalEvent,
      storyId,
      getNextOrderIndex(latestRef.current.events),
      offset.x,
      offset.y,
    );
    const characterIds = getEventCharacterIds(originalEvent);
    const result = await ApiService.events.create(eventData, characterIds, boardId, setLoading);
    if (result.error || !result.data) return { ...result, ids: [] };

    const { data: boardEvents } = await refreshBoardEvents({ storyId, boardId, setLoading });
    setAllEvents((current) => appendMissingEvents(current, boardEvents));
    return { ...result, ids: [result.data.id] };
  }, [refreshBoardEvents]);

  const duplicateEvents = useCallback(async ({ storyId, boardId, originalEvents, setLoading }) => {
    if (!storyId || !boardId || !originalEvents?.length) return [];

    let nextOrderIndex = getNextOrderIndex(latestRef.current.events);
    const createdIds = [];

    for (const [index, originalEvent] of originalEvents.entries()) {
      const { data, error } = await ApiService.events.create(
        buildDuplicateEventData(originalEvent, storyId, nextOrderIndex, 50 + (index * 20), 40 + (index * 20)),
        getEventCharacterIds(originalEvent),
        boardId,
        setLoading,
      );

      if (!error && data?.id) {
        createdIds.push(data.id);
        nextOrderIndex += 1;
      }
    }

    const { data: boardEvents } = await refreshBoardEvents({ storyId, boardId, setLoading });
    setAllEvents((current) => (boardEvents || []).reduce((updatedEvents, event) => (
      updatedEvents.some((item) => item.id === event.id)
        ? updatedEvents.map((item) => item.id === event.id ? event : item)
        : [...updatedEvents, event]
    ), current));
    return createdIds;
  }, [refreshBoardEvents]);

  const getEventDetails = useCallback(async ({ eventId, setLoading }) => (
    ApiService.events.getById(eventId, setLoading)
  ), []);

  const saveEventPosition = useCallback(async ({ eventId, position, setLoading }) => (
    ApiService.events.savePosition(eventId, position, setLoading)
  ), []);

  const createEventBackup = useCallback(async ({ storyId, eventId, note, setLoading }) => {
    // Creating a backup snapshot doesn't change any visible list state — no reload needed.
    return ApiService.events.createBackup(eventId, note, setLoading);
  }, []);

  const getEventVersions = useCallback(async ({ eventId, setLoading }) => (
    ApiService.events.getVersions(eventId, setLoading)
  ), []);

  const restoreEventVersion = useCallback(async ({ storyId, versionId, setLoading }) => {
    const result = await ApiService.events.restoreVersion(versionId, setLoading);
    // Only refresh the events of the active board — not the entire workspace
    const { activeBoardId } = latestRef.current;
    if (!result.error && storyId && activeBoardId) {
      await refreshBoardEvents({ storyId, boardId: activeBoardId, setLoading });
    }
    return result;
  }, [refreshBoardEvents]);

  const saveCharacter = useCallback(async ({ storyId, charData, selectedCharacterId = null, isCloneMode = false, cloneOptions = null, setLoading }) => {
    if (!storyId) return { data: null, error: new Error('Story ID is required') };

    const result = selectedCharacterId && !isCloneMode
      ? await ApiService.characters.update(selectedCharacterId, charData, setLoading)
      : isCloneMode && cloneOptions
        ? await ApiService.characters.clone(selectedCharacterId, { ...cloneOptions, targetStoryId: storyId }, setLoading)
        : await ApiService.characters.create({ ...charData, story_id: storyId }, setLoading);

    if (!result?.error && result?.data) {
      const saved = result.data;
      if (selectedCharacterId && !isCloneMode) {
        // Update: patch the existing character in place
        setCharacters((prev) => prev.map((c) => c.id === selectedCharacterId ? { ...c, ...saved } : c));
      } else {
        // Create or clone: append the new character
        setCharacters((prev) => [...prev, saved]);
      }
    }

    return result;
  }, []);

  const deleteCharacter = useCallback(async ({ storyId, charId, setLoading }) => {
    if (!storyId || !charId) return { data: null, error: new Error('Story ID and character ID are required') };

    // Optimistic removal before the request
    setCharacters((prev) => prev.filter((c) => c.id !== charId));
    // Also remove any relationships that referenced this character
    setRelationships((prev) => prev.filter(
      (r) => r.source_character_id !== charId && r.target_character_id !== charId
    ));

    const result = await ApiService.characters.delete(charId, setLoading);
    if (result?.error) {
      // Rollback on failure — reload the full data to restore consistency
      await ApiService.characters.getAll(storyId, setLoading)
        .then(({ data }) => { if (data) setCharacters(data); });
    }
    return result;
  }, []);

  const updateCharactersGlobal = useCallback(async ({ storyId, characterIds, isGlobal, setLoading }) => {
    if (!storyId || !characterIds?.length) return { error: null, changed: false };

    const previousCharacters = latestRef.current.characters;
    const selectedIds = [...characterIds];
    setCharacters((current) => current.map((character) => (
      selectedIds.includes(character.id) ? { ...character, is_global: isGlobal } : character
    )));

    const results = await Promise.all(selectedIds.map((characterId) =>
      ApiService.characters.update(characterId, { is_global: isGlobal }, setLoading)
    ));

    if (results.some((result) => result.error)) {
      setCharacters(previousCharacters);
      return { error: new Error('No se pudo actualizar uno o más personajes.'), changed: false };
    }

    return { error: null, changed: true };
  }, []);

  const createRelationship = useCallback(async ({ storyId, relData, setLoading }) => {
    if (!storyId) return { data: null, error: new Error('Story ID is required') };

    const result = await ApiService.relationships.create({ ...relData, story_id: storyId }, setLoading);
    if (!result?.error && result?.data) {
      // Append the fully-joined relationship returned by the API
      setRelationships((prev) => [...prev, result.data]);
    }
    return result;
  }, []);

  const deleteRelationship = useCallback(async ({ storyId, relId, setLoading }) => {
    if (!storyId || !relId) return { data: null, error: new Error('Story ID and relationship ID are required') };

    // Optimistic removal
    setRelationships((prev) => prev.filter((r) => r.id !== relId));

    const result = await ApiService.relationships.delete(relId, setLoading);
    if (result?.error) {
      // Rollback: reload only relationships
      await ApiService.relationships.getAll(storyId, setLoading)
        .then(({ data }) => { if (data) setRelationships(data); });
    }
    return result;
  }, []);

  const copyCharactersAsLocal = useCallback(async ({ storyId, characterIds, setLoading }) => {
    if (!storyId || !characterIds?.length) return { data: [], error: new Error('Story ID and character IDs required') };

    const result = await ApiService.characters.copyAsLocal(characterIds, storyId, setLoading);
    if (!result?.error && result?.data?.length) {
      setCharacters((prev) => [...prev, ...result.data]);
    }
    return result;
  }, []);

  // Datos (cambian con el estado) y acciones (identidad estable) en contextos separados
  const dataValue = useMemo(() => ({
    characters,
    relationships,
    characterFolders,
    characterTags,
    customArchetypes,
    events,
    allEvents,
    eventConnections,
    boards,
    activeBoardId,
    dataLoading,
    settledStoryId,
  }), [
    characters,
    relationships,
    characterFolders,
    characterTags,
    customArchetypes,
    events,
    allEvents,
    eventConnections,
    boards,
    activeBoardId,
    dataLoading,
    settledStoryId,
  ]);

  const actionsValue = useMemo(() => ({
    setCharacters,
    setRelationships,
    setCharacterFolders,
    setCharacterTags,
    setCustomArchetypes,
    setEvents,
    setAllEvents,
    setEventConnections,
    setBoards,
    setActiveBoardId,
    setDataLoading,
    resetWorkspace,
    loadStoryData,
    reloadStoryData,
    ensurePrimaryBoard,
    selectBoard,
    createBoard,
    updateBoard,
    deleteBoard,
    refreshBoardEvents,
    createConnection,
    deleteConnection,
    saveEvent,
    deleteEvent,
    duplicateEvent,
    duplicateEvents,
    getEventDetails,
    saveEventPosition,
    createEventBackup,
    getEventVersions,
    restoreEventVersion,
    saveCharacter,
    deleteCharacter,
    updateCharactersGlobal,
    copyCharactersAsLocal,
    createRelationship,
    deleteRelationship,
  }), [
    setCharacters,
    setRelationships,
    setCharacterFolders,
    setCharacterTags,
    setCustomArchetypes,
    setEvents,
    setAllEvents,
    setEventConnections,
    setBoards,
    setActiveBoardId,
    setDataLoading,
    resetWorkspace,
    loadStoryData,
    reloadStoryData,
    ensurePrimaryBoard,
    selectBoard,
    createBoard,
    updateBoard,
    deleteBoard,
    refreshBoardEvents,
    createConnection,
    deleteConnection,
    saveEvent,
    deleteEvent,
    duplicateEvent,
    duplicateEvents,
    getEventDetails,
    saveEventPosition,
    createEventBackup,
    getEventVersions,
    restoreEventVersion,
    saveCharacter,
    deleteCharacter,
    updateCharactersGlobal,
    copyCharactersAsLocal,
    createRelationship,
    deleteRelationship,
  ]);

  return (
    <WorkspaceActionsContext.Provider value={actionsValue}>
      <WorkspaceDataContext.Provider value={dataValue}>
        {children}
      </WorkspaceDataContext.Provider>
    </WorkspaceActionsContext.Provider>
  );
};

/** Solo las acciones: no provoca re-renders cuando cambian los datos. */
export const useWorkspaceActions = () => {
  const actions = useContext(WorkspaceActionsContext);
  if (!actions) {
    throw new Error('useWorkspaceActions must be used inside WorkspaceProvider');
  }
  return actions;
};

/** Solo los datos. */
export const useWorkspaceData = () => {
  const data = useContext(WorkspaceDataContext);
  if (!data) {
    throw new Error('useWorkspaceData must be used inside WorkspaceProvider');
  }
  return data;
};

/** Datos + acciones (API original). Usa useWorkspaceActions / useWorkspaceData si solo necesitas una parte. */
export const useWorkspace = () => {
  const data = useWorkspaceData();
  const actions = useWorkspaceActions();
  return useMemo(() => ({ ...data, ...actions }), [data, actions]);
};
