import React from 'react';
import {
  Box,
  Typography,
  IconButton,
  Tooltip,
  Drawer,
  Button,
  useMediaQuery,
  useTheme,
  Chip,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import PersonIcon from '@mui/icons-material/Person';
import LightbulbOutlinedIcon from '@mui/icons-material/LightbulbOutlined';
import AccountTreeOutlinedIcon from '@mui/icons-material/AccountTreeOutlined';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import PushPinIcon from '@mui/icons-material/PushPin';
import PushPinOutlinedIcon from '@mui/icons-material/PushPinOutlined';
import WidthWideIcon from '@mui/icons-material/ViewSidebarOutlined';
import { useSidebarDetail, DETAIL_VIEWS } from '../../../context/SidebarDetailContext';
import CharactersDetailView from './CharactersDetailView';
import NotesDetailView from './NotesDetailView';

export default function SidebarDetail({
  storyId,
  characters = [],
  relationships = [],
  focusedCharacterId = null,
  onOpenCreateCharacter,
  onOpenEditCharacter,
  onOpenCloneCharacter,
  onDeleteCharacter,
  onSetCharactersGlobal,
  onCopyCharactersAsLocal,
  onRoleChange,
  onCreateRelationship,
  onDeleteRelationship,
}) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const {
    isOpen,
    activeView,
    isExpanded,
    isPinned,
    toggleExpand,
    togglePinned,
    closeDetail,
    setDetailView,
  } = useSidebarDetail();

  if (!isOpen) return null;

  // View titles and icons
  let viewTitle = 'Detalle';
  let ViewIcon = PersonIcon;
  if (activeView === DETAIL_VIEWS.CHARACTERS) {
    viewTitle = 'Personajes y Relaciones';
    ViewIcon = PersonIcon;
  } else if (activeView === DETAIL_VIEWS.NOTES) {
    viewTitle = 'Notas e Ideas';
    ViewIcon = LightbulbOutlinedIcon;
  } else if (activeView === DETAIL_VIEWS.PLOTS) {
    viewTitle = 'Capítulos y Tramas';
    ViewIcon = AccountTreeOutlinedIcon;
  }

  const containerContent = (
    <Box
      sx={{
        width: {
          xs: '100vw',
          sm: isExpanded ? 540 : 360,
          md: isExpanded ? 560 : 360,
        },
        height: '100%',
        bgcolor: 'background.paper',
        display: 'flex',
        flexDirection: 'column',
        borderRight: { xs: 0, sm: 1 },
        borderColor: 'divider',
        position: 'relative',
        zIndex: 8,
        flexShrink: 0,
        boxShadow: { xs: 'none', sm: '4px 0 24px rgba(0,0,0,0.06)' },
        transition: 'width 0.22s cubic-bezier(0.4, 0, 0.2, 1)',
      }}
    >
      {/* Mobile drag handle */}
      {isMobile && (
        <Box sx={{ display: 'flex', justifyContent: 'center', pt: 1, pb: 0.4 }}>
          <Box sx={{ width: 42, height: 4, borderRadius: 2, bgcolor: 'divider' }} />
        </Box>
      )}

      {/* ─── Unified Header for SidebarDetail ─────────────────────────────── */}
      <Box
        sx={{
          px: { xs: 1.2, sm: 1.6 },
          py: 0.8,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: 1,
          borderColor: 'divider',
          bgcolor: 'background.paper',
          minHeight: 46,
          gap: 1,
        }}
      >
        {/* Title + Subview Switcher Pills */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8, minWidth: 0, overflow: 'hidden' }}>
          <ViewIcon color="primary" sx={{ fontSize: 20, flexShrink: 0 }} />
          <Typography
            variant="subtitle2"
            sx={{
              fontWeight: 800,
              fontSize: { xs: '0.85rem', sm: '0.9rem' },
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {viewTitle}
          </Typography>

          {/* Quick switcher buttons between available child views */}
          <Box sx={{ display: { xs: 'none', md: 'flex' }, alignItems: 'center', gap: 0.4, ml: 0.5 }}>
            <Chip
              label="Personajes"
              size="small"
              onClick={() => setDetailView(DETAIL_VIEWS.CHARACTERS)}
              color={activeView === DETAIL_VIEWS.CHARACTERS ? 'primary' : 'default'}
              variant={activeView === DETAIL_VIEWS.CHARACTERS ? 'filled' : 'outlined'}
              sx={{ height: 20, fontSize: '0.64rem', fontWeight: 700, cursor: 'pointer' }}
            />
            <Chip
              label="Notas"
              size="small"
              onClick={() => setDetailView(DETAIL_VIEWS.NOTES)}
              color={activeView === DETAIL_VIEWS.NOTES ? 'primary' : 'default'}
              variant={activeView === DETAIL_VIEWS.NOTES ? 'filled' : 'outlined'}
              sx={{ height: 20, fontSize: '0.64rem', fontWeight: 700, cursor: 'pointer' }}
            />
          </Box>
        </Box>

        {/* Action Controls: Grow / Pin / Close */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.4, flexShrink: 0 }}>
          {/* Capaz de Crecer: Grow / Shrink Toggle */}
          {!isMobile && (
            <Tooltip title={isExpanded ? 'Reducir a ancho estándar (360px)' : 'Expandir extensión (560px)'}>
              <IconButton
                size="small"
                onClick={toggleExpand}
                color={isExpanded ? 'primary' : 'default'}
                sx={{
                  border: 1,
                  borderColor: isExpanded ? 'primary.main' : 'divider',
                  bgcolor: isExpanded ? 'action.selected' : 'transparent',
                  p: 0.4,
                  borderRadius: 1.5,
                }}
              >
                {isExpanded ? <ChevronLeftIcon fontSize="small" /> : <ChevronRightIcon fontSize="small" />}
              </IconButton>
            </Tooltip>
          )}

          {/* Pin/Dock Button on Desktop */}
          {!isMobile && (
            <Tooltip title={isPinned ? 'Desacoplar panel' : 'Fijar panel al lateral'}>
              <IconButton
                size="small"
                onClick={togglePinned}
                color={isPinned ? 'primary' : 'default'}
                sx={{
                  border: 1,
                  borderColor: isPinned ? 'primary.main' : 'divider',
                  bgcolor: isPinned ? 'action.selected' : 'transparent',
                  p: 0.4,
                  borderRadius: 1.5,
                }}
              >
                {isPinned ? <PushPinIcon fontSize="small" /> : <PushPinOutlinedIcon fontSize="small" />}
              </IconButton>
            </Tooltip>
          )}

          {/* Prominent Close Button */}
          <Button
            size="small"
            variant="outlined"
            color="inherit"
            startIcon={<CloseIcon sx={{ fontSize: 14 }} />}
            onClick={closeDetail}
            sx={{
              fontWeight: 700,
              fontSize: '0.72rem',
              textTransform: 'none',
              borderRadius: 1.8,
              px: 1,
              py: 0.3,
              minHeight: 28,
              borderColor: 'divider',
              bgcolor: 'action.hover',
              '&:hover': {
                bgcolor: 'error.main',
                color: '#fff',
                borderColor: 'error.main',
              },
              transition: 'all 0.15s ease',
            }}
          >
            Cerrar
          </Button>
        </Box>
      </Box>

      {/* ─── Dynamic Child View ───────────────────────────────────────────── */}
      {activeView === DETAIL_VIEWS.CHARACTERS && (
        <CharactersDetailView
          storyId={storyId}
          characters={characters}
          relationships={relationships}
          focusedCharacterId={focusedCharacterId}
          isExpanded={isExpanded}
          onOpenCreateCharacter={onOpenCreateCharacter}
          onOpenEditCharacter={onOpenEditCharacter}
          onOpenCloneCharacter={onOpenCloneCharacter}
          onDeleteCharacter={onDeleteCharacter}
          onSetCharactersGlobal={onSetCharactersGlobal}
          onCopyCharactersAsLocal={onCopyCharactersAsLocal}
          onRoleChange={onRoleChange}
          onCreateRelationship={onCreateRelationship}
          onDeleteRelationship={onDeleteRelationship}
        />
      )}

      {activeView === DETAIL_VIEWS.NOTES && (
        <NotesDetailView isExpanded={isExpanded} />
      )}

      {activeView === DETAIL_VIEWS.PLOTS && (
        <Box sx={{ p: 3, textAlign: 'center', color: 'text.secondary' }}>
          <AccountTreeOutlinedIcon sx={{ fontSize: 48, opacity: 0.3, mb: 1 }} />
          <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
            Gestor de Capítulos & Partes
          </Typography>
          <Typography variant="body2" sx={{ fontSize: '0.8rem', mt: 0.5 }}>
            Espacio listo para escribir tus tramas narrativas en próximas versiones.
          </Typography>
        </Box>
      )}
    </Box>
  );

  // Mobile Drawer vs Desktop Stationary Flex Container
  if (isMobile) {
    return (
      <Drawer
        anchor="bottom"
        open={isOpen}
        onClose={closeDetail}
        PaperProps={{
          sx: {
            height: '85vh',
            maxHeight: '90vh',
            borderTopLeftRadius: 16,
            borderTopRightRadius: 16,
            overflow: 'hidden',
          },
        }}
      >
        {containerContent}
      </Drawer>
    );
  }

  return containerContent;
}
