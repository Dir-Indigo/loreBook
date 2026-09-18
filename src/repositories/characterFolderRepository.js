import { supabase } from '../utils/supabaseClient';

export const characterFolderRepository = {
  getAll: (storyId) =>
    supabase
      .from('character_folders')
      .select('*')
      .eq('story_id', storyId)
      .order('position', { ascending: true })
      .order('created_at', { ascending: true }),

  create: (data) =>
    supabase.from('character_folders').insert([data]).select().single(),

  update: (id, data) =>
    supabase
      .from('character_folders')
      .update({ ...data, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single(),

  delete: async (id, storyId) => {
    // 1. Desasignar personajes de esta carpeta o asignarlos a la carpeta base
    await supabase
      .from('characters')
      .update({ folder_id: null })
      .eq('folder_id', id);

    // 2. Eliminar la carpeta (cascada eliminará subcarpetas si aplica)
    return supabase.from('character_folders').delete().eq('id', id);
  },

  ensureDefaultFolder: async (storyId) => {
    // Verificar si ya existe una carpeta por defecto o alguna carpeta en la historia
    const { data: existing, error } = await supabase
      .from('character_folders')
      .select('*')
      .eq('story_id', storyId)
      .order('created_at', { ascending: true });

    if (error) return { data: null, error };

    const defaultFolder = existing?.find((f) => f.is_default || f.name.toLowerCase() === 'principal');
    if (defaultFolder) {
      return { data: defaultFolder, allFolders: existing, error: null };
    }

    if (existing && existing.length > 0) {
      // Ya existen carpetas, la primera o la raíz actúa como principal
      return { data: existing[0], allFolders: existing, error: null };
    }

    // Crear carpeta "Principal" por defecto
    const { data: created, error: createErr } = await supabase
      .from('character_folders')
      .insert([
        {
          story_id: storyId,
          name: 'Principal',
          color: '#8c6d53',
          is_default: true,
          position: 0,
        },
      ])
      .select()
      .single();

    return { data: created, allFolders: created ? [created] : [], error: createErr };
  },
};
