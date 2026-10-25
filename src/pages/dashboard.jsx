import React, { useEffect } from 'react';
import { useRouter } from 'next/router';
import { Box } from '@mui/material';
import LinearProgress from '@mui/material/LinearProgress';
import { useAuth } from '../context/AuthContext';
import { useStory } from '../context/StoryContext';
import { useStorySelector } from '../context/StorySelectorContext';
import { useWorkspaceData } from '../context/WorkspaceContext';
import WorkspaceContainer from '../components/workspace/WorkspaceContainer';
import CustomLoading from '../components/common/CustomLoading';

export default function DashboardPage() {
  const router = useRouter();
  const onOpenStorySelector = useStorySelector();
  const { user, loading: authLoading } = useAuth();
  const { activeStoryId, storiesLoading } = useStory();
  // WorkspaceProvider es el único responsable de cargar los datos de la historia activa
  const { dataLoading, settledStoryId } = useWorkspaceData();

  // Redirigir a login si no está autenticado
  useEffect(() => {
    if (!authLoading && !user) {
      router.replace('/login');
    }
  }, [user, authLoading, router]);

  const storyPending = Boolean(activeStoryId) && settledStoryId !== activeStoryId;

  if (authLoading || storiesLoading || dataLoading || storyPending) {
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
