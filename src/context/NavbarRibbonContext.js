import React, { createContext, useContext, useState, useEffect } from 'react';

const NavbarRibbonContext = createContext({
  ribbonContent: null,
  setRibbonContent: () => {},
});

export function NavbarRibbonProvider({ children }) {
  const [ribbonContent, setRibbonContent] = useState(null);

  return (
    <NavbarRibbonContext.Provider value={{ ribbonContent, setRibbonContent }}>
      {children}
    </NavbarRibbonContext.Provider>
  );
}

export const useNavbarRibbon = () => useContext(NavbarRibbonContext);

/**
 * PageRibbon: Component used inside any page to project its top toolbar
 * directly into the unified Navbar ribbon slot (Word-like ribbon).
 */
export function PageRibbon({ children }) {
  const { setRibbonContent } = useNavbarRibbon();

  useEffect(() => {
    setRibbonContent(children);
    return () => {
      setRibbonContent(null);
    };
  }, [children, setRibbonContent]);

  return null;
}
