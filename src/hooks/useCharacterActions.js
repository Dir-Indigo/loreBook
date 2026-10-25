import { useCallback, useMemo } from 'react';
import { useStory } from '../context/StoryContext';
import { useLoading } from '../context/LoadingContext';
import { useWorkspaceActions } from '../context/WorkspaceContext';

/**
 * Acciones de personajes y relaciones ligadas a la historia activa.
 * Resuelve storyId y setLoading una sola vez para no repetirlos en cada llamada.
 */
export function useCharacterActions({ selectedCharacter, isCloneMode, onSaved } = {}) {
  const { activeStoryId } = useStory();
  const { setLoading } = useLoading();
  const {
    saveCharacter,
    deleteCharacter,
    updateCharactersGlobal,
    copyCharactersAsLocal,
    createRelationship,
    deleteRelationship,
  } = useWorkspaceActions();

  const selectedCharacterId = selectedCharacter?.id || null;

  const handleSave = useCallback(async (charData) => {
    if (!activeStoryId) return;
    await saveCharacter({
      storyId: activeStoryId,
      charData,
      selectedCharacterId,
      isCloneMode,
      cloneOptions: null,
      setLoading,
    });
    onSaved?.();
  }, [activeStoryId, selectedCharacterId, isCloneMode, saveCharacter, setLoading, onSaved]);

  const handleClone = useCallback(async (originalCharId, cloneOptions) => {
    if (!activeStoryId) return;
    await saveCharacter({
      storyId: activeStoryId,
      selectedCharacterId: originalCharId,
      isCloneMode: true,
      cloneOptions,
      setLoading,
    });
    onSaved?.();
  }, [activeStoryId, saveCharacter, setLoading, onSaved]);

  const handleDelete = useCallback((charId) => (
    deleteCharacter({ storyId: activeStoryId, charId, setLoading })
  ), [activeStoryId, deleteCharacter, setLoading]);

  const handleSetGlobal = useCallback(async (characterIds, isGlobal) => {
    if (!characterIds?.length) return;
    await updateCharactersGlobal({ storyId: activeStoryId, characterIds, isGlobal, setLoading });
  }, [activeStoryId, updateCharactersGlobal, setLoading]);

  const handleCopyAsLocal = useCallback((characterIds) => {
    if (!characterIds?.length || !activeStoryId) return undefined;
    return copyCharactersAsLocal({ storyId: activeStoryId, characterIds, setLoading });
  }, [activeStoryId, copyCharactersAsLocal, setLoading]);

  const handleCreateRelationship = useCallback(async (relData) => {
    if (!activeStoryId) return;
    await createRelationship({ storyId: activeStoryId, relData, setLoading });
  }, [activeStoryId, createRelationship, setLoading]);

  const handleDeleteRelationship = useCallback((relId) => (
    deleteRelationship({ storyId: activeStoryId, relId, setLoading })
  ), [activeStoryId, deleteRelationship, setLoading]);

  const handleRoleChange = useCallback((charId, newRole) => {
    saveCharacter({
      storyId: activeStoryId,
      charData: { role_archetype: newRole },
      selectedCharacterId: charId,
      setLoading,
    });
  }, [activeStoryId, saveCharacter, setLoading]);

  return useMemo(() => ({
    handleSave,
    handleClone,
    handleDelete,
    handleSetGlobal,
    handleCopyAsLocal,
    handleCreateRelationship,
    handleDeleteRelationship,
    handleRoleChange,
  }), [
    handleSave,
    handleClone,
    handleDelete,
    handleSetGlobal,
    handleCopyAsLocal,
    handleCreateRelationship,
    handleDeleteRelationship,
    handleRoleChange,
  ]);
}
