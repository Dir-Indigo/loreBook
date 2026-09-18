import { supabase } from '../utils/supabaseClient';

export const characterTagRepository = {
  getAll: (storyId) =>
    supabase
      .from('character_tags')
      .select('*')
      .eq('story_id', storyId)
      .order('created_at', { ascending: true }),

  create: (data) =>
    supabase.from('character_tags').insert([data]).select().single(),

  update: (id, data) =>
    supabase.from('character_tags').update(data).eq('id', id).select().single(),

  delete: async (id) => {
    // Al eliminar una etiqueta, la quitamos también del array custom_tag_ids de los personajes
    // Para no romper referencias
    return supabase.from('character_tags').delete().eq('id', id);
  },
};
