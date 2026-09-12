import { characterRepository } from '../repositories/characterRepository';

export const characterService = {
  getAll: async (storyId) => {
    const { data, error } = await characterRepository.getAll(storyId);
    if (error) throw error;
    return data;
  },
  create: async (charData) => {
    const { data, error } = await characterRepository.create(charData);
    if (error) throw error;
    return data;
  },
  update: async (id, charData) => {
    const { data, error } = await characterRepository.update(id, charData);
    if (error) throw error;
    return data;
  },
  delete: async (id) => {
    const { error } = await characterRepository.delete(id);
    if (error) throw error;
    return true;
  },
  clone: async (originalId, options) => {
    const { data, error } = await characterRepository.clone(originalId, options);
    if (error) throw error;
    return data;
  }
};
