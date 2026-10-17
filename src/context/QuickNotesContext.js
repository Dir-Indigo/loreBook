import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { ApiService } from '../utils/ApiService';
import { useAuth } from './AuthContext';
import { useBackgroundSync } from './SyncContext';

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
  const { executeOptimistic } = useBackgroundSync();
  const [notes, setNotes] = useState([]);
  const [notesLoading, setNotesLoading] = useState(false);
  
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

  const loadNotes = useCallback(async (storyId = null) => {
    if (!user?.id) return;
    setNotesLoading(true);
    const { data } = await ApiService.quickNotes.getAll(user.id, storyId, null);
    setNotes(data || []);
    setNotesLoading(false);
  }, [user?.id]);

  // Automatically load notes as soon as user is authenticated
  useEffect(() => {
    if (user?.id) {
      loadNotes(null);
    } else {
      setNotes([]);
    }
  }, [user?.id, loadNotes]);

  const createNote = useCallback(async ({ content = '', color = '#f5e6c8', storyId = null, story_id = null, status = 'idea' }) => {
    if (!user?.id) return { data: null, error: new Error('Not authenticated') };

    const targetStoryId = storyId || story_id || null;

    // Optimistic insert with a temp id
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

    return await executeOptimistic(
      async () => {
        const result = await ApiService.quickNotes.create(
          { user_id: user.id, story_id: targetStoryId, content, color, status },
          null
        );
        if (result && result.data) {
          setNotes((prev) => prev.map((n) => (n.id === tempId ? result.data : n)));
        }
        return result;
      },
      {
        onRollback: () => {
          setNotes((prev) => prev.filter((n) => n.id !== tempId));
        },
      }
    );
  }, [user?.id, executeOptimistic]);

  const updateNote = useCallback(async (id, patch) => {
    const previous = notes;
    // Optimistic local patch
    setNotes((prev) =>
      prev.map((n) => (n.id === id ? { ...n, ...patch, updated_at: new Date().toISOString() } : n))
    );

    return await executeOptimistic(
      () => ApiService.quickNotes.update(id, patch, null),
      {
        onRollback: () => {
          setNotes(previous);
        },
      }
    );
  }, [notes, executeOptimistic]);

  const deleteNote = useCallback(async (id) => {
    // Optimistic delete
    const previous = notes;
    setNotes((prev) => prev.filter((n) => n.id !== id));

    return await executeOptimistic(
      () => ApiService.quickNotes.delete(id, null),
      {
        onRollback: () => {
          setNotes(previous);
        },
      }
    );
  }, [notes, executeOptimistic]);

  const togglePin = useCallback((id) => {
    const note = notes.find((n) => n.id === id);
    if (note) updateNote(id, { is_pinned: !note.is_pinned });
  }, [notes, updateNote]);

  // Sort: pinned first, then by updated_at descending
  const sortedNotes = [...notes].sort((a, b) => {
    if (a.is_pinned !== b.is_pinned) return a.is_pinned ? -1 : 1;
    return new Date(b.updated_at) - new Date(a.updated_at);
  });

  return (
    <QuickNotesContext.Provider value={{
      notes: sortedNotes,
      notesLoading,
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
