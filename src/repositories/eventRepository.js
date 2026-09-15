import { supabase } from '../utils/supabaseClient';

export const eventRepository = {
  getTree: (storyId) => supabase
    .from('timeline_events')
    .select(`
      id,
      story_id,
      board_id,
      title,
      order_index,
      color_tag,
      importance_level,
      event_characters (
        id,
        character:character_id (id, name, color_tag)
      )
    `)
    .eq('story_id', storyId)
    .order('order_index', { ascending: true }),
  getAll: (storyId, boardId, includeVersions = false) => {
    const eventSelect = `
      *,
      event_characters (
        id,
        role_in_event,
        character:character_id (id, name, avatar_url, role_archetype, color_tag)
      )${includeVersions ? ', event_versions (id, version_number, note, created_at)' : ''}
    `;
    let query = supabase.from('timeline_events').select(eventSelect).eq('story_id', storyId).order('order_index', { ascending: true });
    if (boardId) query = query.eq('board_id', boardId);
    return query;
  },
  getById: (eventId, includeVersions = false) => {
    const eventSelect = `
      *,
      event_characters (
        id,
        role_in_event,
        character:character_id (id, name, avatar_url, role_archetype, color_tag)
      )${includeVersions ? ', event_versions (id, version_number, note, created_at)' : ''}
    `;
    return supabase.from('timeline_events').select(eventSelect).eq('id', eventId).single();
  },
  create: (data) => supabase.from('timeline_events').insert([data]).select().single(),
  update: (id, data) => supabase.from('timeline_events').update({ ...data, updated_at: new Date().toISOString() }).eq('id', id).select().single(),
  delete: (id) => supabase.from('timeline_events').delete().eq('id', id),
  savePosition: (id, pos) => supabase.from('timeline_events').update({ ...pos, updated_at: new Date().toISOString() }).eq('id', id).select().single(),
  getVersions: (eventId) => supabase.from('event_versions').select('*').eq('event_id', eventId).order('version_number', { ascending: false }),
  // Complex operations could be kept in service or moved to RPCs
  createEventCharacterLink: (links) => supabase.from('event_characters').insert(links),
  deleteEventCharacters: (eventId) => supabase.from('event_characters').delete().eq('event_id', eventId),
  createVersion: (versionData) => supabase.from('event_versions').insert([versionData]).select().single(),
  getEventConnections: (storyId) => supabase.from('event_connections').select('*').eq('story_id', storyId),
  createConnection: (connData) => supabase.from('event_connections').insert([connData]).select().single(),
  deleteConnection: (id) => supabase.from('event_connections').delete().eq('id', id),
  deleteConnectionByNodes: (storyId, sourceId, targetId) => supabase.from('event_connections').delete().eq('story_id', storyId).eq('source_event_id', sourceId).eq('target_event_id', targetId),
};
