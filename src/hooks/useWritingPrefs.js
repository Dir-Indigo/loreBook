import { useCallback, useEffect, useState } from 'react';

const STORAGE_KEY = 'lorebook_writing_prefs';

export const WRITING_THEMES = {
  normal: { label: 'Normal', paper: null, outer: null, text: null, muted: null, border: null },
  // Papel cálido de bajo contraste: reduce el deslumbramiento de fondos blancos
  sepia: { label: 'Sepia', paper: '#f4ecd8', outer: '#e8dfc6', text: '#433422', muted: '#7a6a52', border: '#d8cba9' },
  // Fondo oscuro suave (no negro puro) y texto crema, para escribir de noche
  night: { label: 'Noche suave', paper: '#23272e', outer: '#191c21', text: '#d9d3c5', muted: '#9a9588', border: '#363b44' },
};

export const WRITING_FONTS = {
  serif: { label: 'Con serifa', family: 'Merriweather, Georgia, "Times New Roman", serif' },
  sans: { label: 'Sin serifa', family: 'Inter, "Segoe UI", Roboto, Arial, sans-serif' },
};

export const WRITING_WIDTHS = { sm: 'Estrecho', md: 'Medio', lg: 'Ancho' };

export const DEFAULT_WRITING_PREFS = {
  theme: 'normal',
  font: 'serif',
  size: 18, // px
  lineHeight: 1.85,
  width: 'md',
};

export const SIZE_LIMITS = { min: 14, max: 26 };

const sanitize = (raw) => {
  const prefs = { ...DEFAULT_WRITING_PREFS, ...(raw || {}) };
  if (!WRITING_THEMES[prefs.theme]) prefs.theme = DEFAULT_WRITING_PREFS.theme;
  if (!WRITING_FONTS[prefs.font]) prefs.font = DEFAULT_WRITING_PREFS.font;
  if (!WRITING_WIDTHS[prefs.width]) prefs.width = DEFAULT_WRITING_PREFS.width;
  prefs.size = Math.min(SIZE_LIMITS.max, Math.max(SIZE_LIMITS.min, Number(prefs.size) || DEFAULT_WRITING_PREFS.size));
  prefs.lineHeight = Math.min(2.4, Math.max(1.4, Number(prefs.lineHeight) || DEFAULT_WRITING_PREFS.lineHeight));
  return prefs;
};

/** Preferencias de escritura (tema, fuente, tamaño…) que se recuerdan en este navegador. */
export function useWritingPrefs() {
  const [prefs, setPrefs] = useState(DEFAULT_WRITING_PREFS);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) setPrefs(sanitize(JSON.parse(saved)));
    } catch (e) { /* almacenamiento no disponible */ }
  }, []);

  const updatePrefs = useCallback((patch) => {
    setPrefs((current) => {
      const next = sanitize({ ...current, ...patch });
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); } catch (e) { /* ignorar */ }
      return next;
    });
  }, []);

  const resetPrefs = useCallback(() => updatePrefs(DEFAULT_WRITING_PREFS), [updatePrefs]);

  return { prefs, updatePrefs, resetPrefs };
}
