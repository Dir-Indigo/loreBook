import React, { useState } from 'react';
import { alpha } from '@mui/material/styles';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import BookmarkAddOutlinedIcon from '@mui/icons-material/BookmarkAddOutlined';
import PublicOutlinedIcon from '@mui/icons-material/PublicOutlined';
import {
  Card,
  Box,
  Avatar,
  Typography,
  Chip,
  Divider,
  IconButton,
  Tooltip,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
} from '@mui/material';
import MoreVertIcon from '@mui/icons-material/MoreVert'; // Icono para el menú de opciones

export default function CharacterCard({
  character,
  onEdit,
  onDelete,
  onClone,
  onMakeLocalCopy,
  selectable = false,
  selected = false,
  onSelect,
  viewMode = 'compact', // 'compact' | 'medium' | 'detailed'
}) {
  // Estado para controlar la apertura y cierre del menú
  const [anchorEl, setAnchorEl] = useState(null);
  const [bounceKey, setBounceKey] = useState(0);
  const open = Boolean(anchorEl);

  const handleMenuClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleCardClick = (event) => {
    if (!selectable || !onSelect) return;
    setBounceKey((current) => current + 1);
    onSelect(character.id, event);
  };

  const isCompact = viewMode === 'compact';
  const isMedium = viewMode === 'medium';
  const isDetailed = viewMode === 'detailed';

  const avatarSize = isCompact ? 38 : isMedium ? 48 : 56;

  return (
    <Card
      id={`character-card-${character.id}`}
      key={`${character.id}-${bounceKey}`}
      elevation={0}
      sx={{
        p: isCompact ? 1.2 : isMedium ? 1.5 : 2,
        position: 'relative',
        border: selected ? '2px solid' : '1px solid',
        borderColor: selected
          ? character.color_tag || 'primary.main'
          : character.color_tag
          ? alpha(character.color_tag, 0.45)
          : 'divider',
        borderRadius: isCompact ? 2.5 : 3,
        bgcolor: character.color_tag ? alpha(character.color_tag, 0.1) : 'background.paper',
        background: character.color_tag
          ? `linear-gradient(135deg, ${alpha(character.color_tag, 0.15)} 0%, ${alpha(character.color_tag, 0.03)} 100%)`
          : 'background.paper',
        boxShadow: selected
          ? `0 0 0 3px ${alpha(character.color_tag || '#8c6d53', 0.2)}`
          : '0 1px 3px rgba(0,0,0,0.04)',
        animation: selected ? 'selected-character-bounce 260ms ease-out' : 'none',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        cursor: selectable ? 'pointer' : 'default',
        transition: 'all 0.15s ease',
        '&:hover': {
          transform: 'translateY(-2px)',
          boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
          borderColor: character.color_tag || 'primary.main',
        },
      }}
      onClick={handleCardClick}
    >
      {/* Esquina superior derecha: Menú de opciones (Tres puntos) */}
      <Box sx={{ position: 'absolute', top: isCompact ? 6 : 10, right: isCompact ? 6 : 10, zIndex: 1 }}>
        <Tooltip title="Opciones">
          <IconButton
            size="small"
            onClick={(event) => { event.stopPropagation(); handleMenuClick(event); }}
            sx={{ p: isCompact ? 0.3 : 0.5 }}
          >
            <MoreVertIcon sx={{ fontSize: isCompact ? 16 : 18 }} />
          </IconButton>
        </Tooltip>

        <Menu
          anchorEl={anchorEl}
          open={open}
          onClose={handleMenuClose}
          transformOrigin={{ horizontal: 'right', vertical: 'top' }}
          anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
          PaperProps={{
            elevation: 3,
            sx: { borderRadius: 2, minWidth: 170 }
          }}
        >
          {character.is_global && onMakeLocalCopy && (
            <MenuItem
              onClick={(e) => {
                e.stopPropagation();
                handleMenuClose();
                onMakeLocalCopy(character);
              }}
            >
              <ListItemIcon>
                <BookmarkAddOutlinedIcon fontSize="small" color="primary" />
              </ListItemIcon>
              <ListItemText primary="Hacer copia local" secondary="Para esta historia" />
            </MenuItem>
          )}
          {onClone && (
            <MenuItem
              onClick={(e) => {
                e.stopPropagation();
                handleMenuClose();
                onClone(character);
              }}
            >
              <ListItemIcon>
                <ContentCopyIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText primary="Clonar" />
            </MenuItem>
          )}
          <MenuItem
            onClick={(e) => {
              e.stopPropagation();
              handleMenuClose();
              onEdit(character);
            }}
          >
            <ListItemIcon>
              <EditOutlinedIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText primary="Editar" />
          </MenuItem>
          <MenuItem 
            onClick={(e) => {
              e.stopPropagation();
              handleMenuClose();
              onDelete(character.id);
            }}
            sx={{ color: 'error.main' }}
          >
            <ListItemIcon sx={{ color: 'error.main' }}>
              <DeleteOutlineIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText primary="Eliminar" />
          </MenuItem>
        </Menu>
      </Box>

      {/* Cabecera (Avatar y Nombre) */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: isCompact ? 1 : 1.5, mb: isCompact ? 0 : 1, pr: 3.5 }}>
        <Avatar
          src={character.avatar_url}
          alt={character.name}
          sx={{
            width: avatarSize,
            height: avatarSize,
            bgcolor: character.color_tag || 'primary.main',
            color: '#ffffff',
            fontWeight: 700,
            fontSize: isCompact ? '0.85rem' : '1.1rem',
            border: 2,
            borderColor: 'background.paper',
            boxShadow: '0 2px 6px rgba(0,0,0,0.1)',
            flexShrink: 0,
          }}
        >
          {character.name?.charAt(0)}
        </Avatar>
        <Box sx={{ flexGrow: 1, minWidth: 0 }}>
          <Typography
            variant="subtitle2"
            sx={{
              fontWeight: 800,
              fontSize: isCompact ? '0.84rem' : '0.95rem',
              lineHeight: 1.25,
            }}
            noWrap
          >
            {character.name}
          </Typography>
        
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.3, flexWrap: 'wrap' }}>
            <Chip
              label={character.role_archetype || 'Sin rol'}
              size="small"
              sx={{
                height: isCompact ? 18 : 20,
                fontSize: isCompact ? '0.62rem' : '0.68rem',
                fontWeight: 600,
                bgcolor: 'background.subtle',
                border: '1px solid',
                borderColor: 'divider',
              }}
            />
            {character.is_global && (
              <Tooltip title="Personaje Global (Compartido)">
                <Chip
                  icon={<PublicOutlinedIcon sx={{ fontSize: '12px !important' }} />}
                  size="small"
                  color="secondary"
                  variant="outlined"
                  sx={{ height: isCompact ? 18 : 20, fontSize: '0.6rem', px: 0.2 }}
                />
              </Tooltip>
            )}
          </Box>
        </Box>
      </Box>

      {/* Biografía en modo medio o detallado */}
      {!isCompact && character.biography && (
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{
            fontSize: isMedium ? '0.78rem' : '0.84rem',
            lineHeight: 1.4,
            display: '-webkit-box',
            WebkitLineClamp: isMedium ? 2 : 3,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
            mt: 0.8,
          }}
        >
          {character.biography}
        </Typography>
      )}
    </Card>
  );
}