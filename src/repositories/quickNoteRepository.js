import { supabase } from '../utils/supabaseClient';

export const quickNoteRepository = {
  getAll: (userId, storyId) => {
    let query = supabase
      .from('quick_notes')
      .select('*')
      .eq('user_id', userId)
      .order('is_pinned', { ascending: false })
      .order('updated_at', { ascending: false });

    if (storyId) {
      // Include story-specific notes AND global notes (story_id IS NULL)
      query = query.or(`story_id.eq.${storyId},story_id.is.null`);
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
