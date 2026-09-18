import { characterArchetypeRepository } from '../repositories/characterArchetypeRepository';

export const characterArchetypeController = {
  getAll: async (storyId, setLoading) => {
    try {
      if (setLoading) setLoading(true);
      const { data, error } = await characterArchetypeRepository.getAll(storyId);
      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Error fetching character archetypes:', error);
      return { data: [], error };
    } finally {
      if (setLoading) setLoading(false);
    }
  },

  create: async (data, setLoading) => {
    try {
      if (setLoading) setLoading(true);
      const { data: newArch, error } = await characterArchetypeRepository.create(data);
      if (error) throw error;
      return { data: newArch, error: null };
    } catch (error) {
      console.error('Error creating character archetype:', error);
      return { data: null, error };
    } finally {
      if (setLoading) setLoading(false);
    }
  },

  update: async (id, data, setLoading) => {
    try {
      if (setLoading) setLoading(true);
      const { data: updated, error } = await characterArchetypeRepository.update(id, data);
      if (error) throw error;
      return { data: updated, error: null };
    } catch (error) {
      console.error('Error updating character archetype:', error);
      return { data: null, error };
    } finally {
      if (setLoading) setLoading(false);
    }
  },

  delete: async (id, setLoading) => {
    try {
      if (setLoading) setLoading(true);
      const { error } = await characterArchetypeRepository.delete(id);
      if (error) throw error;
      return { error: null };
    } catch (error) {
      console.error('Error deleting character archetype:', error);
      return { error };
    } finally {
      if (setLoading) setLoading(false);
    }
  },
};
