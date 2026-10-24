import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Box,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Typography,
  TextField,
  Snackbar,
  Alert,
  Fab,
  Badge,
  Tooltip,
} from '@mui/material';
import LightbulbOutlinedIcon from '@mui/icons-material/LightbulbOutlined';
import { useStory } from '../../../context/StoryContext';
import { useLoading } from '../../../context/LoadingContext';
import { useWorkspace } from '../../../context/WorkspaceContext';
import { useQuickNotes } from '../../../context/QuickNotesContext';
import { useGlobalActions } from '../../../context/GlobalActionsContext';
import { useCharacterDrawer } from '../../../context/CharacterDrawerContext';
import { useSidebarDetail, DETAIL_VIEWS } from '../../../context/SidebarDetailContext';
import TimelineCanvas from '../../canvas/TimelineCanvas';
import EventModal from '../../canvas/EventModal';
import EventVersionsModal from '../../canvas/EventVersionsModal';
import SpeedDialActions from '../../common/SpeedDialActions';
import CustomButton from '../../common/CustomButton';

export default function EventsWorkspaceView({ onOpenStorySelector }) {
  const { activeStory, activeStoryId } = useStory();
  const { setLoading } = useLoading();
  const { notes } = useQuickNotes();
  const { openDetail } = useSidebarDetail();
  const { eventModalOpen, closeCreateEvent, openCreateEvent, openCreateChar } = useGlobalActions();
  const { prepareCreateChar } = useCharacterDrawer();

  const {
    characters,
    events,
    setEvents,
    allEvents,
    eventConnections,
    boards,
    activeBoardId,
    setActiveBoardId,
    ensurePrimaryBoard,
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
  } = useWorkspace();

  const [selectedEvent, setSelectedEvent] = useState(null);
  const [versionsModalOpen, setVersionsModalOpen] = useState(false);
  const [versionEventId, setVersionEventId] = useState(null);
  const [versionEventTitle, setVersionEventTitle] = useState('');
  const [eventVersions, setEventVersions] = useState([]);
  const [versionsLoading, setVersionsLoading] = useState(false);
  const [pendingConfirmation, setPendingConfirmation] = useState(null);
  const [feedback, setFeedback] = useState(null);

  // Backup note dialog
  const [backupNoteDialog, setBackupNoteDialog] = useState({ open: false, eventId: null, note: '' });

  // Optimistic Connection Handlers
  const handleCreateConnection = async (sourceEventId, targetEventId) => {
    await createConnection({ storyId: activeStoryId, sourceEventId, targetEventId, setLoading });
  };

  const handleDeleteConnection = async (sourceEventId, targetEventId) => {
    await deleteConnection({ storyId: activeStoryId, sourceEventId, targetEventId, setLoading });
  };

  const handleSaveEvent = async (eventData) => {
    await saveEvent({
      storyId: activeStoryId,
      boardId: activeBoardId,
      eventData,
      selectedEventId: selectedEvent?.id || null,
      setLoading,
    });
    setSelectedEvent(null);
    closeCreateEvent();
  };

  const handleDeleteEvent = async (eventId) => {
    await deleteEvent({ storyId: activeStoryId, eventId, setLoading });
    if (selectedEvent?.id === eventId) {
      setSelectedEvent(null);
      closeCreateEvent();
    }
  };

  const handleDuplicateEvent = async (eventId) => {
    await duplicateEvent({ storyId: activeStoryId, eventId, setLoading });
  };

  const handleDuplicateEvents = async (eventIds) => {
    await duplicateEvents({ storyId: activeStoryId, eventIds, setLoading });
  };

  const handleInlineUpdateEvent = async (eventId, fields) => {
    setEvents((prev) => prev.map((ev) => (ev.id === eventId ? { ...ev, ...fields } : ev)));
    await saveEvent({
      storyId: activeStoryId,
      boardId: activeBoardId,
      eventData: fields,
      selectedEventId: eventId,
      setLoading,
    });
  };

  const handleUpdateEventCharacters = async (eventId, characterIds) => {
    await handleInlineUpdateEvent(eventId, { character_ids: characterIds });
  };

  const handleQuickCreateEventAtPosition = async ({ x, y, orderIndex }) => {
    let resolvedBoardId = activeBoardId;
    if (!resolvedBoardId) {
      resolvedBoardId = await ensurePrimaryBoard({ storyId: activeStoryId, setLoading });
    }
    if (!resolvedBoardId) {
      setFeedback('Primero crea un tablero narrativo para guardar eventos.');
      return;
    }

    const defaultTitle = `Evento #${orderIndex || events.length + 1}`;
    await saveEvent({
      storyId: activeStoryId,
      boardId: resolvedBoardId,
      eventData: {
        title: defaultTitle,
        pos_x: x,
        pos_y: y,
        order_index: orderIndex || events.length + 1,
        event_type: 'plot',
      },
      selectedEventId: null,
      setLoading,
    });
  };

  const handleQuickCreateConnectedEvent = async ({ sourceEventId, x, y, orderIndex }) => {
    let resolvedBoardId = activeBoardId;
    if (!resolvedBoardId) {
      resolvedBoardId = await ensurePrimaryBoard({ storyId: activeStoryId, setLoading });
    }
    if (!resolvedBoardId) return;

    const sourceEvent = events.find((e) => e.id === sourceEventId);
    const newTitle = sourceEvent ? `Secuela de "${sourceEvent.title}"` : `Nuevo Evento #${orderIndex}`;

    const createdEvent = await saveEvent({
      storyId: activeStoryId,
      boardId: resolvedBoardId,
      eventData: {
        title: newTitle,
        pos_x: x,
        pos_y: y,
        order_index: orderIndex,
        event_type: sourceEvent?.event_type || 'plot',
      },
      selectedEventId: null,
      setLoading,
    });

    if (createdEvent?.id && sourceEventId) {
      await createConnection({
        storyId: activeStoryId,
        sourceEventId,
        targetEventId: createdEvent.id,
        setLoading,
      });
    }
  };

  // Debounced auto-save for dragged nodes
  const debouncedSave = useMemo(() => {
    const timers = {};
    return (id, x, y) => {
      if (timers[id]) clearTimeout(timers[id]);
      timers[id] = setTimeout(() => {
        saveEventPosition({ storyId: activeStoryId, eventId: id, posX: x, posY: y });
        delete timers[id];
      }, 500);
    };
  }, [activeStoryId, saveEventPosition]);

  const handleNodeDragStop = (draggedNodes = []) => {
    setEvents((prevEvents) =>
      prevEvents.map((event) => {
        const movedNode = draggedNodes.find((node) => node.id === event.id);
        return movedNode
          ? { ...event, pos_x: movedNode.position.x, pos_y: movedNode.position.y }
          : event;
      })
    );

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

  const handleOpenEditEvent = async (event) => {
    const { data: completeEvent } = await getEventDetails({ eventId: event.id, setLoading });
    setSelectedEvent(completeEvent || event);
    openCreateEvent();
  };

  const handleNavigateToConnectedEvent = useCallback(async (targetEvent) => {
    setSelectedEvent(targetEvent);
    try {
      const { data: completeEvent } = await getEventDetails({ eventId: targetEvent.id });
      if (completeEvent) {
        setSelectedEvent((curr) => (curr?.id === targetEvent.id ? completeEvent : curr));
      }
    } catch {
      // Keep targetEvent if background fetch fails
    }
  }, [getEventDetails]);

  return (
    <Box sx={{ flexGrow: 1, height: '100%', position: 'relative', display: 'flex', overflow: 'hidden', minWidth: 0 }}>
      <Box sx={{ flexGrow: 1, height: '100%', position: 'relative', minWidth: 0 }}>
        <TimelineCanvas
          events={events}
          characters={characters}
          eventConnections={eventConnections}
          hasStory={Boolean(activeStory)}
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
            prepareCreateChar();
            openCreateChar();
          }}
        />

        {/* Quick Notes FAB */}
        <Tooltip title="Capturar Idea Rápida" placement="left">
          <Fab
            size="medium"
            color="primary"
            onClick={() => openDetail(DETAIL_VIEWS.NOTES)}
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

      {/* Modals & Dialogs for Canvas */}
      <EventModal
        open={eventModalOpen}
        onClose={() => closeCreateEvent()}
        event={selectedEvent}
        characters={characters}
        allEvents={allEvents}
        eventConnections={eventConnections}
        nextOrderIndex={events.length > 0 ? Math.max(...events.map((e) => e.order_index || 0)) + 1 : 1}
        onSave={handleSaveEvent}
        onNavigateToEvent={handleNavigateToConnectedEvent}
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
    </Box>
  );
}
