import { storyRepository } from '../repositories/storyRepository';

export const storyService = {
  getAll: async (userId) => {
    const { data, error } = await storyRepository.getAll(userId);
    if (error) throw error;
    return data;
  },
  getById: async (id) => {
    const { data, error } = await storyRepository.getById(id);
    if (error) throw error;
    return data;
  },
  create: async (storyData) => {
    const { data, error } = await storyRepository.create(storyData);
    if (error) throw error;
    return data;
  },
  update: async (id, storyData) => {
    const { data, error } = await storyRepository.update(id, storyData);
    if (error) throw error;
    return data;
  },
  delete: async (id) => {
    const { error } = await storyRepository.delete(id);
    if (error) throw error;
    return true;
  },
};
