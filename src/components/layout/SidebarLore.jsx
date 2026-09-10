import React, { useState } from 'react';
import {
  Box,
  Typography,
  IconButton,
  Tooltip,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  ListItemIcon,
  Divider,
  Chip,
  Badge,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
} from '@mui/material';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import PeopleOutlineIcon from '@mui/icons-material/PeopleOutline';
import LayersOutlinedIcon from '@mui/icons-material/LayersOutlined';
import TimelineIcon from '@mui/icons-material/Timeline';
import AddIcon from '@mui/icons-material/Add';
import FlareIcon from '@mui/icons-material/Flare';
import PhotoCameraIcon from '@mui/icons-material/PhotoCamera';
import AddPhotoAlternateIcon from '@mui/icons-material/AddPhotoAlternate';
import CustomButton from '../common/CustomButton';

export default function SidebarLore({
  story,
  characters = [],
  events = [],
  onOpenStorySelector,
  onOpenCharactersDrawer,
  onOpenCreateEvent,
  onUpdateStoryCover,
}) {
  const [collapsed, setCollapsed] = useState(false);
  const [quickCoverOpen, setQuickCoverOpen] = useState(false);
  const [newCoverUrl, setNewCoverUrl] = useState('');

  const handleOpenQuickCover = () => {
    setNewCoverUrl(story?.cover_url || '');
    setQuickCoverOpen(true);
  };

  const handleSaveCover = async () => {
    if (story && onUpdateStoryCover) {
      await onUpdateStoryCover(story.id, newCoverUrl.trim() || null);
    }
    setQuickCoverOpen(false);
  };

  if (collapsed) {
    return (
      <Box
        sx={{
          width: 54,
          height: '100%',
          bgcolor: 'custom.sidebar',
          borderRight: 1,
          borderColor: 'divider',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          py: 1.5,
          gap: 2,
          zIndex: 5,
        }}
      >
        <Tooltip title="Expandir barra lateral" placement="right">
          <IconButton size="small" onClick={() => setCollapsed(false)}>
            <ChevronRightIcon fontSize="small" />
          </IconButton>
        </Tooltip>

        <Divider sx={{ width: '80%' }} />

        <Tooltip title={`Historias (${story ? story.title : 'Ninguna'})`} placement="right">
          <IconButton size="small" onClick={onOpenStorySelector}>
            <LayersOutlinedIcon fontSize="small" color="action" />
          </IconButton>
        </Tooltip>

        <Tooltip title={`Personajes (${characters.length})`} placement="right">
          <IconButton size="small" onClick={onOpenCharactersDrawer}>
            <Badge badgeContent={characters.length} color="primary">
              <PeopleOutlineIcon fontSize="small" color="action" />
            </Badge>
          </IconButton>
        </Tooltip>

        <Tooltip title="Crear Evento" placement="right">
          <IconButton
            size="small"
            onClick={onOpenCreateEvent}
            sx={{ bgcolor: 'primary.main', color: '#fff', '&:hover': { bgcolor: 'primary.dark' } }}
          >
            <AddIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      </Box>
    );
  }

  const hasCover = Boolean(story?.cover_url);

  return (
    <Box
      sx={{
        width: 300,
        height: '100%',
        bgcolor: 'custom.sidebar',
        borderRight: 1,
        borderColor: 'divider',
        display: 'flex',
        flexDirection: 'column',
        zIndex: 5,
        transition: 'width 0.2s ease',
      }}
    >
      {/* Top Header */}
      <Box
        sx={{
          p: 1.5,
          px: 2,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: 1,
          borderColor: 'divider',
        }}
      >
        <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
          Estructura de la Historia
        </Typography>
        <Tooltip title="Colapsar panel lateral">
          <IconButton size="small" onClick={() => setCollapsed(true)}>
            <ChevronLeftIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      </Box>

      {/* Story Summary Banner Section flush with sidebar borders */}
      <Box
        sx={{
          width: '100%',
          p: 2,
          px: 2.2,
          position: 'relative',
          overflow: 'hidden',
          borderBottom: 1,
          borderColor: 'divider',
          bgcolor: hasCover ? 'transparent' : 'background.subtle',
          backgroundImage: hasCover
            ? `linear-gradient(to bottom, rgba(16, 20, 26, 0.45) 0%, rgba(16, 20, 26, 0.88) 100%), url(${story.cover_url})`
            : 'none',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          color: hasCover ? '#f8fafc' : 'text.primary',
          display: 'flex',
          flexDirection: 'column',
          gap: 1.2,
          transition: 'all 0.25s ease',
        }}
      >
        {/* Label & Quick Cover Button */}
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Chip
            label="Proyecto Activo"
            size="small"
            sx={{
              height: 20,
              fontSize: '0.65rem',
              fontWeight: 700,
              textTransform: 'uppercase',
              bgcolor: hasCover ? 'rgba(0, 0, 0, 0.55)' : 'background.subtle',
              color: hasCover ? '#e2e8f0' : 'text.secondary',
              border: hasCover ? '1px solid rgba(255,255,255,0.2)' : 'none',
              backdropFilter: hasCover ? 'blur(4px)' : 'none',
            }}
          />

          {story && (
            <Tooltip title={hasCover ? 'Cambiar portada de la historia' : 'Asignar imagen de fondo / portada'}>
              <IconButton
                size="small"
                onClick={handleOpenQuickCover}
                sx={{
                  p: 0.4,
                  bgcolor: hasCover ? 'rgba(0, 0, 0, 0.5)' : 'background.subtle',
                  color: hasCover ? '#fff' : 'text.secondary',
                  border: hasCover ? '1px solid rgba(255,255,255,0.25)' : 'none',
                  backdropFilter: hasCover ? 'blur(4px)' : 'none',
                  '&:hover': {
                    bgcolor: hasCover ? 'rgba(0, 0, 0, 0.8)' : 'divider',
                  },
                }}
              >
                {hasCover ? <PhotoCameraIcon sx={{ fontSize: 15 }} /> : <AddPhotoAlternateIcon sx={{ fontSize: 15 }} />}
              </IconButton>
            </Tooltip>
          )}
        </Box>

        {/* Story Title */}
        <Typography
          variant="subtitle1"
          sx={{
            fontWeight: 800,
            fontSize: '1.05rem',
            lineHeight: 1.25,
            textShadow: hasCover ? '0 2px 6px rgba(0,0,0,0.85)' : 'none',
            color: hasCover ? '#ffffff' : 'text.primary',
          }}
          noWrap
        >
          {story ? story.title : 'Sin historia seleccionada'}
        </Typography>

        {/* Story Synopsis */}
        {story?.synopsis && (
          <Typography
            variant="caption"
            sx={{
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
              lineHeight: 1.35,
              color: hasCover ? 'rgba(255, 255, 255, 0.88)' : 'text.secondary',
              textShadow: hasCover ? '0 1px 4px rgba(0,0,0,0.8)' : 'none',
            }}
          >
            {story.synopsis}
          </Typography>
        )}

        {/* Buttons covering the background with modern glassmorphic matte style */}
        <Box sx={{ display: 'flex', gap: 1, mt: 0.5 }}>
          <CustomButton
            variant={hasCover ? 'contained' : 'outlined'}
            size="small"
            fullWidth
            startIcon={<LayersOutlinedIcon fontSize="small" />}
            onClick={onOpenStorySelector}
            sx={{
              fontSize: '0.74rem',
              py: 0.45,
              fontWeight: 700,
              bgcolor: hasCover ? 'rgba(255, 255, 255, 0.18)' : undefined,
              color: hasCover ? '#ffffff' : undefined,
              borderColor: hasCover ? 'rgba(255, 255, 255, 0.35)' : undefined,
              backdropFilter: hasCover ? 'blur(6px)' : 'none',
              '&:hover': {
                bgcolor: hasCover ? 'rgba(255, 255, 255, 0.32)' : undefined,
              },
            }}
          >
            Historias
          </CustomButton>

          <CustomButton
            variant={hasCover ? 'contained' : 'outlined'}
            size="small"
            fullWidth
            startIcon={<PeopleOutlineIcon fontSize="small" />}
            onClick={onOpenCharactersDrawer}
            sx={{
              fontSize: '0.74rem',
              py: 0.45,
              fontWeight: 700,
              bgcolor: hasCover ? 'rgba(255, 255, 255, 0.18)' : undefined,
              color: hasCover ? '#ffffff' : undefined,
              borderColor: hasCover ? 'rgba(255, 255, 255, 0.35)' : undefined,
              backdropFilter: hasCover ? 'blur(6px)' : 'none',
              '&:hover': {
                bgcolor: hasCover ? 'rgba(255, 255, 255, 0.32)' : undefined,
              },
            }}
          >
            Personajes ({characters.length})
          </CustomButton>
        </Box>
      </Box>

      {/* Sequential Events Outline list */}
      <Box sx={{ p: 1.5, pb: 0.5, px: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, textTransform: 'uppercase' }}>
          Línea Narrativa ({events.length})
        </Typography>
        <IconButton size="small" onClick={onOpenCreateEvent} sx={{ color: 'primary.main', p: 0.3 }}>
          <AddIcon fontSize="small" />
        </IconButton>
      </Box>

      <Box sx={{ flexGrow: 1, overflowY: 'auto', px: 1.5 }}>
        {events.length === 0 ? (
          <Box sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="caption" color="text.disabled">
              No hay eventos en esta línea de tiempo.
            </Typography>
          </Box>
        ) : (
          <List dense sx={{ p: 0 }}>
            {events.map((ev) => (
              <ListItem key={ev.id} disablePadding sx={{ mb: 0.5 }}>
                <ListItemButton
                  sx={{
                    borderRadius: 1.5,
                    py: 0.6,
                    px: 1,
                    '&:hover': { bgcolor: 'background.subtle' },
                  }}
                >
                  <ListItemIcon sx={{ minWidth: 28 }}>
                    <Box
                      sx={{
                        width: 8,
                        height: 8,
                        borderRadius: '50%',
                        bgcolor: ev.color_tag || 'primary.main',
                      }}
                    />
                  </ListItemIcon>
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8 }}>
                        <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary' }}>
                          #{ev.order_index}
                        </Typography>
                        <Typography variant="body2" sx={{ fontWeight: 600, fontSize: '0.8rem' }} noWrap>
                          {ev.title}
                        </Typography>
                      </Box>
                    }
                  />
                  {ev.importance_level === 'legendary' && (
                    <FlareIcon sx={{ fontSize: 14, color: 'secondary.main', ml: 0.5 }} />
                  )}
                </ListItemButton>
              </ListItem>
            ))}
          </List>
        )}
      </Box>

      {/* Quick Cover Image Dialog */}
      <Dialog
        open={quickCoverOpen}
        onClose={() => setQuickCoverOpen(false)}
        maxWidth="xs"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3, p: 1 } }}
      >
        <DialogTitle sx={{ fontWeight: 700, fontSize: '1rem', pb: 1 }}>
          Portada de la Historia
        </DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
          <Typography variant="body2" color="text.secondary">
            Ingresa la URL de la imagen que servirá de fondo panorámico en el panel de Proyecto Activo.
          </Typography>
          <TextField
            label="URL de la imagen"
            placeholder="https://images.unsplash.com/..."
            value={newCoverUrl}
            onChange={(e) => setNewCoverUrl(e.target.value)}
            fullWidth
            autoFocus
          />
          {newCoverUrl && (
            <Box
              sx={{
                width: '100%',
                height: 110,
                borderRadius: 2,
                backgroundImage: `url(${newCoverUrl})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                border: 1,
                borderColor: 'divider',
              }}
            />
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <CustomButton variant="outlined" color="inherit" onClick={() => setQuickCoverOpen(false)}>
            Cancelar
          </CustomButton>
          <CustomButton onClick={handleSaveCover}>
            Guardar Portada
          </CustomButton>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
