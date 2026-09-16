import { quickNoteService } from '../services/quickNoteService';

const handle = async (promise, setLoading) => {
  if (setLoading) setLoading(true);
  try {
    const data = await promise;
    return { data, error: null };
  } catch (error) {
    console.error('[QuickNoteController]:', error);
    return { data: null, error };
  } finally {
    if (setLoading) setLoading(false);
  }
};

export const quickNoteController = {
  getAll: (userId, storyId, setLoading) =>
    handle(quickNoteService.getAll(userId, storyId), setLoading),
  create: (data, setLoading) =>
    handle(quickNoteService.create(data), setLoading),
  update: (id, patch, setLoading) =>
    handle(quickNoteService.update(id, patch), setLoading),
  delete: (id, setLoading) =>
    handle(quickNoteService.delete(id), setLoading),
};
