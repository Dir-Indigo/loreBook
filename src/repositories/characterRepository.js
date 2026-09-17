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
    const { targetStoryId, nameSuffix, isTemplate } = options;
    const newName = `${original.name}${nameSuffix || ' (Copia)'}`;
    
    const { id, created_at, ...originalData } = original;
    
    const cloneData = {
      ...originalData,
      name: newName,
      story_id: targetStoryId,
      is_template: isTemplate !== undefined ? isTemplate : original.is_template,
    };

    // 3. Insertar clon
    return await supabase.from('characters').insert([cloneData]).select().single();
  },

  copyAsLocal: async (characterIds, targetStoryId) => {
    const ids = Array.isArray(characterIds) ? characterIds : [characterIds];
    if (!ids.length || !targetStoryId) return { data: [], error: null };

    // 1. Obtener personajes originales
    const { data: originals, error: fetchError } = await supabase
      .from('characters')
      .select('*')
      .in('id', ids);

    if (fetchError) return { data: null, error: fetchError };
    if (!originals || !originals.length) return { data: [], error: null };

    // 2. Preparar copias locales
    const copiesData = originals.map((original) => {
      const { id, created_at, ...rest } = original;
      return {
        ...rest,
        is_global: false,
        story_id: targetStoryId,
        name: original.name,
      };
    });

    // 3. Insertar copias locales
    const { data: createdCopies, error: insertError } = await supabase
      .from('characters')
      .insert(copiesData)
      .select('*');

    if (insertError) return { data: null, error: insertError };
    return { data: createdCopies, error: null };
  },
};
