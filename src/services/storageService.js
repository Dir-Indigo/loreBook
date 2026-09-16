import { supabase } from '../utils/supabaseClient';
import { v4 as uuidv4 } from 'uuid';

/**
 * Uploads a character avatar Blob/File to Supabase Storage bucket 'avatars'
 * @param {Blob|File} fileBlob - Optimized image blob
 * @param {string} [characterId] - Optional character identifier
 * @returns {Promise<{ url: string, error: any }>}
 */
export async function uploadCharacterAvatar(fileBlob, characterId = 'temp') {
  try {
    const fileExt = fileBlob.type === 'image/jpeg' ? 'jpg' : 'webp';
    const fileName = `char_${characterId}_${uuidv4().slice(0, 8)}_${Date.now()}.${fileExt}`;
    const filePath = `characters/${fileName}`;

    const { data, error } = await supabase.storage
      .from('avatars')
      .upload(filePath, fileBlob, {
        contentType: fileBlob.type || 'image/webp',
        cacheControl: '360000',
        upsert: true,
      });

    if (error) {
      console.error('Error uploading avatar to Supabase Storage:', error);
      throw error;
    }

    const { data: publicUrlData } = supabase.storage
      .from('avatars')
      .getPublicUrl(filePath);

    return {
      url: publicUrlData.publicUrl,
      path: filePath,
      error: null,
    };
  } catch (err) {
    console.error('Storage upload failed:', err);
    return {
      url: null,
      error: err.message || 'Error al subir la imagen',
    };
  }
}

/**
 * Uploads an optimized story cover Blob/File to Supabase Storage
 * @param {Blob|File} fileBlob - Optimized image blob
 * @param {string} [storyId] - Optional story identifier
 * @returns {Promise<{ url: string, error: any }>}
 */
export async function uploadStoryCover(fileBlob, storyId = 'temp') {
  try {
    const fileExt = fileBlob.type === 'image/jpeg' ? 'jpg' : 'webp';
    const fileName = `cover_${storyId}_${uuidv4().slice(0, 8)}_${Date.now()}.${fileExt}`;
    const filePath = `covers/${fileName}`;

    const { data, error } = await supabase.storage
      .from('avatars')
      .upload(filePath, fileBlob, {
        contentType: fileBlob.type || 'image/webp',
        cacheControl: '360000',
        upsert: true,
      });

    if (error) {
      console.error('Error uploading story cover to Supabase Storage:', error);
      throw error;
    }

    const { data: publicUrlData } = supabase.storage
      .from('avatars')
      .getPublicUrl(filePath);

    return {
      url: publicUrlData.publicUrl,
      path: filePath,
      error: null,
    };
  } catch (err) {
    console.error('Story cover storage upload failed:', err);
    return {
      url: null,
      error: err.message || 'Error al subir la imagen de portada',
    };
  }
}

