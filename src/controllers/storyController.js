import { storyService } from '../services/storyService';

const handleLoading = async (promise, setLoading) => {
  if (setLoading) setLoading(true);
  try {
    const data = await promise;
    return { data, error: null };
  } catch (error) {
    console.error('[StoryController Error]:', error);
    return { data: null, error };
  } finally {
    if (setLoading) setLoading(false);
  }
};

export const storyController = {
  getAll: async (userId, setLoading) => handleLoading(storyService.getAll(userId), setLoading),
  getById: async (id, setLoading) => handleLoading(storyService.getById(id), setLoading),
  create: async (data, setLoading) => handleLoading(storyService.create(data), setLoading),
  update: async (id, data, setLoading) => handleLoading(storyService.update(id, data), setLoading),
  delete: async (id, setLoading) => handleLoading(storyService.delete(id), setLoading),
};
