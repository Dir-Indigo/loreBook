import React, { useRef } from 'react';
import dynamic from 'next/dynamic';
import { Box, Typography } from '@mui/material';
import AutoStoriesIcon from '@mui/icons-material/AutoStories';
import { useWorkspaceView, WORKSPACE_VIEW_KEYS } from '../../context/WorkspaceViewContext';
import WorkspaceNavbar from './WorkspaceNavbar';
import CustomLoading from '../common/CustomLoading';

const ViewLoading = () => <CustomLoading message="Cargando vista..." size={40} />;

// Cada vista se descarga en su propio chunk y solo se monta la primera vez que se visita
const EventsWorkspaceView = dynamic(() => import('./views/EventsWorkspaceView'), { ssr: false, loading: ViewLoading });
const CharactersWorkspaceView = dynamic(() => import('./views/CharactersWorkspaceView'), { ssr: false, loading: ViewLoading });
const IdeasWorkspaceView = dynamic(() => import('./views/IdeasWorkspaceView'), { ssr: false, loading: ViewLoading });
const ManuscriptWorkspaceView = dynamic(() => import('./views/ManuscriptWorkspaceView'), { ssr: false, loading: ViewLoading });

/**
 * WorkspaceContainer — Contenedor central multi-vista sin recarga de página.
 * Integra el nuevo WorkspaceNavbar dedicado de 2 pisos sobre el área de trabajo / lienzo.
 */
export default function WorkspaceContainer({ onOpenStorySelector }) {
  const { activeView } = useWorkspaceView();

  // Vistas ya visitadas: se mantienen montadas (keep-alive) para conservar zoom/pan y evitar re-fetches
  const visitedRef = useRef(new Set());
  visitedRef.current.add(activeView);
  const visited = visitedRef.current;

  return (
    <Box
      sx={{
        flexGrow: 1,
        height: '100%',
        width: '100%',
        position: 'relative',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        minWidth: 0,
      }}
    >
      {/* ─── Navbar Dedicado a la Pizarra (Piso 1: Tabs & CTA | Piso 2: Sub-toolbar Contextual) ─── */}
      <WorkspaceNavbar />

      {/* ─── Área de Lienzo / Vistas Keep-Alive ─────────────────────── */}
      <Box
        sx={{
          flexGrow: 1,
          height: '100%',
          width: '100%',
          position: 'relative',
          overflow: 'hidden',
          display: 'flex',
          minWidth: 0,
        }}
      >
      {/* ─── 1. VISTA EVENTOS & TRAMAS (Keep-Alive en DOM para preservar Zoom y Pan) ── */}
      <Box
        sx={{
          display: activeView === WORKSPACE_VIEW_KEYS.EVENTS ? 'flex' : 'none',
          flexGrow: 1,
          height: '100%',
          width: '100%',
          minWidth: 0,
          position: 'relative',
        }}
      >
        {visited.has(WORKSPACE_VIEW_KEYS.EVENTS) && <EventsWorkspaceView onOpenStorySelector={onOpenStorySelector} />}
      </Box>

      {/* ─── 2. VISTA PERSONAJES (Keep-Alive para evitar re-fetches y re-mounts) ── */}
      <Box
        sx={{
          display: activeView === WORKSPACE_VIEW_KEYS.CHARACTERS ? 'flex' : 'none',
          flexGrow: 1,
          height: '100%',
          width: '100%',
          overflowY: 'auto',
          minWidth: 0,
          flexDirection: 'column',
        }}
      >
        {visited.has(WORKSPACE_VIEW_KEYS.CHARACTERS) && <CharactersWorkspaceView />}
      </Box>

      {/* ─── 3. VISTA PIZARRA DE IDEAS (Keep-Alive para evitar re-fetches) ────── */}
      <Box
        sx={{
          display: activeView === WORKSPACE_VIEW_KEYS.IDEAS ? 'flex' : 'none',
          flexGrow: 1,
          height: '100%',
          width: '100%',
          overflowY: 'auto',
          minWidth: 0,
          flexDirection: 'column',
        }}
      >
        {visited.has(WORKSPACE_VIEW_KEYS.IDEAS) && <IdeasWorkspaceView />}
      </Box>

      {/* ─── 4. VISTA MANUSCRITO & CAPÍTULOS (Keep-Alive) ────────────────── */}
      <Box
        sx={{
          display: activeView === WORKSPACE_VIEW_KEYS.MANUSCRIPT ? 'flex' : 'none',
          flexGrow: 1,
          height: '100%',
          width: '100%',
          minWidth: 0,
          position: 'relative',
        }}
      >
        {visited.has(WORKSPACE_VIEW_KEYS.MANUSCRIPT) && <ManuscriptWorkspaceView />}
      </Box>
      </Box>
    </Box>
  );
}
