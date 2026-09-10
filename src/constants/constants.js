/**
 * Centralized Application Constants & Theme Palettes
 * Lorebook & Worldbuilding Platform
 */

export const APP_CONFIG = {
  NAME: 'Lorebook Studio',
  VERSION: '1.0.0',
  EVENT_TITLE_MAX_LENGTH: 55, // Strict limit to prevent visual overflow in canvas cards
  ZOOM_COMPACT_THRESHOLD: 0.72, // Scale threshold for multiscale node representation
};

export const USER_ROLES = {
  SUPERADMIN: 'superadmin',
  WRITER: 'writer',
};

export const CHARACTER_ARCHETYPES = [
  'Protagonista',
  'Antagonista',
  'Secundario',
  'Mentor',
  'Interés Amoroso',
  'Aliado',
  'Guardián',
  'Heraldo',
  'Pícaro',
  'Figura de Autoridad',
  'Entidad Mítica',
];

export const RELATIONSHIP_TYPES = [
  'Aliado',
  'Rival',
  'Familia',
  'Romance',
  'Mentor / Aprendiz',
  'Enemigo',
  'Pacto / Juramento',
  'Subordinado',
  'Desconocido',
];

export const EVENT_IMPORTANCE = [
  { value: 'low', label: 'Secundario' },
  { value: 'medium', label: 'Importante' },
  { value: 'high', label: 'Clímax / Crítico' },
  { value: 'legendary', label: 'Hito Histórico' },
];

/**
 * 4 Curated Anti-Fatigue Matte Color Themes (RNF-3, RF-5.3, RF-5.4, RF-5.5)
 * Non-glossy, soft on the eyes, balanced contrast for long writing sessions.
 */
export const MATTE_THEMES = {
  warm_sand: {
    id: 'warm_sand',
    name: 'Cálido Arena',
    description: 'Tonalidades crema y tierra suave para una lectura natural similar al papel pergamino.',
    mode: 'light',
    palette: {
      primary: {
        main: '#8c6d53',
        light: '#bcaaa4',
        dark: '#5d4037',
        contrastText: '#fdfbf7',
      },
      secondary: {
        main: '#607d8b',
        light: '#90a4ae',
        dark: '#37474f',
        contrastText: '#ffffff',
      },
      background: {
        default: '#f7f4ed',
        paper: '#fdfbf7',
        canvas: '#efeae1',
        sidebar: '#f2ece2',
        subtle: '#e8e0d4',
      },
      text: {
        primary: '#3e342d',
        secondary: '#6d6157',
        disabled: '#a89c92',
      },
      divider: '#e3dad0',
      node: {
        bg: '#fdfbf7',
        border: '#d7cabb',
        borderActive: '#8c6d53',
        compactBg: '#e8e0d4',
      },
      tagColors: ['#8c6d53', '#5d6d7e', '#6e7f60', '#9c6b6b', '#827717', '#546e7a'],
    },
  },

  sepia_writer: {
    id: 'sepia_writer',
    name: 'Sepia Escritor',
    description: 'Estética de máquina de escribir y biblioteca clásica con cálidos contrastes mate.',
    mode: 'light',
    palette: {
      primary: {
        main: '#795548',
        light: '#a1887f',
        dark: '#4e342e',
        contrastText: '#faf7f2',
      },
      secondary: {
        main: '#78909c',
        light: '#b0bec5',
        dark: '#455a64',
        contrastText: '#ffffff',
      },
      background: {
        default: '#f3ede3',
        paper: '#faf7f2',
        canvas: '#eae2d4',
        sidebar: '#ebe4d7',
        subtle: '#e2d7c5',
      },
      text: {
        primary: '#33261d',
        secondary: '#5e4e42',
        disabled: '#9c8c80',
      },
      divider: '#dccfc0',
      node: {
        bg: '#faf7f2',
        border: '#cebea9',
        borderActive: '#795548',
        compactBg: '#e2d7c5',
      },
      tagColors: ['#795548', '#546e7a', '#558b2f', '#ad1457', '#e65100', '#4e342e'],
    },
  },

  muted_dark: {
    id: 'muted_dark',
    name: 'Noche Atenuada',
    description: 'Modo oscuro carbón suave no reflectante diseñado para sesiones nocturnas.',
    mode: 'dark',
    palette: {
      primary: {
        main: '#9fa8da',
        light: '#c5cae9',
        dark: '#5c6bc0',
        contrastText: '#12161f',
      },
      secondary: {
        main: '#80cbc4',
        light: '#b2dfdb',
        dark: '#00897b',
        contrastText: '#12161f',
      },
      background: {
        default: '#1a1d24',
        paper: '#222731',
        canvas: '#16181f',
        sidebar: '#1e222b',
        subtle: '#2a303d',
      },
      text: {
        primary: '#e3e8f0',
        secondary: '#9ea8b6',
        disabled: '#5a6473',
      },
      divider: '#2d3442',
      node: {
        bg: '#222731',
        border: '#333b4d',
        borderActive: '#9fa8da',
        compactBg: '#2a303d',
      },
      tagColors: ['#9fa8da', '#80cbc4', '#ce93d8', '#ffab91', '#81c784', '#ffe082'],
    },
  },

  slate_executive: {
    id: 'slate_executive',
    name: 'Gris Ejecutivo',
    description: 'Paleta minimalista y limpia con tonos pizarra neutros y excelente legibilidad.',
    mode: 'light',
    palette: {
      primary: {
        main: '#475569',
        light: '#64748b',
        dark: '#334155',
        contrastText: '#f8fafc',
      },
      secondary: {
        main: '#0d9488',
        light: '#14b8a6',
        dark: '#0f766e',
        contrastText: '#ffffff',
      },
      background: {
        default: '#f1f5f9',
        paper: '#ffffff',
        canvas: '#e2e8f0',
        sidebar: '#e8edf3',
        subtle: '#cbd5e1',
      },
      text: {
        primary: '#0f172a',
        secondary: '#475569',
        disabled: '#94a3b8',
      },
      divider: '#cbd5e1',
      node: {
        bg: '#ffffff',
        border: '#cbd5e1',
        borderActive: '#475569',
        compactBg: '#e2e8f0',
      },
      tagColors: ['#475569', '#0d9488', '#d97706', '#dc2626', '#2563eb', '#7c3aed'],
    },
  },
};
