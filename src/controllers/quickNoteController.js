import { quickNoteService } from '../services/quickNoteService';

const handle = async (promise, setLoading) => {
  if (setLoading) setLoading(true);
  try {
    const result = await promise;
    if (result && typeof result === 'object' && 'data' in result && 'count' in result) {
      return { data: result.data, count: result.count, meta: result, error: null };
    }
    return { data: result, error: null };
  } catch (error) {
    console.error('[QuickNoteController]:', error);
    return { data: null, error };
  } finally {
    if (setLoading) setLoading(false);
  }
};

export const quickNoteController = {
  getAll: (userId, storyId, options = {}, setLoading) => {
    let opts = options;
    let sl = setLoading;
    if (typeof options === 'function') {
      sl = options;
      opts = {};
    }
    return handle(quickNoteService.getAll(userId, storyId, opts), sl);
  },
  create: (data, setLoading) =>
    handle(quickNoteService.create(data), setLoading),
  update: (id, patch, setLoading) =>
    handle(quickNoteService.update(id, patch), setLoading),
  delete: (id, setLoading) =>
    handle(quickNoteService.delete(id), setLoading),
};
