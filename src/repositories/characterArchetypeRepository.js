import { supabase } from '../utils/supabaseClient';

export const characterArchetypeRepository = {
  getAll: (storyId) =>
    supabase
      .from('character_archetypes')
      .select('*')
      .eq('story_id', storyId)
      .order('created_at', { ascending: true }),

  create: (data) =>
    supabase.from('character_archetypes').insert([data]).select().single(),

  update: (id, data) =>
    supabase.from('character_archetypes').update(data).eq('id', id).select().single(),

  delete: (id) =>
    supabase.from('character_archetypes').delete().eq('id', id),
};
