import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { ThemeProvider as MuiThemeProvider, CssBaseline } from '@mui/material';
import { MATTE_THEMES } from '../constants/constants';
import { createLoreTheme } from '../constants/theme';

const ThemeContext = createContext({
  activeThemeKey: 'warm_sand',
  setThemeKey: () => {},
  themes: MATTE_THEMES,
  currentThemeConfig: MATTE_THEMES.warm_sand,
});

export const LoreThemeProvider = ({ children }) => {
  const [activeThemeKey, setActiveThemeKey] = useState('warm_sand');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    try {
      const savedTheme = localStorage.getItem('lorebook_theme_key');
      if (savedTheme && MATTE_THEMES[savedTheme]) {
        setActiveThemeKey(savedTheme);
      }
    } catch (e) {
      console.warn('Could not read theme from localStorage', e);
    }
    setMounted(true);
  }, []);

  const handleSetTheme = (themeKey) => {
    if (MATTE_THEMES[themeKey]) {
      setActiveThemeKey(themeKey);
      try {
        localStorage.setItem('lorebook_theme_key', themeKey);
      } catch (e) {
        console.warn('Could not save theme to localStorage', e);
      }
    }
  };

  const muiTheme = useMemo(() => {
    return createLoreTheme(activeThemeKey);
  }, [activeThemeKey]);

  const currentThemeConfig = MATTE_THEMES[activeThemeKey] || MATTE_THEMES.warm_sand;

  return (
    <ThemeContext.Provider
      value={{
        activeThemeKey,
        setThemeKey: handleSetTheme,
        themes: MATTE_THEMES,
        currentThemeConfig,
      }}
    >
      <MuiThemeProvider theme={muiTheme}>
        <CssBaseline />
        {children}
      </MuiThemeProvider>
    </ThemeContext.Provider>
  );
};

export const useLoreTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useLoreTheme must be used within a LoreThemeProvider');
  }
  return context;
};
