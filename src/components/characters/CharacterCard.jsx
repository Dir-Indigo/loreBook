import React, { useState } from 'react';
import { alpha } from '@mui/material/styles';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
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

export default function CharacterCard({ character, onEdit, onDelete, onClone }) {
  // Estado para controlar la apertura y cierre del menú
  const [anchorEl, setAnchorEl] = useState(null);
  const open = Boolean(anchorEl);

  const handleMenuClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  return (
    <Card
      elevation={0}
      sx={{
        p: 2,
        position: 'relative',
        border: '1.5px solid',
        borderColor: character.color_tag ? alpha(character.color_tag, 0.4) : 'divider',
        borderRadius: 3,
        bgcolor: character.color_tag ? alpha(character.color_tag, 0.12) : 'background.paper',
        background: character.color_tag
          ? `linear-gradient(135deg, ${alpha(character.color_tag, 0.16)} 0%, ${alpha(character.color_tag, 0.04)} 100%)`
          : 'background.paper',
        boxShadow: 'none',
        display: 'flex',
        flexDirection: 'column',
        transition: 'all 0.2s ease',
      }}
    >
      {/* Esquina superior derecha: Menú de opciones (Tres puntos) */}
      <Box sx={{ position: 'absolute', top: 12, right: 12 }}>
        <Tooltip title="Opciones">
          <IconButton size="small" onClick={handleMenuClick}>
            <MoreVertIcon fontSize="small" />
          </IconButton>
        </Tooltip>

        <Menu
          anchorEl={anchorEl}
          open={open}
          onClose={handleMenuClose}
          onClick={handleMenuClose}
          transformOrigin={{ horizontal: 'right', vertical: 'top' }}
          anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
          PaperProps={{
            elevation: 2,
            sx: { borderRadius: 2, minWidth: 140 }
          }}
        >
          {onClone && (
            <MenuItem onClick={() => onClone(character)}>
              <ListItemIcon>
                <ContentCopyIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText primary="Clonar" />
            </MenuItem>
          )}
          <MenuItem onClick={() => onEdit(character)}>
            <ListItemIcon>
              <EditOutlinedIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText primary="Editar" />
          </MenuItem>
          <MenuItem 
            onClick={() => onDelete(character.id)}
            sx={{ color: 'error.main' }}
          >
            <ListItemIcon sx={{ color: 'error.main' }}>
              <DeleteOutlineIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText primary="Eliminar" />
          </MenuItem>
        </Menu>
      </Box>

      {/* Cabecera (Avatar y Nombre). Se añadió paddingRight para evitar que choque con el botón de opciones */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1.5, pr: 4 }}>
        <Avatar
          src={character.avatar_url}
          alt={character.name}
          sx={{
            width: 56,
            height: 56,
            bgcolor: character.color_tag || 'primary.main',
            color: '#ffffff',
            fontWeight: 600,
            border: 2,
            borderColor: 'background.paper',
          }}
        >
          {character.name?.charAt(0)}
        </Avatar>
        <Box sx={{ flexGrow: 1, minWidth: 0 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 800 }} noWrap>
            {character.name}
          </Typography>
          <Chip
            label={character.role_archetype || 'Sin rol'}
            size="small"
            sx={{ height: 20, fontSize: '0.65rem', bgcolor: 'background.subtle' }}
          />
        </Box>
      </Box>

      {/* Biografía */}
      <Typography
        variant="body2"
        color="text.secondary"
        sx={{
          flexGrow: 1,
          fontSize: '0.85rem',
          display: '-webkit-box',
          WebkitLineClamp: 3,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
          mb: 0, // Reducido ya que eliminamos la barra inferior anterior
        }}
      >
        {character.biography || ''}
      </Typography>
    </Card>
  );
}