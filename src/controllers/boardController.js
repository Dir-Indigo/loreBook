import { supabase } from '../utils/supabaseClient';

const handleLoading = async (promise, setLoading) => {
  if (setLoading) setLoading(true);
  try {
    const { data, error } = await promise;
    if (error) {
      console.error('[BoardController Error]:', error);
      return { data: null, error };
    }
    return { data, error: null };
  } catch (error) {
    console.error('[BoardController Error]:', error);
    return { data: null, error };
  } finally {
    if (setLoading) setLoading(false);
  }
};

export const boardController = {
  getAll: async (storyId, setLoading) => handleLoading(supabase.from('narrative_boards').select('*').eq('story_id', storyId).order('position', { ascending: true }), setLoading),
  create: async (data, setLoading) => handleLoading(supabase.from('narrative_boards').insert([data]).select().single(), setLoading),
  update: async (id, data, setLoading) => handleLoading(supabase.from('narrative_boards').update(data).eq('id', id).select().single(), setLoading),
  delete: async (id, setLoading) => handleLoading(supabase.from('narrative_boards').delete().eq('id', id), setLoading),
};
