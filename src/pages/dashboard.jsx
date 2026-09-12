import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/router';
import { Box } from '@mui/material';
import { useAuth } from '../context/AuthContext';
import { useStory } from '../context/StoryContext';
import { useLoading } from '../context/LoadingContext';
import { storyController } from '../controllers/storyController';
import { characterController } from '../controllers/characterController';
import { boardController } from '../controllers/boardController';
import { eventController } from '../controllers/eventController';
import { relationshipController } from '../controllers/relationshipController';
import SidebarLore from '../components/layout/SidebarLore';
import TimelineCanvas from '../components/canvas/TimelineCanvas';
import CharacterDrawer from '../components/characters/CharacterDrawer';
import CharacterModal from '../components/characters/CharacterModal';
import EventModal from '../components/canvas/EventModal';
import EventVersionsModal from '../components/canvas/EventVersionsModal';
import CustomLoading from '../components/common/CustomLoading';
import { APP_CONFIG } from '../constants/constants';

export default function DashboardPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { activeStory, activeStoryId, storiesLoading } = useStory();
  const { setLoading } = useLoading();

  // Core Data States
  const [characters, setCharacters] = useState([]);
  const [relationships, setRelationships] = useState([]);
  const [events, setEvents] = useState([]);
  const [eventConnections, setEventConnections] = useState([]);
  const [boards, setBoards] = useState([]);
  const [activeBoardId, setActiveBoardId] = useState(null);

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

  // Redirect unauthenticated users to login
  useEffect(() => {
    if (!authLoading && !user) {
      router.replace('/login');
    }
  }, [user, authLoading, router]);

  // Load characters, relationships, boards and (board-filtered) events for the active story
  const loadStoryData = useCallback(async (storyId, boardId = null) => {
    if (!storyId) {
      setCharacters([]);
      setRelationships([]);
      setEvents([]);
      setEventConnections([]);
      setBoards([]);
      setActiveBoardId(null);
      // Solo desactivar la carga si ya no hay historias cargándose
      setDataLoading(false);
      return;
    }

    setDataLoading(true); // <--- Garantizar estado de carga al iniciar llamadas
    try {
        const [charsRes, relsRes, boardsRes, eventsRes, connsRes] = await Promise.all([
          characterController.getAll(storyId, setLoading),
          relationshipController.getAll(storyId, setLoading),
          boardController.getAll(storyId, setLoading),
          eventController.getAll(storyId, boardId, setLoading),
          eventController.getConnections(storyId, setLoading),
        ]);

        setCharacters(charsRes.data || []);
        setRelationships(relsRes.data || []);
        setBoards(boardsRes.data || []);
        setEventConnections(connsRes.data || []);

        // Determine which board to show
        const targetBoardId = boardId
          || (boardsRes.data?.find((b) => !b.parent_board_id)?.id) // first root board
          || null;
        setActiveBoardId(targetBoardId);

        setEvents(eventsRes.data || []);
    } catch (error) {
        console.error('Failed to load story data:', error);
    } finally {
        setDataLoading(false);
    }
  }, [setLoading]);

  useEffect(() => {
      // Activar carga si hay un storyId
      if (activeStoryId) {
        loadStoryData(activeStoryId);
      } else {
        // Si no hay storyId, pero authLoading terminó, significa que no hay historia seleccionada
        if (!authLoading) {
            setDataLoading(false);
        }
      }
  }, [activeStoryId, authLoading, loadStoryData]);

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
    setActiveBoardId(boardId);
    const { data: eventsData } = await eventController.getAll(activeStoryId, boardId, setLoading);
    setEvents(eventsData || []);
    const { data: conns } = await eventController.getConnections(activeStoryId, setLoading);
    setEventConnections(conns || []);
  }, [activeStoryId, activeBoardId, setLoading]);

  const handleCreateBoard = async (name, parentBoardId = null) => {
    if (!activeStoryId) return;
    const siblings = boards.filter((b) => b.parent_board_id === (parentBoardId || null));
    const position = siblings.length;
    const { data } = await boardController.create({ story_id: activeStoryId, name, parent_board_id: parentBoardId, position }, setLoading);
    if (data) {
      setBoards((prev) => [...prev, data]);
      handleSelectBoard(data.id);
    }
  };

  const handleRenameBoard = async (boardId, newName) => {
    const { data } = await boardController.update(boardId, { name: newName }, setLoading);
    if (data) setBoards((prev) => prev.map((b) => (b.id === boardId ? data : b)));
  };

  const handleChangeBoardColor = async (boardId, color) => {
    const { data } = await boardController.update(boardId, { color }, setLoading);
    if (data) setBoards((prev) => prev.map((b) => (b.id === boardId ? data : b)));
  };

  const handleDeleteBoard = async (board) => {
    if (!window.confirm(`¿Eliminar el tablero "${board.name}"?`)) return;
    await boardController.delete(board.id, setLoading);
    setBoards((prev) => prev.filter((b) => b.id !== board.id));
    if (activeBoardId === board.id) {
        setActiveBoardId(null);
        setEvents([]);
    }
  };

  const handleSaveCharacter = async (charData) => {
    if (!activeStoryId) return;
    if (selectedCharacter && !isCloneCharMode) {
      await characterController.update(selectedCharacter.id, charData, setLoading);
    } else {
      await characterController.create({ ...charData, story_id: activeStoryId }, setLoading);
    }
    await loadStoryData(activeStoryId);
    setCharModalOpen(false);
  };

  const handleCloneCharacter = async (originalCharId, cloneOptions) => {
    if (!activeStoryId) return;
    await characterController.clone(originalCharId, { ...cloneOptions, targetStoryId: activeStoryId }, setLoading);
    await loadStoryData(activeStoryId);
    setCharModalOpen(false);
  };

  const handleDeleteCharacter = async (charId) => {
    if (window.confirm('¿Seguro que deseas eliminar este personaje?')) {
      await characterController.delete(charId, setLoading);
      await loadStoryData(activeStoryId);
    }
  };

  const handleCreateRelationship = async (relData) => {
    if (!activeStoryId) return;
    const result = await relationshipController.create({ ...relData, story_id: activeStoryId }, setLoading);
    if (!result.error) {
        await loadStoryData(activeStoryId);
    }
  };

  const handleDeleteRelationship = async (relId) => {
    const result = await relationshipController.delete(relId, setLoading);
    if (!result.error) {
        await loadStoryData(activeStoryId);
    }
  };

  const handleSaveEvent = async ({ eventData, characterIds, createBackup, backupNote }) => {
    if (!activeStoryId) return;
    if (selectedEvent) {
      await eventController.update(selectedEvent.id, eventData, null, null, null, setLoading);
      // Need to handle characterIds linking update if necessary
    } else {
      await eventController.create({ ...eventData, story_id: activeStoryId }, characterIds, activeBoardId, setLoading);
    }
    const { data: eventsData } = await eventController.getAll(activeStoryId, activeBoardId, setLoading);
    setEvents(eventsData || []);
    setEventModalOpen(false);
  };

  const handleDuplicateEvent = async (originalEvent, offset = { x: 50, y: 40 }) => {
    if (!activeStoryId || !originalEvent) return;
    const charIds = (originalEvent.event_characters || []).map((ec) => ec.character?.id || ec.character_id).filter(Boolean);
    const newOrderIndex = (Number(originalEvent.order_index) || 1) + 0.1;
    const eventPayload = {
      story_id: activeStoryId,
      title: `${originalEvent.title} (Copia)`,
      summary: originalEvent.summary || '',
      details: originalEvent.details || '',
      order_index: newOrderIndex,
      pos_x: (Number(originalEvent.pos_x) || 120) + offset.x,
      pos_y: (Number(originalEvent.pos_y) || 100) + offset.y,
    };
    await eventController.create(eventPayload, charIds, activeBoardId, setLoading);
    const { data: eventsData } = await eventController.getAll(activeStoryId, activeBoardId, setLoading);
    setEvents(eventsData || []);
  };

  const handleDeleteEvent = async (eventId) => {
    if (window.confirm('¿Eliminar evento?')) {
      await eventController.delete(eventId, setLoading);
      const { data: eventsData } = await eventController.getAll(activeStoryId, activeBoardId, setLoading);
      setEvents(eventsData || []);
    }
  };

  const [debouncedSave] = useState(() => {
    let timeoutId;
    return (eventId, newX, newY) => {
      if (timeoutId) clearTimeout(timeoutId);
      timeoutId = setTimeout(async () => {
        await eventController.savePosition(eventId, { pos_x: newX, pos_y: newY }, null);
      }, 1000); // 1 second delay
    };
  });

  const handleNodeDragStop = (eventId, newX, newY) => {
    // Actualización optimista inmediata
    setEvents(prevEvents => prevEvents.map(ev => 
      ev.id === eventId ? { ...ev, pos_x: newX, pos_y: newY } : ev
    ));
    // Guardado diferido
    debouncedSave(eventId, newX, newY);
  };

  const handleCreateQuickBackup = async (eventId) => {
    const note = prompt('Nota:', 'Respaldo manual');
    if (note !== null) {
      await eventController.createBackup(eventId, note, setLoading);
      await loadStoryData(activeStoryId);
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
    if (window.confirm('¿Restaurar evento?')) {
      await eventController.restoreVersion(versionId, setLoading);
      await loadStoryData(activeStoryId);
      setVersionsModalOpen(false);
    }
  };

  const handleUpdateStoryCover = async (storyId, coverUrl) => {
    await storyController.update(storyId, { cover_url: coverUrl }, setLoading);
  };

  if (authLoading || storiesLoading || dataLoading) {
    return <CustomLoading fullscreen message="Cargando estudio..." />;
  }

  return (
    <>
        <SidebarLore
          view="dashboard"
          story={activeStory}
          characters={characters}
          events={events}
          boards={boards}
          activeBoardId={activeBoardId}
          onOpenCharactersDrawer={() => setCharDrawerOpen(true)}
          onOpenCreateEvent={(boardId) => {
            setSelectedEvent(null);
            setEventModalOpen(true);
          }}
          onUpdateStoryCover={handleUpdateStoryCover}
          onSelectBoard={handleSelectBoard}
          onCreateBoard={handleCreateBoard}
          onRenameBoard={handleRenameBoard}
          onDeleteBoard={handleDeleteBoard}
          onChangeBoardColor={handleChangeBoardColor}
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
            onOpenEditEvent={(event) => {
              setSelectedEvent(event);
              setEventModalOpen(true);
            }}
            onDeleteEvent={handleDeleteEvent}
            onOpenVersions={handleOpenVersions}
            onCreateBackup={handleCreateQuickBackup}
            onNodeDragStop={handleNodeDragStop}
            onDuplicateEvent={handleDuplicateEvent}
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
    </>
  );
}
