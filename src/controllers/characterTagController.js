import { characterTagRepository } from '../repositories/characterTagRepository';

export const characterTagController = {
  getAll: async (storyId, setLoading) => {
    try {
      if (setLoading) setLoading(true);
      const { data, error } = await characterTagRepository.getAll(storyId);
      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Error fetching character tags:', error);
      return { data: [], error };
    } finally {
      if (setLoading) setLoading(false);
    }
  },

  create: async (data, setLoading) => {
    try {
      if (setLoading) setLoading(true);
      const { data: newTag, error } = await characterTagRepository.create(data);
      if (error) throw error;
      return { data: newTag, error: null };
    } catch (error) {
      console.error('Error creating character tag:', error);
      return { data: null, error };
    } finally {
      if (setLoading) setLoading(false);
    }
  },

  update: async (id, data, setLoading) => {
    try {
      if (setLoading) setLoading(true);
      const { data: updated, error } = await characterTagRepository.update(id, data);
      if (error) throw error;
      return { data: updated, error: null };
    } catch (error) {
      console.error('Error updating character tag:', error);
      return { data: null, error };
    } finally {
      if (setLoading) setLoading(false);
    }
  },

  delete: async (id, setLoading) => {
    try {
      if (setLoading) setLoading(true);
      const { error } = await characterTagRepository.delete(id);
      if (error) throw error;
      return { error: null };
    } catch (error) {
      console.error('Error deleting character tag:', error);
      return { error };
    } finally {
      if (setLoading) setLoading(false);
    }
  },
};
