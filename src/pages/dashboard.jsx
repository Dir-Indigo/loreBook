import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/router';
import { Box, Dialog, DialogTitle, DialogContent, DialogActions, Typography, TextField, Snackbar, Alert, Fab, Badge, Tooltip } from '@mui/material';
import LightbulbOutlinedIcon from '@mui/icons-material/LightbulbOutlined';
import { useAuth } from '../context/AuthContext';
import { useStory } from '../context/StoryContext';
import { useLoading } from '../context/LoadingContext';
import { useWorkspace } from '../context/WorkspaceContext';
import { useQuickNotes } from '../context/QuickNotesContext';
import { useGlobalActions } from '../context/GlobalActionsContext';
import SidebarLore from '../components/layout/SidebarLore';
import TimelineCanvas from '../components/canvas/TimelineCanvas';
import CharacterDrawer from '../components/characters/CharacterDrawer';
import CharacterModal from '../components/characters/CharacterModal';
import EventModal from '../components/canvas/EventModal';
import EventVersionsModal from '../components/canvas/EventVersionsModal';
import QuickNotesPanel from '../components/common/QuickNotesPanel';
import SpeedDialActions from '../components/common/SpeedDialActions';
import CustomLoading from '../components/common/CustomLoading';
import CustomButton from '../components/common/CustomButton';

