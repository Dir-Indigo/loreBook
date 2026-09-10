import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/router';
import { Box } from '@mui/material';
import { useAuth } from '../context/AuthContext';
import { ApiService } from '../utils/ApiService';
import Navbar from '../components/layout/Navbar';
import SidebarLore from '../components/layout/SidebarLore';
import TimelineCanvas from '../components/canvas/TimelineCanvas';
import StoryModal from '../components/stories/StoryModal';
import CharacterDrawer from '../components/characters/CharacterDrawer';
import CharacterModal from '../components/characters/CharacterModal';
import EventModal from '../components/canvas/EventModal';
import EventVersionsModal from '../components/canvas/EventVersionsModal';
import CustomLoading from '../components/common/CustomLoading';
import { APP_CONFIG } from '../constants/constants';

export default function DashboardPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  // Core Data States
  const [stories, setStories] = useState([]);
  const [activeStoryId, setActiveStoryId] = useState(null);
  const [characters, setCharacters] = useState([]);
  const [relationships, setRelationships] = useState([]);
  const [events, setEvents] = useState([]);

  // UI / Modal States
  const [dataLoading, setDataLoading] = useState(true);
  const [storyModalOpen, setStoryModalOpen] = useState(false);
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

  // Load all stories for user
  const loadStories = useCallback(async () => {
    if (!user) return;
    setDataLoading(true);
    const { data } = await ApiService.getStories(user.id);
    if (data && data.length > 0) {
      setStories(data);
      if (!activeStoryId || !data.some((s) => s.id === activeStoryId)) {
        setActiveStoryId(data[0].id);
      }
    } else {
      setStories([]);
      setActiveStoryId(null);
    }
    setDataLoading(false);
  }, [user, activeStoryId]);

  useEffect(() => {
    if (user) {
      loadStories();
    }
  }, [user, loadStories]);

  // Load characters, relationships, and events for the active story
  const loadStoryData = useCallback(async (storyId) => {
    if (!storyId) {
      setCharacters([]);
      setRelationships([]);
      setEvents([]);
      return;
    }

    const [charsRes, relsRes, eventsRes] = await Promise.all([
      ApiService.getCharacters(storyId),
      ApiService.getCharacterRelationships(storyId),
      ApiService.getEvents(storyId),
    ]);

    if (charsRes.data) setCharacters(charsRes.data);
    if (relsRes.data) setRelationships(relsRes.data);
    if (eventsRes.data) setEvents(eventsRes.data);
  }, []);

  useEffect(() => {
    if (activeStoryId) {
      loadStoryData(activeStoryId);
    }
  }, [activeStoryId, loadStoryData]);

  const activeStory = stories.find((s) => s.id === activeStoryId) || null;

  // ==========================================
  // STORY HANDLERS
  // ==========================================
  const handleCreateStory = async (storyData) => {
    if (!user) return;
    const { data, error } = await ApiService.createStory({
      ...storyData,
      user_id: user.id,
    });
    if (!error && data) {
      await loadStories();
      setActiveStoryId(data.id);
    }
  };

  const handleUpdateStory = async (storyId, updates) => {
    const { error } = await ApiService.updateStory(storyId, updates);
    if (!error) {
      await loadStories();
    }
  };

  const handleDeleteStory = async (storyId) => {
    if (window.confirm('¿Seguro que deseas eliminar esta historia y todo su contenido?')) {
      const { error } = await ApiService.deleteStory(storyId);
      if (!error) {
        await loadStories();
      }
    }
  };

  // ==========================================
  // CHARACTER HANDLERS
  // ==========================================
  const handleSaveCharacter = async (charData) => {
    if (!activeStoryId) return;

    if (selectedCharacter && !isCloneCharMode) {
      const { error } = await ApiService.updateCharacter(selectedCharacter.id, charData);
      if (!error) {
        await loadStoryData(activeStoryId);
        setCharModalOpen(false);
      }
    } else {
      const { error } = await ApiService.createCharacter({
        ...charData,
        story_id: activeStoryId,
      });
      if (!error) {
        await loadStoryData(activeStoryId);
        setCharModalOpen(false);
      }
    }
  };

  const handleCloneCharacter = async (originalCharId, cloneOptions) => {
    if (!activeStoryId) return;
    const { error } = await ApiService.cloneCharacter(originalCharId, {
      ...cloneOptions,
      targetStoryId: activeStoryId,
    });
    if (!error) {
      await loadStoryData(activeStoryId);
      setCharModalOpen(false);
    }
  };

  const handleDeleteCharacter = async (charId) => {
    if (window.confirm('¿Seguro que deseas eliminar este personaje?')) {
      const { error } = await ApiService.deleteCharacter(charId);
      if (!error) {
        await loadStoryData(activeStoryId);
      }
    }
  };

  const handleCreateRelationship = async (relData) => {
    if (!activeStoryId) return;
    const { error } = await ApiService.createRelationship({
      ...relData,
      story_id: activeStoryId,
    });
    if (!error) {
      await loadStoryData(activeStoryId);
    }
  };

  const handleDeleteRelationship = async (relId) => {
    const { error } = await ApiService.deleteRelationship(relId);
    if (!error) {
      await loadStoryData(activeStoryId);
    }
  };

  // ==========================================
  // EVENT & TIMELINE HANDLERS
  // ==========================================
  const handleSaveEvent = async ({ eventData, characterIds, createBackup, backupNote }) => {
    if (!activeStoryId) return;

    if (selectedEvent) {
      const { error } = await ApiService.updateEvent(
        selectedEvent.id,
        eventData,
        characterIds,
        createBackup,
        backupNote
      );
      if (!error) {
        await loadStoryData(activeStoryId);
        setEventModalOpen(false);
      }
    } else {
      const { error } = await ApiService.createEvent(
        {
          ...eventData,
          story_id: activeStoryId,
        },
        characterIds
      );
      if (!error) {
        await loadStoryData(activeStoryId);
        setEventModalOpen(false);
      }
    }
  };

  /**
   * Duplicate Event via Ctrl+C & Ctrl+V (Requirement 1.2)
   */
  const handleDuplicateEvent = async (originalEvent, offset = { x: 50, y: 40 }) => {
    if (!activeStoryId || !originalEvent) return;

    const charIds = (originalEvent.event_characters || [])
      .map((ec) => ec.character?.id || ec.character_id)
      .filter(Boolean);

    const rawTitle = `${originalEvent.title || 'Evento'} (Copia)`;
    const newTitle = rawTitle.substring(0, APP_CONFIG.EVENT_TITLE_MAX_LENGTH);
    const newOrderIndex = (Number(originalEvent.order_index) || 1) + 0.1;

    const eventPayload = {
      story_id: activeStoryId,
      title: newTitle,
      summary: originalEvent.summary || '',
      details: originalEvent.details || '',
      order_index: newOrderIndex,
      importance_level: originalEvent.importance_level || 'medium',
      color_tag: originalEvent.color_tag || '#8c6d53',
      pos_x: (Number(originalEvent.pos_x) || 120) + offset.x,
      pos_y: (Number(originalEvent.pos_y) || 100) + offset.y,
    };

    const { error } = await ApiService.createEvent(eventPayload, charIds);
    if (!error) {
      await loadStoryData(activeStoryId);
    }
  };

  const handleDeleteEvent = async (eventId) => {
    if (window.confirm('¿Seguro que deseas eliminar este evento de la línea de tiempo?')) {
      const { error } = await ApiService.deleteEvent(eventId);
      if (!error) {
        await loadStoryData(activeStoryId);
      }
    }
  };

  const handleNodeDragStop = async (eventId, newX, newY) => {
    await ApiService.saveEventPosition(eventId, {
      pos_x: newX,
      pos_y: newY,
    });
  };

  const handleCreateQuickBackup = async (eventId) => {
    const note = prompt('Nota o motivo para este respaldo:', 'Respaldo manual');
    if (note !== null) {
      const { error } = await ApiService.createEventBackup(eventId, note);
      if (!error) {
        await loadStoryData(activeStoryId);
      }
    }
  };

  const handleOpenVersions = async (eventId, title) => {
    setVersionEventId(eventId);
    setVersionEventTitle(title);
    setVersionsModalOpen(true);
    setVersionsLoading(true);

    const { data } = await ApiService.getEventVersions(eventId);
    if (data) {
      setEventVersions(data);
    }
    setVersionsLoading(false);
  };

  const handleRestoreVersion = async (versionId) => {
    if (window.confirm('¿Deseas restaurar este evento al estado guardado en esta versión?')) {
      const { error } = await ApiService.restoreEventVersion(versionId);
      if (!error) {
        await loadStoryData(activeStoryId);
        setVersionsModalOpen(false);
      }
    }
  };

  const handleUpdateStoryCover = async (storyId, coverUrl) => {
    const { error } = await ApiService.updateStory(storyId, { cover_url: coverUrl });
    if (!error) {
      await loadStories();
    }
  };

  // Next order index calculation
  const nextOrderIndex = events.length > 0
    ? Math.max(...events.map((e) => e.order_index || 0)) + 1
    : 1;

  if (authLoading || dataLoading) {
    return (
      <CustomLoading
        fullscreen
        message="Cargando tu estudio narrativo..."
        subtitle="Sincronizando universos, personajes y líneas de tiempo"
      />
    );
  }

  return (
    <Box
      sx={{
        width: '100vw',
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        bgcolor: 'background.default',
        overflow: 'hidden',
      }}
    >
      {/* Top Navbar */}
      <Navbar
        activeStory={activeStory}
        onOpenStorySelector={() => setStoryModalOpen(true)}
      />

      {/* Main Workspace (100% viewport - RNF-4) */}
      <Box
        sx={{
          flexGrow: 1,
          display: 'flex',
          width: '100%',
          height: 'calc(100vh - 52px)',
          overflow: 'hidden',
          position: 'relative',
        }}
      >
        {/* Left Sidebar */}
        <SidebarLore
          story={activeStory}
          characters={characters}
          events={events}
          onOpenStorySelector={() => setStoryModalOpen(true)}
          onOpenCharactersDrawer={() => setCharDrawerOpen(true)}
          onOpenCreateEvent={() => {
            setSelectedEvent(null);
            setEventModalOpen(true);
          }}
          onUpdateStoryCover={handleUpdateStoryCover}
        />

        {/* Center Canvas Area */}
        <Box sx={{ flexGrow: 1, height: '100%', position: 'relative' }}>
          <TimelineCanvas
            events={events}
            characters={characters}
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
      </Box>

      {/* Modals & Drawers */}
      <StoryModal
        open={storyModalOpen}
        onClose={() => setStoryModalOpen(false)}
        stories={stories}
        activeStoryId={activeStoryId}
        onSelectStory={(id) => setActiveStoryId(id)}
        onCreateStory={handleCreateStory}
        onUpdateStory={handleUpdateStory}
        onDeleteStory={handleDeleteStory}
      />

      <CharacterDrawer
        open={charDrawerOpen}
        onClose={() => setCharDrawerOpen(false)}
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
        nextOrderIndex={nextOrderIndex}
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
    </Box>
  );
}
