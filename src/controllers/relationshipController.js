import { supabase } from '../utils/supabaseClient';

const handleLoading = async (promise, setLoading) => {
  if (setLoading) setLoading(true);
  try {
    const { data, error } = await promise;
    if (error) {
      console.error('[RelationshipController Error]:', error);
      return { data: null, error };
    }
    return { data, error: null };
  } catch (error) {
    console.error('[RelationshipController Error]:', error);
    return { data: null, error };
  } finally {
    if (setLoading) setLoading(false);
  }
};

export const relationshipController = {
  getAll: async (storyId, setLoading) => handleLoading(supabase.from('character_relationships').select('*, source:source_character_id(id, name, avatar_url), target:target_character_id(id, name, avatar_url)').eq('story_id', storyId), setLoading),
  create: async (data, setLoading) => handleLoading(supabase.from('character_relationships').insert([data]).select('*, source:source_character_id(id, name, avatar_url), target:target_character_id(id, name, avatar_url)').single(), setLoading),
  delete: async (id, setLoading) => handleLoading(supabase.from('character_relationships').delete().eq('id', id), setLoading),
};
