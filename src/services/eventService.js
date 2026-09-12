import { eventRepository } from '../repositories/eventRepository';
import { supabase } from '../utils/supabaseClient';

export const eventService = {
  getAll: async (storyId, boardId) => {
    const { data, error } = await eventRepository.getAll(storyId, boardId);
    if (error) throw error;
    return data;
  },
  create: async (eventData, characterIds, boardId) => {
    const payload = boardId ? { ...eventData, board_id: boardId } : eventData;
    const { data: newEvent, error: eventErr } = await eventRepository.create(payload);
    if (eventErr) throw eventErr;
    if (characterIds && characterIds.length > 0) {
        await eventRepository.createEventCharacterLink(characterIds.map(charId => ({ event_id: newEvent.id, character_id: charId })));
    }
    await eventRepository.createVersion({ event_id: newEvent.id, version_number: 1, snapshot_data: { ...newEvent, characterIds }, note: 'Versión inicial' });
    return newEvent;
  },
  update: async (id, data, characterIds, createBackup, backupNote) => {
    if (createBackup) {
       // ... backup logic ...
    }
    const { data: updated, error } = await eventRepository.update(id, data);
    if (error) throw error;
    if (characterIds) {
        await eventRepository.deleteEventCharacters(id);
        if (characterIds.length > 0) await eventRepository.createEventCharacterLink(characterIds.map(charId => ({ event_id: id, character_id: charId })));
    }
    return updated;
  },
  delete: async (id) => {
    const { error } = await eventRepository.delete(id);
    if (error) throw error;
    return true;
  },
  savePosition: async (id, pos) => {
    const { data, error } = await eventRepository.savePosition(id, pos);
    if (error) throw error;
    return data;
  },
  getVersions: async (eventId) => {
    const { data, error } = await eventRepository.getVersions(eventId);
    if (error) throw error;
    return data;
  },
  createBackup: async (eventId, note) => {
    // ... complex backup logic ...
  },
  restoreVersion: async (versionId) => {
    // ... complex restore logic ...
  },
  getConnections: async (storyId) => {
    const { data, error } = await eventRepository.getEventConnections(storyId);
    if (error) throw error;
    return data;
  },
  createConnection: async (storyId, sourceId, targetId) => {
    const { data, error } = await eventRepository.createConnection({ story_id: storyId, source_event_id: sourceId, target_event_id: targetId });
    if (error) throw error;
    return data;
  },
  deleteConnectionByNodes: async (storyId, sourceId, targetId) => {
    const { error } = await eventRepository.deleteConnectionByNodes(storyId, sourceId, targetId);
    if (error) throw error;
    return true;
  }
};
