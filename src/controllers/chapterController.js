import { chapterService } from '../services/chapterService';
import { createController } from './_base';

const handleLoading = createController('Chapter').run;

export const chapterController = {
  getAll: async (storyId, setLoading) => handleLoading(chapterService.getAll(storyId), setLoading),
  getById: async (chapterId, setLoading) => handleLoading(chapterService.getById(chapterId), setLoading),
  create: async (data, setLoading) => handleLoading(chapterService.create(data), setLoading),
  updateDraft: async (id, patch, setLoading) => handleLoading(chapterService.updateDraft(id, patch), setLoading),
  delete: async (id, setLoading) => handleLoading(chapterService.delete(id), setLoading),
  getVersions: async (chapterId, setLoading) => handleLoading(chapterService.getVersions(chapterId), setLoading),
  createCommit: async (chapterId, commitMessage, title, content, authorId, setLoading) =>
    handleLoading(chapterService.createCommit(chapterId, commitMessage, title, content, authorId), setLoading),
  restoreVersion: async (chapterId, version, setLoading) =>
    handleLoading(chapterService.restoreVersion(chapterId, version), setLoading),
};
