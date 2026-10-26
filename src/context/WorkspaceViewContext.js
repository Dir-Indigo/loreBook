import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/router';
import AccountTreeOutlinedIcon from '@mui/icons-material/AccountTreeOutlined';
import PeopleOutlineIcon from '@mui/icons-material/PeopleOutline';
import LightbulbOutlinedIcon from '@mui/icons-material/LightbulbOutlined';
import AutoStoriesIcon from '@mui/icons-material/AutoStories';

const WorkspaceViewContext = createContext(null);

export const WORKSPACE_VIEW_KEYS = {
  EVENTS: 'events',
  CHARACTERS: 'characters',
  IDEAS: 'ideas',
  MANUSCRIPT: 'manuscript', // Preparado para la gestión de capítulos y redacción a futuro
};

/**
 * Metadata extensible para vistas del espacio de trabajo
 */
export const WORKSPACE_VIEWS_CONFIG = [
  {
    id: WORKSPACE_VIEW_KEYS.IDEAS,
    label: 'Pizarra de Ideas',
    shortLabel: 'Ideas',
    navLabel: 'Ideas',
    navShortLabel: 'Ideas',
    icon: LightbulbOutlinedIcon,
    description: 'Pizarra centralizada de ideas, notas rápidas y brainstorming',
  },
  {
    id: WORKSPACE_VIEW_KEYS.CHARACTERS,
    label: 'Personajes',
    shortLabel: 'Personajes',
    navLabel: 'Personajes',
    navShortLabel: 'Personajes',
    icon: PeopleOutlineIcon,
    description: 'Fichas completas, relaciones, carpetas y etiquetas',
  },
  {
    id: WORKSPACE_VIEW_KEYS.EVENTS,
    label: 'Eventos & Tramas',
    shortLabel: 'Tramas',
    navLabel: 'Estructura Narrativa',
    navShortLabel: 'Estructura',
    icon: AccountTreeOutlinedIcon,
    description: 'Lienzo visual de líneas narrativas, tableros y eventos',
  },
  {
    id: WORKSPACE_VIEW_KEYS.MANUSCRIPT,
    label: 'Capítulos & Manuscrito',
    shortLabel: 'Manuscrito',
    navLabel: 'Capítulos',
    navShortLabel: 'Capítulos',
    icon: AutoStoriesIcon,
    description: 'Redacción continua por capítulos con historial de versiones y diffs estilo Git',
  },
];

