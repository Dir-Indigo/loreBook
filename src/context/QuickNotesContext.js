import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { ApiService } from '../utils/ApiService';
import { useAuth } from './AuthContext';

const QuickNotesContext = createContext(null);

export const NOTE_COLORS = [
  '#f5e6c8', // sand (default)
  '#fde8d8', // peach
  '#fce4ec', // rose
  '#e8f5e9', // mint
  '#e3f2fd', // sky
  '#ede7f6', // lavender
  '#fff9c4', // lemon
  '#f3e5f5', // lilac
  '#e0f2f1', // teal
  '#263238', // dark slate (dark mode note)
];

export const NOTE_STATUSES = [
  { value: 'idea',      label: 'Idea',       color: '#8c6d53' },
  { value: 'pending',   label: 'Pendiente',  color: '#ed6c02' },
  { value: 'done',      label: 'Hecha',      color: '#2e7d32' },
  { value: 'discarded', label: 'Descartada', color: '#9e9e9e' },
];

export const QuickNotesProvider = ({ children }) => {
  const { user } = useAuth();
  const [notes, setNotes] = useState([]);
  const [notesLoading, setNotesLoading] = useState(false);
  const [totalCount, setTotalCount] = useState(0);

  // Pagination & Filter States
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(15);
  const [scopeFilter, setScopeFilter] = useState('story'); // 'story' | 'global' | 'all'
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Panel open and pinned (docked) state
  const [isOpen, setIsOpen] = useState(false);
  const [isPinned, setIsPinnedState] = useState(false);

  // Initialize pinned state from localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('lorebook_notes_pinned');
      if (saved === 'true') {
        setIsPinnedState(true);
        setIsOpen(true);
      }
    }
  }, []);

  const setIsPinned = useCallback((pinned) => {
    setIsPinnedState(pinned);
    if (typeof window !== 'undefined') {
      localStorage.setItem('lorebook_notes_pinned', pinned ? 'true' : 'false');
    }
    if (pinned) {
      setIsOpen(true);
    }
  }, []);

  const togglePinned = useCallback(() => {
    setIsPinnedState((prev) => {
      const next = !prev;
      if (typeof window !== 'undefined') {
        localStorage.setItem('lorebook_notes_pinned', next ? 'true' : 'false');
      }
      if (next) setIsOpen(true);
      return next;
    });
  }, []);

  const toggleOpen = useCallback(() => {
    setIsOpen((prev) => !prev);
  }, []);

  // Centralized, optimized note fetcher with pagination & filtering
  const loadNotes = useCallback(async (optionsArg = null) => {
    if (!user?.id) return;
    setNotesLoading(true);

    let opts = {};
    let targetStoryId = null;

    if (typeof optionsArg === 'string') {
      targetStoryId = optionsArg;
    } else if (optionsArg && typeof optionsArg === 'object') {
      targetStoryId = optionsArg.storyId || null;
      opts = { ...optionsArg };
    }

    const currentPage = opts.page ?? page;
    const currentPageSize = opts.pageSize ?? pageSize;
    const currentScope = opts.scope ?? scopeFilter;
    const currentStatus = opts.status ?? statusFilter;
    const currentSearch = opts.search ?? searchQuery;

    try {
      const result = await ApiService.quickNotes.getAll(user.id, targetStoryId, {
        page: currentPage,
        pageSize: currentPageSize,
        scope: currentScope,
        status: currentStatus,
        search: currentSearch,
      });

      if (result?.data) {
        setNotes(result.data);
        if (typeof result.count === 'number') {
          setTotalCount(result.count);
        } else {
          setTotalCount(result.data.length);
        }
      }
    } catch (err) {
      console.error('[QuickNotesContext] Error loading notes:', err);
    } finally {
      setNotesLoading(false);
    }
  }, [user?.id, page, pageSize, scopeFilter, statusFilter, searchQuery]);

  // Load notes initially or when user signs in
  useEffect(() => {
    if (user?.id) {
      loadNotes();
    } else {
      setNotes([]);
      setTotalCount(0);
    }
  }, [user?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // Pagination Actions
  const handleSetPage = useCallback((newPage) => {
    setPage(newPage);
    loadNotes({ page: newPage });
  }, [loadNotes]);

  const nextPage = useCallback(() => {
    const totalPages = Math.ceil(totalCount / pageSize) || 1;
    if (page < totalPages) {
      handleSetPage(page + 1);
    }
  }, [page, pageSize, totalCount, handleSetPage]);

  const prevPage = useCallback(() => {
    if (page > 1) {
      handleSetPage(page - 1);
    }
  }, [page, handleSetPage]);

  const handleSetScopeFilter = useCallback((scope) => {
    setScopeFilter(scope);
    setPage(1);
    loadNotes({ scope, page: 1 });
  }, [loadNotes]);

  const handleSetStatusFilter = useCallback((status) => {
    setStatusFilter(status);
    setPage(1);
    loadNotes({ status, page: 1 });
  }, [loadNotes]);

  const handleSetSearchQuery = useCallback((search) => {
    setSearchQuery(search);
    setPage(1);
    loadNotes({ search, page: 1 });
  }, [loadNotes]);

  const createNote = useCallback(async ({ content = '', color = '#f5e6c8', storyId = null, story_id = null, status = 'idea' }) => {
    if (!user?.id) return { data: null, error: new Error('Not authenticated') };

    const targetStoryId = storyId || story_id || null;

    // Optimistic insert with temp id
    const tempId = `temp-${Date.now()}`;
    const optimistic = {
      id: tempId,
      user_id: user.id,
      story_id: targetStoryId,
      content,
      color,
      status,
      tags: [],
      is_pinned: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    setNotes((prev) => [optimistic, ...prev]);
    setTotalCount((c) => c + 1);

    const result = await ApiService.quickNotes.create(
      { user_id: user.id, story_id: targetStoryId, content, color, status },
      null
    );

    if (result.error || !result.data) {
      // Rollback
      setNotes((prev) => prev.filter((n) => n.id !== tempId));
      setTotalCount((c) => Math.max(0, c - 1));
      return result;
    }

    // Replace optimistic with real record
    setNotes((prev) => prev.map((n) => (n.id === tempId ? result.data : n)));
    return result;
  }, [user?.id]);

  const updateNote = useCallback(async (id, patch) => {
    // Optimistic local patch
    setNotes((prev) =>
      prev.map((n) => (n.id === id ? { ...n, ...patch, updated_at: new Date().toISOString() } : n))
    );

    const result = await ApiService.quickNotes.update(id, patch, null);
    if (result.error) {
      // Re-fetch on error to ensure sync
      loadNotes();
    }
    return result;
  }, [loadNotes]);

  const deleteNote = useCallback(async (id) => {
    // Optimistic delete
    const previous = notes;
    setNotes((prev) => prev.filter((n) => n.id !== id));
    setTotalCount((c) => Math.max(0, c - 1));

    const result = await ApiService.quickNotes.delete(id, null);
    if (result.error) {
      setNotes(previous);
      setTotalCount((c) => c + 1);
    }
    return result;
  }, [notes]);

  const togglePin = useCallback((id) => {
    const note = notes.find((n) => n.id === id);
    if (note) updateNote(id, { is_pinned: !note.is_pinned });
  }, [notes, updateNote]);

  // Sort: pinned first, then by updated_at descending
  const sortedNotes = [...notes].sort((a, b) => {
    if (a.is_pinned !== b.is_pinned) return a.is_pinned ? -1 : 1;
    return new Date(b.updated_at) - new Date(a.updated_at);
  });

  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  const hasMore = page < totalPages;

  return (
    <QuickNotesContext.Provider value={{
      notes: sortedNotes,
      notesLoading,
      totalCount,
      page,
      pageSize,
      totalPages,
      hasMore,
      setPage: handleSetPage,
      nextPage,
      prevPage,
      scopeFilter,
      setScopeFilter: handleSetScopeFilter,
      statusFilter,
      setStatusFilter: handleSetStatusFilter,
      searchQuery,
      setSearchQuery: handleSetSearchQuery,
      isOpen,
      setIsOpen,
      toggleOpen,
      isPinned,
      setIsPinned,
      togglePinned,
      loadNotes,
      createNote,
      updateNote,
      deleteNote,
      togglePin,
    }}>
      {children}
    </QuickNotesContext.Provider>
  );
};

export const useQuickNotes = () => {
  const ctx = useContext(QuickNotesContext);
  if (!ctx) throw new Error('useQuickNotes must be used inside QuickNotesProvider');
  return ctx;
};
