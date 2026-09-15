import { supabase } from '../utils/supabaseClient';

export const characterRepository = {
  getAll: (storyId) => supabase
    .from('characters')
    .select('*')
    .or(`story_id.eq.${storyId},is_global.eq.true`)
    .order('name', { ascending: true }),
  getById: (id) => supabase.from('characters').select('*').eq('id', id).single(),
  create: (data) => supabase.from('characters').insert([data]).select().single(),
  update: (id, data) => supabase.from('characters').update(data).eq('id', id).select().single(),
  delete: (id) => supabase.from('characters').delete().eq('id', id),
  
  clone: async (originalId, options) => {
    // 1. Obtener personaje original
    const { data: original, error: fetchError } = await supabase
      .from('characters')
      .select('*')
      .eq('id', originalId)
      .single();
      
    if (fetchError) return { data: null, error: fetchError };

    // 2. Preparar datos para clonar
    const { targetStoryId, nameSuffix } = options;
    const newName = `${original.name}${nameSuffix || ' (Copia)'}`;
    
    const { id, created_at, ...originalData } = original;
    
    const cloneData = {
      ...originalData,
      name: newName,
      story_id: targetStoryId,
    };

    // 3. Insertar clon
    return await supabase.from('characters').insert([cloneData]).select().single();
  },
};
