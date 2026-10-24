import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import { Box } from '@mui/material';
import LinearProgress from '@mui/material/LinearProgress';
import { useAuth } from '../context/AuthContext';
import { useStory } from '../context/StoryContext';
import { useLoading } from '../context/LoadingContext';
import { useWorkspace } from '../context/WorkspaceContext';
import WorkspaceContainer from '../components/workspace/WorkspaceContainer';
import CustomLoading from '../components/common/CustomLoading';

export default function DashboardPage({ onOpenStorySelector }) {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { activeStoryId, storiesLoading } = useStory();
  const { setLoading } = useLoading();
  const { loadStoryData } = useWorkspace();
  const [dataLoading, setDataLoading] = useState(true);
  const hasInitialized = useRef(false);

  // Redirigir a login si no está autenticado
  useEffect(() => {
    if (!authLoading && !user) {
      router.replace('/login');
    }
  }, [user, authLoading, router]);

  // Carga inicial reactiva de la historia — solo una vez por activeStoryId
  useEffect(() => {
    if (hasInitialized.current) return;
    if (activeStoryId) {
      hasInitialized.current = true;
      loadStoryData({ storyId: activeStoryId, setLoading, setDataLoading });
    } else if (!authLoading && !storiesLoading) {
      hasInitialized.current = true;
      setDataLoading(false);
    }
  }, [activeStoryId, authLoading, storiesLoading, loadStoryData, setLoading]);

  if (authLoading || storiesLoading || dataLoading) {
    return (
      <Box sx={{ position: 'relative', width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <LinearProgress sx={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3 }} />
        <CustomLoading message="Cargando estudio..." subtitle="Preparando tu espacio narrativo..." size={56} />
      </Box>
    );
  }

  return (
    <WorkspaceContainer onOpenStorySelector={onOpenStorySelector} />
  );
}
