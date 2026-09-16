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
  'Deuteragonista',
  'Antagonista',
  'Mentor',
  'Secundario',
  'Terciario',
  'Ambiental',
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

export const CHARACTER_COLOR_PALETTE = [
  // --- PRIMARIOS MATE (Posiciones 0 a 2) ---
  '#0284c7', // Azul Cerúleo Mate (Primario)
  '#eab308', // Amarillo Mostaza / Dorado Mate (Primario)
  '#be123c', // Rojo Carmesí Mate (Primario)

  // --- SECUNDARIOS MATE (Posiciones 3 a 5) ---
  '#16a34a', // Verde Hoja Mate (Secundario)
  '#ea580c', // Naranja Terracota Mate (Secundario)
  '#7c3aed', // Violeta / Púrpura Mate (Secundario)

  // --- NEUTROS Y COMPLEMENTARIOS MATE (Posiciones 6 a 10) ---
  '#0d9488', // Verde Azulado / Teal Mate
  '#be185d', // Rosa Magenta Mate
  '#854d0e', // Ocre / Tierra Mate
  '#64748b', // Gris Pizarra Medio Mate
  '#1e293b', // Azul Oscuro / Grafito Mate
];

/**
 * 4 Curated Anti-Fatigue Matte Color Themes (RNF-3, RF-5.3, RF-5.4, RF-5.5)
 * Non-glossy, soft on the eyes, balanced contrast for long writing sessions with harmonious secondary accents.
 */
export const MATTE_THEMES = {
  warm_sand: {
    id: 'warm_sand',
    name: 'Cálido Arena',
    description: 'Tonalidades crema y tierra suave con un contraste verde salvia mate armonioso.',
    mode: 'light',
    palette: {
      primary: {
        main: '#8c6d53', // Terracota / Tierra suave
        light: '#bcaaa4',
        dark: '#5d4037',
        contrastText: '#fdfbf7',
      },
      secondary: {
        main: '#4a7c72', // Verde Salvia Mate / Laurel Pine
        light: '#78a89f',
        dark: '#2d564e',
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
      tagColors: ['#8c6d53', '#4a7c72', '#b26a45', '#5d6d7e', '#827717', '#9c6b6b'],
    },
  },

  sepia_writer: {
    id: 'sepia_writer',
    name: 'Sepia Escritor',
    description: 'Estética de biblioteca clásica y máquina de escribir con acento azul petróleo mate.',
    mode: 'light',
    palette: {
      primary: {
        main: '#795548', // Madera noble / Sepia intenso
        light: '#a1887f',
        dark: '#4e342e',
        contrastText: '#faf7f2',
      },
      secondary: {
        main: '#356877', // Azul Petróleo Profundo Mate
        light: '#6596a5',
        dark: '#1e4652',
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
      tagColors: ['#795548', '#356877', '#a0522d', '#558b2f', '#ad1457', '#4e342e'],
    },
  },

  muted_dark: {
    id: 'muted_dark',
    name: 'Noche Atenuada',
    description: 'Modo carbón suave no reflectante con acento ámbar/albaricoque cálido mate.',
    mode: 'dark',
    palette: {
      primary: {
        main: '#9fa8da', // Índigo / Lavanda atenuado
        light: '#c5cae9',
        dark: '#5c6bc0',
        contrastText: '#12161f',
      },
      secondary: {
        main: '#e09f67', // Ámbar Albaricoque Cálido Mate
        light: '#f0bc8e',
        dark: '#b2743e',
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
      tagColors: ['#9fa8da', '#e09f67', '#80cbc4', '#ce93d8', '#ffab91', '#81c784'],
    },
  },

  slate_executive: {
    id: 'slate_executive',
    name: 'Gris Ejecutivo',
    description: 'Paleta pizarra moderna y limpia con acento cobre/ocre mate de alto impacto.',
    mode: 'light',
    palette: {
      primary: {
        main: '#334155', // Pizarra grafito profundo
        light: '#64748b',
        dark: '#1e293b',
        contrastText: '#f8fafc',
      },
      secondary: {
        main: '#c26a27', // Ocre / Cobre Mate Ejecutivo
        light: '#df8d4f',
        dark: '#914a14',
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
        borderActive: '#334155',
        compactBg: '#e2e8f0',
      },
      tagColors: ['#334155', '#c26a27', '#0d9488', '#2563eb', '#7c3aed', '#dc2626'],
    },
  },
};
