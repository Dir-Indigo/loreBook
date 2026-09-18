import { characterFolderRepository } from '../repositories/characterFolderRepository';

export const characterFolderController = {
  getAll: async (storyId, setLoading) => {
    try {
      if (setLoading) setLoading(true);
      const { data, error } = await characterFolderRepository.getAll(storyId);
      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Error fetching character folders:', error);
      return { data: [], error };
    } finally {
      if (setLoading) setLoading(false);
    }
  },

  create: async (data, setLoading) => {
    try {
      if (setLoading) setLoading(true);
      const { data: newFolder, error } = await characterFolderRepository.create(data);
      if (error) throw error;
      return { data: newFolder, error: null };
    } catch (error) {
      console.error('Error creating character folder:', error);
      return { data: null, error };
    } finally {
      if (setLoading) setLoading(false);
    }
  },

  update: async (id, data, setLoading) => {
    try {
      if (setLoading) setLoading(true);
      const { data: updated, error } = await characterFolderRepository.update(id, data);
      if (error) throw error;
      return { data: updated, error: null };
    } catch (error) {
      console.error('Error updating character folder:', error);
      return { data: null, error };
    } finally {
      if (setLoading) setLoading(false);
    }
  },

  delete: async (id, storyId, setLoading) => {
    try {
      if (setLoading) setLoading(true);
      const { error } = await characterFolderRepository.delete(id, storyId);
      if (error) throw error;
      return { error: null };
    } catch (error) {
      console.error('Error deleting character folder:', error);
      return { error };
    } finally {
      if (setLoading) setLoading(false);
    }
  },

  ensureDefaultFolder: async (storyId, setLoading) => {
    try {
      if (setLoading) setLoading(true);
      const result = await characterFolderRepository.ensureDefaultFolder(storyId);
      if (result.error) throw result.error;
      return result;
    } catch (error) {
      console.error('Error ensuring default character folder:', error);
      return { data: null, allFolders: [], error };
    } finally {
      if (setLoading) setLoading(false);
    }
  },
};
