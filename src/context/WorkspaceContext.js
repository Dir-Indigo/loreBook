import React, { createContext, useContext, useState, useCallback, useEffect, useMemo, useRef } from 'react';
import { ApiService } from '../utils/ApiService';
import { useStory } from './StoryContext';
import { DEFAULT_ENTITY_COLOR } from '../constants/constants';
import { useNotify } from './FeedbackContext';

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
  color: DEFAULT_ENTITY_COLOR,
};

const createPrimaryBoard = (storyId, setLoading) => (
  ApiService.boards.create({ story_id: storyId, ...PRIMARY_BOARD_DEFAULTS }, setLoading)
);

// IDs temporales: permiten mostrar un registro al instante mientras el servidor confirma el guardado
const TEMP_PREFIX = 'temp-';
const makeTempId = (kind) => `${TEMP_PREFIX}${kind}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
const isTempId = (id) => typeof id === 'string' && id.startsWith(TEMP_PREFIX);

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
  const notify = useNotify();
  const notifyRef = useRef(notify);
  notifyRef.current = notify;
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
  latestRef.current = { activeStoryId, boards, events, allEvents, activeBoardId, eventConnections, characters, relationships };

  // Registros creados de forma optimista: mientras el servidor no confirma, otras acciones esperan el id real
  const pendingRef = useRef(new Map()); // tempId -> Promise<realId | null>
  const idMapRef = useRef(new Map()); // tempId -> realId

  const resolveId = useCallback(async (id) => {
    if (!isTempId(id)) return id;
    if (idMapRef.current.has(id)) return idMapRef.current.get(id);
    const pending = pendingRef.current.get(id);
    return pending ? pending : null;
  }, []);

  const updateQueuesRef = useRef(new Map()); // eventId -> cola de actualizaciones para que no se pisen entre sí

  const trackPending = useCallback((tempId, promise) => {
    pendingRef.current.set(tempId, promise);
    promise.finally(() => pendingRef.current.delete(tempId));
  }, []);

  // Reglas para construir el vínculo evento↔personaje con los datos que ya tenemos en memoria
  const buildEventCharacters = useCallback((eventId, ids = []) => (
    (ids || [])
      .map((item) => (typeof item === 'object' ? item?.id : item))
      .filter(Boolean)
      .map((charId) => {
        const character = latestRef.current.characters.find((c) => c.id === charId);
        return character ? { id: `local-${eventId}-${charId}`, character_id: charId, character } : null;
      })
      .filter(Boolean)
  ), []);

  const patchEventLocal = useCallback((eventId, patch) => {
    const merge = (list) => list.map((event) => (event.id === eventId ? { ...event, ...patch } : event));
    setEvents(merge);
    setAllEvents(merge);
  }, []);

  // Cuando el servidor confirma, el id temporal pasa a ser el real (también en las conexiones que lo usan)
  const swapEventId = useCallback((tempId, realId, serverFields = {}) => {
    patchEventLocal(tempId, { id: realId, ...serverFields });
    setEventConnections((current) => current.map((conn) => (
      conn.source_event_id === tempId || conn.target_event_id === tempId
        ? {
            ...conn,
            source_event_id: conn.source_event_id === tempId ? realId : conn.source_event_id,
            target_event_id: conn.target_event_id === tempId ? realId : conn.target_event_id,
          }
        : conn
    )));
  }, [patchEventLocal]);

  const removeEventLocal = useCallback((eventId) => {
    setEvents((current) => current.filter((event) => event.id !== eventId));
    setAllEvents((current) => current.filter((event) => event.id !== eventId));
    setEventConnections((current) => current.filter((conn) => conn.source_event_id !== eventId && conn.target_event_id !== eventId));
  }, []);

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

  const createBoard = useCallback(async ({ storyId, name, parentBoardId = null, position, color = DEFAULT_ENTITY_COLOR }) => {
    if (!storyId || !name) return { data: null, error: new Error('Story ID and name are required') };

    // El tablero aparece (y se activa) al instante; el servidor confirma en segundo plano
    const tempId = makeTempId('board');
    const previousActiveBoardId = latestRef.current.activeBoardId;
    const previousEvents = latestRef.current.events;
    const optimistic = { id: tempId, story_id: storyId, name, parent_board_id: parentBoardId, position, color };
    setBoards((prev) => [...prev, optimistic]);
    setActiveBoardId(tempId);
    setEvents([]);

    const persist = (async () => {
      const { data, error } = await ApiService.boards.create({
        story_id: storyId,
        name,
        parent_board_id: parentBoardId,
        position,
        color,
      }, null);

      if (error || !data) {
        setBoards((prev) => prev.filter((board) => board.id !== tempId));
        setActiveBoardId((current) => (current === tempId ? previousActiveBoardId : current));
        setEvents(previousEvents);
        notifyRef.current?.error?.('No se pudo crear el tablero.');
        return null;
      }

      idMapRef.current.set(tempId, data.id);
      setBoards((prev) => prev.map((board) => (board.id === tempId ? data : board)));
      setActiveBoardId((current) => (current === tempId ? data.id : current));
      return data.id;
    })();
    trackPending(tempId, persist);

    const realId = await persist;
    return realId ? { data: { ...optimistic, id: realId }, error: null } : { data: null, error: new Error('No se pudo crear el tablero') };
  }, [trackPending]);

  const updateBoard = useCallback(async ({ boardId, patch }) => {
    if (!boardId) return { data: null, error: new Error('Board ID is required') };

    const previous = latestRef.current.boards.find((board) => board.id === boardId);
    const snapshot = {};
    Object.keys(patch || {}).forEach((key) => { snapshot[key] = previous?.[key]; });
    setBoards((prev) => prev.map((board) => (board.id === boardId ? { ...board, ...patch } : board)));

    const realId = await resolveId(boardId);
    if (!realId) return { data: null, error: new Error('El tablero no existe') };

    const { data, error } = await ApiService.boards.update(realId, patch, null);
    if (error || !data) {
      setBoards((prev) => prev.map((board) => (board.id === boardId || board.id === realId ? { ...board, ...snapshot } : board)));
      notifyRef.current?.error?.('No se pudo actualizar el tablero.');
      return { data: null, error };
    }
    return { data, error: null };
  }, [resolveId]);

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

  const deleteBoard = useCallback(async ({ storyId, boardId }) => {
    if (!storyId || !boardId) return { data: null, error: new Error('Story ID and board ID are required') };

    const { boards, activeBoardId, allEvents, events } = latestRef.current;
    const remainingBoards = boards.filter((board) => board.id !== boardId);
    const wasActive = activeBoardId === boardId;
    const fallbackId = remainingBoards.find((board) => !board.parent_board_id)?.id || null;

    // Desaparece al instante; si el servidor falla se restaura todo
    setBoards(remainingBoards);
    setAllEvents((current) => current.filter((event) => event.board_id !== boardId));
    if (wasActive) {
      setActiveBoardId(fallbackId);
      if (!fallbackId) setEvents([]);
    }

    const realId = await resolveId(boardId);
    const [deleteResult] = await Promise.all([
      realId ? ApiService.boards.delete(realId, null) : Promise.resolve({ data: null, error: null }),
      wasActive && fallbackId ? refreshBoardEvents({ storyId, boardId: fallbackId }) : Promise.resolve(),
    ]);

    if (deleteResult.error) {
      setBoards(boards);
      setAllEvents(allEvents);
      if (wasActive) {
        setActiveBoardId(activeBoardId);
        setEvents(events);
      }
      notifyRef.current?.error?.('No se pudo eliminar el tablero.');
      return { data: null, error: deleteResult.error };
    }

    if (wasActive && !fallbackId) {
      const newPrimaryId = await ensurePrimaryBoard({ storyId });
      if (newPrimaryId) setActiveBoardId(newPrimaryId);
    }
    return { data: deleteResult.data, error: null };
  }, [ensurePrimaryBoard, refreshBoardEvents, resolveId]);

  const createConnection = useCallback(async ({ storyId, sourceEventId, targetEventId }) => {
    if (!storyId) return { data: null, error: new Error('Story ID is required') };

    const temporaryId = makeTempId('conn');
    setEventConnections((current) => [...current, {
      id: temporaryId,
      story_id: storyId,
      source_event_id: sourceEventId,
      target_event_id: targetEventId,
    }]);

    // Si algún extremo aún se está creando en el servidor, se espera su id real
    const [realSource, realTarget] = await Promise.all([resolveId(sourceEventId), resolveId(targetEventId)]);
    if (!realSource || !realTarget) {
      setEventConnections((current) => current.filter((connection) => connection.id !== temporaryId));
      return { data: null, error: new Error('El evento no existe') };
    }

    const result = await ApiService.events.createConnection(storyId, realSource, realTarget, null);
    if (result.error || !result.data) {
      setEventConnections((current) => current.filter((connection) => connection.id !== temporaryId));
      notifyRef.current?.error?.('No se pudo crear la conexión.');
      return result;
    }

    setEventConnections((current) => current.map((connection) => (
      connection.id === temporaryId ? result.data : connection
    )));
    return result;
  }, [resolveId]);

  const deleteConnection = useCallback(async ({ storyId, sourceEventId, targetEventId }) => {
    if (!storyId) return { data: null, error: new Error('Story ID is required') };

    const previous = latestRef.current.eventConnections;
    setEventConnections((current) => current.filter((connection) => (
      connection.source_event_id !== sourceEventId || connection.target_event_id !== targetEventId
    )));

    const [realSource, realTarget] = await Promise.all([resolveId(sourceEventId), resolveId(targetEventId)]);
    if (!realSource || !realTarget) return { data: null, error: null };

    const result = await ApiService.events.deleteConnection({ storyId, source: realSource, target: realTarget }, null);
    if (result?.error) {
      setEventConnections(previous);
      notifyRef.current?.error?.('No se pudo eliminar la conexión.');
    }
    return result;
  }, [resolveId]);
  // Crear: el evento aparece al instante (id temporal) y `persisted` resuelve cuando el servidor confirma.
  // Editar: el cambio se aplica al instante y se revierte solo si el servidor falla.
  // `localPatch` agrega campos que solo viven en el estado (no se envían a la BD).
  const saveEvent = useCallback(async ({ storyId, eventData, characterIds, createBackup, backupNote, selectedEventId, localPatch = null, tempId: providedTempId = null }) => {
    if (!storyId) return { data: null, error: new Error('Story ID is required') };

    let resolvedBoardId = latestRef.current.activeBoardId;
    if (!resolvedBoardId) {
      resolvedBoardId = await ensurePrimaryBoard({ storyId });
    }
    if (!resolvedBoardId) return { data: null, error: new Error('A primary board is required') };

    // ── Editar ──
    if (selectedEventId) {
      const hasCharacters = Array.isArray(characterIds);
      const patch = {
        ...eventData,
        ...(hasCharacters ? { event_characters: buildEventCharacters(selectedEventId, characterIds) } : {}),
        ...(localPatch || {}),
      };
      const previous = latestRef.current.allEvents.find((e) => e.id === selectedEventId)
        || latestRef.current.events.find((e) => e.id === selectedEventId);
      const snapshot = {};
      Object.keys(patch).forEach((key) => { snapshot[key] = previous?.[key]; });
      patchEventLocal(selectedEventId, patch);

      const realId = await resolveId(selectedEventId);
      if (!realId) return { data: null, error: new Error('El evento no existe') };
      if (!Object.keys(eventData || {}).length && !hasCharacters && !createBackup) return { data: null, error: null };

      const queues = updateQueuesRef.current;
      const task = (queues.get(realId) || Promise.resolve())
        .catch(() => {})
        .then(() => ApiService.events.update(realId, eventData || {}, characterIds, createBackup, backupNote, null));
      queues.set(realId, task);
      const result = await task;
      if (queues.get(realId) === task) queues.delete(realId);
      if (result.error) {
        patchEventLocal(realId, snapshot);
        notifyRef.current?.error?.('No se pudo guardar el evento. Se restauró el estado anterior.');
      }
      return result;
    }

    // ── Crear ──
    const tempId = providedTempId || makeTempId('event');
    const now = new Date().toISOString();
    const optimistic = {
      ...eventData,
      id: tempId,
      story_id: storyId,
      board_id: resolvedBoardId,
      event_characters: buildEventCharacters(tempId, characterIds),
      created_at: now,
      updated_at: now,
    };
    setActiveBoardId(resolvedBoardId);
    setEvents((current) => [...current, optimistic]);
    setAllEvents((current) => [...current, optimistic]);

    const boardRealId = await resolveId(resolvedBoardId);
    const persisted = (async () => {
      const result = boardRealId
        ? await ApiService.events.create({ ...eventData, story_id: storyId }, characterIds, boardRealId, null)
        : { data: null, error: new Error('El tablero no existe') };

      if (result.error || !result.data) {
        removeEventLocal(tempId);
        notifyRef.current?.error?.('No se pudo crear el evento.');
        return { data: null, error: result.error || new Error('No se pudo crear el evento') };
      }
      idMapRef.current.set(tempId, result.data.id);
      // Conserva lo que el usuario haya cambiado mientras tanto (posición, título…) y solo toma lo asignado por el servidor
      swapEventId(tempId, result.data.id, { created_at: result.data.created_at, updated_at: result.data.updated_at });
      return { data: { ...optimistic, id: result.data.id }, error: null };
    })();
    trackPending(tempId, persisted.then((r) => r.data?.id || null));

    return { data: optimistic, error: null, tempId, persisted };
  }, [ensurePrimaryBoard, buildEventCharacters, patchEventLocal, removeEventLocal, swapEventId, resolveId, trackPending]);

  const deleteEvent = useCallback(async ({ storyId, boardId, eventId }) => {
    if (!storyId || !eventId) return { data: null, error: new Error('Story ID and event ID are required') };

    // Se quita al instante (junto a sus conexiones); si el servidor falla se restaura
    const { events, allEvents, eventConnections } = latestRef.current;
    removeEventLocal(eventId);

    const realId = await resolveId(eventId);
    if (!realId) return { data: null, error: null }; // nunca llegó a crearse

    const result = await ApiService.events.delete(realId, null);
    if (result.error) {
      setEvents(events);
      setAllEvents(allEvents);
      setEventConnections(eventConnections);
      notifyRef.current?.error?.('No se pudo eliminar el evento.');
    }
    return result;
  }, [removeEventLocal, resolveId]);

  // Las copias aparecen al instante con id temporal; devuelve los ids temporales y `persisted` con los reales
  const duplicateEvents = useCallback(async ({ storyId, boardId, originalEvents }) => {
    if (!storyId || !boardId || !originalEvents?.length) return { ids: [], persisted: Promise.resolve([]) };

    let nextOrderIndex = getNextOrderIndex(latestRef.current.events);
    const now = new Date().toISOString();
    const drafts = originalEvents.map((originalEvent, index) => {
      const eventData = buildDuplicateEventData(originalEvent, storyId, nextOrderIndex + index, 50 + (index * 20), 40 + (index * 20));
      const tempId = makeTempId('event');
      const characterIds = getEventCharacterIds(originalEvent);
      return {
        tempId,
        eventData,
        characterIds,
        optimistic: {
          ...eventData,
          id: tempId,
          board_id: boardId,
          event_characters: buildEventCharacters(tempId, characterIds),
          created_at: now,
          updated_at: now,
        },
      };
    });

    setEvents((current) => [...current, ...drafts.map((d) => d.optimistic)]);
    setAllEvents((current) => [...current, ...drafts.map((d) => d.optimistic)]);

    const persisted = (async () => {
      const realIds = [];
      for (const draft of drafts) {
        const { data, error } = await ApiService.events.create(draft.eventData, draft.characterIds, boardId, null);
        if (error || !data?.id) {
          removeEventLocal(draft.tempId);
          notifyRef.current?.error?.('No se pudo duplicar un evento.');
          continue;
        }
        idMapRef.current.set(draft.tempId, data.id);
        swapEventId(draft.tempId, data.id, { created_at: data.created_at, updated_at: data.updated_at });
        realIds.push(data.id);
      }
      return realIds;
    })();
    drafts.forEach((draft, index) => {
      trackPending(draft.tempId, persisted.then(() => idMapRef.current.get(draft.tempId) || null));
    });

    return { ids: drafts.map((d) => d.tempId), persisted };
  }, [buildEventCharacters, removeEventLocal, swapEventId, trackPending]);

  const duplicateEvent = useCallback(async ({ storyId, boardId, originalEvent }) => {
    if (!originalEvent) return { ids: [], persisted: Promise.resolve([]) };
    return duplicateEvents({ storyId, boardId, originalEvents: [originalEvent] });
  }, [duplicateEvents]);

  const getEventDetails = useCallback(async ({ eventId, setLoading }) => (
    ApiService.events.getById(eventId, setLoading)
  ), []);

  const saveEventPosition = useCallback(async ({ eventId, position, posX, posY }) => {
    const pos = position || { pos_x: posX, pos_y: posY };
    if (pos.pos_x === undefined || pos.pos_y === undefined) return { data: null, error: null };
    const realId = await resolveId(eventId); // si el evento aún se está creando, espera su id real
    if (!realId) return { data: null, error: null };
    return ApiService.events.savePosition(realId, pos, null);
  }, [resolveId]);

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

  const saveCharacter = useCallback(async ({ storyId, charData, selectedCharacterId = null, isCloneMode = false, cloneOptions = null }) => {
    if (!storyId) return { data: null, error: new Error('Story ID is required') };

    // Clonar requiere que el servidor copie datos: se espera su respuesta
    if (isCloneMode && cloneOptions) {
      const result = await ApiService.characters.clone(selectedCharacterId, { ...cloneOptions, targetStoryId: storyId }, null);
      if (!result?.error && result?.data) setCharacters((prev) => [...prev, result.data]);
      return result;
    }

    // Editar: se refleja al instante y se revierte si falla
    if (selectedCharacterId && !isCloneMode) {
      const previous = latestRef.current.characters.find((c) => c.id === selectedCharacterId);
      const snapshot = {};
      Object.keys(charData || {}).forEach((key) => { snapshot[key] = previous?.[key]; });
      setCharacters((prev) => prev.map((c) => (c.id === selectedCharacterId ? { ...c, ...charData } : c)));

      const realId = await resolveId(selectedCharacterId);
      if (!realId) return { data: null, error: new Error('El personaje no existe') };
      const result = await ApiService.characters.update(realId, charData, null);
      if (result?.error) {
        setCharacters((prev) => prev.map((c) => (c.id === realId || c.id === selectedCharacterId ? { ...c, ...snapshot } : c)));
        notifyRef.current?.error?.('No se pudo guardar el personaje. Se restauró el estado anterior.');
      } else if (result?.data) {
        setCharacters((prev) => prev.map((c) => (c.id === realId ? { ...c, ...result.data } : c)));
      }
      return result;
    }

    // Crear: aparece al instante con id temporal
    const tempId = makeTempId('char');
    const optimistic = { ...charData, id: tempId, story_id: storyId, created_at: new Date().toISOString() };
    setCharacters((prev) => [...prev, optimistic]);
    const persist = (async () => {
      const result = await ApiService.characters.create({ ...charData, story_id: storyId }, null);
      if (result?.error || !result?.data) {
        setCharacters((prev) => prev.filter((c) => c.id !== tempId));
        notifyRef.current?.error?.('No se pudo crear el personaje.');
        return { result, realId: null };
      }
      idMapRef.current.set(tempId, result.data.id);
      setCharacters((prev) => prev.map((c) => (c.id === tempId ? { ...c, ...result.data } : c)));
      return { result, realId: result.data.id };
    })();
    trackPending(tempId, persist.then((r) => r.realId));
    return (await persist).result;
  }, [resolveId, trackPending]);

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

  const createRelationship = useCallback(async ({ storyId, relData }) => {
    if (!storyId) return { data: null, error: new Error('Story ID is required') };

    const tempId = makeTempId('rel');
    const { characters } = latestRef.current;
    const pick = (id) => {
      const c = characters.find((item) => item.id === id);
      return c ? { id: c.id, name: c.name, avatar_url: c.avatar_url } : null;
    };
    const optimistic = {
      ...relData,
      id: tempId,
      story_id: storyId,
      source: pick(relData.source_character_id),
      target: pick(relData.target_character_id),
    };
    setRelationships((prev) => [...prev, optimistic]);

    const result = await ApiService.relationships.create({ ...relData, story_id: storyId }, null);
    if (result?.error || !result?.data) {
      setRelationships((prev) => prev.filter((r) => r.id !== tempId));
      notifyRef.current?.error?.('No se pudo crear la relación.');
      return result;
    }
    setRelationships((prev) => prev.map((r) => (r.id === tempId ? result.data : r)));
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
