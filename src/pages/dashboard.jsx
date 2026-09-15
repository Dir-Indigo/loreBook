import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/router';
import { Box, Dialog, DialogTitle, DialogContent, DialogActions, Typography, Snackbar, Alert } from '@mui/material';
import { useAuth } from '../context/AuthContext';
import { useStory } from '../context/StoryContext';
import { useLoading } from '../context/LoadingContext';
import { useWorkspace } from '../context/WorkspaceContext';
import { storyController } from '../controllers/storyController';
import { characterController } from '../controllers/characterController';
import { eventController } from '../controllers/eventController';
import { relationshipController } from '../controllers/relationshipController';
import SidebarLore from '../components/layout/SidebarLore';
import TimelineCanvas from '../components/canvas/TimelineCanvas';
import CharacterDrawer from '../components/characters/CharacterDrawer';
import CharacterModal from '../components/characters/CharacterModal';
import EventModal from '../components/canvas/EventModal';
import EventVersionsModal from '../components/canvas/EventVersionsModal';
import CustomLoading from '../components/common/CustomLoading';
import CustomButton from '../components/common/CustomButton';
import { APP_CONFIG } from '../constants/constants';

export default function DashboardPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { activeStory, activeStoryId, storiesLoading } = useStory();
  const { setLoading } = useLoading();

  const {
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
    saveCharacter,
    deleteCharacter,
    updateCharactersGlobal,
    createRelationship,
    deleteRelationship,
  } = useWorkspace();

  // UI / Modal States
  const [dataLoading, setDataLoading] = useState(true);
  const [charDrawerOpen, setCharDrawerOpen] = useState(false);
  const [charModalOpen, setCharModalOpen] = useState(false);
  const [selectedCharacter, setSelectedCharacter] = useState(null);
  const [isCloneCharMode, setIsCloneCharMode] = useState(false);

  const [eventModalOpen, setEventModalOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);

  const [versionsModalOpen, setVersionsModalOpen] = useState(false);
  const [versionEventId, setVersionEventId] = useState(null);
  const [versionEventTitle, setVersionEventTitle] = useState('');
  const [eventVersions, setEventVersions] = useState([]);
  const [versionsLoading, setVersionsLoading] = useState(false);
  const [pendingConfirmation, setPendingConfirmation] = useState(null);
  const [feedback, setFeedback] = useState(null);

  // Redirect unauthenticated users to login
  useEffect(() => {
    if (!authLoading && !user) {
      router.replace('/login');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
      // Activar carga si hay un storyId
      if (activeStoryId) {
        loadStoryData({ storyId: activeStoryId, setLoading, setDataLoading });
      } else {
        // Si no hay storyId, pero authLoading terminó, significa que no hay historia seleccionada
        if (!authLoading) {
            setDataLoading(false);
        }
      }
  }, [activeStoryId, authLoading, loadStoryData, setLoading]);

  // Optimistic Connection Handlers
  const handleCreateConnection = async (sourceEventId, targetEventId) => {
    if (!activeStoryId) return;
    const tempId = `temp-${Date.now()}`;
    const newConn = { id: tempId, story_id: activeStoryId, source_event_id: sourceEventId, target_event_id: targetEventId };
    
    setEventConnections((prev) => [...prev, newConn]);

    const { data } = await eventController.createConnection(activeStoryId, sourceEventId, targetEventId, setLoading);
    if (!data) {
      setEventConnections((prev) => prev.filter((c) => c.id !== tempId));
    } else {
      setEventConnections((prev) => prev.map((c) => (c.id === tempId ? data : c)));
    }
  };

  const handleDeleteConnection = async (sourceEventId, targetEventId) => {
    if (!activeStoryId) return;
    setEventConnections((prev) =>
      prev.filter((c) => !(c.source_event_id === sourceEventId && c.target_event_id === targetEventId))
    );
    await eventController.deleteConnectionByNodes(activeStoryId, sourceEventId, targetEventId, setLoading);
  };

  const handleSelectBoard = useCallback(async (boardId) => {
    if (!activeStoryId || boardId === activeBoardId) return;
    await selectBoard({ storyId: activeStoryId, boardId, setLoading });
  }, [activeStoryId, activeBoardId, selectBoard, setLoading]);

  const handleCreateBoard = async (name, parentBoardId = null) => {
    if (!activeStoryId) return;
    const siblings = boards.filter((b) => b.parent_board_id === (parentBoardId || null));
    const position = siblings.length;
    await createBoard({
      storyId: activeStoryId,
      name,
      parentBoardId,
      position,
      setLoading,
    });
  };

  const handleRenameBoard = async (boardId, newName) => {
    await updateBoard({ boardId, patch: { name: newName }, setLoading });
  };

  const handleChangeBoardColor = async (boardId, color) => {
    await updateBoard({ boardId, patch: { color }, setLoading });
  };

  const handleDeleteBoard = async (board) => {
    setPendingConfirmation({
      title: 'Eliminar carpeta',
      message: `¿Eliminar la carpeta "${board.name}"?`,
      onConfirm: async () => {
        await deleteBoard({ storyId: activeStoryId, boardId: board.id, setLoading });
        setPendingConfirmation(null);
      }
    });
  };

  const handleSaveCharacter = async (charData) => {
    if (!activeStoryId) return;
    await saveCharacter({
      storyId: activeStoryId,
      charData,
      selectedCharacterId: selectedCharacter?.id || null,
      isCloneMode: isCloneCharMode,
      cloneOptions: null,
      setLoading,
    });
    setCharModalOpen(false);
  };

  const handleCloneCharacter = async (originalCharId, cloneOptions) => {
    if (!activeStoryId) return;
    await saveCharacter({
      storyId: activeStoryId,
      selectedCharacterId: originalCharId,
      isCloneMode: true,
      cloneOptions,
      setLoading,
    });
    setCharModalOpen(false);
  };

  const handleDeleteCharacter = async (charId) => {
    const character = characters.find((item) => item.id === charId);
    setPendingConfirmation({
      title: 'Eliminar personaje',
      message: `¿Eliminar el personaje "${character?.name || ''}"?`,
      onConfirm: async () => {
        await deleteCharacter({ storyId: activeStoryId, charId, setLoading });
        setPendingConfirmation(null);
      },
    });
  };

  const handleSetCharactersGlobal = async (characterIds, isGlobal) => {
    if (!characterIds?.length) return;
    const { error } = await updateCharactersGlobal({ storyId: activeStoryId, characterIds, isGlobal, setLoading });
    if (error) {
      setFeedback('No se pudo actualizar uno o más personajes.');
    }
  };

  const handleCreateRelationship = async (relData) => {
    if (!activeStoryId) return;
    await createRelationship({ storyId: activeStoryId, relData, setLoading });
  };

  const handleDeleteRelationship = async (relId) => {
    await deleteRelationship({ storyId: activeStoryId, relId, setLoading });
  };

  const handleSaveEvent = async ({ eventData, characterIds, createBackup, backupNote }) => {
    if (!activeStoryId) return;

    let resolvedBoardId = activeBoardId;
    if (!resolvedBoardId) {
      resolvedBoardId = await ensurePrimaryBoard({ storyId: activeStoryId, setLoading });
    }

    if (!resolvedBoardId) {
      setFeedback('Primero crea una línea narrativa principal antes de guardar eventos.');
      return;
    }

    const result = selectedEvent
      ? await eventController.update(selectedEvent.id, eventData, characterIds, createBackup, backupNote, setLoading)
      : await eventController.create({ ...eventData, story_id: activeStoryId }, characterIds, resolvedBoardId, setLoading);

    if (result.error) {
      setFeedback(`No se pudo guardar el evento: ${result.error.message || 'error desconocido'}`);
      return;
    }

    setActiveBoardId(resolvedBoardId);
    const { data: eventsData } = await refreshBoardEvents({ storyId: activeStoryId, boardId: resolvedBoardId, setLoading });
    setAllEvents((current) => selectedEvent
      ? current.map((event) => event.id === selectedEvent.id ? { ...event, ...eventData } : event)
      : [...current, ...(eventsData || []).filter((event) => !current.some((item) => item.id === event.id))]);
    setEventModalOpen(false);
  };

  const handleDuplicateEvent = async (originalEvent, offset = { x: 50, y: 40 }) => {
    if (!activeStoryId || !originalEvent) return;
    const charIds = (originalEvent.event_characters || []).map((ec) => ec.character?.id || ec.character_id).filter(Boolean);
    const newOrderIndex = events.length > 0
      ? Math.max(...events.map((event) => Number(event.order_index) || 0)) + 1
      : 1;
    const eventPayload = {
      story_id: activeStoryId,
      title: `${originalEvent.title} (Copia)`,
      summary: originalEvent.summary || '',
      details: originalEvent.details || '',
      color_tag: originalEvent.color_tag || '#8d7b68',
      importance_level: originalEvent.importance_level || 'medium',
      order_index: newOrderIndex,
      pos_x: (Number(originalEvent.pos_x) || 120) + offset.x,
      pos_y: (Number(originalEvent.pos_y) || 100) + offset.y,
    };
    const { data } = await eventController.create(eventPayload, charIds, activeBoardId, setLoading);
    await refreshBoardEvents({ storyId: activeStoryId, boardId: activeBoardId, setLoading });
    setAllEvents((current) => data ? [...current, data] : current);
    return data?.id ? [data.id] : [];
  };

  const handleDuplicateEvents = async (originalEvents) => {
    if (!activeStoryId || !activeBoardId || !originalEvents?.length) return [];

    let nextOrderIndex = events.length > 0
      ? Math.max(...events.map((event) => Number(event.order_index) || 0)) + 1
      : 1;
    const createdIds = [];

    for (const [index, originalEvent] of originalEvents.entries()) {
      const charIds = (originalEvent.event_characters || [])
        .map((ec) => ec.character?.id || ec.character_id)
        .filter(Boolean);
      const { data, error } = await eventController.create({
        story_id: activeStoryId,
        title: `${originalEvent.title} (Copia)`,
        summary: originalEvent.summary || '',
        details: originalEvent.details || '',
        color_tag: originalEvent.color_tag || '#8d7b68',
        importance_level: originalEvent.importance_level || 'medium',
        order_index: nextOrderIndex,
        pos_x: (Number(originalEvent.pos_x) || 120) + 50 + (index * 20),
        pos_y: (Number(originalEvent.pos_y) || 100) + 40 + (index * 20),
      }, charIds, activeBoardId, setLoading);

      if (!error && data?.id) {
        createdIds.push(data.id);
        nextOrderIndex += 1;
      }
    }

    const { data: eventsData } = await refreshBoardEvents({ storyId: activeStoryId, boardId: activeBoardId, setLoading });
    setAllEvents((current) => {
      const created = eventsData || [];
      return current.map((event) => created.find((item) => item.id === event.id) || event)
        .concat(created.filter((item) => !current.some((event) => event.id === item.id)));
    });
    return createdIds;
  };

  const handleDeleteEvent = async (eventId) => {
    const eventToDelete = allEvents.find((event) => event.id === eventId);
    setPendingConfirmation({
      title: 'Eliminar evento',
      message: `¿Eliminar el evento "${eventToDelete?.title || ''}"?`,
      onConfirm: async () => {
      await eventController.delete(eventId, setLoading);
      await refreshBoardEvents({ storyId: activeStoryId, boardId: activeBoardId, setLoading });
      setAllEvents((current) => current.filter((event) => event.id !== eventId));
      setPendingConfirmation(null);
      },
    });
  };

  const [debouncedSave] = useState(() => {
    const timeoutIds = new Map();
    return (eventId, newX, newY) => {
      if (timeoutIds.has(eventId)) clearTimeout(timeoutIds.get(eventId));
      timeoutIds.set(eventId, setTimeout(async () => {
        await eventController.savePosition(eventId, { pos_x: newX, pos_y: newY }, null);
        timeoutIds.delete(eventId);
      }, 1000));
    };
  });

  const handleNodeDragStop = (draggedNodes = []) => {
    // Actualización optimista inmediata
    setEvents((prevEvents) => prevEvents.map((event) => {
      const movedNode = draggedNodes.find((node) => node.id === event.id);
      return movedNode
        ? { ...event, pos_x: movedNode.position.x, pos_y: movedNode.position.y }
        : event;
    }));

    draggedNodes.forEach((node) => {
      debouncedSave(node.id, node.position.x, node.position.y);
    });
  };

  const handleCreateQuickBackup = async (eventId) => {
    const note = prompt('Nota:', 'Respaldo manual');
    if (note !== null) {
      await eventController.createBackup(eventId, note, setLoading);
      await loadStoryData({ storyId: activeStoryId, setLoading });
    }
  };

  const handleOpenVersions = async (eventId, title) => {
    setVersionEventId(eventId);
    setVersionEventTitle(title);
    setVersionsModalOpen(true);
    setVersionsLoading(true);
    const { data } = await eventController.getVersions(eventId, setLoading);
    setEventVersions(data || []);
    setVersionsLoading(false);
  };

  const handleRestoreVersion = async (versionId) => {
    setPendingConfirmation({
      title: 'Restaurar versión',
      message: '¿Restaurar esta versión del evento?',
      onConfirm: async () => {
        await eventController.restoreVersion(versionId, setLoading);
        await loadStoryData({ storyId: activeStoryId, setLoading });
        setVersionsModalOpen(false);
        setPendingConfirmation(null);
      },
    });
  };

  const handleUpdateStoryCover = async (storyId, coverUrl) => {
    await storyController.update(storyId, { cover_url: coverUrl }, setLoading);
  };

  const handleOpenEditEvent = async (event) => {
    const { data: completeEvent } = await eventController.getById(event.id, setLoading);
    setSelectedEvent(completeEvent || event);
    setEventModalOpen(true);
  };

  const openCreateEventModal = useCallback(async (boardId = activeBoardId) => {
    let resolvedBoardId = boardId || activeBoardId;
    if (!resolvedBoardId) {
      resolvedBoardId = await ensurePrimaryBoard({ storyId: activeStoryId, setLoading });
    }

    if (!resolvedBoardId) {
      setFeedback('Primero crea una línea narrativa principal para guardar eventos.');
      return;
    }

    setActiveBoardId(resolvedBoardId);
    setSelectedEvent(null);
    setEventModalOpen(true);
  }, [activeBoardId, activeStoryId, ensurePrimaryBoard]);

  if (authLoading || storiesLoading || dataLoading) {
    return <CustomLoading fullscreen message="Cargando estudio..." />;
  }

  return (
    <>
        <SidebarLore
          view="dashboard"
          story={activeStory}
          characters={characters}
          events={allEvents}
          eventConnections={eventConnections}
          boards={boards}
          activeBoardId={activeBoardId}
          onOpenCharactersDrawer={() => setCharDrawerOpen(true)}
          onOpenCreateEvent={openCreateEventModal}
          onUpdateStoryCover={handleUpdateStoryCover}
          onSelectBoard={handleSelectBoard}
          onCreateBoard={handleCreateBoard}
          onRenameBoard={handleRenameBoard}
          onDeleteBoard={handleDeleteBoard}
          onChangeBoardColor={handleChangeBoardColor}
          onOpenEditEvent={handleOpenEditEvent}
          onDeleteEvent={handleDeleteEvent}
        />

        <Box sx={{ flexGrow: 1, height: '100%', position: 'relative' }}>
          <TimelineCanvas
            events={events}
            characters={characters}
            eventConnections={eventConnections}
            activeBoardName={boards.find((b) => b.id === activeBoardId)?.name || null}
            onCreateConnection={handleCreateConnection}
            onDeleteConnection={handleDeleteConnection}
            onOpenCreateEvent={() => {
              setSelectedEvent(null);
              setEventModalOpen(true);
            }}
            onOpenEditEvent={handleOpenEditEvent}
            onDeleteEvent={handleDeleteEvent}
            onOpenVersions={handleOpenVersions}
            onCreateBackup={handleCreateQuickBackup}
            onNodeDragStop={handleNodeDragStop}
            onDuplicateEvent={handleDuplicateEvent}
            onDuplicateEvents={handleDuplicateEvents}
          />
        </Box>

      <CharacterDrawer
        open={charDrawerOpen}
        onClose={() => setCharDrawerOpen(false)}
        storyId={activeStoryId}
        characters={characters}
        relationships={relationships}
        onOpenCreateCharacter={() => {
          setSelectedCharacter(null);
          setIsCloneCharMode(false);
          setCharModalOpen(true);
        }}
        onOpenEditCharacter={(char) => {
          setSelectedCharacter(char);
          setIsCloneCharMode(false);
          setCharModalOpen(true);
        }}
        onOpenCloneCharacter={(char) => {
          setSelectedCharacter(char);
          setIsCloneCharMode(true);
          setCharModalOpen(true);
        }}
        onDeleteCharacter={handleDeleteCharacter}
        onSetCharactersGlobal={handleSetCharactersGlobal}
        onCreateRelationship={handleCreateRelationship}
        onDeleteRelationship={handleDeleteRelationship}
      />

      <CharacterModal
        open={charModalOpen}
        onClose={() => setCharModalOpen(false)}
        character={selectedCharacter}
        isCloneMode={isCloneCharMode}
        onSave={handleSaveCharacter}
        onClone={handleCloneCharacter}
      />

      <EventModal
        open={eventModalOpen}
        onClose={() => setEventModalOpen(false)}
        event={selectedEvent}
        characters={characters}
        nextOrderIndex={events.length > 0 ? Math.max(...events.map((e) => e.order_index || 0)) + 1 : 1}
        onSave={handleSaveEvent}
      />

      <EventVersionsModal
        open={versionsModalOpen}
        onClose={() => setVersionsModalOpen(false)}
        eventId={versionEventId}
        eventTitle={versionEventTitle}
        versions={eventVersions}
        loading={versionsLoading}
        onRestoreVersion={handleRestoreVersion}
      />

      <Dialog
        open={Boolean(pendingConfirmation)}
        onClose={() => setPendingConfirmation(null)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>{pendingConfirmation?.title}</DialogTitle>
        <DialogContent>
          <Typography color="text.secondary">{pendingConfirmation?.message}</Typography>
        </DialogContent>
        <DialogActions>
          <CustomButton variant="outlined" color="inherit" onClick={() => setPendingConfirmation(null)}>Cancelar</CustomButton>
          <CustomButton color="error" onClick={() => pendingConfirmation?.onConfirm?.()}>Confirmar</CustomButton>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={Boolean(feedback)}
        autoHideDuration={3500}
        onClose={() => setFeedback(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity="warning" onClose={() => setFeedback(null)}>{feedback}</Alert>
      </Snackbar>
    </>
  );
}
