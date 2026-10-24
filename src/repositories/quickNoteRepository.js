import { supabase } from '../utils/supabaseClient';

export const quickNoteRepository = {
  getAll: (userId, storyId, options = {}) => {
    const {
      page = null,
      pageSize = 15,
      status = null,
      search = '',
      scope = null, // 'story' | 'global' | 'all'
    } = options;

    let query = supabase
      .from('quick_notes')
      .select('*', { count: 'exact' })
      .eq('user_id', userId)
      .order('is_pinned', { ascending: false })
      .order('updated_at', { ascending: false });

    if (scope === 'global') {
      query = query.is('story_id', null);
    } else if (scope === 'story' && storyId) {
      query = query.eq('story_id', storyId);
    } else if (storyId) {
      // Include story-specific notes AND global notes (story_id IS NULL)
      query = query.or(`story_id.eq.${storyId},story_id.is.null`);
    }

    if (status && status !== 'all') {
      query = query.eq('status', status);
    }

    if (search && search.trim()) {
      query = query.ilike('content', `%${search.trim()}%`);
    }

    if (page && pageSize) {
      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;
      query = query.range(from, to);
    }

    return query;
  },

  create: (data) => supabase.from('quick_notes').insert([data]).select().single(),

  update: (id, data) =>
    supabase
      .from('quick_notes')
      .update({ ...data, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single(),

  delete: (id) => supabase.from('quick_notes').delete().eq('id', id),
};
