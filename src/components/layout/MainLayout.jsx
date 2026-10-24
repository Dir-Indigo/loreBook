import React, { useState, useCallback, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import { Box } from '@mui/material';
import Navbar from './Navbar';
import SidebarLore from './SidebarLore';
import SidebarDetail from './sidebar-detail/SidebarDetail';
import StoryModal from '../stories/StoryModal';
import PullToRefresh from '../common/PullToRefresh';
import CharacterModal from '../characters/CharacterModal';
import { useStory } from '../../context/StoryContext';
import { useWorkspace } from '../../context/WorkspaceContext';
import { useLoading } from '../../context/LoadingContext';
import { useGlobalActions } from '../../context/GlobalActionsContext';
import { useCharacterDrawer } from '../../context/CharacterDrawerContext';
import { useQuickNotes } from '../../context/QuickNotesContext';
import { useWorkspaceView, WORKSPACE_VIEW_KEYS } from '../../context/WorkspaceViewContext';

export default function MainLayout({ children }) {
  const router = useRouter();
  const { setActiveView } = useWorkspaceView();
  const { stories, activeStory, activeStoryId, changeActiveStory, createStory, updateStory, deleteStory } = useStory();
  const {
    characters,
    relationships,
    characterFolders,
    characterTags,
    customArchetypes,
    saveCharacter,
    deleteCharacter,
    updateCharactersGlobal,
    copyCharactersAsLocal,
    createRelationship,
    deleteRelationship,
  } = useWorkspace();
  const { setLoading } = useLoading();
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

  const handleOpenStorySelector = () => setStoryModalOpen(true);

  const isAuthPage = router.pathname === '/login';

  if (isAuthPage) {
    return <Box sx={{ height: '100vh', width: '100vw' }}>{children}</Box>;
  }

  // Expose modal handler to children by cloning them
  const childrenWithProps = React.Children.map(children, (child) =>
    React.isValidElement(child)
      ? React.cloneElement(child, { onOpenStorySelector: handleOpenStorySelector })
      : child
  );

  // ─── Character CRUD handlers (shared across all pages via context) ───────────

  const handleSaveCharacter = useCallback(async (charData) => {
    if (!activeStoryId) return;
    await saveCharacter({
      storyId: activeStoryId,
      charData,
      selectedCharacterId: selectedCharacter?.id || null,
      isCloneMode,
      cloneOptions: null,
      setLoading,
    });
    clearCharSelection();
    closeCreateChar();
  }, [activeStoryId, selectedCharacter, isCloneMode, saveCharacter, setLoading, clearCharSelection, closeCreateChar]);

  const handleCloneCharacter = useCallback(async (originalCharId, cloneOptions) => {
    if (!activeStoryId) return;
    await saveCharacter({
      storyId: activeStoryId,
      selectedCharacterId: originalCharId,
      isCloneMode: true,
      cloneOptions,
      setLoading,
    });
    clearCharSelection();
    closeCreateChar();
  }, [activeStoryId, saveCharacter, setLoading, clearCharSelection, closeCreateChar]);

  const handleDeleteCharacter = useCallback(async (charId) => {
    await deleteCharacter({ storyId: activeStoryId, charId, setLoading });
  }, [activeStoryId, deleteCharacter, setLoading]);

  const handleSetCharactersGlobal = useCallback(async (characterIds, isGlobal) => {
    if (!characterIds?.length) return;
    await updateCharactersGlobal({ storyId: activeStoryId, characterIds, isGlobal, setLoading });
  }, [activeStoryId, updateCharactersGlobal, setLoading]);

  const handleCopyCharactersAsLocal = useCallback(async (characterIds) => {
    if (!characterIds?.length || !activeStoryId) return;
    return copyCharactersAsLocal({ storyId: activeStoryId, characterIds, setLoading });
  }, [activeStoryId, copyCharactersAsLocal, setLoading]);

  const handleCreateRelationship = useCallback(async (relData) => {
    if (!activeStoryId) return;
    await createRelationship({ storyId: activeStoryId, relData, setLoading });
  }, [activeStoryId, createRelationship, setLoading]);

  const handleDeleteRelationship = useCallback(async (relId) => {
    await deleteRelationship({ storyId: activeStoryId, relId, setLoading });
  }, [activeStoryId, deleteRelationship, setLoading]);

  const handleRoleChange = useCallback((charId, newRole) => {
    saveCharacter({
      storyId: activeStoryId,
      charData: { role_archetype: newRole },
      selectedCharacterId: charId,
      setLoading,
    });
  }, [activeStoryId, saveCharacter, setLoading]);

  return (
    <PullToRefresh>
      <Box sx={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
        <Navbar activeStory={activeStory} onOpenStorySelector={handleOpenStorySelector} />

        <Box sx={{ flexGrow: 1, display: 'flex', overflow: 'hidden', position: 'relative' }}>
          {/* ─── Persistent Primary Left Sidebar (El Padre) ──────────────────── */}
          <SidebarLore
            story={activeStory}
            characters={characters}
            characterFolders={characterFolders}
            onOpenCharactersDrawer={openCharacterDrawer}
            onOpenStorySelector={handleOpenStorySelector}
            onUpdateStoryCover={(storyId, coverUrl) => updateStory(storyId, { cover_url: coverUrl })}
          />

          {/* ─── Unified Secondary Sidebar (El Hijo Único: SidebarDetail) ─────── */}
          <SidebarDetail
            storyId={activeStoryId}
            characters={characters}
            relationships={relationships}
            focusedCharacterId={focusedCharacterId}
            onOpenCreateCharacter={() => {
              prepareCreateChar();
              openCreateChar();
            }}
            onOpenEditCharacter={(char) => {
              prepareEditChar(char);
              openCreateChar();
            }}
            onOpenCloneCharacter={(char) => {
              prepareCloneChar(char);
              openCreateChar();
            }}
            onDeleteCharacter={handleDeleteCharacter}
            onSetCharactersGlobal={handleSetCharactersGlobal}
            onCopyCharactersAsLocal={handleCopyCharactersAsLocal}
            onRoleChange={handleRoleChange}
            onCreateRelationship={handleCreateRelationship}
            onDeleteRelationship={handleDeleteRelationship}
          />

          {/* ─── Page Content (Lienzo / Workspace amplio y despejado) ───────── */}
          <Box sx={{ flexGrow: 1, height: '100%', overflow: 'hidden', display: 'flex', minWidth: 0 }}>
            {childrenWithProps}
          </Box>
        </Box>

        {/* ─── Persistent CharacterModal ───────────────────────────────────── */}
        <CharacterModal
          open={charModalOpen}
          onClose={() => {
            clearCharSelection();
            closeCreateChar();
          }}
          character={selectedCharacter}
          isCloneMode={isCloneMode}
          availableTags={characterTags}
          availableFolders={characterFolders}
          customArchetypes={customArchetypes}
          onSave={handleSaveCharacter}
          onClone={handleCloneCharacter}
        />

        <StoryModal
          open={storyModalOpen}
          onClose={() => setStoryModalOpen(false)}
          stories={stories}
          activeStoryId={activeStoryId}
          onSelectStory={(id) => {
            changeActiveStory(id);
            if (router.pathname.startsWith('/characters/')) {
              // Stay on dashboard, switch to characters view without full reload
              setActiveView(WORKSPACE_VIEW_KEYS.CHARACTERS);
              router.push('/dashboard');
            }
          }}
          onCreateStory={createStory}
          onUpdateStory={updateStory}
          onDeleteStory={deleteStory}
        />
      </Box>
    </PullToRefresh>
  );
}
