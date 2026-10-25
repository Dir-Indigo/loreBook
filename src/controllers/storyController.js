import { storyService } from '../services/storyService';
import { createController } from './_base';

const handleLoading = createController('Story').run;

export const storyController = {
  getAll: async (userId, setLoading) => handleLoading(storyService.getAll(userId), setLoading),
  getById: async (id, setLoading) => handleLoading(storyService.getById(id), setLoading),
  create: async (data, setLoading) => handleLoading(storyService.create(data), setLoading),
  update: async (id, data, setLoading) => handleLoading(storyService.update(id, data), setLoading),
  delete: async (id, setLoading) => handleLoading(storyService.delete(id), setLoading),
};
