import React, { useState } from 'react';
import { alpha } from '@mui/material/styles';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import BookmarkAddOutlinedIcon from '@mui/icons-material/BookmarkAddOutlined';
import PublicOutlinedIcon from '@mui/icons-material/PublicOutlined';
import CheckIcon from '@mui/icons-material/Check';
import DriveFileMoveOutlinedIcon from '@mui/icons-material/DriveFileMoveOutlined';
import LocalOfferOutlinedIcon from '@mui/icons-material/LocalOfferOutlined';

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
  Tabs,
  Tab,
} from '@mui/material';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import { CHARACTER_ARCHETYPES } from '../../constants/constants';
import { ApiService } from '../../utils/ApiService';

export default function CharacterCard({
  character,
  allTags = [],
  allFolders = [],
  customArchetypes = [],
  onEdit,
  onDelete,
  onClone,
  onMakeLocalCopy,
  onRoleChange,
  onMoveToFolder,
  onAssignTags,
  selectable = false,
  selected = false,
  onSelect,
  viewMode = 'compact', // 'compact' | 'medium' | 'detailed'
  showBiography = true,
}) {
  const [anchorEl, setAnchorEl] = useState(null);
  const [roleAnchorEl, setRoleAnchorEl] = useState(null);
  const [archMenuTab, setArchMenuTab] = useState(0);
  const open = Boolean(anchorEl);
  const isRoleMenuOpen = Boolean(roleAnchorEl);

  const handleMenuClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleRoleChipClick = (event) => {
    event.stopPropagation();
    const isCustom = customArchetypes.some((a) => a.name === character.role_archetype);
    setArchMenuTab(isCustom ? 1 : 0);
    setRoleAnchorEl(event.currentTarget);
  };

  const handleRoleMenuClose = (event) => {
    if (event) event.stopPropagation();
    setRoleAnchorEl(null);
  };

  const handleSelectRole = async (newRole, event) => {
    if (event) event.stopPropagation();
    setRoleAnchorEl(null);
    if (newRole === character.role_archetype) return;

    if (onRoleChange) {
      await onRoleChange(character.id, newRole);
    } else {
      try {
        await ApiService.characters.update(character.id, { role_archetype: newRole });
      } catch (err) {
        console.error('Error updating character role:', err);
      }
    }
  };

  const handleCardClick = (event) => {
    if (!selectable || !onSelect) return;
    onSelect(character.id, event);
  };

  const isCompact = viewMode === 'compact';
  const isMedium = viewMode === 'medium';
  const isDetailed = viewMode === 'detailed';

  const avatarSize = isCompact ? 38 : isMedium ? 48 : 56;

  // Custom tags associated with this character
  const assignedTagIds = Array.isArray(character.custom_tag_ids) ? character.custom_tag_ids : [];
  const characterTags = allTags.filter((t) => assignedTagIds.includes(t.id));

  return (
    <Card
      id={`character-card-${character.id}`}
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
      <Box sx={{ position: 'absolute', top: isCompact ? 6 : 8, right: isCompact ? 6 : 8, zIndex: 1 }}>
        <Tooltip title="Opciones de personaje">
          <IconButton
            size="small"
            onClick={(event) => { event.stopPropagation(); handleMenuClick(event); }}
            sx={{
              p: isCompact ? 0.3 : 0.5,
              borderRadius: 2,
              bgcolor: open ? 'action.selected' : 'transparent',
              '&:hover': { bgcolor: 'action.hover' },
            }}
          >
            <MoreVertIcon sx={{ fontSize: isCompact ? 20 : 22 }} />
          </IconButton>
        </Tooltip>

        <Menu
          anchorEl={anchorEl}
          open={open}
          onClose={handleMenuClose}
          onClick={(e) => e.stopPropagation()}
          transformOrigin={{ horizontal: 'right', vertical: 'top' }}
          anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
          PaperProps={{
            elevation: 3,
            sx: { borderRadius: 2, minWidth: 190 }
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
          {onMoveToFolder && (
            <MenuItem
              onClick={(e) => {
                e.stopPropagation();
                handleMenuClose();
                onMoveToFolder(character);
              }}
            >
              <ListItemIcon>
                <DriveFileMoveOutlinedIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText primary="Mover a carpeta..." />
            </MenuItem>
          )}
          {onAssignTags && (
            <MenuItem
              onClick={(e) => {
                e.stopPropagation();
                handleMenuClose();
                onAssignTags(character);
              }}
            >
              <ListItemIcon>
                <LocalOfferOutlinedIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText primary="Asignar etiquetas..." />
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
            {/* Chip de Rol / Arquetipo */}
            {(() => {
              const customArch = customArchetypes.find((a) => a.name === character.role_archetype);
              const chipColor = customArch?.color;
              return (
                <Chip
                  label={character.role_archetype || 'Sin rol'}
                  size="small"
                  onClick={handleRoleChipClick}
                  sx={{
                    height: isCompact ? 18 : 20,
                    fontSize: isCompact ? '0.62rem' : '0.68rem',
                    fontWeight: 600,
                    bgcolor: isRoleMenuOpen
                      ? 'action.selected'
                      : chipColor
                      ? alpha(chipColor, 0.15)
                      : 'background.subtle',
                    border: '1px solid',
                    borderColor: isRoleMenuOpen
                      ? 'primary.main'
                      : chipColor
                      ? alpha(chipColor, 0.5)
                      : 'divider',
                    color: chipColor || 'inherit',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                    '&:hover': {
                      bgcolor: chipColor ? alpha(chipColor, 0.25) : 'action.hover',
                      borderColor: chipColor || 'primary.main',
                    },
                  }}
                />
              );
            })()}

            {/* Menú Rápido de Selección de Tipo de Personaje */}
            <Menu
              anchorEl={roleAnchorEl}
              open={isRoleMenuOpen}
              onClose={handleRoleMenuClose}
              onClick={(e) => e.stopPropagation()}
              transformOrigin={{ horizontal: 'left', vertical: 'top' }}
              anchorOrigin={{ horizontal: 'left', vertical: 'bottom' }}
              PaperProps={{
                elevation: 6,
                sx: {
                  borderRadius: 2.5,
                  minWidth: 220,
                  maxWidth: 260,
                  maxHeight: 340,
                  p: 0,
                  overflow: 'hidden',
                  border: '1px solid',
                  borderColor: 'divider',
                  display: 'flex',
                  flexDirection: 'column',
                },
              }}
            >
              {/* Tab Selector */}
              <Box sx={{ p: 0.8, pb: 0.5, bgcolor: 'background.subtle', borderBottom: '1px solid', borderColor: 'divider' }}>
                <Tabs
                  value={archMenuTab}
                  onChange={(e, val) => setArchMenuTab(val)}
                  variant="fullWidth"
                  sx={{
                    minHeight: 28,
                    bgcolor: 'action.hover',
                    borderRadius: 1.5,
                    p: 0.3,
                    '& .MuiTabs-indicator': { display: 'none' },
                    '& .MuiTab-root': {
                      minHeight: 24,
                      py: 0.3,
                      px: 0.8,
                      fontSize: '0.72rem',
                      fontWeight: 700,
                      textTransform: 'none',
                      borderRadius: 1,
                      color: 'text.secondary',
                      '&.Mui-selected': {
                        bgcolor: 'background.paper',
                        color: 'primary.main',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.12)',
                      },
                    },
                  }}
                >
                  <Tab label="Estándar" />
                  <Tab label={`Propios (${customArchetypes.length})`} />
                </Tabs>
              </Box>

              <Box sx={{ overflowY: 'auto', py: 0.5 }}>
                {archMenuTab === 0 && (
                  CHARACTER_ARCHETYPES.map((arch) => {
                    const isSelected = (character.role_archetype || 'Protagonista') === arch;
                    return (
                      <MenuItem
                        key={arch}
                        selected={isSelected}
                        onClick={(e) => handleSelectRole(arch, e)}
                        sx={{
                          py: 0.5,
                          px: 1.5,
                          fontSize: '0.8rem',
                          fontWeight: isSelected ? 700 : 500,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          borderRadius: 1,
                          mx: 0.5,
                        }}
                      >
                        <ListItemText
                          primary={arch}
                          primaryTypographyProps={{
                            fontSize: '0.8rem',
                            fontWeight: isSelected ? 700 : 500,
                            color: isSelected ? 'primary.main' : 'text.primary',
                          }}
                        />
                        {isSelected && (
                          <ListItemIcon sx={{ minWidth: 'auto', color: 'primary.main', ml: 1 }}>
                            <CheckIcon sx={{ fontSize: 16 }} />
                          </ListItemIcon>
                        )}
                      </MenuItem>
                    );
                  })
                )}

                {archMenuTab === 1 && (
                  customArchetypes.length > 0 ? (
                    customArchetypes.map((arch) => {
                      const isSelected = character.role_archetype === arch.name;
                      return (
                        <MenuItem
                          key={arch.id || arch.name}
                          selected={isSelected}
                          onClick={(e) => handleSelectRole(arch.name, e)}
                          sx={{
                            py: 0.5,
                            px: 1.5,
                            fontSize: '0.8rem',
                            fontWeight: isSelected ? 700 : 500,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            borderRadius: 1,
                            mx: 0.5,
                          }}
                        >
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8, minWidth: 0 }}>
                            <Box
                              sx={{
                                width: 8,
                                height: 8,
                                borderRadius: '50%',
                                bgcolor: arch.color || 'primary.main',
                                flexShrink: 0,
                              }}
                            />
                            <ListItemText
                              primary={arch.name}
                              primaryTypographyProps={{
                                fontSize: '0.8rem',
                                fontWeight: isSelected ? 700 : 500,
                                color: isSelected ? 'primary.main' : 'text.primary',
                                noWrap: true,
                              }}
                            />
                          </Box>
                          {isSelected && (
                            <ListItemIcon sx={{ minWidth: 'auto', color: 'primary.main', ml: 1 }}>
                              <CheckIcon sx={{ fontSize: 16 }} />
                            </ListItemIcon>
                          )}
                        </MenuItem>
                      );
                    })
                  ) : (
                    <Box sx={{ p: 2, textAlign: 'center' }}>
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
                        No hay arquetipos propios aún.
                      </Typography>
                    </Box>
                  )
                )}
              </Box>
            </Menu>

            {character.is_global && (
              <Tooltip title="Personaje Global">
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

      {/* Etiquetas Personalizadas (Custom Tags) */}
      {characterTags.length > 0 && (
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.4, mt: 0.8, mb: isCompact ? 0 : 0.4 }}>
          {characterTags.slice(0, isCompact ? 3 : 5).map((tag) => (
            <Chip
              key={tag.id}
              label={tag.name}
              size="small"
              sx={{
                height: 17,
                fontSize: '0.6rem',
                fontWeight: 700,
                color: '#fff',
                bgcolor: tag.color || '#8c6d53',
                borderRadius: 1,
                px: 0.2,
                '& .MuiChip-label': { px: 0.6 },
              }}
            />
          ))}
          {characterTags.length > (isCompact ? 3 : 5) && (
            <Typography variant="caption" sx={{ fontSize: '0.62rem', color: 'text.secondary', fontWeight: 700, alignSelf: 'center' }}>
              +{characterTags.length - (isCompact ? 3 : 5)}
            </Typography>
          )}
        </Box>
      )}

      {/* Biografía en modo medio o detallado */}
      {showBiography && !isCompact && character.biography && (
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