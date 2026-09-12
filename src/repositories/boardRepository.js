import { supabase } from '../utils/supabaseClient';

export const boardRepository = {
  getAll: (storyId) => supabase.from('narrative_boards').select('*').eq('story_id', storyId).order('position', { ascending: true }).order('created_at', { ascending: true }),
  create: (data) => supabase.from('narrative_boards').insert([data]).select().single(),
  update: (id, data) => supabase.from('narrative_boards').update({ ...data, updated_at: new Date().toISOString() }).eq('id', id).select().single(),
  delete: (id) => supabase.from('narrative_boards').delete().eq('id', id),
};
