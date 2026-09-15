import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/router';
import { Box, Dialog, DialogTitle, DialogContent, DialogActions, Typography, Snackbar, Alert } from '@mui/material';
import { useAuth } from '../context/AuthContext';
import { useStory } from '../context/StoryContext';
import { useLoading } from '../context/LoadingContext';
import { useWorkspace } from '../context/WorkspaceContext';
import SidebarLore from '../components/layout/SidebarLore';
import TimelineCanvas from '../components/canvas/TimelineCanvas';
import CharacterDrawer from '../components/characters/CharacterDrawer';
import CharacterModal from '../components/characters/CharacterModal';
import EventModal from '../components/canvas/EventModal';
import EventVersionsModal from '../components/canvas/EventVersionsModal';
import CustomLoading from '../components/common/CustomLoading';
import CustomButton from '../components/common/CustomButton';

export default function DashboardPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { activeStory, activeStoryId, storiesLoading, updateStory } = useStory();
  const { setLoading } = useLoading();

  const {
    characters,
    relationships,
    events,
    setEvents,
    allEvents,
    setAllEvents,
    eventConnections,
    boards,
    activeBoardId,
    setActiveBoardId,
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
    await createConnection({ storyId: activeStoryId, sourceEventId, targetEventId, setLoading });
  };

  const handleDeleteConnection = async (sourceEventId, targetEventId) => {
    await deleteConnection({ storyId: activeStoryId, sourceEventId, targetEventId, setLoading });
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
    const result = await saveEvent({
      storyId: activeStoryId,
      eventData,
      characterIds,
      createBackup,
      backupNote,
      selectedEventId: selectedEvent?.id,
      setLoading,
    });

    if (result.error) {
      setFeedback(result.error.message === 'A primary board is required'
        ? 'Primero crea una línea narrativa principal antes de guardar eventos.'
        : `No se pudo guardar el evento: ${result.error.message || 'error desconocido'}`);
      return;
    }

    setEventModalOpen(false);
  };

  const handleDuplicateEvent = async (originalEvent, offset = { x: 50, y: 40 }) => {
    const result = await duplicateEvent({
      storyId: activeStoryId,
      boardId: activeBoardId,
      originalEvent,
      offset,
      setLoading,
    });
    return result.ids;
  };

  const handleDuplicateEvents = async (originalEvents) => {
    return duplicateEvents({
      storyId: activeStoryId,
      boardId: activeBoardId,
      originalEvents,
      setLoading,
    });
  };

  const handleDeleteEvent = async (eventId) => {
    const eventToDelete = allEvents.find((event) => event.id === eventId);
    setPendingConfirmation({
      title: 'Eliminar evento',
      message: `¿Eliminar el evento "${eventToDelete?.title || ''}"?`,
      onConfirm: async () => {
      await deleteEvent({ storyId: activeStoryId, boardId: activeBoardId, eventId, setLoading });
      setPendingConfirmation(null);
      },
    });
  };

  const [debouncedSave] = useState(() => {
    const timeoutIds = new Map();
    return (eventId, newX, newY) => {
      if (timeoutIds.has(eventId)) clearTimeout(timeoutIds.get(eventId));
      timeoutIds.set(eventId, setTimeout(async () => {
        await saveEventPosition({ eventId, position: { pos_x: newX, pos_y: newY }, setLoading: null });
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
      await createEventBackup({ storyId: activeStoryId, eventId, note, setLoading });
    }
  };

  const handleOpenVersions = async (eventId, title) => {
    setVersionEventId(eventId);
    setVersionEventTitle(title);
    setVersionsModalOpen(true);
    setVersionsLoading(true);
    const { data } = await getEventVersions({ eventId, setLoading });
    setEventVersions(data || []);
    setVersionsLoading(false);
  };

  const handleRestoreVersion = async (versionId) => {
    setPendingConfirmation({
      title: 'Restaurar versión',
      message: '¿Restaurar esta versión del evento?',
      onConfirm: async () => {
        await restoreEventVersion({ storyId: activeStoryId, versionId, setLoading });
        setVersionsModalOpen(false);
        setPendingConfirmation(null);
      },
    });
  };

  const handleUpdateStoryCover = async (storyId, coverUrl) => {
    await updateStory(storyId, { cover_url: coverUrl });
  };

  const handleOpenEditEvent = async (event) => {
    const { data: completeEvent } = await getEventDetails({ eventId: event.id, setLoading });
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
