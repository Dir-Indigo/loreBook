import { boardRepository } from '../repositories/boardRepository';

export const boardService = {
  getAll: async (storyId) => {
    const { data, error } = await boardRepository.getAll(storyId);
    if (error) throw error;
    return data;
  },
  create: async (boardData) => {
    const { data, error } = await boardRepository.create(boardData);
    if (error) throw error;
    return data;
  },
  update: async (id, boardData) => {
    const { data, error } = await boardRepository.update(id, boardData);
    if (error) throw error;
    return data;
  },
  delete: async (id) => {
    const { error } = await boardRepository.delete(id);
    if (error) throw error;
    return true;
  },
};
