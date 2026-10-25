import { supabase } from '../utils/supabaseClient';
import { createController } from './_base';

const handleLoading = createController('Relationship').runQuery;

export const relationshipController = {
  getAll: async (storyId, setLoading) => handleLoading(supabase.from('character_relationships').select('*, source:source_character_id(id, name, avatar_url), target:target_character_id(id, name, avatar_url)').eq('story_id', storyId), setLoading),
  create: async (data, setLoading) => handleLoading(supabase.from('character_relationships').insert([data]).select('*, source:source_character_id(id, name, avatar_url), target:target_character_id(id, name, avatar_url)').single(), setLoading),
  delete: async (id, setLoading) => handleLoading(supabase.from('character_relationships').delete().eq('id', id), setLoading),
};
