import { characterTagRepository } from '../repositories/characterTagRepository';
import { createController } from './_base';

const { runQuery } = createController('CharacterTag');

export const characterTagController = {
  getAll: async (storyId, setLoading) =>
    runQuery(() => characterTagRepository.getAll(storyId), setLoading, { fallback: [] }),

  create: async (data, setLoading) =>
    runQuery(() => characterTagRepository.create(data), setLoading),

  update: async (id, data, setLoading) =>
    runQuery(() => characterTagRepository.update(id, data), setLoading),

  delete: async (id, setLoading) => {
    const { error } = await runQuery(() => characterTagRepository.delete(id), setLoading);
    return { error };
  },
};
