import React, { useState } from 'react';
import { useRouter } from 'next/router';
import { Box } from '@mui/material';
import Navbar from './Navbar';
import StoryModal from '../stories/StoryModal';
import QuickNotesPanel from '../common/QuickNotesPanel';
import PullToRefresh from '../common/PullToRefresh';
import { useStory } from '../../context/StoryContext';

export default function MainLayout({ children }) {
  const router = useRouter();
  const { stories, activeStory, activeStoryId, changeActiveStory, createStory, updateStory, deleteStory } = useStory();
  const [storyModalOpen, setStoryModalOpen] = useState(false);

  const handleOpenStorySelector = () => setStoryModalOpen(true);

  // We should only show the Navbar on authenticated pages. 
  // Let's check if the path is login, or other non-auth pages.
  const isAuthPage = router.pathname === '/login';

  if (isAuthPage) {
    return <Box sx={{ height: '100vh', width: '100vw' }}>{children}</Box>;
  }

  // Expose modal handler to children by cloning them
  const childrenWithProps = React.Children.map(children, child =>
    React.isValidElement(child)
      ? React.cloneElement(child, { onOpenStorySelector: handleOpenStorySelector })
      : child
  );

  return (
    <PullToRefresh>
      <Box sx={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
        <Navbar activeStory={activeStory} onOpenStorySelector={handleOpenStorySelector} />
      
      <Box sx={{ flexGrow: 1, display: 'flex', overflow: 'hidden', position: 'relative' }}>
        <Box sx={{ flexGrow: 1, height: '100%', overflow: 'hidden', display: 'flex', minWidth: 0 }}>
          {childrenWithProps}
        </Box>
        
        {/* Global Express Ideas Panel (Available anywhere, dockable on PC) */}
        <QuickNotesPanel />
      </Box>

      <StoryModal
        open={storyModalOpen}
        onClose={() => setStoryModalOpen(false)}
        stories={stories}
        activeStoryId={activeStoryId}
        onSelectStory={(id) => {
          changeActiveStory(id);
          // If we are on the character page, we should redirect to the new story's character page
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
