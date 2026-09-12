import React from 'react';
import Head from 'next/head';
import { LoreThemeProvider } from '../context/ThemeContext';
import { AuthProvider } from '../context/AuthContext';
import { StoryProvider } from '../context/StoryContext';
import { LoadingProvider } from '../context/LoadingContext';
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
          <StoryProvider>
            <LoreThemeProvider>
              <MainLayout>
                <Component {...pageProps} />
              </MainLayout>
            </LoreThemeProvider>
          </StoryProvider>
        </LoadingProvider>
      </AuthProvider>
    </>
  );
}
