import { characterFolderRepository } from '../repositories/characterFolderRepository';
import { createController } from './_base';

const { runQuery } = createController('CharacterFolder');

export const characterFolderController = {
  getAll: async (storyId, setLoading) =>
    runQuery(() => characterFolderRepository.getAll(storyId), setLoading, { fallback: [] }),

  create: async (data, setLoading) =>
    runQuery(() => characterFolderRepository.create(data), setLoading),

  update: async (id, data, setLoading) =>
    runQuery(() => characterFolderRepository.update(id, data), setLoading),

  delete: async (id, storyId, setLoading) => {
    const { error } = await runQuery(() => characterFolderRepository.delete(id, storyId), setLoading);
    return { error };
  },

  // El repositorio devuelve además `allFolders`, por eso no pasa por runQuery
  ensureDefaultFolder: async (storyId, setLoading) => {
    try {
      if (setLoading) setLoading(true);
      const result = await characterFolderRepository.ensureDefaultFolder(storyId);
      if (result.error) throw result.error;
      return result;
    } catch (error) {
      console.error('[CharacterFolder Error]:', error);
      return { data: null, allFolders: [], error };
    } finally {
      if (setLoading) setLoading(false);
    }
  },
};
