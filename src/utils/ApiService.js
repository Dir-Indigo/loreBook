import { supabase } from './supabaseClient';

/**
 * ApiService Bridge (RF-5.1, RF-5.2)
 * Centralizes all application requests with detailed formatted console logging.
 */

const logRequest = (action, endpoint, payload) => {
  const time = new Date().toLocaleTimeString();
  console.groupCollapsed(
    `%c[ApiService REQ] %c${action} %c${endpoint} %c@ ${time}`,
    'background: #8c6d53; color: #fff; font-weight: bold; padding: 2px 6px; border-radius: 4px;',
    'color: #0d9488; font-weight: bold;',
    'color: #6366f1;',
    'color: #888;'
  );
  if (payload !== undefined) {
    console.log('%cPayload:', 'font-weight: bold; color: #475569;', payload);
  }
  console.groupEnd();
};

const logResponse = (action, endpoint, data, error, durationMs) => {
  const isError = Boolean(error);
  console.groupCollapsed(
    `%c[ApiService RES] %c${action} %c${endpoint} %c${isError ? 'FAIL' : 'OK'} %c(${durationMs}ms)`,
    `background: ${isError ? '#dc2626' : '#10b981'}; color: #fff; font-weight: bold; padding: 2px 6px; border-radius: 4px;`,
    'color: #0d9488; font-weight: bold;',
    'color: #6366f1;',
    `color: ${isError ? '#dc2626' : '#10b981'}; font-weight: bold;`,
    'color: #888;'
  );
  if (isError) {
    console.error('Error Details:', error);
  } else {
    console.log('%cData Received:', 'font-weight: bold; color: #475569;', data);
  }
  console.groupEnd();
};

async function executeBridge(action, endpoint, requestFn, payload) {
  logRequest(action, endpoint, payload);
  const start = performance.now();
  try {
    const result = await requestFn();
    const duration = Math.round(performance.now() - start);
    if (result.error) {
      logResponse(action, endpoint, null, result.error, duration);
      return { data: null, error: result.error };
    }
    logResponse(action, endpoint, result.data, null, duration);
    return { data: result.data, error: null };
  } catch (err) {
    const duration = Math.round(performance.now() - start);
    logResponse(action, endpoint, null, err, duration);
    return { data: null, error: err };
  }
}

