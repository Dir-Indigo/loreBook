import { createTheme } from '@mui/material/styles';
import { MATTE_THEMES } from './constants';

/**
 * Builds a clean, matte, anti-fatigue Material UI theme without glossy/heavy shadows
 * @param {string} themeKey - one of 'warm_sand', 'sepia_writer', 'muted_dark', 'slate_executive'
 */
export function createLoreTheme(themeKey = 'warm_sand') {
  const currentTheme = MATTE_THEMES[themeKey] || MATTE_THEMES.warm_sand;
  const { palette, mode } = currentTheme;

  return createTheme({
    palette: {
      mode,
      primary: palette.primary,
      secondary: palette.secondary,
      background: {
        default: palette.background.default,
        paper: palette.background.paper,
      },
      text: palette.text,
      divider: palette.divider,
      custom: {
        canvas: palette.background.canvas,
        sidebar: palette.background.sidebar,
        subtle: palette.background.subtle,
        node: palette.node,
        tagColors: palette.tagColors,
      },
    },
    typography: {
      fontFamily: [
        'Outfit',
        'Inter',
        '-apple-system',
        'BlinkMacSystemFont',
        '"Segoe UI"',
        'Roboto',
        'sans-serif',
      ].join(','),
      h1: { fontWeight: 700, letterSpacing: '-0.02em' },
      h2: { fontWeight: 600, letterSpacing: '-0.015em' },
      h3: { fontWeight: 600, letterSpacing: '-0.01em' },
      h4: { fontWeight: 600 },
      h5: { fontWeight: 600 },
      h6: { fontWeight: 600 },
      subtitle1: { fontWeight: 500 },
      subtitle2: { fontWeight: 500 },
      button: { textTransform: 'none', fontWeight: 600 },
    },
    shape: {
      borderRadius: 10,
    },
    shadows: Array(25).fill('none').map((_, index) => {
      if (index === 0) return 'none';
      if (index === 1) return mode === 'dark' ? '0 2px 6px rgba(0,0,0,0.3)' : '0 2px 6px rgba(45,35,25,0.06)';
      if (index === 2) return mode === 'dark' ? '0 4px 12px rgba(0,0,0,0.4)' : '0 4px 12px rgba(45,35,25,0.08)';
      return mode === 'dark' ? '0 6px 18px rgba(0,0,0,0.5)' : '0 6px 18px rgba(45,35,25,0.10)';
    }),
    components: {
      MuiCssBaseline: {
        styleOverrides: {
          '*': {
            boxSizing: 'border-box',
          },
          'html, body': {
            margin: 0,
            padding: 0,
            width: '100%',
            height: '100%',
            backgroundColor: palette.background.default,
            color: palette.text.primary,
            overflow: 'hidden',
          },
          '#__next': {
            width: '100%',
            height: '100%',
          },
          '::-webkit-scrollbar': {
            width: '6px',
            height: '6px',
          },
          '::-webkit-scrollbar-track': {
            background: palette.background.default,
          },
          '::-webkit-scrollbar-thumb': {
            background: palette.divider,
            borderRadius: '4px',
          },
          '::-webkit-scrollbar-thumb:hover': {
            background: palette.primary.main,
          },
        },
      },
      MuiButton: {
        styleOverrides: {
          root: {
            boxShadow: 'none',
            borderRadius: 8,
            padding: '8px 16px',
            transition: 'all 0.2s ease-in-out',
            '&:hover': {
              boxShadow: 'none',
              filter: 'brightness(0.96)',
            },
          },
          contained: {
            '&:hover': {
              boxShadow: 'none',
            },
          },
          outlined: {
            borderWidth: '1.5px',
            '&:hover': {
              borderWidth: '1.5px',
            },
          },
        },
      },
      MuiPaper: {
        styleOverrides: {
          root: {
            backgroundImage: 'none',
            borderColor: palette.divider,
          },
        },
      },
      MuiDialog: {
        styleOverrides: {
          paper: {
            backgroundColor: palette.background.paper,
            border: `1px solid ${palette.divider}`,
            borderRadius: 14,
          },
        },
      },
      MuiCard: {
        styleOverrides: {
          root: {
            border: `1px solid ${palette.divider}`,
            borderRadius: 10,
          },
        },
      },
      MuiTableCell: {
        styleOverrides: {
          root: {
            borderColor: palette.divider,
            padding: '12px 16px',
          },
          head: {
            fontWeight: 600,
            backgroundColor: palette.background.subtle,
            color: palette.text.primary,
          },
        },
      },
      MuiChip: {
        styleOverrides: {
          root: {
            borderRadius: 6,
            fontWeight: 500,
          },
        },
      },
      MuiTextField: {
        defaultProps: {
          size: 'small',
          variant: 'outlined',
        },
      },
      MuiOutlinedInput: {
        styleOverrides: {
          root: {
            borderRadius: 8,
            backgroundColor: mode === 'dark' ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.015)',
            '& fieldset': {
              borderColor: palette.divider,
            },
            '&:hover fieldset': {
              borderColor: palette.primary.main,
            },
          },
        },
      },
    },
  });
}
