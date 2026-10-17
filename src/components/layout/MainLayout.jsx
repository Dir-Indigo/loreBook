import React, { useState } from 'react';
import { useRouter } from 'next/router';
import { Box } from '@mui/material';
import Navbar from './Navbar';
import SidebarLore from './SidebarLore';
import StoryModal from '../stories/StoryModal';
import QuickNotesPanel from '../common/QuickNotesPanel';
import PullToRefresh from '../common/PullToRefresh';
import { useStory } from '../../context/StoryContext';
import { useNavbarRibbon } from '../../context/NavbarRibbonContext';

/**
 * MainLayout
 *
 * Layout architecture (full-height flex column):
 *
 *  ┌──────────────────────────────────────────────────────┐
 *  │  Navbar (Fila 1) — full width                        │
 *  ├─────────────┬────────────────────────────────────────┤
 *  │             │ Fila 2 (Ribbon) ← only in center col   │
 *  │ SidebarLore ├────────────────────────────────────────┤
 *  │ (persistent)│ Page Content ({children})              │ QuickNotesPanel
 *  │             │                                        │ (persistent)
 *  └─────────────┴────────────────────────────────────────┘
 *
 * SidebarLore and QuickNotesPanel are mounted ONCE and never
 * remounted on page transitions — zero reload flicker.
 * Fila 2 is inside the center column, so it NEVER overlaps SidebarLore.
 */
export default function MainLayout({ children }) {
  const router = useRouter();
  const { stories, activeStory, activeStoryId, changeActiveStory, createStory, updateStory, deleteStory } = useStory();
  const { ribbonContent } = useNavbarRibbon();
  const [storyModalOpen, setStoryModalOpen] = useState(false);

  const handleOpenStorySelector = () => setStoryModalOpen(true);

  // Bare pages: no shell (no navbar, no sidebars)
  const isAuthPage = router.pathname === '/login';
  const isAdminPage = router.pathname.startsWith('/admin');

  if (isAuthPage || isAdminPage) {
    return <Box sx={{ height: '100vh', width: '100vw' }}>{children}</Box>;
  }

  // Expose modal handler to children
  const childrenWithProps = React.Children.map(children, (child) =>
    React.isValidElement(child)
      ? React.cloneElement(child, { onOpenStorySelector: handleOpenStorySelector })
      : child
  );

  return (
    <PullToRefresh>
      {/* Outer flex column */}
      <Box sx={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>

        {/* ── Fila 1: Navbar (full width) ─────────────────────────────────── */}
        <Navbar activeStory={activeStory} onOpenStorySelector={handleOpenStorySelector} />

        {/* ── Body row ─────────────────────────────────────────────────────── */}
        <Box sx={{ flexGrow: 1, display: 'flex', overflow: 'hidden', position: 'relative' }}>

          {/* Left: SidebarLore — persistent, survives all route changes */}
          <SidebarLore onOpenStorySelector={handleOpenStorySelector} />

          {/* Center column: Ribbon (Fila 2) on top, then page content */}
          <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 }}>

            {/* Fila 2: contextual ribbon injected by each page via <PageRibbon> */}
            {ribbonContent && (
              <Box
                sx={{
                  flexShrink: 0,
                  borderBottom: 1,
                  borderColor: 'divider',
                  bgcolor: 'background.paper',
                  overflowX: 'auto',
                  overflowY: 'hidden',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
                }}
              >
                {ribbonContent}
              </Box>
            )}

            {/* Scrollable page area */}
            <Box sx={{ flexGrow: 1, overflow: 'hidden', display: 'flex', minWidth: 0 }}>
              {childrenWithProps}
            </Box>
          </Box>

          {/* Right: QuickNotesPanel — persistent, survives all route changes */}
          <QuickNotesPanel />
        </Box>

        {/* Story Selector Modal */}
        <StoryModal
          open={storyModalOpen}
          onClose={() => setStoryModalOpen(false)}
          stories={stories}
          activeStoryId={activeStoryId}
          onSelectStory={(id) => {
            changeActiveStory(id);
            if (router.pathname.startsWith('/characters/')) {
              router.push(`/characters/${id}`);
            }
          }}
          onCreateStory={createStory}
          onUpdateStory={updateStory}
          onDeleteStory={deleteStory}
        />
      </Box>
    </PullToRefresh>
  );
}
