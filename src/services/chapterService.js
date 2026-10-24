import { chapterRepository } from '../repositories/chapterRepository';
import { countWords, computeLineDiff } from '../utils/diffUtils';

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

    // Crea el commit #1 (Snapshot inicial estilo Git)
    await chapterRepository.createVersion({
      chapter_id: newChapter.id,
      version_number: 1,
      commit_message: 'Borrador inicial',
      title_snapshot: newChapter.title,
      content_snapshot: newChapter.content || '',
      word_count: wordCount,
      diff_stats: { addedLines: (newChapter.content || '').split('\n').length, removedLines: 0 },
    });

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

    // Crea un commit de restauración
    const { data: existingVersions } = await chapterRepository.getVersions(chapterId);
    const nextVersionNumber = (existingVersions?.[0]?.version_number || 0) + 1;

    await chapterRepository.createVersion({
      chapter_id: chapterId,
      version_number: nextVersionNumber,
      commit_message: `Revertido a Versión #${version.version_number}: "${version.commit_message}"`,
      title_snapshot: version.title_snapshot,
      content_snapshot: version.content_snapshot,
      word_count: wordCount,
      diff_stats: { restoredFrom: version.version_number },
    });

    return updatedChapter;
  },
};
