import React, { createContext, useContext, useState, useCallback, useEffect, useMemo } from 'react';

const CharacterDrawerContext = createContext(null);

/**
 * CharacterDrawerContext — gestiona el estado del CharacterDrawer globalmente.
 * Permite abrir/cerrar el drawer desde cualquier página o componente sin
 * que el drawer se destruya al navegar.
 */
export function CharacterDrawerProvider({ children }) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('lorebook_char_drawer_open');
      if (saved === 'true') {
        setOpen(true);
      }
    }
  }, []);

  const [focusedCharacterId, setFocusedCharacterId] = useState(null);
  const [selectedCharacter, setSelectedCharacter] = useState(null);
  const [isCloneMode, setIsCloneMode] = useState(false);

  const setOpenPersisted = useCallback((value) => {
    setOpen(value);
    if (typeof window !== 'undefined') {
      localStorage.setItem('lorebook_char_drawer_open', value.toString());
    }
  }, []);

  /**
   * Opens the drawer.
   * - If called with no args or a React event → toggles
   * - If called with a character object or id → opens and focuses that character
   */
  const openDrawer = useCallback((charOrId = null) => {
    const isEvent = Boolean(
      charOrId &&
        (charOrId.nativeEvent ||
          charOrId._reactName ||
          typeof charOrId.preventDefault === 'function')
    );
    const targetId = isEvent
      ? null
      : typeof charOrId === 'object' && charOrId
      ? charOrId.id
      : charOrId;

    setFocusedCharacterId(targetId || null);
    if (isEvent) {
      setOpen((prev) => {
        const next = !prev;
        if (typeof window !== 'undefined') {
          localStorage.setItem('lorebook_char_drawer_open', next.toString());
        }
        return next;
      });
    } else {
      setOpenPersisted(true);
    }
  }, [setOpenPersisted]);

  const closeDrawer = useCallback(() => {
    setOpenPersisted(false);
    setFocusedCharacterId(null);
  }, [setOpenPersisted]);

  const prepareCreateChar = useCallback(() => {
    setSelectedCharacter(null);
    setIsCloneMode(false);
  }, []);

  const prepareEditChar = useCallback((char) => {
    setSelectedCharacter(char);
    setIsCloneMode(false);
  }, []);

  const prepareCloneChar = useCallback((char) => {
    setSelectedCharacter(char);
    setIsCloneMode(true);
  }, []);

  const clearCharSelection = useCallback(() => {
    setSelectedCharacter(null);
    setIsCloneMode(false);
  }, []);

  const value = useMemo(() => ({
    open,
    focusedCharacterId,
    selectedCharacter,
    isCloneMode,
    openDrawer,
    closeDrawer,
    prepareCreateChar,
    prepareEditChar,
    prepareCloneChar,
    clearCharSelection,
  }), [
    open,
    focusedCharacterId,
    selectedCharacter,
    isCloneMode,
    openDrawer,
    closeDrawer,
    prepareCreateChar,
    prepareEditChar,
    prepareCloneChar,
    clearCharSelection,
  ]);

  return (
    <CharacterDrawerContext.Provider value={value}>
      {children}
    </CharacterDrawerContext.Provider>
  );
}

export const useCharacterDrawer = () => {
  const ctx = useContext(CharacterDrawerContext);
  if (!ctx) throw new Error('useCharacterDrawer must be used inside CharacterDrawerProvider');
  return ctx;
};