export function WorkspaceViewProvider({ children }) {
  const router = useRouter();

  // Deduce initial view based on route or query param
  const getInitialView = () => {
    if (typeof window === 'undefined') return WORKSPACE_VIEW_KEYS.EVENTS;
    const path = window.location.pathname;
    const search = new URLSearchParams(window.location.search);
    const viewParam = search.get('view');

    if (viewParam && Object.values(WORKSPACE_VIEW_KEYS).includes(viewParam)) {
      return viewParam;
    }
    if (path.startsWith('/characters')) return WORKSPACE_VIEW_KEYS.CHARACTERS;
    if (path.startsWith('/ideas')) return WORKSPACE_VIEW_KEYS.IDEAS;
    return WORKSPACE_VIEW_KEYS.EVENTS;
  };

  const [activeView, setActiveViewState] = useState(getInitialView);

  // Subbar (Floor 2) visibility state (persisted)
  const [isSubbarOpen, setIsSubbarOpen] = useState(true);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('lorebook_workspace_subbar');
      if (saved !== null) {
        setIsSubbarOpen(saved === 'true');
      }
    }
  }, []);

  const toggleSubbar = useCallback(() => {
    setIsSubbarOpen((prev) => {
      const next = !prev;
      if (typeof window !== 'undefined') {
        localStorage.setItem('lorebook_workspace_subbar', next.toString());
      }
      return next;
    });
  }, []);

  // Shared contextual filter states between WorkspaceNavbar and Views
  const [charactersSearch, setCharactersSearch] = useState('');
  const [charactersRoleFilter, setCharactersRoleFilter] = useState('all');
  const [charactersScope, setCharactersScope] = useState(0); // 0=Locales, 1=Globales, 2=Todos
  const [charactersTag, setCharactersTag] = useState('all'); // 'all' | tag.id
  const [charactersSort, setCharactersSort] = useState('name-asc');
  const [charactersViewMode, setCharactersViewMode] = useState('compact'); // 'gallery' | 'compact' | 'medium' | 'detailed'
  const [charactersShowDescriptions, setCharactersShowDescriptions] = useState(true);
  const [charactersGroupByRole, setCharactersGroupByRole] = useState(true);
  // Tarjetas de personaje con color de fondo (true) o neutras con acento lateral (false); se recuerda
  const [charactersColorCards, setCharactersColorCardsState] = useState(true);
  useEffect(() => {
    try {
      const saved = localStorage.getItem('lorebook_characters_color_cards');
      if (saved !== null) setCharactersColorCardsState(saved === 'true');
    } catch (e) { /* almacenamiento no disponible */ }
  }, []);
  const setCharactersColorCards = useCallback((value) => {
    setCharactersColorCardsState(value);
    try { localStorage.setItem('lorebook_characters_color_cards', String(value)); } catch (e) { /* ignorar */ }
  }, []);
  // Datos y acciones que la vista de personajes registra para que el navbar los muestre (tags, roles, conteos, modales)
  const [charactersToolbar, setCharactersToolbar] = useState(null);
  const [ideasSearch, setIdeasSearch] = useState('');
  const [ideasStatus, setIdeasStatus] = useState('all');
  const [ideasStoryFilter, setIdeasStoryFilter] = useState('all'); // 'all' | 'global' | story_id
  const [ideasViewMode, setIdeasViewMode] = useState('grid'); // 'grid' | 'kanban'
  const [eventsCompact, setEventsCompact] = useState(false);
  // Indica si el WorkspaceNavbar está montado (si no, las vistas muestran su propia barra)
  const [hasWorkspaceNavbar, setHasWorkspaceNavbar] = useState(false);

  // Sync state if user navigates via browser back/forward or route
  useEffect(() => {
    if (!router.isReady) return;
    const queryView = router.query.view;
    if (queryView && Object.values(WORKSPACE_VIEW_KEYS).includes(queryView)) {
      setActiveViewState(queryView);
    } else if (router.pathname.startsWith('/characters')) {
      setActiveViewState(WORKSPACE_VIEW_KEYS.CHARACTERS);
    } else if (router.pathname.startsWith('/ideas')) {
      setActiveViewState(WORKSPACE_VIEW_KEYS.IDEAS);
    } else if (router.pathname === '/dashboard') {
      setActiveViewState(WORKSPACE_VIEW_KEYS.EVENTS);
    }
  }, [router.isReady, router.pathname, router.query.view]);

  /**
   * Cambia la vista del lienzo SIN recargar la página
   */
  const setActiveView = useCallback((viewKey) => {
    if (!Object.values(WORKSPACE_VIEW_KEYS).includes(viewKey)) return;
    setActiveViewState(viewKey);

    // Actualiza la URL de forma sutil (shallow) para permitir compartir enlaces sin recargar
    if (typeof window !== 'undefined' && router.isReady) {
      const url = new URL(window.location.href);
      url.pathname = '/dashboard';
      if (viewKey === WORKSPACE_VIEW_KEYS.EVENTS) {
        url.searchParams.delete('view');
      } else {
        url.searchParams.set('view', viewKey);
      }
      window.history.replaceState({}, '', url.toString());
    }
  }, [router.isReady]);

  const value = useMemo(() => ({
    activeView,
    setActiveView,
    views: WORKSPACE_VIEWS_CONFIG,
    isEventsView: activeView === WORKSPACE_VIEW_KEYS.EVENTS,
    isCharactersView: activeView === WORKSPACE_VIEW_KEYS.CHARACTERS,
    isIdeasView: activeView === WORKSPACE_VIEW_KEYS.IDEAS,
    isManuscriptView: activeView === WORKSPACE_VIEW_KEYS.MANUSCRIPT,
    // Subbar Floor 2 controls
    isSubbarOpen,
    setIsSubbarOpen,
    toggleSubbar,
    // Shared contextual filters
    charactersSearch,
    setCharactersSearch,
    charactersRoleFilter,
    setCharactersRoleFilter,
    charactersScope,
    setCharactersScope,
    charactersTag,
    setCharactersTag,
    charactersSort,
    setCharactersSort,
    charactersViewMode,
    setCharactersViewMode,
    charactersShowDescriptions,
    setCharactersShowDescriptions,
    charactersGroupByRole,
    setCharactersGroupByRole,
    charactersColorCards,
    setCharactersColorCards,
    charactersToolbar,
    setCharactersToolbar,
    ideasSearch,
    setIdeasSearch,
    ideasStatus,
    setIdeasStatus,
    ideasStoryFilter,
    setIdeasStoryFilter,
    ideasViewMode,
    setIdeasViewMode,
    eventsCompact,
    setEventsCompact,
    hasWorkspaceNavbar,
    setHasWorkspaceNavbar,
  }), [
    activeView,
    setActiveView,
    isSubbarOpen,
    toggleSubbar,
    charactersSearch,
    charactersRoleFilter,
    charactersScope,
    charactersTag,
    charactersSort,
    charactersViewMode,
    charactersShowDescriptions,
    charactersGroupByRole,
    charactersColorCards,
    setCharactersColorCards,
    charactersToolbar,
    ideasSearch,
    ideasStatus,
    ideasStoryFilter,
    ideasViewMode,
    eventsCompact,
    hasWorkspaceNavbar,
  ]);

  return (
    <WorkspaceViewContext.Provider value={value}>
      {children}
    </WorkspaceViewContext.Provider>
  );
}

export function useWorkspaceView() {
  const context = useContext(WorkspaceViewContext);
  if (!context) {
    return {
      activeView: WORKSPACE_VIEW_KEYS.EVENTS,
      setActiveView: () => {},
      views: WORKSPACE_VIEWS_CONFIG,
      isEventsView: true,
      isCharactersView: false,
      isIdeasView: false,
      isManuscriptView: false,
      isSubbarOpen: true,
      setIsSubbarOpen: () => {},
      toggleSubbar: () => {},
      charactersSearch: '',
      setCharactersSearch: () => {},
      charactersRoleFilter: 'all',
      setCharactersRoleFilter: () => {},
      charactersScope: 0,
      setCharactersScope: () => {},
      charactersTag: 'all',
      setCharactersTag: () => {},
      charactersSort: 'name-asc',
      setCharactersSort: () => {},
      charactersViewMode: 'compact',
      setCharactersViewMode: () => {},
      charactersShowDescriptions: true,
      setCharactersShowDescriptions: () => {},
      charactersGroupByRole: true,
      setCharactersGroupByRole: () => {},
      charactersColorCards: true,
      setCharactersColorCards: () => {},
      charactersToolbar: null,
      setCharactersToolbar: () => {},
      ideasSearch: '',
      setIdeasSearch: () => {},
      ideasStatus: 'all',
      setIdeasStatus: () => {},
      ideasStoryFilter: 'all',
      setIdeasStoryFilter: () => {},
      ideasViewMode: 'grid',
      setIdeasViewMode: () => {},
      eventsCompact: false,
      setEventsCompact: () => {},
      hasWorkspaceNavbar: false,
      setHasWorkspaceNavbar: () => {},
    };
  }
  return context;
}

