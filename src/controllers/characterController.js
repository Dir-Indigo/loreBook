import { characterService } from '../services/characterService';

const handleLoading = async (promise, setLoading) => {
  if (setLoading) setLoading(true);
  try {
    const data = await promise;
    return { data, error: null };
  } catch (error) {
    console.error('[CharacterController Error]:', error);
    return { data: null, error };
  } finally {
    if (setLoading) setLoading(false);
  }
};

export const characterController = {
  getAll: async (storyId, setLoading) => handleLoading(characterService.getAll(storyId), setLoading),
  create: async (data, setLoading) => handleLoading(characterService.create(data), setLoading),
  update: async (id, data, setLoading) => handleLoading(characterService.update(id, data), setLoading),
  delete: async (id, setLoading) => handleLoading(characterService.delete(id), setLoading),
  moveToFolder: async (characterIds, folderId, setLoading) => handleLoading(characterService.moveToFolder(characterIds, folderId), setLoading),
  assignTagsBatch: async (characterIds, options, setLoading) => handleLoading(characterService.assignTagsBatch(characterIds, options), setLoading),
  clone: async (originalId, options, setLoading) => handleLoading(characterService.clone(originalId, options), setLoading),
  copyAsLocal: async (characterIds, targetStoryId, setLoading) => handleLoading(characterService.copyAsLocal(characterIds, targetStoryId), setLoading)
};
