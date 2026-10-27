import React, { useState, useCallback, useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/router';
import { Box } from '@mui/material';
import Navbar from './Navbar';
import SidebarLore from './SidebarLore';
import SidebarDetail from './sidebar-detail/SidebarDetail';
import PullToRefresh from '../common/PullToRefresh';
import { useStory } from '../../context/StoryContext';
import { useWorkspaceData } from '../../context/WorkspaceContext';
import { StorySelectorProvider } from '../../context/StorySelectorContext';
import { useCharacterActions } from '../../hooks/useCharacterActions';
import { useGlobalActions } from '../../context/GlobalActionsContext';
import { useCharacterDrawer } from '../../context/CharacterDrawerContext';
import { useQuickNotes } from '../../context/QuickNotesContext';
import { useWorkspaceView, WORKSPACE_VIEW_KEYS } from '../../context/WorkspaceViewContext';

// Modales pesados: se descargan solo la primera vez que se abren
const StoryModal = dynamic(() => import('../stories/StoryModal'), { ssr: false });
const CharacterModal = dynamic(() => import('../characters/CharacterModal'), { ssr: false });

export default function MainLayout({ children }) {
  const router = useRouter();
  const { setActiveView } = useWorkspaceView();
  const { stories, activeStory, activeStoryId, changeActiveStory, createStory, updateStory, deleteStory } = useStory();
  const { characters, relationships, characterFolders, characterTags, customArchetypes } = useWorkspaceData();
  const { charModalOpen, openCreateChar, closeCreateChar } = useGlobalActions();
  const { isOpen: isNotesOpen, setIsOpen: setNotesOpen } = useQuickNotes();
  const {
    open: charDrawerOpen,
    focusedCharacterId,
    selectedCharacter,
    isCloneMode,
    openDrawer: openCharacterDrawer,
    closeDrawer: closeCharacterDrawer,
    prepareCreateChar,
    prepareEditChar,
    prepareCloneChar,
    clearCharSelection,
  } = useCharacterDrawer();

  // Mutual exclusion: only ONE secondary panel (Notes OR Characters) open at a time
  // to avoid stacking multiple sidebars and stretching the workspace sheet
  const lastSecondaryRef = useRef(null);
  useEffect(() => {
    if (charDrawerOpen && isNotesOpen) {
      if (lastSecondaryRef.current === 'char') {
        closeCharacterDrawer();
      } else {
        setNotesOpen(false);
      }
    }
    if (charDrawerOpen && !isNotesOpen) lastSecondaryRef.current = 'char';
    if (isNotesOpen && !charDrawerOpen) lastSecondaryRef.current = 'notes';
  }, [charDrawerOpen, isNotesOpen, closeCharacterDrawer, setNotesOpen]);

  const [storyModalOpen, setStoryModalOpen] = useState(false);
  const [storyModalMounted, setStoryModalMounted] = useState(false);
  const [charModalMounted, setCharModalMounted] = useState(false);
  useEffect(() => { if (storyModalOpen) setStoryModalMounted(true); }, [storyModalOpen]);
  useEffect(() => { if (charModalOpen) setCharModalMounted(true); }, [charModalOpen]);

  const handleOpenStorySelector = useCallback(() => setStoryModalOpen(true), []);
  const handleCloseStorySelector = useCallback(() => setStoryModalOpen(false), []);

  // ─── Character CRUD handlers (compartidos por todas las páginas) ─────────────
  const handleCloseCharacterModal = useCallback(() => {
    clearCharSelection();
    closeCreateChar();
  }, [clearCharSelection, closeCreateChar]);

  const {
    handleSave: handleSaveCharacter,
    handleClone: handleCloneCharacter,
    handleDelete: handleDeleteCharacter,
    handleSetGlobal: handleSetCharactersGlobal,
    handleCopyAsLocal: handleCopyCharactersAsLocal,
    handleCreateRelationship,
    handleDeleteRelationship,
    handleRoleChange,
  } = useCharacterActions({ selectedCharacter, isCloneMode, onSaved: handleCloseCharacterModal });

  const handleOpenCreateCharacter = useCallback(() => {
    prepareCreateChar();
    openCreateChar();
  }, [prepareCreateChar, openCreateChar]);

  const handleOpenEditCharacter = useCallback((char) => {
    prepareEditChar(char);
    openCreateChar();
  }, [prepareEditChar, openCreateChar]);

  const handleOpenCloneCharacter = useCallback((char) => {
    prepareCloneChar(char);
    openCreateChar();
  }, [prepareCloneChar, openCreateChar]);

  const handleUpdateStoryCover = useCallback(
    (storyId, coverUrl) => updateStory(storyId, { cover_url: coverUrl }),
    [updateStory]
  );

  const handleSelectStory = useCallback((id) => {
    changeActiveStory(id);
    if (router.pathname.startsWith('/characters/')) {
      // Stay on dashboard, switch to characters view without full reload
      setActiveView(WORKSPACE_VIEW_KEYS.CHARACTERS);
      router.push('/dashboard');
    }
  }, [changeActiveStory, router, setActiveView]);

  // Páginas a pantalla completa, sin la estructura de la app (barras laterales, navbar…)
  const isAuthPage = ['/', '/login', '/404'].includes(router.pathname);

  // El early return va después de todos los hooks para respetar las reglas de hooks
  if (isAuthPage) {
    return <Box sx={{ height: '100dvh', width: '100vw' }}>{children}</Box>;
  }

  return (
    <StorySelectorProvider value={handleOpenStorySelector}>
      <PullToRefresh>
        <Box sx={{ display: 'flex', flexDirection: 'column', height: '100dvh', overflow: 'hidden' }}>
          <Navbar activeStory={activeStory} onOpenStorySelector={handleOpenStorySelector} />

          <Box sx={{ flexGrow: 1, display: 'flex', overflow: 'hidden', position: 'relative' }}>
            {/* ─── Persistent Primary Left Sidebar (El Padre) ──────────────────── */}
            <SidebarLore
              story={activeStory}
              characters={characters}
              characterFolders={characterFolders}
              onOpenCharactersDrawer={openCharacterDrawer}
              onOpenStorySelector={handleOpenStorySelector}
              onUpdateStoryCover={handleUpdateStoryCover}
            />

            {/* ─── Unified Secondary Sidebar (El Hijo Único: SidebarDetail) ─────── */}
            <SidebarDetail
              storyId={activeStoryId}
              characters={characters}
              relationships={relationships}
              focusedCharacterId={focusedCharacterId}
              onOpenCreateCharacter={handleOpenCreateCharacter}
              onOpenEditCharacter={handleOpenEditCharacter}
              onOpenCloneCharacter={handleOpenCloneCharacter}
              onDeleteCharacter={handleDeleteCharacter}
              onSetCharactersGlobal={handleSetCharactersGlobal}
              onCopyCharactersAsLocal={handleCopyCharactersAsLocal}
              onRoleChange={handleRoleChange}
              onCreateRelationship={handleCreateRelationship}
              onDeleteRelationship={handleDeleteRelationship}
            />

            {/* ─── Page Content (Lienzo / Workspace amplio y despejado) ───────── */}
            <Box sx={{ flexGrow: 1, height: '100%', overflow: 'hidden', display: 'flex', minWidth: 0 }}>
              {children}
            </Box>
          </Box>

          {/* ─── Persistent CharacterModal ───────────────────────────────────── */}
          {charModalMounted && (
            <CharacterModal
              open={charModalOpen}
              onClose={handleCloseCharacterModal}
              character={selectedCharacter}
              isCloneMode={isCloneMode}
              availableTags={characterTags}
              availableFolders={characterFolders}
              customArchetypes={customArchetypes}
              onSave={handleSaveCharacter}
              onClone={handleCloneCharacter}
            />
          )}

          {storyModalMounted && (
            <StoryModal
              open={storyModalOpen}
              onClose={handleCloseStorySelector}
              stories={stories}
              activeStoryId={activeStoryId}
              onSelectStory={handleSelectStory}
              onCreateStory={createStory}
              onUpdateStory={updateStory}
              onDeleteStory={deleteStory}
            />
          )}
        </Box>
      </PullToRefresh>
    </StorySelectorProvider>
  );
}
