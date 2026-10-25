import React, { useState } from 'react';
import {
  Box,
  Typography,
  IconButton,
  Button,
  List,
  ListItem,
  ListItemText,
  Chip,
  Tooltip,
  Menu,
  MenuItem,
  ListItemIcon,
  Paper,
  Divider,
} from '@mui/material';
import AutoStoriesIcon from '@mui/icons-material/AutoStories';
import AddIcon from '@mui/icons-material/Add';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import EditNoteIcon from '@mui/icons-material/EditNote';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';

import { useManuscriptCore } from '../../../context/ManuscriptContext';
import { useWorkspaceView, WORKSPACE_VIEW_KEYS } from '../../../context/WorkspaceViewContext';
import { useConfirm } from '../../../context/FeedbackContext';
import IconAction from '../../common/IconAction';

export default function SidebarManuscriptSection({ story }) {
  const confirm = useConfirm();
  const {
    chapters,
    activeChapterId,
    setActiveChapterId,
    createChapter,
    deleteChapter,
    totalManuscriptWords,
    isDirty,
  } = useManuscriptCore();

  const { setActiveView } = useWorkspaceView();

  const [menuAnchor, setMenuAnchor] = useState(null);
  const [selectedMenuChapter, setSelectedMenuChapter] = useState(null);

  const handleOpenMenu = (e, chapter) => {
    e.stopPropagation();
    setSelectedMenuChapter(chapter);
    setMenuAnchor(e.currentTarget);
  };

  const handleCloseMenu = () => {
    setMenuAnchor(null);
    setSelectedMenuChapter(null);
  };

  const handleDelete = async () => {
    if (!selectedMenuChapter) return;
    const chapter = selectedMenuChapter;
    handleCloseMenu();
    const accepted = await confirm({
      title: 'Eliminar capítulo',
      description: `Se eliminará "${chapter.title}" junto con su historial de versiones. Esta acción no se puede deshacer.`,
      confirmText: 'Eliminar',
      tone: 'danger',
    });
    if (accepted) {
      await deleteChapter(chapter.id);
    }
  };

  const statusColors = {
    draft: { label: 'Borrador', color: 'default' },
    review: { label: 'Revisión', color: 'warning' },
    done: { label: 'Finalizado', color: 'success' },
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', flexGrow: 1, overflow: 'hidden' }}>
      {/* ── Header ──────────────────────────────────────────────────────── */}
      <Box
        sx={{
          p: 1.2,
          px: 2,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderBottom: 1,
          borderColor: 'divider',
        }}
      >
        <Typography variant="caption" sx={{ fontWeight: 800, color: 'text.secondary', textTransform: 'uppercase', fontSize: '0.7rem' }}>
          Capítulos ({chapters.length})
        </Typography>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.6 }}>
          <Tooltip title="Abrir editor en la pizarra">
            <IconButton
              size="small"
              onClick={() => setActiveView(WORKSPACE_VIEW_KEYS.MANUSCRIPT)}
              sx={{ p: 0.4 }}
            >
              <OpenInNewIcon sx={{ fontSize: 16 }} />
            </IconButton>
          </Tooltip>

          <Button
            size="small"
            variant="contained"
            color="primary"
            startIcon={<AddIcon sx={{ fontSize: 14 }} />}
            onClick={() => createChapter()}
            sx={{
              fontSize: '0.68rem',
              fontWeight: 700,
              textTransform: 'none',
              py: 0.2,
              px: 1,
              borderRadius: 1.5,
            }}
          >
            Nuevo
          </Button>
        </Box>
      </Box>

      {/* ── Resumen de Palabras de la Obra ──────────────────────────────── */}
      <Box sx={{ px: 2, py: 1.2, borderBottom: 1, borderColor: 'divider', bgcolor: 'background.subtle' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
            Extensión acumulada:
          </Typography>
          <Typography variant="caption" sx={{ fontWeight: 800, color: 'primary.main' }}>
            {totalManuscriptWords.toLocaleString()} palabras
          </Typography>
        </Box>
      </Box>

      {/* ── Lista de Capítulos ──────────────────────────────────────────── */}
      <Box sx={{ flexGrow: 1, overflowY: 'auto', p: 1.2 }}>
        {chapters.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 4, px: 2 }}>
            <AutoStoriesIcon sx={{ fontSize: 36, opacity: 0.3, mb: 1 }} />
            <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.8rem', mb: 1.5 }}>
              Aún no has creado capítulos para esta historia.
            </Typography>
            <Button
              size="small"
              variant="outlined"
              startIcon={<AddIcon />}
              onClick={() => createChapter('Capítulo 1')}
              sx={{ fontSize: '0.75rem', fontWeight: 700, borderRadius: 2 }}
            >
              Crear Capítulo 1
            </Button>
          </Box>
        ) : (
          <List disablePadding sx={{ display: 'flex', flexDirection: 'column', gap: 0.8 }}>
            {chapters.map((ch, idx) => {
              const isSelected = ch.id === activeChapterId;
              const hasUnsaved = isSelected && isDirty;
              const st = statusColors[ch.status] || statusColors.draft;

              return (
                <ListItem
                  key={ch.id}
                  disableGutters
                  onClick={() => {
                    setActiveChapterId(ch.id);
                  }}
                  sx={{
                    p: 1.2,
                    px: 1.5,
                    borderRadius: 2,
                    cursor: 'pointer',
                    border: 1,
                    borderColor: isSelected ? 'primary.main' : 'divider',
                    bgcolor: isSelected ? 'action.selected' : 'background.paper',
                    transition: 'all 0.15s ease',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    '&:hover': {
                      bgcolor: isSelected ? 'action.selected' : 'action.hover',
                    },
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2, minWidth: 0, flexGrow: 1 }}>
                    <Box
                      sx={{
                        width: 24,
                        height: 24,
                        borderRadius: 1,
                        bgcolor: isSelected ? 'primary.main' : 'background.subtle',
                        color: isSelected ? '#fff' : 'text.secondary',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '0.72rem',
                        fontWeight: 800,
                        flexShrink: 0,
                      }}
                    >
                      {idx + 1}
                    </Box>

                    <Box sx={{ minWidth: 0, flexGrow: 1 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.6 }}>
                        <Typography variant="body2" sx={{ fontWeight: isSelected ? 800 : 600, fontSize: '0.82rem' }} noWrap>
                          {ch.title}
                        </Typography>
                        {hasUnsaved && (
                          <Tooltip title="Cambios sin guardar versión">
                            <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: 'warning.main', flexShrink: 0 }} />
                          </Tooltip>
                        )}
                      </Box>

                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.3 }}>
                        <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.68rem' }}>
                          {ch.word_count || 0} palabras
                        </Typography>
                        <Chip
                          size="small"
                          label={st.label}
                          color={st.color}
                          variant="outlined"
                          sx={{ height: 16, fontSize: '0.58rem', fontWeight: 700 }}
                        />
                      </Box>
                    </Box>
                  </Box>

                  <IconAction label="Opciones del capítulo"
                    size="small"
                    onClick={(e) => handleOpenMenu(e, ch)}
                    sx={{ p: 0.4, color: 'text.secondary' }}
                  >
                    <MoreVertIcon sx={{ fontSize: 16 }} />
                  </IconAction>
                </ListItem>
              );
            })}
          </List>
        )}
      </Box>

      {/* Menú contextual de opciones de capítulo */}
      <Menu
        anchorEl={menuAnchor}
        open={Boolean(menuAnchor)}
        onClose={handleCloseMenu}
        PaperProps={{ sx: { minWidth: 140, borderRadius: 2 } }}
      >
        <MenuItem
          onClick={() => {
            if (selectedMenuChapter) setActiveChapterId(selectedMenuChapter.id);
            setActiveView(WORKSPACE_VIEW_KEYS.MANUSCRIPT);
            handleCloseMenu();
          }}
          sx={{ fontSize: '0.78rem' }}
        >
          <ListItemIcon>
            <EditNoteIcon fontSize="small" color="primary" />
          </ListItemIcon>
          Editar en Lienzo
        </MenuItem>

        <Divider sx={{ my: 0.5 }} />

        <MenuItem onClick={handleDelete} sx={{ fontSize: '0.78rem', color: 'error.main' }}>
          <ListItemIcon>
            <DeleteOutlineIcon fontSize="small" color="error" />
          </ListItemIcon>
          Eliminar
        </MenuItem>
      </Menu>
    </Box>
  );
}
