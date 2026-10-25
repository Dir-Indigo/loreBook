import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useStory } from './StoryContext';
import { useAuth } from './AuthContext';
import { useLoading } from './LoadingContext';
import { ApiService } from '../utils/ApiService';
import { countWords, computeLineDiff, computeWordDiff } from '../utils/diffUtils';

// Dos contextos: el texto del borrador cambia en cada pulsación y vive solo en el contexto "editor";
// todo lo demás (capítulos, estado de guardado, métricas y diffs con retardo, acciones estables) va en el "core",
// que no cambia mientras se escribe, así que sus consumidores no se re-renderizan por pulsación.
const ManuscriptContext = createContext(null);
const ManuscriptEditorContext = createContext(null);

// Las métricas y diffs se calculan al pausar la escritura, no en cada tecla
const METRICS_DEBOUNCE_MS = 400;
const EMPTY_WORD_DIFF = [];

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

  // Estado del autoguardado: 'idle' | 'saving' | 'saved' | 'error'
  const [saveStatus, setSaveStatus] = useState('idle');

  // Último estado renderizado, para vaciar el borrador pendiente (flush) sin cierres obsoletos
  const latestDraftRef = useRef({ chapterId: null, patch: null, unsaved: false });
  // Capítulo cuyo contenido ya está volcado en el buffer local (evita guardar con el buffer del capítulo anterior)
  const hydratedChapterIdRef = useRef(null);
  const activeChapterRef = useRef(null);

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

  activeChapterRef.current = activeChapter;
  const activeChapterKey = activeChapter?.id || null;

  // Al cambiar de capítulo (no en cada guardado), hidratar el borrador local.
  // Depender del objeto completo sobrescribiría lo escrito mientras una petición de guardado estaba en vuelo.
  useEffect(() => {
    const activeChapter = activeChapterRef.current;
    hydratedChapterIdRef.current = activeChapter?.id || null;
    setSaveStatus('idle');
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
  }, [activeChapterKey, loadVersions]);

  const setActiveChapterId = useCallback((id) => {
    setActiveChapterIdState(id);
  }, []);

  // 3. Métricas y Diffs Git-like, calculados sobre una copia del borrador con retardo.
  // El LCS del diff es O(líneas²) y O(tokens²): hacerlo en cada pulsación bloqueaba la escritura.
  const [diffSource, setDiffSource] = useState({ chapterId: null, text: '' });

  useEffect(() => {
    const timer = setTimeout(
      () => setDiffSource({ chapterId: activeChapterId, text: workingDraft }),
      METRICS_DEBOUNCE_MS
    );
    return () => clearTimeout(timer);
  }, [workingDraft, activeChapterId]);

  // Si cambia la referencia del último commit, recalcular ya (sin esperar al retardo)
  useEffect(() => {
    const { chapterId, patch } = latestDraftRef.current;
    if (patch) setDiffSource({ chapterId, text: patch.content });
  }, [lastCommittedContent]);

  // Mientras la copia retardada pertenece a otro capítulo, se usa el borrador en vivo
  const metricsDraft = diffSource.chapterId === activeChapterId ? diffSource.text : workingDraft;

  const wordCount = useMemo(() => countWords(metricsDraft), [metricsDraft]);

  const totalManuscriptWords = useMemo(() => {
    return chapters.reduce((acc, c) => {
      if (c.id === activeChapterId) return acc + wordCount;
      return acc + (c.word_count || 0);
    }, 0);
  }, [chapters, activeChapterId, wordCount]);

  // Comparación Diff con el último commit
  const diffSummary = useMemo(() => {
    return computeLineDiff(lastCommittedContent, metricsDraft);
  }, [lastCommittedContent, metricsDraft]);

  // Diff a nivel de palabras: solo cuando el Modo Revisión está activo
  const wordDiff = useMemo(() => {
    if (!reviewMode) return EMPTY_WORD_DIFF;
    return computeWordDiff(lastCommittedContent, metricsDraft);
  }, [reviewMode, lastCommittedContent, metricsDraft]);

  const isDirty = useMemo(() => {
    if (!activeChapter) return false;
    const contentChanged = workingDraft !== lastCommittedContent;
    const titleChanged = workingTitle !== activeChapter.title;
    const summaryChanged = workingSummary !== (activeChapter.summary || '');
    const statusChanged = workingStatus !== (activeChapter.status || 'draft');
    return contentChanged || titleChanged || summaryChanged || statusChanged;
  }, [activeChapter, workingDraft, lastCommittedContent, workingTitle, workingSummary, workingStatus]);

  // 4. Guardar borrador (Draft auto-save silencioso)
  // El borrador está "sin guardar" cuando el buffer difiere de lo ya persistido en el capítulo
  // (distinto de isDirty, que compara contra el último commit).
  const hasUnsavedDraft = Boolean(
    activeChapter &&
    hydratedChapterIdRef.current === activeChapter.id &&
    (
      workingDraft !== (activeChapter.content || '') ||
      workingTitle !== (activeChapter.title || '') ||
      workingSummary !== (activeChapter.summary || '') ||
      workingStatus !== (activeChapter.status || 'draft')
    )
  );

  // Los guardados se encadenan: así una petición lenta nunca pisa a una más reciente
  const saveQueueRef = useRef(Promise.resolve());

  const persistDraft = useCallback((chapterId, patch, silent = true) => {
    if (!chapterId || !patch) return Promise.resolve();
    const run = async () => {
      setSaveStatus('saving');
      try {
        const res = await ApiService.chapters.updateDraft(chapterId, patch, silent ? undefined : setLoading);
        if (res.error || !res.data) {
          setSaveStatus('error');
          return;
        }
        setChapters((prev) => prev.map((c) => (c.id === chapterId ? { ...c, ...res.data } : c)));
        setSaveStatus('saved');
      } catch (err) {
        console.error('[ManuscriptContext] Error saving draft:', err);
        setSaveStatus('error');
      }
    };
    saveQueueRef.current = saveQueueRef.current.then(run);
    return saveQueueRef.current;
  }, [setLoading]);

  const saveDraft = useCallback((silent = true) => {
    const { chapterId, patch } = latestDraftRef.current;
    return persistDraft(chapterId, patch, silent);
  }, [persistDraft]);

  // Guarda de inmediato lo pendiente (cambio de capítulo, pestaña oculta, cierre)
  const flushDraft = useCallback(() => {
    const { chapterId, patch, unsaved } = latestDraftRef.current;
    if (unsaved) persistDraft(chapterId, patch, true);
  }, [persistDraft]);

  // Se actualiza en un efecto (no en el render): los cleanups del siguiente commit
  // todavía ven el estado del capítulo anterior y pueden vaciarlo.
  useEffect(() => {
    latestDraftRef.current = {
      chapterId: activeChapterId,
      patch: { title: workingTitle, content: workingDraft, summary: workingSummary, status: workingStatus },
      unsaved: hasUnsavedDraft,
    };
  });

  // Auto-guardado diferido: solo si hay cambios sin guardar
  useEffect(() => {
    if (!hasUnsavedDraft) return undefined;
    const timer = setTimeout(flushDraft, 2500);
    return () => clearTimeout(timer);
  }, [hasUnsavedDraft, workingDraft, workingTitle, workingSummary, workingStatus, activeChapterId, flushDraft]);

  // Al cambiar de capítulo o desmontar, no perder lo pendiente del capítulo que se abandona
  useEffect(() => flushDraft, [activeChapterId, flushDraft]);

  // Pestaña oculta o cierre: guardar y, si no se pudo, avisar al navegador
  useEffect(() => {
    const onVisibility = () => {
      if (document.visibilityState === 'hidden') flushDraft();
    };
    const onBeforeUnload = (event) => {
      if (!latestDraftRef.current.unsaved) return;
      flushDraft();
      event.preventDefault();
      event.returnValue = '';
    };
    document.addEventListener('visibilitychange', onVisibility);
    window.addEventListener('beforeunload', onBeforeUnload);
    return () => {
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('beforeunload', onBeforeUnload);
    };
  }, [flushDraft]);

  // 5. Commit de versión (Git-like snapshot)
  const commitVersion = useCallback(async (commitMessage) => {
    if (!activeChapterId) return { success: false, error: 'No hay capítulo activo' };
    const { chapterId: draftChapterId, patch: draft } = latestDraftRef.current;
    if (!draft || draftChapterId !== activeChapterId) return { success: false, error: 'El borrador aún no está listo' };
    const msg = (commitMessage || '').trim() || 'Punto de control sin mensaje';

    try {
      const res = await ApiService.chapters.createCommit(
        activeChapterId,
        msg,
        draft.title,
        draft.content,
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
  }, [activeChapterId, user?.id, setLoading]);

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

  const editorValue = useMemo(() => ({ workingDraft, setWorkingDraft }), [workingDraft]);

  const coreValue = useMemo(() => ({
    chapters,
    loading,
    activeChapterId,
    activeChapter,
    setActiveChapterId,
    // Working buffer (el texto del borrador va en el contexto editor)
    workingTitle,
    setWorkingTitle,
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
    saveStatus,
    hasUnsavedDraft,
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
    saveStatus,
    hasUnsavedDraft,
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
    <ManuscriptContext.Provider value={coreValue}>
      <ManuscriptEditorContext.Provider value={editorValue}>
        {children}
      </ManuscriptEditorContext.Provider>
    </ManuscriptContext.Provider>
  );
}

const noop = () => {};

const DEFAULT_CORE = {
  chapters: [],
  loading: false,
  activeChapterId: null,
  activeChapter: null,
  setActiveChapterId: noop,
  workingTitle: '',
  setWorkingTitle: noop,
  workingSummary: '',
  setWorkingSummary: noop,
  workingStatus: 'draft',
  setWorkingStatus: noop,
  lastCommittedContent: '',
  diffSummary: { isClean: true, addedLines: 0, removedLines: 0, diffChunks: [] },
  wordDiff: [],
  isDirty: false,
  wordCount: 0,
  totalManuscriptWords: 0,
  versions: [],
  versionsLoading: false,
  loadVersions: noop,
  saveDraft: noop,
  saveStatus: 'idle',
  hasUnsavedDraft: false,
  commitVersion: async () => {},
  restoreVersion: noop,
  createChapter: async () => {},
  deleteChapter: noop,
  loadChapters: noop,
  isCommitModalOpen: false,
  setIsCommitModalOpen: noop,
  isHistoryDrawerOpen: false,
  setIsHistoryDrawerOpen: noop,
  isDiffModalOpen: false,
  setIsDiffModalOpen: noop,
  reviewMode: false,
  setReviewMode: noop,
};

const DEFAULT_EDITOR = { workingDraft: '', setWorkingDraft: noop };

/**
 * Todo el estado del manuscrito excepto el texto del borrador. No se re-renderiza al escribir:
 * usarlo en cualquier componente que no necesite `workingDraft`.
 */
export function useManuscriptCore() {
  return useContext(ManuscriptContext) || DEFAULT_CORE;
}

/** Estado completo, incluido el texto del borrador (se re-renderiza en cada pulsación). */
export function useManuscript() {
  const core = useManuscriptCore();
  const editor = useContext(ManuscriptEditorContext) || DEFAULT_EDITOR;
  return useMemo(() => ({ ...core, ...editor }), [core, editor]);
}
