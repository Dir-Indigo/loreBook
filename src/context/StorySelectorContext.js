import { createContext, useContext } from 'react';

// Permite abrir el selector de historias desde cualquier página sin clonar children con props
const StorySelectorContext = createContext(() => {});

export const StorySelectorProvider = StorySelectorContext.Provider;
export const useStorySelector = () => useContext(StorySelectorContext);
