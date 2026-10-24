import { supabase } from '../utils/supabaseClient';

export const chapterRepository = {
  getAll: async (storyId) => {
    return await supabase
      .from('chapters')
      .select('*')
      .eq('story_id', storyId)
      .order('order_index', { ascending: true })
      .order('created_at', { ascending: true });
  },

  getById: async (chapterId) => {
    return await supabase
      .from('chapters')
      .select('*')
      .eq('id', chapterId)
      .single();
  },

  create: async (chapterData) => {
    return await supabase
      .from('chapters')
      .insert(chapterData)
      .select()
      .single();
  },

  update: async (chapterId, patch) => {
    return await supabase
      .from('chapters')
      .update({ ...patch, updated_at: new Date().toISOString() })
      .eq('id', chapterId)
      .select()
      .single();
  },

  delete: async (chapterId) => {
    return await supabase
      .from('chapters')
      .delete()
      .eq('id', chapterId);
  },

  getVersions: async (chapterId) => {
    return await supabase
      .from('chapter_versions')
      .select('*')
      .eq('chapter_id', chapterId)
      .order('version_number', { ascending: false });
  },

  createVersion: async (versionData) => {
    return await supabase
      .from('chapter_versions')
      .insert(versionData)
      .select()
      .single();
  },
};
