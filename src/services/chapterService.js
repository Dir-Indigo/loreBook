import { chapterRepository } from '../repositories/chapterRepository';
import { countWords, computeLineDiff } from '../utils/diffUtils';
import { APP_CONFIG } from '../constants/constants';

export const chapterService = {
  getAll: async (storyId) => {
    const { data, error } = await chapterRepository.getAll(storyId);
    if (error) throw error;
    return data || [];
  },

  getById: async (chapterId) => {
    const { data, error } = await chapterRepository.getById(chapterId);
    if (error) throw error;
    return data;
  },

  create: async (chapterData) => {
    const wordCount = countWords(chapterData.content || '');
    const payload = {
      ...chapterData,
      word_count: wordCount,
      content: chapterData.content || '',
      title: chapterData.title || 'Nuevo Capítulo',
    };

    const { data: newChapter, error } = await chapterRepository.create(payload);
    if (error) throw error;

    // No se crea una copia inicial: un capítulo vacío no necesita respaldo y ocuparía uno de los cupos.

    return newChapter;
  },

  updateDraft: async (chapterId, patch) => {
    const updates = { ...patch };
    if (typeof updates.content === 'string') {
      updates.word_count = countWords(updates.content);
    }
    const { data, error } = await chapterRepository.update(chapterId, updates);
    if (error) throw error;
    return data;
  },

  delete: async (chapterId) => {
    const { error } = await chapterRepository.delete(chapterId);
    if (error) throw error;
    return true;
  },

  getVersions: async (chapterId) => {
    const { data, error } = await chapterRepository.getVersions(chapterId);
    if (error) throw error;
    return data || [];
  },

  createCommit: async (chapterId, commitMessage, title, content, authorId = null) => {
    // 1. Obtener versiones anteriores para calcular número y diff respecto al último commit
    const { data: existingVersions, error: vErr } = await chapterRepository.getVersions(chapterId);
    if (vErr) throw vErr;

    const lastVersion = existingVersions?.[0] || null;
    const nextVersionNumber = lastVersion ? lastVersion.version_number + 1 : 1;
    const prevContent = lastVersion ? lastVersion.content_snapshot : '';

    const diff = computeLineDiff(prevContent, content);
    const wordCount = countWords(content);

    // 2. Crear el snapshot / commit
    const versionPayload = {
      chapter_id: chapterId,
      version_number: nextVersionNumber,
      commit_message: commitMessage.trim() || `Versión #${nextVersionNumber}`,
      title_snapshot: title,
      content_snapshot: content,
      word_count: wordCount,
      diff_stats: {
        addedLines: diff.addedLines,
        removedLines: diff.removedLines,
      },
      created_by: authorId || null,
    };

    const { data: newVersion, error: createVErr } = await chapterRepository.createVersion(versionPayload);
    if (createVErr) throw createVErr;

    // 2b. Conserva solo las copias más recientes: se eliminan las más antiguas (después de crear la nueva,
    // para no perder nada si la creación falla)
    const keepOld = Math.max(0, APP_CONFIG.MAX_CHAPTER_VERSIONS - 1);
    const staleIds = (existingVersions || []).slice(keepOld).map((v) => v.id);
    if (staleIds.length > 0) {
      const { error: pruneErr } = await chapterRepository.deleteVersions(staleIds);
      if (pruneErr) console.warn('[chapterService] No se pudieron eliminar copias antiguas:', pruneErr);
    }

    // 3. Sincronizar el capítulo
    const { data: updatedChapter, error: uErr } = await chapterRepository.update(chapterId, {
      title,
      content,
      word_count: wordCount,
    });
    if (uErr) throw uErr;

    return { chapter: updatedChapter, version: newVersion };
  },

  restoreVersion: async (chapterId, version) => {
    const wordCount = countWords(version.content_snapshot || '');
    const { data: updatedChapter, error } = await chapterRepository.update(chapterId, {
      content: version.content_snapshot,
      title: version.title_snapshot || undefined,
      word_count: wordCount,
    });
    if (error) throw error;

    // Restaurar no crea otra copia: las copias existentes se conservan tal cual.

    return updatedChapter;
  },
};
