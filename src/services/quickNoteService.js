import { quickNoteRepository } from '../repositories/quickNoteRepository';

export const quickNoteService = {
  getAll: async (userId, storyId) => {
    const { data, error } = await quickNoteRepository.getAll(userId, storyId);
    if (error) throw error;
    return data;
  },

  create: async (noteData) => {
    const { data, error } = await quickNoteRepository.create(noteData);
    if (error) throw error;
    return data;
  },

  update: async (id, patch) => {
    const { data, error } = await quickNoteRepository.update(id, patch);
    if (error) throw error;
    return data;
  },

  delete: async (id) => {
    const { error } = await quickNoteRepository.delete(id);
    if (error) throw error;
    return true;
  },
};
