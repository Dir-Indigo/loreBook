import React, { createContext, useContext, useState, useCallback } from 'react';
import { boardController } from '../controllers/boardController';
import { eventController } from '../controllers/eventController';
import { characterController } from '../controllers/characterController';
import { relationshipController } from '../controllers/relationshipController';

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

  const loadStoryData = useCallback(async ({ storyId, boardId = null, setLoading, setDataLoading }) => {
    if (!storyId) {
      resetWorkspace();
      if (setDataLoading) setDataLoading(false);
      return { data: null, error: null };
    }

    if (setDataLoading) setDataLoading(true);

    try {
      const [charsRes, relsRes, boardsRes, treeEventsRes, connsRes] = await Promise.all([
        characterController.getAll(storyId, setLoading),
        relationshipController.getAll(storyId, setLoading),
        boardController.getAll(storyId, setLoading),
        eventController.getTree(storyId, setLoading),
        eventController.getConnections(storyId, setLoading),
      ]);

      const existingBoards = boardsRes.data || [];
      const loadedEvents = treeEventsRes.data || [];
      let targetBoardId = boardId || existingBoards.find((b) => !b.parent_board_id)?.id || null;

      if (!targetBoardId) {
        const { data: createdBoard, error } = await boardController.create({
          story_id: storyId,
          name: 'Línea principal',
          parent_board_id: null,
          position: 0,
          color: '#8c6d53',
        }, setLoading);

        if (!error && createdBoard) {
          existingBoards.push(createdBoard);
          targetBoardId = createdBoard.id;
        }
      }

      setCharacters(charsRes.data || []);
      setRelationships(relsRes.data || []);
      setBoards(existingBoards);
      setAllEvents(loadedEvents);
      setEventConnections(connsRes.data || []);
      setActiveBoardId(targetBoardId);

      const { data: activeEvents } = await eventController.getAll(storyId, targetBoardId, setLoading);
      setEvents(activeEvents || []);

      return { data: { boards: existingBoards, activeBoardId: targetBoardId, events: activeEvents || [] }, error: null };
    } catch (error) {
      console.error('Failed to load story data:', error);
      return { data: null, error };
    } finally {
      if (setDataLoading) setDataLoading(false);
    }
  }, [resetWorkspace]);

  const ensurePrimaryBoard = useCallback(async ({ storyId, setLoading }) => {
    if (!storyId) return null;

    const currentBoards = boards.length ? boards : [];
    const primaryBoard = currentBoards.find((board) => !board.parent_board_id) || null;
    if (primaryBoard) {
      setActiveBoardId(primaryBoard.id);
      return primaryBoard.id;
    }

    const { data, error } = await boardController.create({
      story_id: storyId,
      name: 'Línea principal',
      parent_board_id: null,
      position: 0,
      color: '#8c6d53',
    }, setLoading);

    if (error || !data) return null;

    setBoards((prev) => [...prev, data]);
    setActiveBoardId(data.id);
    return data.id;
  }, [boards]);

  const selectBoard = useCallback(async ({ storyId, boardId, setLoading, reloadConnections = true }) => {
    if (!storyId || !boardId) return { data: [], error: null };

    setActiveBoardId(boardId);

    const [{ data: eventsData }, { data: connsData }] = await Promise.all([
      eventController.getAll(storyId, boardId, setLoading),
      reloadConnections ? eventController.getConnections(storyId, setLoading) : Promise.resolve({ data: eventConnections }),
    ]);

    setEvents(eventsData || []);
    if (reloadConnections) {
      setEventConnections(connsData || []);
    }

    return { data: eventsData || [], error: null };
  }, [eventConnections]);

  const createBoard = useCallback(async ({ storyId, name, parentBoardId = null, position, color = '#8c6d53', setLoading }) => {
    if (!storyId || !name) return { data: null, error: new Error('Story ID and name are required') };

    const { data, error } = await boardController.create({
      story_id: storyId,
      name,
      parent_board_id: parentBoardId,
      position,
      color,
    }, setLoading);

    if (error || !data) return { data: null, error };

    setBoards((prev) => [...prev, data]);
    setActiveBoardId(data.id);

    const { data: eventsData } = await eventController.getAll(storyId, data.id, setLoading);
    setEvents(eventsData || []);

    return { data, error: null };
  }, []);

  const updateBoard = useCallback(async ({ boardId, patch, setLoading }) => {
    if (!boardId) return { data: null, error: new Error('Board ID is required') };

    const { data, error } = await boardController.update(boardId, patch, setLoading);
    if (error || !data) return { data: null, error };

    setBoards((prev) => prev.map((board) => (board.id === boardId ? data : board)));
    return { data, error: null };
  }, []);

  const refreshBoardEvents = useCallback(async ({ storyId, boardId, setLoading }) => {
    if (!storyId || !boardId) {
      setEvents([]);
      return { data: [], error: null };
    }

    const { data: boardEvents, error } = await eventController.getAll(storyId, boardId, setLoading);
    if (error) {
      return { data: [], error };
    }

    setEvents(boardEvents || []);
    return { data: boardEvents || [], error: null };
  }, []);

  const deleteBoard = useCallback(async ({ storyId, boardId, setLoading }) => {
    if (!storyId || !boardId) return { data: null, error: new Error('Story ID and board ID are required') };

    const { data, error } = await boardController.delete(boardId, setLoading);
    if (error) return { data: null, error };

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
  }, [activeBoardId, boards, ensurePrimaryBoard, refreshBoardEvents]);

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

    const result = await eventController.createConnection(storyId, sourceEventId, targetEventId, setLoading);
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
    return eventController.deleteConnectionByNodes(storyId, sourceEventId, targetEventId, setLoading);
  }, []);

  const saveEvent = useCallback(async ({ storyId, eventData, characterIds, createBackup, backupNote, selectedEventId, setLoading }) => {
    if (!storyId) return { data: null, error: new Error('Story ID is required') };

    let resolvedBoardId = activeBoardId;
    if (!resolvedBoardId) {
      resolvedBoardId = await ensurePrimaryBoard({ storyId, setLoading });
    }
    if (!resolvedBoardId) return { data: null, error: new Error('A primary board is required') };

    const result = selectedEventId
      ? await eventController.update(selectedEventId, eventData, characterIds, createBackup, backupNote, setLoading)
      : await eventController.create({ ...eventData, story_id: storyId }, characterIds, resolvedBoardId, setLoading);

    if (result.error) return result;

    setActiveBoardId(resolvedBoardId);
    const { data: boardEvents } = await refreshBoardEvents({ storyId, boardId: resolvedBoardId, setLoading });
    setAllEvents((current) => selectedEventId
      ? current.map((event) => event.id === selectedEventId ? { ...event, ...eventData } : event)
      : [...current, ...(boardEvents || []).filter((event) => !current.some((item) => item.id === event.id))]);

    return result;
  }, [activeBoardId, ensurePrimaryBoard, refreshBoardEvents]);

  const deleteEvent = useCallback(async ({ storyId, boardId, eventId, setLoading }) => {
    if (!storyId || !eventId) return { data: null, error: new Error('Story ID and event ID are required') };

    const result = await eventController.delete(eventId, setLoading);
    if (result.error) return result;

    await refreshBoardEvents({ storyId, boardId, setLoading });
    setAllEvents((current) => current.filter((event) => event.id !== eventId));
    return result;
  }, [refreshBoardEvents]);

  const duplicateEvent = useCallback(async ({ storyId, boardId, originalEvent, offset = { x: 50, y: 40 }, setLoading }) => {
    if (!storyId || !boardId || !originalEvent) return { data: null, error: null, ids: [] };

    const characterIds = (originalEvent.event_characters || [])
      .map((eventCharacter) => eventCharacter.character?.id || eventCharacter.character_id)
      .filter(Boolean);
    const nextOrderIndex = events.length > 0
      ? Math.max(...events.map((event) => Number(event.order_index) || 0)) + 1
      : 1;
    const eventData = {
      story_id: storyId,
      title: `${originalEvent.title} (Copia)`,
      summary: originalEvent.summary || '',
      details: originalEvent.details || '',
      color_tag: originalEvent.color_tag || '#8d7b68',
      importance_level: originalEvent.importance_level || 'medium',
      order_index: nextOrderIndex,
      pos_x: (Number(originalEvent.pos_x) || 120) + offset.x,
      pos_y: (Number(originalEvent.pos_y) || 100) + offset.y,
    };
    const result = await eventController.create(eventData, characterIds, boardId, setLoading);
    if (result.error || !result.data) return { ...result, ids: [] };

    const { data: boardEvents } = await refreshBoardEvents({ storyId, boardId, setLoading });
    setAllEvents((current) => current.concat(
      (boardEvents || []).filter((event) => !current.some((item) => item.id === event.id))
    ));
    return { ...result, ids: [result.data.id] };
  }, [events, refreshBoardEvents]);

  const duplicateEvents = useCallback(async ({ storyId, boardId, originalEvents, setLoading }) => {
    if (!storyId || !boardId || !originalEvents?.length) return [];

    let nextOrderIndex = events.length > 0
      ? Math.max(...events.map((event) => Number(event.order_index) || 0)) + 1
      : 1;
    const createdIds = [];

    for (const [index, originalEvent] of originalEvents.entries()) {
      const characterIds = (originalEvent.event_characters || [])
        .map((eventCharacter) => eventCharacter.character?.id || eventCharacter.character_id)
        .filter(Boolean);
      const { data, error } = await eventController.create({
        story_id: storyId,
        title: `${originalEvent.title} (Copia)`,
        summary: originalEvent.summary || '',
        details: originalEvent.details || '',
        color_tag: originalEvent.color_tag || '#8d7b68',
        importance_level: originalEvent.importance_level || 'medium',
        order_index: nextOrderIndex,
        pos_x: (Number(originalEvent.pos_x) || 120) + 50 + (index * 20),
        pos_y: (Number(originalEvent.pos_y) || 100) + 40 + (index * 20),
      }, characterIds, boardId, setLoading);

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
  }, [events, refreshBoardEvents]);

  const getEventDetails = useCallback(async ({ eventId, setLoading }) => (
    eventController.getById(eventId, setLoading)
  ), []);

  const saveEventPosition = useCallback(async ({ eventId, position, setLoading }) => (
    eventController.savePosition(eventId, position, setLoading)
  ), []);

  const createEventBackup = useCallback(async ({ storyId, eventId, note, setLoading }) => {
    const result = await eventController.createBackup(eventId, note, setLoading);
    if (!result.error && storyId) {
      await loadStoryData({ storyId, setLoading });
    }
    return result;
  }, [loadStoryData]);

  const getEventVersions = useCallback(async ({ eventId, setLoading }) => (
    eventController.getVersions(eventId, setLoading)
  ), []);

  const restoreEventVersion = useCallback(async ({ storyId, versionId, setLoading }) => {
    const result = await eventController.restoreVersion(versionId, setLoading);
    if (!result.error && storyId) {
      await loadStoryData({ storyId, setLoading });
    }
    return result;
  }, [loadStoryData]);

  const saveCharacter = useCallback(async ({ storyId, charData, selectedCharacterId = null, isCloneMode = false, cloneOptions = null, setLoading }) => {
    if (!storyId) return { data: null, error: new Error('Story ID is required') };

    const result = selectedCharacterId && !isCloneMode
      ? await characterController.update(selectedCharacterId, charData, setLoading)
      : isCloneMode && cloneOptions
        ? await characterController.clone(selectedCharacterId, { ...cloneOptions, targetStoryId: storyId }, setLoading)
        : await characterController.create({ ...charData, story_id: storyId }, setLoading);

    if (!result?.error) {
      await loadStoryData({ storyId, setLoading });
    }

    return result;
  }, [loadStoryData]);

  const deleteCharacter = useCallback(async ({ storyId, charId, setLoading }) => {
    if (!storyId || !charId) return { data: null, error: new Error('Story ID and character ID are required') };

    const result = await characterController.delete(charId, setLoading);
    if (!result?.error) {
      await loadStoryData({ storyId, setLoading });
    }
    return result;
  }, [loadStoryData]);

  const updateCharactersGlobal = useCallback(async ({ storyId, characterIds, isGlobal, setLoading }) => {
    if (!storyId || !characterIds?.length) return { error: null, changed: false };

    const previousCharacters = characters;
    const selectedIds = [...characterIds];
    setCharacters((current) => current.map((character) => (
      selectedIds.includes(character.id) ? { ...character, is_global: isGlobal } : character
    )));

    const results = await Promise.all(selectedIds.map((characterId) =>
      characterController.update(characterId, { is_global: isGlobal }, setLoading)
    ));

    if (results.some((result) => result.error)) {
      setCharacters(previousCharacters);
      return { error: new Error('No se pudo actualizar uno o más personajes.'), changed: false };
    }

    return { error: null, changed: true };
  }, [characters]);

  const createRelationship = useCallback(async ({ storyId, relData, setLoading }) => {
    if (!storyId) return { data: null, error: new Error('Story ID is required') };

    const result = await relationshipController.create({ ...relData, story_id: storyId }, setLoading);
    if (!result?.error) {
      await loadStoryData({ storyId, setLoading });
    }
    return result;
  }, [loadStoryData]);

  const deleteRelationship = useCallback(async ({ storyId, relId, setLoading }) => {
    if (!storyId || !relId) return { data: null, error: new Error('Story ID and relationship ID are required') };

    const result = await relationshipController.delete(relId, setLoading);
    if (!result?.error) {
      await loadStoryData({ storyId, setLoading });
    }
    return result;
  }, [loadStoryData]);

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
      loadStoryData,
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
      createRelationship,
      deleteRelationship,
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
