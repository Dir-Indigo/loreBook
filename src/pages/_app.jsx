import React from 'react';
import Head from 'next/head';
import { Outfit, Inter } from 'next/font/google';
import { LoreThemeProvider } from '../context/ThemeContext';
import { FeedbackProvider } from '../context/FeedbackContext';
import { AuthProvider } from '../context/AuthContext';
import { StoryProvider } from '../context/StoryContext';
import { WorkspaceProvider } from '../context/WorkspaceContext';
import { WorkspaceViewProvider } from '../context/WorkspaceViewContext';
import { LoadingProvider } from '../context/LoadingContext';
import { QuickNotesProvider } from '../context/QuickNotesContext';
import { GlobalActionsProvider } from '../context/GlobalActionsContext';
import { CharacterDrawerProvider } from '../context/CharacterDrawerContext';
import { SidebarDetailProvider } from '../context/SidebarDetailContext';
import { ManuscriptProvider } from '../context/ManuscriptContext';
import MainLayout from '../components/layout/MainLayout';
import '../styles/globals.css';

// Fuentes autoalojadas por Next: sin @import bloqueante y con fallback métrico
const outfit = Outfit({ subsets: ['latin'], weight: ['400', '500', '600', '700', '800'], display: 'swap' });
const inter = Inter({ subsets: ['latin'], weight: ['400', '500', '600', '700'], display: 'swap' });
const fontVariables = `:root{--font-outfit:${outfit.style.fontFamily};--font-inter:${inter.style.fontFamily};}`;

export default function App({ Component, pageProps }) {
  return (
    <>
      <Head>
        <title>Lorebook Studio - Narrative & Worldbuilding</title>
        <meta name="viewport" content="initial-scale=1, width=device-width" />
      </Head>
      <style>{fontVariables}</style>
      <LoreThemeProvider>
        <FeedbackProvider>
        <AuthProvider>
          <LoadingProvider>
            <StoryProvider>
              <WorkspaceProvider>
                <WorkspaceViewProvider>
                  <ManuscriptProvider>
                    <QuickNotesProvider>
                      <GlobalActionsProvider>
                        <CharacterDrawerProvider>
                          <SidebarDetailProvider>
                            <MainLayout>
                              <Component {...pageProps} />
                            </MainLayout>
                          </SidebarDetailProvider>
                        </CharacterDrawerProvider>
                      </GlobalActionsProvider>
                    </QuickNotesProvider>
                  </ManuscriptProvider>
                </WorkspaceViewProvider>
              </WorkspaceProvider>
            </StoryProvider>
          </LoadingProvider>
        </AuthProvider>
        </FeedbackProvider>
      </LoreThemeProvider>
    </>
  );
}
