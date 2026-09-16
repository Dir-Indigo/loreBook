import { characterController } from '../controllers/characterController';
import { storyController } from '../controllers/storyController';
import { boardController } from '../controllers/boardController';
import { eventController } from '../controllers/eventController';
import { relationshipController } from '../controllers/relationshipController';
import { quickNoteController } from '../controllers/quickNoteController';

/**
 * ApiService Facade (RF-5.1, RF-5.2)
 * Centralizes UI access to domain-specific controllers and provides unified logging.
 */

const logRequest = (action, endpoint, payload) => {
  console.groupCollapsed(
    `%c[ApiService REQ] %c${action} %c${endpoint}`,
    'background: #8c6d53; color: #fff; font-weight: bold; padding: 2px 6px; border-radius: 4px;',
    'color: #0d9488; font-weight: bold;',
    'color: #6366f1;'
  );
  if (payload) console.log('Payload:', payload);
  console.groupEnd();
};

const bridge = async (action, endpoint, controllerMethod, setLoading, ...args) => {
  logRequest(action, endpoint, args);
  return await controllerMethod(...args, setLoading);
};

export const ApiService = {
  // 3. Alias directos en la raíz para compatibilidad con AuthContext y StoryContext
  getStories: (userId, setLoading) => bridge('GET_STORIES', 'public.stories', storyController.getAll, setLoading, userId),

  characters: {
    getAll: (storyId, setLoading) => bridge('GET_CHARS', 'public.characters', characterController.getAll, setLoading, storyId),
    create: (data, setLoading) => bridge('CREATE_CHAR', 'public.characters', characterController.create, setLoading, data),
    update: (id, data, setLoading) => bridge('UPDATE_CHAR', 'public.characters', characterController.update, setLoading, id, data),
    delete: (id, setLoading) => bridge('DELETE_CHAR', 'public.characters', characterController.delete, setLoading, id),
    clone: (id, options, setLoading) => bridge('CLONE_CHAR', 'public.characters', characterController.clone, setLoading, id, options),
  },
  stories: {
    getAll: (userId, setLoading) => bridge('GET_STORIES', 'public.stories', storyController.getAll, setLoading, userId),
    getById: (id, setLoading) => bridge('GET_STORY', 'public.stories', storyController.getById, setLoading, id),
    create: (data, setLoading) => bridge('CREATE_STORY', 'public.stories', storyController.create, setLoading, data),
    update: (id, data, setLoading) => bridge('UPDATE_STORY', 'public.stories', storyController.update, setLoading, id, data),
    delete: (id, setLoading) => bridge('DELETE_STORY', 'public.stories', storyController.delete, setLoading, id),
  },
  boards: {
    getAll: (storyId, setLoading) => bridge('GET_BOARDS', 'public.narrative_boards', boardController.getAll, setLoading, storyId),
    create: (data, setLoading) => bridge('CREATE_BOARD', 'public.narrative_boards', boardController.create, setLoading, data),
    update: (id, data, setLoading) => bridge('UPDATE_BOARD', 'public.narrative_boards', boardController.update, setLoading, id, data),
    delete: (id, setLoading) => bridge('DELETE_BOARD', 'public.narrative_boards', boardController.delete, setLoading, id),
  },
  events: {
    getTree: (storyId, setLoading) => bridge('GET_EVENT_TREE', 'public.timeline_events', eventController.getTree, setLoading, storyId),
    getAll: (storyId, boardId, setLoading) => bridge('GET_EVENTS', 'public.timeline_events', eventController.getAll, setLoading, storyId, boardId),
    getById: (id, setLoading) => bridge('GET_EVENT', 'public.timeline_events', eventController.getById, setLoading, id),
    create: (data, chars, boardId, setLoading) => bridge('CREATE_EVENT', 'public.timeline_events', eventController.create, setLoading, data, chars, boardId),
    update: (id, data, charIds, backup, note, setLoading) => bridge('UPDATE_EVENT', 'public.timeline_events', eventController.update, setLoading, id, data, charIds, backup, note),
    delete: (id, setLoading) => bridge('DELETE_EVENT', 'public.timeline_events', eventController.delete, setLoading, id),
    savePosition: (id, pos, setLoading) => bridge('SAVE_POS', 'public.timeline_events', eventController.savePosition, setLoading, id, pos),
    getVersions: (eventId, setLoading) => bridge('GET_VERSIONS', 'public.event_versions', eventController.getVersions, setLoading, eventId),
    createBackup: (eventId, note, setLoading) => bridge('CREATE_BACKUP', 'public.event_versions', eventController.createBackup, setLoading, eventId, note),
    restoreVersion: (vId, setLoading) => bridge('RESTORE_VERSION', 'public.event_versions', eventController.restoreVersion, setLoading, vId),
    createConnection: (sId, src, tgt, setLoading) => bridge('CREATE_CONN', 'public.event_connections', eventController.createConnection, setLoading, sId, src, tgt),
    deleteConnection: (nodes, setLoading) => bridge('DEL_CONN', 'public.event_connections', eventController.deleteConnectionByNodes, setLoading, nodes.storyId, nodes.source, nodes.target),
    getConnections: (sId, setLoading) => bridge('GET_CONN', 'public.event_connections', eventController.getConnections, setLoading, sId),
  },
  relationships: {
    getAll: (sId, setLoading) => bridge('GET_RELS', 'public.character_relationships', relationshipController.getAll, setLoading, sId),
    create: (data, setLoading) => bridge('CREATE_REL', 'public.character_relationships', relationshipController.create, setLoading, data),
    delete: (id, setLoading) => bridge('DELETE_REL', 'public.character_relationships', relationshipController.delete, setLoading, id),
  },
  quickNotes: {
    getAll: (userId, storyId, setLoading) => bridge('GET_NOTES', 'public.quick_notes', quickNoteController.getAll, setLoading, userId, storyId),
    create: (data, setLoading) => bridge('CREATE_NOTE', 'public.quick_notes', quickNoteController.create, setLoading, data),
    update: (id, patch, setLoading) => bridge('UPDATE_NOTE', 'public.quick_notes', quickNoteController.update, setLoading, id, patch),
    delete: (id, setLoading) => bridge('DELETE_NOTE', 'public.quick_notes', quickNoteController.delete, setLoading, id),
  },
};