export default function DashboardPage({ onOpenStorySelector }) {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { activeStory, activeStoryId, storiesLoading, updateStory } = useStory();
  const { setLoading } = useLoading();
  const { notes, toggleOpen } = useQuickNotes();
  const { eventModalOpen, charModalOpen, closeCreateEvent, closeCreateChar, openCreateEvent, openCreateChar } = useGlobalActions();


  const {
    characters,
    relationships,
    events,
    setEvents,
    allEvents,
    setAllEvents,
    eventConnections,
    setEventConnections,
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
    copyCharactersAsLocal,
    createRelationship,
    deleteRelationship,
  } = useWorkspace();

  // UI / Modal States
  const [dataLoading, setDataLoading] = useState(true);
  const [charDrawerOpen, setCharDrawerOpen] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('lorebook_char_drawer_open') === 'true';
    }
    return false;
  });
  const [focusedCharacterId, setFocusedCharacterId] = useState(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('lorebook_char_drawer_open', charDrawerOpen.toString());
    }
  }, [charDrawerOpen]);
  
  // Modales gestionados por contexto global
  const [selectedCharacter, setSelectedCharacter] = useState(null);
  const [isCloneCharMode, setIsCloneCharMode] = useState(false);

  const handleOpenCharactersDrawer = useCallback((charOrId = null) => {
    const targetId = typeof charOrId === 'object' && charOrId ? charOrId.id : charOrId;
    setFocusedCharacterId(targetId || null);
    setCharDrawerOpen(true);
  }, []);

  const [selectedEvent, setSelectedEvent] = useState(null);

  const [versionsModalOpen, setVersionsModalOpen] = useState(false);
  const [versionEventId, setVersionEventId] = useState(null);
  const [versionEventTitle, setVersionEventTitle] = useState('');
  const [eventVersions, setEventVersions] = useState([]);
  const [versionsLoading, setVersionsLoading] = useState(false);
  const [pendingConfirmation, setPendingConfirmation] = useState(null);
  const [feedback, setFeedback] = useState(null);

  // Backup note dialog (replaces native prompt())
  const [backupNoteDialog, setBackupNoteDialog] = useState({ open: false, eventId: null, note: '' });

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

  const handleCopyCharactersAsLocal = async (characterIds) => {
    if (!characterIds?.length || !activeStoryId) return;
    const result = await copyCharactersAsLocal({ storyId: activeStoryId, characterIds, setLoading });
    if (result?.error) {
      setFeedback('No se pudo copiar uno o más personajes a esta historia.');
    }
    return result;
  };

  const handleCreateRelationship = async (relData) => {
    if (!activeStoryId) return;
    await createRelationship({ storyId: activeStoryId, relData, setLoading });
  };

  const handleDeleteRelationship = async (relId) => {
    await deleteRelationship({ storyId: activeStoryId, relId, setLoading });
  };

  const handleMoveCharacterToFolder = async (charOrIds, targetFolderId) => {
    const ids = Array.isArray(charOrIds) ? charOrIds : [charOrIds?.id || charOrIds];
    await ApiService.characters.moveToFolder(ids, targetFolderId);
    if (activeStoryId) {
      await loadStoryData({ storyId: activeStoryId });
    }
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

    setSelectedEvent(null);
    closeCreateEvent();
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
        setPendingConfirmation(null);
        await deleteEvent({ storyId: activeStoryId, boardId: activeBoardId, eventId, setLoading: null });
      },
    });
  };

  const handleInlineUpdateEvent = async (eventId, patchData) => {
    if (!activeStoryId || !eventId) return;
    await saveEvent({
      storyId: activeStoryId,
      eventData: patchData,
      selectedEventId: eventId,
      setLoading: null,
    });
  };

  const handleUpdateEventCharacters = async (eventId, characterIds) => {
    if (!activeStoryId || !eventId) return;
    await saveEvent({
      storyId: activeStoryId,
      eventData: {},
      characterIds,
      selectedEventId: eventId,
      setLoading: null,
    });
  };

  const handleQuickCreateEventAtPosition = async ({ x, y }) => {
    if (!activeStoryId) {
      setFeedback('Selecciona o crea una historia primero.');
      return;
    }
    const nextOrderIndex = events.length > 0
      ? Math.max(...events.map((e) => Number(e.order_index) || 0)) + 1
      : 1;

    // Creación optimista: mostrar el nodo inmediatamente sin esperar al server
    const tempId = `temp-${Date.now()}`;
    const optimisticEvent = {
      id: tempId,
      title: 'Nuevo Evento',
      summary: '',
      pos_x: x,
      pos_y: y,
      order_index: nextOrderIndex,
      color_tag: '#8c6d53',
      importance_level: 'medium',
      event_characters: [],
      event_versions: [],
      story_id: activeStoryId,
    };
    setEvents((prev) => [...prev, optimisticEvent]);

    // Guardar en server en segundo plano
    const result = await saveEvent({
      storyId: activeStoryId,
      eventData: {
        title: 'Nuevo Evento',
        summary: '',
        pos_x: x,
        pos_y: y,
        order_index: nextOrderIndex,
        color_tag: '#8c6d53',
      },
      characterIds: [],
      setLoading: null,
    });

    // Reemplazar el nodo temporal con el real
    if (result?.data?.id) {
      setEvents((prev) => prev.map((ev) => ev.id === tempId ? { ...optimisticEvent, ...result.data, id: result.data.id } : ev));
    } else {
      // Revertir si falló
      setEvents((prev) => prev.filter((ev) => ev.id !== tempId));
    }

    return result;
  };

  const handleQuickCreateConnectedEvent = async ({ sourceEventId, sourcePosition }) => {
    if (!activeStoryId) return;
    const sourceEvent = events.find((ev) => ev.id === sourceEventId);
    if (!sourceEvent) return;

    const offsetX = sourcePosition === 'right' ? 380 : -380;
    const x = (Number(sourceEvent.pos_x) || 0) + offsetX;
    const y = Number(sourceEvent.pos_y) || 0;
    const nextOrderIndex = events.length > 0
      ? Math.max(...events.map((e) => Number(e.order_index) || 0)) + 1
      : 1;

    // Creación optimista
    const tempId = `temp-${Date.now()}`;
    const optimisticEvent = {
      id: tempId,
      title: 'Nuevo Evento',
      summary: '',
      pos_x: x,
      pos_y: y,
      order_index: nextOrderIndex,
      color_tag: '#8c6d53',
      importance_level: 'medium',
      event_characters: [],
      event_versions: [],
      story_id: activeStoryId,
    };
    setEvents((prev) => [...prev, optimisticEvent]);

    // Optimistic Connection
    const tempConnId = `temp-conn-${Date.now()}`;
    const sourceId = sourcePosition === 'right' ? sourceEventId : tempId;
    const targetId = sourcePosition === 'right' ? tempId : sourceEventId;
    const optimisticConnection = {
      id: tempConnId,
      story_id: activeStoryId,
      source_event_id: sourceId,
      target_event_id: targetId,
    };
    setEventConnections((current) => [...current, optimisticConnection]);

    // Guardar evento en server
    const result = await saveEvent({
      storyId: activeStoryId,
      eventData: {
        title: 'Nuevo Evento',
        summary: '',
        pos_x: x,
        pos_y: y,
        order_index: nextOrderIndex,
        color_tag: '#8c6d53',
      },
      characterIds: [],
      setLoading: null,
    });

    if (result?.data?.id) {
      const newEventId = result.data.id;
      setEvents((prev) => prev.map((ev) => ev.id === tempId ? { ...optimisticEvent, ...result.data, id: newEventId } : ev));
      
      // Actualizar conexión
      setEventConnections((current) => current.map((conn) => 
        conn.id === tempConnId ? { ...conn, source_event_id: sourcePosition === 'right' ? sourceEventId : newEventId, target_event_id: sourcePosition === 'right' ? newEventId : sourceEventId } : conn
      ));
      
      // Crear la conexión real
      handleCreateConnection(sourceId, targetId);
    } else {
      setEvents((prev) => prev.filter((ev) => ev.id !== tempId));
      setEventConnections((current) => current.filter((conn) => conn.id !== tempConnId));
    }
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

  const handleCreateQuickBackup = (eventId) => {
    setBackupNoteDialog({ open: true, eventId, note: 'Respaldo manual' });
  };

  const handleConfirmBackup = async () => {
    const { eventId, note } = backupNoteDialog;
    setBackupNoteDialog({ open: false, eventId: null, note: '' });
    await createEventBackup({ storyId: activeStoryId, eventId, note, setLoading });
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
    openCreateEvent();
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
    openCreateEvent();
  }, [activeBoardId, activeStoryId, ensurePrimaryBoard, openCreateEvent]);

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
          onOpenCharactersDrawer={handleOpenCharactersDrawer}
          onOpenCreateEvent={() => {
            setSelectedEvent(null);
            openCreateEvent();
          }}
          onUpdateStoryCover={handleUpdateStoryCover}
          onSelectBoard={handleSelectBoard}
          onCreateBoard={handleCreateBoard}
          onRenameBoard={handleRenameBoard}
          onDeleteBoard={handleDeleteBoard}
          onChangeBoardColor={handleChangeBoardColor}
          onOpenEditEvent={handleOpenEditEvent}
          onDeleteEvent={handleDeleteEvent}
          onMoveCharacterToFolder={handleMoveCharacterToFolder}
        />

        <Box sx={{ flexGrow: 1, height: '100%', position: 'relative', display: 'flex', overflow: 'hidden' }}>
          <Box sx={{ flexGrow: 1, height: '100%', position: 'relative', minWidth: 0 }}>
            <TimelineCanvas
              events={events}
              characters={characters}
              eventConnections={eventConnections}
              hasStory={!!activeStory}
              onOpenStorySelector={onOpenStorySelector}
              activeBoardName={boards.find((b) => b.id === activeBoardId)?.name || null}
              onCreateConnection={handleCreateConnection}
              onDeleteConnection={handleDeleteConnection}
              onOpenCreateEvent={() => {
                setSelectedEvent(null);
                openCreateEvent();
              }}
              onOpenEditEvent={handleOpenEditEvent}
              onDeleteEvent={handleDeleteEvent}
              onOpenVersions={handleOpenVersions}
              onCreateBackup={handleCreateQuickBackup}
              onNodeDragStop={handleNodeDragStop}
              onDuplicateEvent={handleDuplicateEvent}
              onDuplicateEvents={handleDuplicateEvents}
              onInlineUpdateEvent={handleInlineUpdateEvent}
              onUpdateEventCharacters={handleUpdateEventCharacters}
              onQuickCreateEventAtPosition={handleQuickCreateEventAtPosition}
              onQuickCreateConnectedEvent={handleQuickCreateConnectedEvent}
            />

          {/* Speed Dial Actions */}
          <SpeedDialActions
            onOpenCreateEvent={() => {
              setSelectedEvent(null);
              openCreateEvent();
            }}
            onOpenCreateCharacter={() => {
              setSelectedCharacter(null);
              setIsCloneCharMode(false);
              openCreateChar();
            }}
          />

          {/* Quick Notes FAB */}
          <Tooltip title="Capturar Idea Rápida" placement="left">
            <Fab
              size="medium"
              color="primary"
              onClick={toggleOpen}
              sx={{
                position: 'absolute',
                bottom: { xs: 20, sm: 80 },
                right: { xs: 16, sm: 20 },
                zIndex: 10,
                boxShadow: '0 4px 20px rgba(0,0,0,0.25)',
                '&:hover': { transform: 'scale(1.08)' },
                transition: 'transform 0.15s ease',
              }}
            >
              <Badge badgeContent={notes.length} color="secondary" max={99}>
                <LightbulbOutlinedIcon sx={{ fontSize: 24 }} />
              </Badge>
            </Fab>
          </Tooltip>
        </Box>

        <CharacterDrawer
          open={charDrawerOpen}
          onClose={() => {
            setCharDrawerOpen(false);
            setFocusedCharacterId(null);
          }}
          storyId={activeStoryId}
          characters={characters}
          relationships={relationships}
          focusedCharacterId={focusedCharacterId}
          onOpenCreateCharacter={() => openCreateChar()}
          onOpenEditCharacter={(char) => {
            setSelectedCharacter(char);
            setIsCloneCharMode(false);
            openCreateChar();
          }}
          onOpenCloneCharacter={(char) => {
            setSelectedCharacter(char);
            setIsCloneCharMode(true);
            openCreateChar();
          }}
          onDeleteCharacter={handleDeleteCharacter}
          onSetCharactersGlobal={handleSetCharactersGlobal}
          onCopyCharactersAsLocal={handleCopyCharactersAsLocal}
          onRoleChange={(charId, newRole) => {
            saveCharacter({
              storyId: activeStoryId,
              charData: { role_archetype: newRole },
              selectedCharacterId: charId,
              setLoading,
            });
          }}
          onCreateRelationship={handleCreateRelationship}
          onDeleteRelationship={handleDeleteRelationship}
        />
      </Box>

      <CharacterModal
        open={charModalOpen}
        onClose={() => closeCreateChar()}
        character={selectedCharacter}
        isCloneMode={isCloneCharMode}
        onSave={handleSaveCharacter}
        onClone={handleCloneCharacter}
      />

      <EventModal
        open={eventModalOpen}
        onClose={() => closeCreateEvent()}
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

      {/* Backup note dialog */}
      <Dialog
        open={backupNoteDialog.open}
        onClose={() => setBackupNoteDialog({ open: false, eventId: null, note: '' })}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle sx={{ fontWeight: 700, fontSize: '1rem' }}>Crear respaldo manual</DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <TextField
            label="Nota del respaldo"
            value={backupNoteDialog.note}
            onChange={(e) => setBackupNoteDialog((prev) => ({ ...prev, note: e.target.value }))}
            onKeyDown={(e) => { if (e.key === 'Enter') handleConfirmBackup(); }}
            fullWidth
            autoFocus
            size="small"
          />
        </DialogContent>
        <DialogActions>
          <CustomButton variant="outlined" color="inherit" onClick={() => setBackupNoteDialog({ open: false, eventId: null, note: '' })}>Cancelar</CustomButton>
          <CustomButton onClick={handleConfirmBackup}>Crear Respaldo</CustomButton>
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
