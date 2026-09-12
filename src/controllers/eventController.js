import { eventService } from '../services/eventService';

const handleLoading = async (promise, setLoading) => {
  if (setLoading) setLoading(true);
  try {
    const data = await promise;
    return { data, error: null };
  } catch (error) {
    console.error('[EventController Error]:', error);
    return { data: null, error };
  } finally {
    if (setLoading) setLoading(false);
  }
};

export const eventController = {
    getAll: async (storyId, boardId, setLoading) => handleLoading(eventService.getAll(storyId, boardId), setLoading),
    create: async (eventData, characterIds, boardId, setLoading) => handleLoading(eventService.create(eventData, characterIds, boardId), setLoading),
    update: async (id, data, characterIds, createBackup, backupNote, setLoading) => handleLoading(eventService.update(id, data, characterIds, createBackup, backupNote), setLoading),
    delete: async (id, setLoading) => handleLoading(eventService.delete(id), setLoading),
    savePosition: async (id, pos, setLoading) => handleLoading(eventService.savePosition(id, pos), setLoading),
    getVersions: async (eventId, setLoading) => handleLoading(eventService.getVersions(eventId), setLoading),
    createBackup: async (eventId, note, setLoading) => handleLoading(eventService.createBackup(eventId, note), setLoading),
    restoreVersion: async (versionId, setLoading) => handleLoading(eventService.restoreVersion(versionId), setLoading),
    getConnections: async (storyId, setLoading) => handleLoading(eventService.getConnections(storyId), setLoading),
    createConnection: async (storyId, sourceId, targetId, setLoading) => handleLoading(eventService.createConnection(storyId, sourceId, targetId), setLoading),
    deleteConnectionByNodes: async (storyId, sourceId, targetId, setLoading) => handleLoading(eventService.deleteConnectionByNodes(storyId, sourceId, targetId), setLoading),
};
