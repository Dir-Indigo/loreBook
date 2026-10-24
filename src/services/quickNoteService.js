import { quickNoteRepository } from '../repositories/quickNoteRepository';

export const quickNoteService = {
  getAll: async (userId, storyId, options = {}) => {
    const { data, count, error } = await quickNoteRepository.getAll(userId, storyId, options);
    if (error) throw error;
    return {
      data: data || [],
      count: count ?? (data?.length || 0),
      page: options.page || 1,
      pageSize: options.pageSize || (data?.length || 15),
      totalPages: options.page && options.pageSize && count ? Math.ceil(count / options.pageSize) : 1,
      hasMore: options.page && options.pageSize && count ? (options.page * options.pageSize < count) : false,
    };
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
