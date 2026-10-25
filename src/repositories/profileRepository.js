import { supabase } from '../utils/supabaseClient';

const PROFILE_COLUMNS = 'id, email, full_name, avatar_url, role, created_at';

const countRows = (table) => supabase.from(table).select('id', { count: 'exact', head: true });

export const profileRepository = {
  getAll: () => supabase
    .from('profiles')
    .select(PROFILE_COLUMNS)
    .order('created_at', { ascending: false }),

  // .select() devuelve las filas realmente modificadas: vacío significa que RLS no permitió el cambio
  updateRole: (id, role) => supabase
    .from('profiles')
    .update({ role })
    .eq('id', id)
    .select('id, role'),

  countProfiles: () => countRows('profiles'),
  countStories: () => countRows('stories'),
  countCharacters: () => countRows('characters'),
  countEvents: () => countRows('timeline_events'),
};
