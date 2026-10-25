import { characterArchetypeRepository } from '../repositories/characterArchetypeRepository';
import { createController } from './_base';

const { runQuery } = createController('CharacterArchetype');

export const characterArchetypeController = {
  getAll: async (storyId, setLoading) =>
    runQuery(() => characterArchetypeRepository.getAll(storyId), setLoading, { fallback: [] }),

  create: async (data, setLoading) =>
    runQuery(() => characterArchetypeRepository.create(data), setLoading),

  update: async (id, data, setLoading) =>
    runQuery(() => characterArchetypeRepository.update(id, data), setLoading),

  delete: async (id, setLoading) => {
    const { error } = await runQuery(() => characterArchetypeRepository.delete(id), setLoading);
    return { error };
  },
};