export const ApiService = {
  // ==========================================
  // STORIES & UNIVERSES (RF-2.1, RF-2.2, RF-2.3)
  // ==========================================
  async getStories(userId) {
    return executeBridge('GET_STORIES', 'public.stories', async () => {
      let query = supabase
        .from('stories')
        .select('*, universe:belongs_to_universe_id(id, title)')
        .order('created_at', { ascending: false });

      if (userId) {
        query = query.eq('user_id', userId);
      }
      return await query;
    }, { userId });
  },

  async getStoryById(storyId) {
    return executeBridge('GET_STORY_BY_ID', `public.stories/${storyId}`, async () => {
      return await supabase
        .from('stories')
        .select('*, universe:belongs_to_universe_id(id, title)')
        .eq('id', storyId)
        .single();
    }, { storyId });
  },

  async createStory(storyData) {
    return executeBridge('CREATE_STORY', 'public.stories', async () => {
      return await supabase
        .from('stories')
        .insert([storyData])
        .select()
        .single();
    }, storyData);
  },

  async updateStory(storyId, updates) {
    return executeBridge('UPDATE_STORY', `public.stories/${storyId}`, async () => {
      return await supabase
        .from('stories')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', storyId)
        .select()
        .single();
    }, { storyId, updates });
  },

  async deleteStory(storyId) {
    return executeBridge('DELETE_STORY', `public.stories/${storyId}`, async () => {
      return await supabase
        .from('stories')
        .delete()
        .eq('id', storyId);
    }, { storyId });
  },

  // ==========================================
  // CHARACTERS & RELATIONSHIPS (RF-3.1, RF-3.2, RF-3.3, RF-3.4)
  // ==========================================
  async getCharacters(storyId) {
    return executeBridge('GET_CHARACTERS', `public.characters?story_id=${storyId}`, async () => {
      return await supabase
        .from('characters')
        .select('*')
        .eq('story_id', storyId)
        .order('name', { ascending: true });
    }, { storyId });
  },

  async createCharacter(characterData) {
    return executeBridge('CREATE_CHARACTER', 'public.characters', async () => {
      return await supabase
        .from('characters')
        .insert([characterData])
        .select()
        .single();
    }, characterData);
  },

  async updateCharacter(characterId, updates) {
    return executeBridge('UPDATE_CHARACTER', `public.characters/${characterId}`, async () => {
      return await supabase
        .from('characters')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', characterId)
        .select()
        .single();
    }, { characterId, updates });
  },

  async deleteCharacter(characterId) {
    return executeBridge('DELETE_CHARACTER', `public.characters/${characterId}`, async () => {
      return await supabase
        .from('characters')
        .delete()
        .eq('id', characterId);
    }, { characterId });
  },

  /**
   * Clone character as template or alternate version (RF-3.4)
   */
  async cloneCharacter(originalCharacterId, { nameSuffix = ' (Copia)', targetStoryId = null, isTemplate = false }) {
    return executeBridge('CLONE_CHARACTER', `public.characters/${originalCharacterId}/clone`, async () => {
      const { data: original, error: fetchErr } = await supabase
        .from('characters')
        .select('*')
        .eq('id', originalCharacterId)
        .single();

      if (fetchErr) throw fetchErr;

      const newCharacter = {
        story_id: targetStoryId || original.story_id,
        name: `${original.name}${nameSuffix}`,
        role_archetype: original.role_archetype,
        biography: original.biography,
        avatar_url: original.avatar_url,
        color_tag: original.color_tag,
        is_template: isTemplate,
        parent_character_id: original.id,
        attributes: original.attributes || {},
      };

      return await supabase
        .from('characters')
        .insert([newCharacter])
        .select()
        .single();
    }, { originalCharacterId, nameSuffix, targetStoryId, isTemplate });
  },

  async getCharacterRelationships(storyId) {
    return executeBridge('GET_RELATIONSHIPS', `public.character_relationships?story_id=${storyId}`, async () => {
      return await supabase
        .from('character_relationships')
        .select('*, source:source_character_id(id, name, avatar_url), target:target_character_id(id, name, avatar_url)')
        .eq('story_id', storyId);
    }, { storyId });
  },

  async createRelationship(relData) {
    return executeBridge('CREATE_RELATIONSHIP', 'public.character_relationships', async () => {
      return await supabase
        .from('character_relationships')
        .insert([relData])
        .select('*, source:source_character_id(id, name, avatar_url), target:target_character_id(id, name, avatar_url)')
        .single();
    }, relData);
  },

  async deleteRelationship(relId) {
    return executeBridge('DELETE_RELATIONSHIP', `public.character_relationships/${relId}`, async () => {
      return await supabase
        .from('character_relationships')
        .delete()
        .eq('id', relId);
    }, { relId });
  },

  // ==========================================
  // TIMELINE EVENTS & POSITIONS (RF-4.1 - RF-4.6)
  // ==========================================
  async getEvents(storyId, boardId = null) {
    const endpoint = boardId
      ? `public.timeline_events?story_id=${storyId}&board_id=${boardId}`
      : `public.timeline_events?story_id=${storyId}`;
    return executeBridge('GET_TIMELINE_EVENTS', endpoint, async () => {
      let query = supabase
        .from('timeline_events')
        .select(`
          *,
          event_characters (
            id,
            role_in_event,
            character:character_id (id, name, avatar_url, role_archetype, color_tag)
          ),
          event_versions (id, version_number, note, created_at)
        `)
        .eq('story_id', storyId)
        .order('order_index', { ascending: true });

      if (boardId) {
        query = query.eq('board_id', boardId);
      }

      return await query;
    }, { storyId, boardId });
  },

  async createEvent(eventData, characterIds = [], boardId = null) {
    const payload = boardId ? { ...eventData, board_id: boardId } : eventData;
    return executeBridge('CREATE_TIMELINE_EVENT', 'public.timeline_events', async () => {
      const { data: newEvent, error: eventErr } = await supabase
        .from('timeline_events')
        .insert([payload])
        .select()
        .single();

      if (eventErr) throw eventErr;

      if (characterIds && characterIds.length > 0) {
        const charLinks = characterIds.map(charId => ({
          event_id: newEvent.id,
          character_id: charId,
        }));
        const { error: linkErr } = await supabase
          .from('event_characters')
          .insert(charLinks);
        if (linkErr) console.warn('Error linking characters to event:', linkErr);
      }

      // Automatically create initial version 1 (RF-4.6)
      await supabase.from('event_versions').insert([{
        event_id: newEvent.id,
        version_number: 1,
        snapshot_data: { ...newEvent, characterIds },
        note: 'Versión inicial creada',
      }]);

      return { data: newEvent, error: null };
    }, { eventData, characterIds, boardId });
  },

  async updateEvent(eventId, updates, characterIds = null, createBackup = false, backupNote = '') {
    return executeBridge('UPDATE_TIMELINE_EVENT', `public.timeline_events/${eventId}`, async () => {
      // If backup requested before modifying (RF-4.6)
      if (createBackup) {
        const { data: currentEvent } = await supabase
          .from('timeline_events')
          .select('*, event_characters(character_id)')
          .eq('id', eventId)
          .single();

        if (currentEvent) {
          const { count } = await supabase
            .from('event_versions')
            .select('*', { count: 'exact', head: true })
            .eq('event_id', eventId);

          const nextVersion = (count || 0) + 1;
          await supabase.from('event_versions').insert([{
            event_id: eventId,
            version_number: nextVersion,
            snapshot_data: currentEvent,
            note: backupNote || `Copia de seguridad v${nextVersion}`,
          }]);
        }
      }

      const { data: updatedEvent, error: updateErr } = await supabase
        .from('timeline_events')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', eventId)
        .select()
        .single();

      if (updateErr) throw updateErr;

      if (characterIds !== null) {
        // Replace event characters
        await supabase.from('event_characters').delete().eq('event_id', eventId);
        if (characterIds.length > 0) {
          const links = characterIds.map(charId => ({
            event_id: eventId,
            character_id: charId,
          }));
          await supabase.from('event_characters').insert(links);
        }
      }

      return { data: updatedEvent, error: null };
    }, { eventId, updates, characterIds, createBackup, backupNote });
  },

  /**
   * Save persistent (X, Y) canvas coordinates and sequence order (RF-4.3, RF-4.1)
   */
  async saveEventPosition(eventId, { pos_x, pos_y, order_index }) {
    return executeBridge('SAVE_EVENT_POSITION', `public.timeline_events/${eventId}/position`, async () => {
      const updateData = { updated_at: new Date().toISOString() };
      if (pos_x !== undefined) updateData.pos_x = pos_x;
      if (pos_y !== undefined) updateData.pos_y = pos_y;
      if (order_index !== undefined) updateData.order_index = order_index;

      return await supabase
        .from('timeline_events')
        .update(updateData)
        .eq('id', eventId)
        .select()
        .single();
    }, { eventId, pos_x, pos_y, order_index });
  },

  async deleteEvent(eventId) {
    return executeBridge('DELETE_TIMELINE_EVENT', `public.timeline_events/${eventId}`, async () => {
      return await supabase
        .from('timeline_events')
        .delete()
        .eq('id', eventId);
    }, { eventId });
  },

  // ==========================================
  // EVENT CONNECTIONS / CABLES (DAG Multi-branching)
  // ==========================================
  async getEventConnections(storyId) {
    return executeBridge('GET_EVENT_CONNECTIONS', `public.event_connections?story_id=${storyId}`, async () => {
      return await supabase
        .from('event_connections')
        .select('*')
        .eq('story_id', storyId);
    }, { storyId });
  },

  async createEventConnection(storyId, sourceEventId, targetEventId) {
    return executeBridge('CREATE_EVENT_CONNECTION', 'public.event_connections', async () => {
      return await supabase
        .from('event_connections')
        .insert([{
          story_id: storyId,
          source_event_id: sourceEventId,
          target_event_id: targetEventId,
        }])
        .select()
        .single();
    }, { storyId, sourceEventId, targetEventId });
  },

  async deleteEventConnection(connectionId) {
    return executeBridge('DELETE_EVENT_CONNECTION', `public.event_connections/${connectionId}`, async () => {
      return await supabase
        .from('event_connections')
        .delete()
        .eq('id', connectionId);
    }, { connectionId });
  },

  async deleteEventConnectionByNodes(storyId, sourceEventId, targetEventId) {
    return executeBridge('DELETE_EVENT_CONNECTION_BY_NODES', `public.event_connections?nodes`, async () => {
      return await supabase
        .from('event_connections')
        .delete()
        .eq('story_id', storyId)
        .eq('source_event_id', sourceEventId)
        .eq('target_event_id', targetEventId);
    }, { storyId, sourceEventId, targetEventId });
  },

  // ==========================================
  // NARRATIVE BOARDS (Líneas Narrativas)
  // ==========================================

  /**
   * Get all boards for a story (flat list; tree is built in the UI)
   */
  async getBoards(storyId) {
    return executeBridge('GET_BOARDS', `public.narrative_boards?story_id=${storyId}`, async () => {
      return await supabase
        .from('narrative_boards')
        .select('*')
        .eq('story_id', storyId)
        .order('position', { ascending: true })
        .order('created_at', { ascending: true });
    }, { storyId });
  },

  async createBoard(storyId, { name = 'Nuevo tablero', parentBoardId = null, color = '#8c6d53', position = 0 } = {}) {
    return executeBridge('CREATE_BOARD', 'public.narrative_boards', async () => {
      return await supabase
        .from('narrative_boards')
        .insert([{ story_id: storyId, parent_board_id: parentBoardId, name, color, position }])
        .select()
        .single();
    }, { storyId, name, parentBoardId, color, position });
  },

  async updateBoard(boardId, updates) {
    return executeBridge('UPDATE_BOARD', `public.narrative_boards/${boardId}`, async () => {
      return await supabase
        .from('narrative_boards')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', boardId)
        .select()
        .single();
    }, { boardId, updates });
  },

  async deleteBoard(boardId) {
    return executeBridge('DELETE_BOARD', `public.narrative_boards/${boardId}`, async () => {
      return await supabase
        .from('narrative_boards')
        .delete()
        .eq('id', boardId);
    }, { boardId });
  },

  /**
   * Move a timeline event to a different narrative board
   */
  async moveEventToBoard(eventId, newBoardId) {
    return executeBridge('MOVE_EVENT_TO_BOARD', `public.timeline_events/${eventId}/board`, async () => {
      return await supabase
        .from('timeline_events')
        .update({ board_id: newBoardId, updated_at: new Date().toISOString() })
        .eq('id', eventId)
        .select()
        .single();
    }, { eventId, newBoardId });
  },

  // ==========================================
  // EVENT VERSIONS & RESTORE (RF-4.6)
  // ==========================================
  async getEventVersions(eventId) {
    return executeBridge('GET_EVENT_VERSIONS', `public.event_versions?event_id=${eventId}`, async () => {
      return await supabase
        .from('event_versions')
        .select('*')
        .eq('event_id', eventId)
        .order('version_number', { ascending: false });
    }, { eventId });
  },

  async createEventBackup(eventId, note = 'Copia de seguridad manual') {
    return executeBridge('CREATE_EVENT_BACKUP', `public.event_versions/${eventId}`, async () => {
      const { data: currentEvent, error: fetchErr } = await supabase
        .from('timeline_events')
        .select('*, event_characters(character_id)')
        .eq('id', eventId)
        .single();

      if (fetchErr) throw fetchErr;

      const { count } = await supabase
        .from('event_versions')
        .select('*', { count: 'exact', head: true })
        .eq('event_id', eventId);

      const nextVersion = (count || 0) + 1;

      return await supabase
        .from('event_versions')
        .insert([{
          event_id: eventId,
          version_number: nextVersion,
          snapshot_data: currentEvent,
          note: note || `Versión ${nextVersion}`,
        }])
        .select()
        .single();
    }, { eventId, note });
  },

  async restoreEventVersion(versionId) {
    return executeBridge('RESTORE_EVENT_VERSION', `public.event_versions/${versionId}/restore`, async () => {
      const { data: versionRecord, error: vErr } = await supabase
        .from('event_versions')
        .select('*')
        .eq('id', versionId)
        .single();

      if (vErr) throw vErr;

      const snapshot = versionRecord.snapshot_data;
      const eventId = versionRecord.event_id;

      // Update event with snapshot data
      const { data: restoredEvent, error: updateErr } = await supabase
        .from('timeline_events')
        .update({
          title: snapshot.title,
          summary: snapshot.summary,
          details: snapshot.details,
          order_index: snapshot.order_index,
          color_tag: snapshot.color_tag,
          importance_level: snapshot.importance_level,
          pos_x: snapshot.pos_x,
          pos_y: snapshot.pos_y,
          updated_at: new Date().toISOString(),
        })
        .eq('id', eventId)
        .select()
        .single();

      if (updateErr) throw updateErr;

      // Restore character associations if available
      if (snapshot.event_characters || snapshot.characterIds) {
        const charIds = snapshot.characterIds || (snapshot.event_characters || []).map(ec => ec.character_id);
        await supabase.from('event_characters').delete().eq('event_id', eventId);
        if (charIds && charIds.length > 0) {
          const links = charIds.map(charId => ({
            event_id: eventId,
            character_id: charId,
          }));
          await supabase.from('event_characters').insert(links);
        }
      }

      return { data: restoredEvent, error: null };
    }, { versionId });
  },

  // ==========================================
  // USER PROFILES & RBAC ADMIN (RF-1.1, RF-1.2, RF-1.3)
  // ==========================================
  async getProfile(userId) {
    return executeBridge('GET_PROFILE', `public.profiles/${userId}`, async () => {
      return await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
    }, { userId });
  },

  async updateProfile(userId, updates) {
    return executeBridge('UPDATE_PROFILE', `public.profiles/${userId}`, async () => {
      return await supabase
        .from('profiles')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', userId)
        .select()
        .single();
    }, { userId, updates });
  },

  async getAllProfilesForAdmin() {
    return executeBridge('ADMIN_GET_ALL_PROFILES', 'public.profiles', async () => {
      return await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });
    });
  },

  async updateProfileRole(userId, newRole) {
    return executeBridge('ADMIN_UPDATE_ROLE', `public.profiles/${userId}/role`, async () => {
      return await supabase
        .from('profiles')
        .update({ role: newRole, updated_at: new Date().toISOString() })
        .eq('id', userId)
        .select()
        .single();
    }, { userId, newRole });
  },

  async getPlatformStats() {
    return executeBridge('ADMIN_GET_STATS', 'platform.stats', async () => {
      const [profilesRes, storiesRes, charactersRes, eventsRes] = await Promise.all([
        supabase.from('profiles').select('*', { count: 'exact', head: true }),
        supabase.from('stories').select('*', { count: 'exact', head: true }),
        supabase.from('characters').select('*', { count: 'exact', head: true }),
        supabase.from('timeline_events').select('*', { count: 'exact', head: true }),
      ]);

      return {
        data: {
          totalUsers: profilesRes.count || 0,
          totalStories: storiesRes.count || 0,
          totalCharacters: charactersRes.count || 0,
          totalEvents: eventsRes.count || 0,
        },
        error: null,
      };
    });
  },
};
