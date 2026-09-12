import { supabase } from '../utils/supabaseClient';

export const storyRepository = {
  getAll: (userId) => {
    let query = supabase.from('stories').select('*, universe:belongs_to_universe_id(id, title)').order('created_at', { ascending: false });
    if (userId) query = query.eq('user_id', userId);
    return query;
  },
  getById: (id) => supabase.from('stories').select('*, universe:belongs_to_universe_id(id, title)').eq('id', id).single(),
  create: (data) => supabase.from('stories').insert([data]).select().single(),
  update: (id, data) => supabase.from('stories').update({ ...data, updated_at: new Date().toISOString() }).eq('id', id).select().single(),
  delete: (id) => supabase.from('stories').delete().eq('id', id),
};
