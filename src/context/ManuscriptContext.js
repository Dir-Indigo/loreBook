import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useStory } from './StoryContext';
import { useAuth } from './AuthContext';
import { useLoading } from './LoadingContext';
import { ApiService } from '../utils/ApiService';
import { countWords, computeLineDiff, computeWordDiff } from '../utils/diffUtils';

const ManuscriptContext = createContext(null);

export function ManuscriptProvider({ children }) {
  const { activeStoryId } = useStory();
  const { user } = useAuth();
  const { setLoading } = useLoading();

  const [chapters, setChapters] = useState([]);
  const [loading, setChaptersLoading] = useState(false);
  const [activeChapterId, setActiveChapterIdState] = useState(null);

  // Draft local buffer (Working copy)
  const [workingTitle, setWorkingTitle] = useState('');
  const [workingDraft, setWorkingDraft] = useState('');
  const [workingSummary, setWorkingSummary] = useState('');
  const [workingStatus, setWorkingStatus] = useState('draft');

  // Baseline content from the last commit
  const [lastCommittedContent, setLastCommittedContent] = useState('');

  // Version history states
  const [versions, setVersions] = useState([]);
  const [versionsLoading, setVersionsLoading] = useState(false);

  // Modals & Drawers
  const [isCommitModalOpen, setIsCommitModalOpen] = useState(false);
  const [isHistoryDrawerOpen, setIsHistoryDrawerOpen] = useState(false);
  const [isDiffModalOpen, setIsDiffModalOpen] = useState(false);
  const [reviewMode, setReviewMode] = useState(false);

  // Auto-save debounce timer ref
  const autoSaveTimerRef = useRef(null);

  // 1. Cargar capítulos cuando cambia la historia activa
  const loadChapters = useCallback(async (storyIdToLoad) => {
    const sId = storyIdToLoad || activeStoryId;
    if (!sId) {
      setChapters([]);
      setActiveChapterIdState(null);
      return;
    }

    setChaptersLoading(true);
    try {
      const res = await ApiService.chapters.getAll(sId, setLoading);
      if (res.data) {
        setChapters(res.data);
        if (res.data.length > 0) {
          // Si el capítulo activo actual no está en la lista o no hay ninguno, seleccionar el primero
          setActiveChapterIdState((prev) => {
            if (prev && res.data.some((c) => c.id === prev)) return prev;
            return res.data[0].id;
          });
        } else {
          setActiveChapterIdState(null);
        }
      }
    } catch (err) {
      console.error('[ManuscriptContext] Error loading chapters:', err);
    } finally {
      setChaptersLoading(false);
    }
  }, [activeStoryId, setLoading]);

  useEffect(() => {
    loadChapters();
  }, [loadChapters]);

  // Active chapter object
  const activeChapter = useMemo(() => {
    return chapters.find((c) => c.id === activeChapterId) || null;
  }, [chapters, activeChapterId]);

  // 2. Cargar versiones del capítulo activo y sincronizar buffer local
  const loadVersions = useCallback(async (chapterId) => {
    if (!chapterId) {
      setVersions([]);
      return;
    }
    setVersionsLoading(true);
    try {
      const res = await ApiService.chapters.getVersions(chapterId);
      if (res.data) {
        setVersions(res.data);
        if (res.data.length > 0) {
          setLastCommittedContent(res.data[0].content_snapshot || '');
        } else {
          setLastCommittedContent('');
        }
      }
    } catch (err) {
      console.error('[ManuscriptContext] Error loading versions:', err);
    } finally {
      setVersionsLoading(false);
    }
  }, []);

  // Al cambiar el capítulo activo, hidratar el borrador local
  useEffect(() => {
    if (activeChapter) {
      setWorkingTitle(activeChapter.title || '');
      setWorkingDraft(activeChapter.content || '');
      setWorkingSummary(activeChapter.summary || '');
      setWorkingStatus(activeChapter.status || 'draft');
      loadVersions(activeChapter.id);
    } else {
      setWorkingTitle('');
      setWorkingDraft('');
      setWorkingSummary('');
      setWorkingStatus('draft');
      setLastCommittedContent('');
      setVersions([]);
    }
  }, [activeChapter, loadVersions]);

  const setActiveChapterId = useCallback((id) => {
    setActiveChapterIdState(id);
  }, []);

  // 3. Métricas y Diffs Git-like
  const wordCount = useMemo(() => countWords(workingDraft), [workingDraft]);

  const totalManuscriptWords = useMemo(() => {
    return chapters.reduce((acc, c) => {
      if (c.id === activeChapterId) return acc + wordCount;
      return acc + (c.word_count || 0);
    }, 0);
  }, [chapters, activeChapterId, wordCount]);

  // Comparación Diff con el último commit
  const diffSummary = useMemo(() => {
    return computeLineDiff(lastCommittedContent, workingDraft);
  }, [lastCommittedContent, workingDraft]);

  // Diff a nivel de palabras en tiempo real para el Modo Revisión
  const wordDiff = useMemo(() => {
    return computeWordDiff(lastCommittedContent, workingDraft);
  }, [lastCommittedContent, workingDraft]);

  const isDirty = useMemo(() => {
    if (!activeChapter) return false;
    const contentChanged = workingDraft !== lastCommittedContent;
    const titleChanged = workingTitle !== activeChapter.title;
    const summaryChanged = workingSummary !== (activeChapter.summary || '');
    const statusChanged = workingStatus !== (activeChapter.status || 'draft');
    return contentChanged || titleChanged || summaryChanged || statusChanged;
  }, [activeChapter, workingDraft, lastCommittedContent, workingTitle, workingSummary, workingStatus]);

  // 4. Guardar borrador (Draft auto-save silencioso)
  const saveDraft = useCallback(async (silent = true) => {
    if (!activeChapterId) return;
    try {
      const res = await ApiService.chapters.updateDraft(activeChapterId, {
        title: workingTitle,
        content: workingDraft,
        summary: workingSummary,
        status: workingStatus,
      }, silent ? undefined : setLoading);

      if (res.data) {
        setChapters((prev) =>
          prev.map((c) => (c.id === activeChapterId ? { ...c, ...res.data } : c))
        );
      }
    } catch (err) {
      console.error('[ManuscriptContext] Error saving draft:', err);
    }
  }, [activeChapterId, workingTitle, workingDraft, workingSummary, workingStatus, setLoading]);

  // Auto-guardado diferido de borrador
  useEffect(() => {
    if (!activeChapterId) return;
    if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
    autoSaveTimerRef.current = setTimeout(() => {
      saveDraft(true);
    }, 2500);

    return () => {
      if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
    };
  }, [workingDraft, workingTitle, workingSummary, workingStatus, activeChapterId, saveDraft]);

  // 5. Commit de versión (Git-like snapshot)
  const commitVersion = useCallback(async (commitMessage) => {
    if (!activeChapterId) return { success: false, error: 'No hay capítulo activo' };
    const msg = (commitMessage || '').trim() || 'Punto de control sin mensaje';

    try {
      const res = await ApiService.chapters.createCommit(
        activeChapterId,
        msg,
        workingTitle,
        workingDraft,
        user?.id || null,
        setLoading
      );

      if (res.data) {
        const { chapter, version } = res.data;
        // Actualiza el baseline del commit
        setLastCommittedContent(version.content_snapshot);
        // Actualiza capítulos y versiones
        setChapters((prev) =>
          prev.map((c) => (c.id === activeChapterId ? { ...c, ...chapter } : c))
        );
        setVersions((prev) => [version, ...prev]);
        setIsCommitModalOpen(false);
        return { success: true, version };
      }
      return { success: false, error: res.error };
    } catch (err) {
      console.error('[ManuscriptContext] Error committing version:', err);
      return { success: false, error: err.message };
    }
  }, [activeChapterId, workingTitle, workingDraft, user?.id, setLoading]);

  // 6. Restaurar a versión anterior
  const restoreVersion = useCallback(async (version) => {
    if (!activeChapterId || !version) return;
    try {
      const res = await ApiService.chapters.restoreVersion(activeChapterId, version, setLoading);
      if (res.data) {
        setWorkingTitle(res.data.title || '');
        setWorkingDraft(res.data.content || '');
        setLastCommittedContent(res.data.content || '');
        setChapters((prev) =>
          prev.map((c) => (c.id === activeChapterId ? { ...c, ...res.data } : c))
        );
        // Recargar historial
        await loadVersions(activeChapterId);
        setIsHistoryDrawerOpen(false);
      }
    } catch (err) {
      console.error('[ManuscriptContext] Error restoring version:', err);
    }
  }, [activeChapterId, loadVersions, setLoading]);

  // 7. Crear nuevo capítulo
  const createChapter = useCallback(async (customTitle) => {
    if (!activeStoryId) return null;
    const nextOrder = chapters.length + 1;
    const defaultTitle = customTitle || `Capítulo ${nextOrder}`;

    try {
      const res = await ApiService.chapters.create({
        story_id: activeStoryId,
        title: defaultTitle,
        content: '',
        order_index: nextOrder,
        status: 'draft',
      }, setLoading);

      if (res.data) {
        setChapters((prev) => [...prev, res.data]);
        setActiveChapterIdState(res.data.id);
        return res.data;
      }
    } catch (err) {
      console.error('[ManuscriptContext] Error creating chapter:', err);
    }
    return null;
  }, [activeStoryId, chapters.length, setLoading]);

  // 8. Eliminar capítulo
  const deleteChapter = useCallback(async (chapterId) => {
    if (!chapterId) return;
    try {
      const res = await ApiService.chapters.delete(chapterId, setLoading);
      if (!res.error) {
        setChapters((prev) => {
          const filtered = prev.filter((c) => c.id !== chapterId);
          if (activeChapterId === chapterId) {
            setActiveChapterIdState(filtered[0]?.id || null);
          }
          return filtered;
        });
      }
    } catch (err) {
      console.error('[ManuscriptContext] Error deleting chapter:', err);
    }
  }, [activeChapterId, setLoading]);

  const value = useMemo(() => ({
    chapters,
    loading,
    activeChapterId,
    activeChapter,
    setActiveChapterId,
    // Working draft states
    workingTitle,
    setWorkingTitle,
    workingDraft,
    setWorkingDraft,
    workingSummary,
    setWorkingSummary,
    workingStatus,
    setWorkingStatus,
    // Git-like change tracking
    lastCommittedContent,
    diffSummary,
    wordDiff,
    isDirty,
    wordCount,
    totalManuscriptWords,
    // Version control
    versions,
    versionsLoading,
    loadVersions,
    saveDraft,
    commitVersion,
    restoreVersion,
    createChapter,
    deleteChapter,
    loadChapters,
    // Modal states
    isCommitModalOpen,
    setIsCommitModalOpen,
    isHistoryDrawerOpen,
    setIsHistoryDrawerOpen,
    isDiffModalOpen,
    setIsDiffModalOpen,
    reviewMode,
    setReviewMode,
  }), [
    chapters,
    loading,
    activeChapterId,
    activeChapter,
    setActiveChapterId,
    workingTitle,
    workingDraft,
    workingSummary,
    workingStatus,
    lastCommittedContent,
    diffSummary,
    wordDiff,
    isDirty,
    wordCount,
    totalManuscriptWords,
    versions,
    versionsLoading,
    loadVersions,
    saveDraft,
    commitVersion,
    restoreVersion,
    createChapter,
    deleteChapter,
    loadChapters,
    isCommitModalOpen,
    isHistoryDrawerOpen,
    isDiffModalOpen,
    reviewMode,
  ]);

  return (
    <ManuscriptContext.Provider value={value}>
      {children}
    </ManuscriptContext.Provider>
  );
}

