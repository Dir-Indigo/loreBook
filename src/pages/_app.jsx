import React from 'react';
import Head from 'next/head';
import { LoreThemeProvider } from '../context/ThemeContext';
import { AuthProvider } from '../context/AuthContext';
import { StoryProvider } from '../context/StoryContext';
import { WorkspaceProvider } from '../context/WorkspaceContext';
import { LoadingProvider } from '../context/LoadingContext';
import { QuickNotesProvider } from '../context/QuickNotesContext';
import { GlobalActionsProvider } from '../context/GlobalActionsContext';
import { SyncProvider } from '../context/SyncContext';
import { NavbarRibbonProvider } from '../context/NavbarRibbonContext';
import MainLayout from '../components/layout/MainLayout';
import '../styles/globals.css';

export default function App({ Component, pageProps }) {
  return (
    <>
      <Head>
        <title>Lorebook Studio - Narrative & Worldbuilding</title>
        <meta name="viewport" content="initial-scale=1, width=device-width" />
      </Head>
      <AuthProvider>
        <LoadingProvider>
          <SyncProvider>
            <StoryProvider>
              <WorkspaceProvider>
                <QuickNotesProvider>
                  <GlobalActionsProvider>
                    <NavbarRibbonProvider>
                      <LoreThemeProvider>
                        <MainLayout>
                          <Component {...pageProps} />
                        </MainLayout>
                      </LoreThemeProvider>
                    </NavbarRibbonProvider>
                  </GlobalActionsProvider>
                </QuickNotesProvider>
              </WorkspaceProvider>
            </StoryProvider>
          </SyncProvider>
        </LoadingProvider>
      </AuthProvider>
    </>
  );
}
