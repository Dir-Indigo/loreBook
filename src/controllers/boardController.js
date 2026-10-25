import { supabase } from '../utils/supabaseClient';
import { createController } from './_base';

const handleLoading = createController('Board').runQuery;

export const boardController = {
  getAll: async (storyId, setLoading) => handleLoading(supabase.from('narrative_boards').select('*').eq('story_id', storyId).order('position', { ascending: true }), setLoading),
  create: async (data, setLoading) => handleLoading(supabase.from('narrative_boards').insert([data]).select().single(), setLoading),
  update: async (id, data, setLoading) => handleLoading(supabase.from('narrative_boards').update(data).eq('id', id).select().single(), setLoading),
  delete: async (id, setLoading) => handleLoading(supabase.from('narrative_boards').delete().eq('id', id), setLoading),
};