export function useManuscript() {
  const context = useContext(ManuscriptContext);
  if (!context) {
    return {
      chapters: [],
      loading: false,
      activeChapterId: null,
      activeChapter: null,
      setActiveChapterId: () => {},
      workingTitle: '',
      setWorkingTitle: () => {},
      workingDraft: '',
      setWorkingDraft: () => {},
      workingSummary: '',
      setWorkingSummary: () => {},
      workingStatus: 'draft',
      setWorkingStatus: () => {},
      lastCommittedContent: '',
      diffSummary: { isClean: true, addedLines: 0, removedLines: 0, diffChunks: [] },
      wordDiff: [],
      isDirty: false,
      wordCount: 0,
      totalManuscriptWords: 0,
      versions: [],
      versionsLoading: false,
      loadVersions: () => {},
      saveDraft: () => {},
      commitVersion: async () => {},
      restoreVersion: () => {},
      createChapter: async () => {},
      deleteChapter: () => {},
      loadChapters: () => {},
      isCommitModalOpen: false,
      setIsCommitModalOpen: () => {},
      isHistoryDrawerOpen: false,
      setIsHistoryDrawerOpen: () => {},
      isDiffModalOpen: false,
      setIsDiffModalOpen: () => {},
      reviewMode: false,
      setReviewMode: () => {},
    };
  }
  return context;
}
