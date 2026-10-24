import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { useCharacterDrawer } from './CharacterDrawerContext';
import { useQuickNotes } from './QuickNotesContext';

const SidebarDetailContext = createContext(null);

export const DETAIL_VIEWS = {
  CHARACTERS: 'characters',
  NOTES: 'notes',
  PLOTS: 'plots', // Preparado para la gestión de capítulos, partes y tramas a futuro
};

/**
 * SidebarDetailProvider — Coordina el SidebarDetail unificado (el hijo único que nace de SidebarLore).
 * Permite que cualquier componente del sistema abra, cierre, expanda o conmute
 * entre las vistas de detalle sin conflictos de espacio ni sidebars superpuestos.
 */
export function SidebarDetailProvider({ children }) {
  const {
    open: charDrawerOpen,
    openDrawer: openCharacterDrawer,
    closeDrawer: closeCharacterDrawer,
    setFocusedCharacterId,
  } = useCharacterDrawer();

  const {
    isOpen: isNotesOpen,
    setIsOpen: setNotesOpen,
    setStatusFilter,
    setSearchQuery,
  } = useQuickNotes();

  // Active detail view: 'characters' | 'notes' | 'plots' | null
  const [activeView, setActiveViewState] = useState(null);

  // Growth / Expansion state (360px <-> 560px)
  const [isExpanded, setIsExpandedState] = useState(false);

  // Dock / Pin state
  const [isPinned, setIsPinnedState] = useState(false);

  // Initialize persisted preferences from localStorage safely
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedExpanded = localStorage.getItem('lorebook_sidebar_detail_expanded');
      if (savedExpanded === 'true') {
        setIsExpandedState(true);
      }
      const savedPinned = localStorage.getItem('lorebook_sidebar_detail_pinned');
      if (savedPinned === 'true') {
        setIsPinnedState(true);
      }
    }
  }, []);

  const toggleExpand = useCallback(() => {
    setIsExpandedState((prev) => {
      const next = !prev;
      if (typeof window !== 'undefined') {
        localStorage.setItem('lorebook_sidebar_detail_expanded', next ? 'true' : 'false');
      }
      return next;
    });
  }, []);

  const togglePinned = useCallback(() => {
    setIsPinnedState((prev) => {
      const next = !prev;
      if (typeof window !== 'undefined') {
        localStorage.setItem('lorebook_sidebar_detail_pinned', next ? 'true' : 'false');
      }
      return next;
    });
  }, []);

  // Sync with existing context flags
  useEffect(() => {
    if (charDrawerOpen && !isNotesOpen) {
      setActiveViewState(DETAIL_VIEWS.CHARACTERS);
    } else if (isNotesOpen && !charDrawerOpen) {
      setActiveViewState(DETAIL_VIEWS.NOTES);
    } else if (!charDrawerOpen && !isNotesOpen) {
      setActiveViewState(null);
    }
  }, [charDrawerOpen, isNotesOpen]);

  /**
   * Abre una vista específica en el SidebarDetail
   */
  const openDetail = useCallback((view, payload = {}) => {
    if (view === DETAIL_VIEWS.CHARACTERS) {
      setNotesOpen(false);
      if (payload?.characterId && setFocusedCharacterId) {
        setFocusedCharacterId(payload.characterId);
      }
      openCharacterDrawer(payload?.characterId || null);
      setActiveViewState(DETAIL_VIEWS.CHARACTERS);
    } else if (view === DETAIL_VIEWS.NOTES) {
      closeCharacterDrawer();
      if (payload?.statusFilter && setStatusFilter) {
        setStatusFilter(payload.statusFilter);
      }
      if (payload?.searchQuery !== undefined && setSearchQuery) {
        setSearchQuery(payload.searchQuery);
      }
      setNotesOpen(true);
      setActiveViewState(DETAIL_VIEWS.NOTES);
    } else if (view === DETAIL_VIEWS.PLOTS) {
      closeCharacterDrawer();
      setNotesOpen(false);
      setActiveViewState(DETAIL_VIEWS.PLOTS);
    }
  }, [closeCharacterDrawer, openCharacterDrawer, setFocusedCharacterId, setNotesOpen, setSearchQuery, setStatusFilter]);

  /**
   * Cierra el SidebarDetail
   */
  const closeDetail = useCallback(() => {
    closeCharacterDrawer();
    setNotesOpen(false);
    setActiveViewState(null);
  }, [closeCharacterDrawer, setNotesOpen]);

  /**
   * Conmuta la vista activa del SidebarDetail sin cerrar el panel
   */
  const setDetailView = useCallback((newView) => {
    if (newView === activeView) return;
    openDetail(newView);
  }, [activeView, openDetail]);

  const isOpen = activeView !== null;

  const value = {
    activeView,
    isOpen,
    isExpanded,
    isPinned,
    toggleExpand,
    togglePinned,
    openDetail,
    closeDetail,
    setDetailView,
  };

  return (
    <SidebarDetailContext.Provider value={value}>
      {children}
    </SidebarDetailContext.Provider>
  );
}

export function useSidebarDetail() {
  const context = useContext(SidebarDetailContext);
  if (!context) {
    // Graceful fallback if called outside provider
    return {
      activeView: null,
      isOpen: false,
      isExpanded: false,
      isPinned: false,
      toggleExpand: () => {},
      togglePinned: () => {},
      openDetail: () => {},
      closeDetail: () => {},
      setDetailView: () => {},
    };
  }
  return context;
}
