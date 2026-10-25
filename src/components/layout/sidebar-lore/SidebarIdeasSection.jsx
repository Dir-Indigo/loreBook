import React from 'react';
import { useRouter } from 'next/router';
import {
  Box,
  Typography,
  IconButton,
  Tooltip,
  Button,
  Chip,
  Paper,
  Divider,
} from '@mui/material';
import LightbulbOutlinedIcon from '@mui/icons-material/LightbulbOutlined';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import PushPinIcon from '@mui/icons-material/PushPin';
import AddIcon from '@mui/icons-material/Add';
import CustomButton from '../../common/CustomButton';
import { useSidebarDetail, DETAIL_VIEWS } from '../../../context/SidebarDetailContext';
import { useQuickNotes, NOTE_STATUSES } from '../../../context/QuickNotesContext';
import { useWorkspaceView, WORKSPACE_VIEW_KEYS } from '../../../context/WorkspaceViewContext';

export default function SidebarIdeasSection({ story, storyNotes = [] }) {
  const router = useRouter();
  const { activeView, isOpen, openDetail, closeDetail } = useSidebarDetail();
  const { setActiveView } = useWorkspaceView();
  const { notes, setStatusFilter, setScopeFilter } = useQuickNotes();

  const isDetailOpen = isOpen && activeView === DETAIL_VIEWS.NOTES;

  // Breakdown counts
  const totalNotes = storyNotes.length;
  const pinnedNotes = storyNotes.filter((n) => n.is_pinned);
  const statusCounts = NOTE_STATUSES.map((st) => ({
    ...st,
    count: storyNotes.filter((n) => n.status === st.value).length,
  }));

  const handleFilterClick = (statusValue) => {
    openDetail(DETAIL_VIEWS.NOTES, { statusFilter: statusValue });
  };

  const handleToggleDetail = () => {
    if (isDetailOpen) {
      closeDetail();
    } else {
      openDetail(DETAIL_VIEWS.NOTES);
    }
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', flexGrow: 1, overflow: 'hidden' }}>
      {/* ─── Header ──────────────────────────────────────────────────────── */}
      <Box
        sx={{
          p: 1.2,
          px: 2,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderBottom: '1px solid rgba(0,0,0,0.06)',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8 }}>
          <Typography variant="caption" sx={{ fontWeight: 800, color: 'text.secondary', textTransform: 'uppercase', fontSize: '0.7rem' }}>
            Estructura de Ideas ({totalNotes})
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.6 }}>
          <Tooltip title={isDetailOpen ? 'Ocultar panel de detalle' : 'Abrir detalle de notas'}>
            <Button
              size="small"
              variant={isDetailOpen ? 'contained' : 'outlined'}
              color="secondary"
              endIcon={<ChevronRightIcon fontSize="small" />}
              onClick={handleToggleDetail}
              sx={{
                fontSize: '0.68rem',
                fontWeight: 700,
                textTransform: 'none',
                py: 0.2,
                px: 0.8,
                borderRadius: 1.5,
              }}
            >
              {isDetailOpen ? 'Acoplado' : 'Detalle'}
            </Button>
          </Tooltip>

          <Tooltip title="Abrir pizarra central de ideas">
            <IconButton size="small" onClick={() => setActiveView(WORKSPACE_VIEW_KEYS.IDEAS)} sx={{ p: 0.4 }}>
              <OpenInNewIcon sx={{ fontSize: 16 }} />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {/* ─── Body: Structural Overview & Metrics ──────────────────────────── */}
      <Box sx={{ flexGrow: 1, overflowY: 'auto', p: 1.8, display: 'flex', flexDirection: 'column', gap: 1.8 }}>
        {/* Detail Link Banner */}
        <Paper
          variant="outlined"
          onClick={handleToggleDetail}
          sx={{
            p: 1.4,
            borderRadius: 2,
            bgcolor: isDetailOpen ? 'action.selected' : 'action.hover',
            borderColor: isDetailOpen ? 'primary.main' : 'divider',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            transition: 'all 0.15s ease',
            '&:hover': { transform: 'translateX(2px)', borderColor: 'primary.main' },
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <LightbulbOutlinedIcon color="primary" sx={{ fontSize: 22 }} />
            <Box>
              <Typography variant="subtitle2" sx={{ fontWeight: 800, fontSize: '0.82rem', lineHeight: 1.2 }}>
                Panel de Detalle
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.68rem' }}>
                {isDetailOpen ? 'Visible y sincronizado' : 'Haz clic para desplegar'}
              </Typography>
            </Box>
          </Box>
          <ChevronRightIcon color="action" fontSize="small" />
        </Paper>

        {/* Desglose por Estados (Filtros Interactivos) */}
        <Box>
          <Typography variant="caption" sx={{ fontWeight: 800, color: 'text.secondary', textTransform: 'uppercase', fontSize: '0.68rem', display: 'block', mb: 1 }}>
            Ideas por Estado
          </Typography>

          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 1 }}>
            {statusCounts.map((st) => (
              <Box
                key={st.value}
                onClick={() => handleFilterClick(st.value)}
                sx={{
                  p: 1,
                  borderRadius: 1.8,
                  bgcolor: 'background.paper',
                  border: '1px solid rgba(0,0,0,0.08)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  transition: 'all 0.12s ease',
                  '&:hover': {
                    borderColor: st.color,
                    transform: 'translateY(-1px)',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                  },
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.6 }}>
                  <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: st.color }} />
                  <Typography variant="caption" sx={{ fontWeight: 700, fontSize: '0.72rem' }}>
                    {st.label}
                  </Typography>
                </Box>
                <Typography variant="caption" sx={{ fontWeight: 800, color: 'text.secondary', fontSize: '0.75rem' }}>
                  {st.count}
                </Typography>
              </Box>
            ))}
          </Box>
        </Box>

        {/* Ámbito de Ideas */}
        <Box>
          <Typography variant="caption" sx={{ fontWeight: 800, color: 'text.secondary', textTransform: 'uppercase', fontSize: '0.68rem', display: 'block', mb: 1 }}>
            Ámbito de Cobertura
          </Typography>

          <Box sx={{ display: 'flex', gap: 1 }}>
            <Box
              onClick={() => {
                setScopeFilter('story');
                openDetail(DETAIL_VIEWS.NOTES);
              }}
              sx={{
                flex: 1,
                p: 1,
                borderRadius: 1.8,
                bgcolor: 'background.paper',
                border: '1px solid rgba(0,0,0,0.08)',
                cursor: 'pointer',
                textAlign: 'center',
                '&:hover': { borderColor: 'primary.main' },
              }}
            >
              <Typography variant="subtitle2" sx={{ fontWeight: 800, fontSize: '0.8rem', color: 'primary.main' }}>
                {storyNotes.length}
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.65rem' }}>
                En {story?.title || 'Esta Historia'}
              </Typography>
            </Box>

            <Box
              onClick={() => {
                setScopeFilter('global');
                openDetail(DETAIL_VIEWS.NOTES);
              }}
              sx={{
                flex: 1,
                p: 1,
                borderRadius: 1.8,
                bgcolor: 'background.paper',
                border: '1px solid rgba(0,0,0,0.08)',
                cursor: 'pointer',
                textAlign: 'center',
                '&:hover': { borderColor: 'primary.main' },
              }}
            >
              <Typography variant="subtitle2" sx={{ fontWeight: 800, fontSize: '0.8rem', color: 'secondary.main' }}>
                {notes.filter((n) => !n.story_id).length}
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.65rem' }}>
                Globales
              </Typography>
            </Box>
          </Box>
        </Box>

        {/* Ideas Destacadas / Fijadas (Mini lista representativa, no duplicada) */}
        {pinnedNotes.length > 0 && (
          <Box>
            <Typography variant="caption" sx={{ fontWeight: 800, color: 'text.secondary', textTransform: 'uppercase', fontSize: '0.68rem', display: 'block', mb: 0.8 }}>
              Ideas Destacadas ({pinnedNotes.length})
            </Typography>

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.8 }}>
              {pinnedNotes.slice(0, 3).map((n) => (
                <Box
                  key={n.id}
                  onClick={() => openDetail(DETAIL_VIEWS.NOTES)}
                  sx={{
                    p: 1,
                    borderRadius: 1.5,
                    bgcolor: n.color || 'action.hover',
                    border: '1px solid rgba(0,0,0,0.1)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 0.6,
                    '&:hover': { transform: 'translateX(2px)' },
                    transition: 'transform 0.12s ease',
                  }}
                >
                  <PushPinIcon sx={{ fontSize: 13, color: 'error.main' }} />
                  <Typography variant="caption" sx={{ fontWeight: 600, fontSize: '0.74rem', color: '#111', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {n.content}
                  </Typography>
                </Box>
              ))}
            </Box>
          </Box>
        )}
      </Box>

      {/* ─── Footer Action ───────────────────────────────────────────────── */}
      <Divider />
      <Box sx={{ p: 1.2 }}>
        <CustomButton
          variant="contained"
          size="small"
          fullWidth
          startIcon={<AddIcon fontSize="small" />}
          onClick={() => openDetail(DETAIL_VIEWS.NOTES)}
          sx={{ fontSize: '0.75rem', py: 0.5 }}
        >
          Capturar Idea en Detalle
        </CustomButton>
      </Box>
    </Box>
  );
}
