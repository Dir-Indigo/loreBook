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
  Avatar,
  Divider,
  Chip,
  Badge,
} from '@mui/material';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import PeopleOutlineIcon from '@mui/icons-material/PeopleOutline';
import LayersOutlinedIcon from '@mui/icons-material/LayersOutlined';
import TimelineIcon from '@mui/icons-material/Timeline';
import AddIcon from '@mui/icons-material/Add';
import FlareIcon from '@mui/icons-material/Flare';
import CustomButton from '../common/CustomButton';

export default function SidebarLore({
  story,
  characters = [],
  events = [],
  onOpenStorySelector,
  onOpenCharactersDrawer,
  onOpenCreateEvent,
  onSelectEventInCanvas,
}) {
  const [collapsed, setCollapsed] = useState(false);

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
          <IconButton size="small" onClick={onOpenCreateEvent} sx={{ bgcolor: 'primary.main', color: '#fff', '&:hover': { bgcolor: 'primary.dark' } }}>
            <AddIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        width: 280,
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

      {/* Story Summary Card */}
      <Box sx={{ p: 2, pb: 1.5, borderBottom: 1, borderColor: 'divider' }}>
        <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, textTransform: 'uppercase' }}>
          Proyecto Activo
        </Typography>
        <Typography variant="subtitle1" sx={{ fontWeight: 700, mt: 0.3 }} noWrap>
          {story ? story.title : 'Sin historia seleccionada'}
        </Typography>
        {story?.synopsis && (
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
              mt: 0.5,
            }}
          >
            {story.synopsis}
          </Typography>
        )}

        <Box sx={{ display: 'flex', gap: 1, mt: 1.5 }}>
          <CustomButton
            variant="outlined"
            size="small"
            fullWidth
            startIcon={<LayersOutlinedIcon fontSize="small" />}
            onClick={onOpenStorySelector}
            sx={{ fontSize: '0.75rem', py: 0.4 }}
          >
            Historias
          </CustomButton>
          <CustomButton
            variant="outlined"
            size="small"
            fullWidth
            startIcon={<PeopleOutlineIcon fontSize="small" />}
            onClick={onOpenCharactersDrawer}
            sx={{ fontSize: '0.75rem', py: 0.4 }}
          >
            Personajes ({characters.length})
          </CustomButton>
        </Box>
      </Box>

      {/* Sequential Events Outline list */}
      <Box sx={{ p: 1.5, pb: 0.5, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, textTransform: 'uppercase' }}>
          Línea Narrativa ({events.length})
        </Typography>
        <IconButton size="small" onClick={onOpenCreateEvent} sx={{ color: 'primary.main', p: 0.3 }}>
          <AddIcon fontSize="small" />
        </IconButton>
      </Box>

      <Box sx={{ flexGrow: 1, overflowY: 'auto', px: 1 }}>
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
    </Box>
  );
}
