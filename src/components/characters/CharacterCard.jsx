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
import FolderOutlinedIcon from '@mui/icons-material/FolderOutlined';

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
import { CHARACTER_ARCHETYPES, DEFAULT_ENTITY_COLOR } from '../../constants/constants';
import { ApiService } from '../../utils/ApiService';
import { useWorkspaceView } from '../../context/WorkspaceViewContext';

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
  viewMode = 'compact', // 'gallery' | 'compact' | 'medium' | 'detailed'
  showBiography = true,
}) {
  const { charactersColorCards: colorCards } = useWorkspaceView();
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
    if (selectable && onSelect) {
      onSelect(character.id, event);
    } else if (onEdit) {
      onEdit(character);
    }
  };

  const handleContextMenu = (event) => {
    event.preventDefault();
    event.stopPropagation();
    setAnchorEl(event.currentTarget);
  };

  const isGallery = viewMode === 'gallery';
  const isCompact = viewMode === 'compact';
  const isMedium = viewMode === 'medium';
  const isDetailed = viewMode === 'detailed';

  const avatarSize = isCompact ? 38 : isMedium ? 48 : 56;

  // Custom tags associated with this character
  const assignedTagIds = Array.isArray(character.custom_tag_ids) ? character.custom_tag_ids : [];
  const characterTags = allTags.filter((t) => assignedTagIds.includes(t.id));
 
  const customArch = customArchetypes.find((a) => a.name === character.role_archetype);
  const archetypeColor = customArch?.color;

  // Render shared context & action menu
  const renderMenu = () => (
    <Menu
      anchorEl={anchorEl}
      open={open}
      onClose={handleMenuClose}
      onClick={(e) => e.stopPropagation()}
      transformOrigin={{ horizontal: 'right', vertical: 'top' }}
      anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
      PaperProps={{
        elevation: 6,
        sx: {
          borderRadius: 2.5,
          minWidth: 215,
          p: 0,
          overflow: 'hidden',
          border: '1px solid',
          borderColor: 'divider',
          boxShadow: '0 8px 30px rgba(0,0,0,0.18)',
        },
      }}
    >
      {/* Mini Cabecera con Nombre del Personaje */}
      <Box sx={{ px: 1.8, py: 1.2, bgcolor: 'background.subtle', borderBottom: '1px solid', borderColor: 'divider' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Avatar
            src={character.avatar_url}
            sx={{
              width: 26,
              height: 26,
              bgcolor: character.color_tag || 'primary.main',
              fontSize: '0.75rem',
              fontWeight: 700,
            }}
          >
            {character.name?.charAt(0)}
          </Avatar>
          <Box sx={{ minWidth: 0, flexGrow: 1 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 800, fontSize: '0.82rem', lineHeight: 1.2 }} noWrap>
              {character.name}
            </Typography>
            <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.68rem', display: 'block' }} noWrap>
              {character.role_archetype || 'Sin rol'}
            </Typography>
          </Box>
        </Box>
      </Box>

      {/* Sección 1: Acciones Principales */}
      <Box sx={{ py: 0.5 }}>
        {onEdit && (
          <MenuItem
            onClick={(e) => {
              e.stopPropagation();
              handleMenuClose();
              onEdit(character);
            }}
            sx={{ py: 0.8, px: 1.8, fontSize: '0.82rem' }}
          >
            <ListItemIcon sx={{ minWidth: 32, color: 'primary.main' }}>
              <EditOutlinedIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText primary="Editar personaje" primaryTypographyProps={{ fontSize: '0.82rem', fontWeight: 600 }} />
          </MenuItem>
        )}

        {onClone && (
          <MenuItem
            onClick={(e) => {
              e.stopPropagation();
              handleMenuClose();
              onClone(character);
            }}
            sx={{ py: 0.8, px: 1.8, fontSize: '0.82rem' }}
          >
            <ListItemIcon sx={{ minWidth: 32 }}>
              <ContentCopyIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText primary="Clonar personaje" primaryTypographyProps={{ fontSize: '0.82rem' }} />
          </MenuItem>
        )}

        {character.is_global && onMakeLocalCopy && (
          <MenuItem
            onClick={(e) => {
              e.stopPropagation();
              handleMenuClose();
              onMakeLocalCopy(character);
            }}
            sx={{ py: 0.8, px: 1.8, fontSize: '0.82rem' }}
          >
            <ListItemIcon sx={{ minWidth: 32, color: 'secondary.main' }}>
              <BookmarkAddOutlinedIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText
              primary="Hacer copia local"
              secondary="Guardar en esta historia"
              primaryTypographyProps={{ fontSize: '0.82rem', fontWeight: 600 }}
              secondaryTypographyProps={{ fontSize: '0.68rem' }}
            />
          </MenuItem>
        )}
      </Box>

      {/* Sección 2: Organización */}
      {(onMoveToFolder || onAssignTags) && (
        <>
          <Divider sx={{ my: 0.2 }} />
          <Box sx={{ py: 0.5 }}>
            {onMoveToFolder && (
              <MenuItem
                onClick={(e) => {
                  e.stopPropagation();
                  handleMenuClose();
                  onMoveToFolder(character);
                }}
                sx={{ py: 0.8, px: 1.8, fontSize: '0.82rem' }}
              >
                <ListItemIcon sx={{ minWidth: 32 }}>
                  <DriveFileMoveOutlinedIcon fontSize="small" />
                </ListItemIcon>
                <ListItemText primary="Mover a carpeta…" primaryTypographyProps={{ fontSize: '0.82rem' }} />
              </MenuItem>
            )}

            {onAssignTags && (
              <MenuItem
                onClick={(e) => {
                  e.stopPropagation();
                  handleMenuClose();
                  onAssignTags(character);
                }}
                sx={{ py: 0.8, px: 1.8, fontSize: '0.82rem' }}
              >
                <ListItemIcon sx={{ minWidth: 32 }}>
                  <LocalOfferOutlinedIcon fontSize="small" />
                </ListItemIcon>
                <ListItemText primary="Gestionar etiquetas…" primaryTypographyProps={{ fontSize: '0.82rem' }} />
              </MenuItem>
            )}
          </Box>
        </>
      )}

      {/* Sección 3: Zona de Peligro */}
      {onDelete && (
        <>
          <Divider sx={{ my: 0.2 }} />
          <Box sx={{ py: 0.5 }}>
            <MenuItem
              onClick={(e) => {
                e.stopPropagation();
                handleMenuClose();
                onDelete(character.id);
              }}
              sx={{
                py: 0.8,
                px: 1.8,
                color: 'error.main',
                '&:hover': { bgcolor: (theme) => alpha(theme.palette.error.main, 0.08) },
              }}
            >
              <ListItemIcon sx={{ minWidth: 32, color: 'error.main' }}>
                <DeleteOutlineIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText
                primary="Eliminar"
                primaryTypographyProps={{ fontSize: '0.82rem', fontWeight: 600, color: 'error.main' }}
              />
            </MenuItem>
          </Box>
        </>
      )}
    </Menu>
  );

  // Render role selection menu
  const renderRoleMenu = () => (
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
        {archMenuTab === 0 &&
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
          })}

        {archMenuTab === 1 &&
          (customArchetypes.length > 0 ? (
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
          ))}
      </Box>
    </Menu>
  );

  // Rich Tooltip content for Gallery Mode
  const tooltipContent = (
    <Box sx={{ p: 0.5, maxWidth: 260 }}>
      {/* Name & Role (Clickable Chip) */}
      <Box sx={{ mb: character.biography ? 1 : 0 }}>
        <Typography variant="subtitle2" sx={{ fontWeight: 800, fontSize: '0.85rem', lineHeight: 1.2, mb: 0.4 }} noWrap>
          {character.name}
        </Typography>
        {(() => {
          const chipColor = customArch?.color;
          return (
            <Chip
              label={character.role_archetype || 'Sin rol'}
              size="small"
              onClick={handleRoleChipClick}
              sx={{
                height: 18,
                fontSize: '0.68rem',
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
      </Box>

      {/* Biography snippet */}
      {character.biography ? (
        <Typography
          variant="caption"
          color="text.secondary"
          sx={{
            display: '-webkit-box',
            WebkitLineClamp: 4,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
            lineHeight: 1.35,
            fontSize: '0.72rem',
            fontStyle: 'italic',
            mb: 0.6,
          }}
        >
          "{character.biography}"
        </Typography>
      ) : (
        <Typography
          variant="caption"
          color="text.disabled"
          sx={{ fontStyle: 'italic', fontSize: '0.7rem', display: 'block', mb: 0.6 }}
        >
          Sin biografía
        </Typography>
      )}

      {/* Quick Action Hint */}
      <Divider sx={{ my: 0.6 }} />
      <Typography variant="caption" sx={{ color: 'text.disabled', fontSize: '0.68rem', display: 'block', textAlign: 'center' }}>
        Clic en rol para cambiar • Clic para seleccionar • Doble clic para editar
      </Typography>
    </Box>
  );

  // ─── MODO GALERÍA / MOSAICO DE RETRATOS ───
  if (isGallery) {
    return (
      <>
        <Tooltip
          title={tooltipContent}
          arrow
          placement="top"
          enterDelay={300}
          leaveDelay={100}
          componentsProps={{
            tooltip: {
              sx: {
                bgcolor: 'background.paper',
                color: 'text.primary',
                p: 1.2,
                borderRadius: 2.5,
                boxShadow: '0 8px 30px rgba(0,0,0,0.22)',
                border: '1px solid',
                borderColor: 'divider',
              },
            },
            arrow: {
              sx: {
                color: 'background.paper',
                '&::before': {
                  border: '1px solid',
                  borderColor: 'divider',
                },
              },
            },
          }}
        >
          <Card
            id={`character-gallery-card-${character.id}`}
            elevation={0}
            onClick={handleCardClick}
            onDoubleClick={(e) => {
              e.stopPropagation();
              if (onEdit) onEdit(character);
            }}
            onContextMenu={handleContextMenu}
            sx={{
              position: 'relative',
              borderRadius: 2.5,
              overflow: 'hidden',
              cursor: 'pointer',
              userSelect: 'none',
              border: selected ? '2px solid' : '1px solid',
              borderColor: selected
                ? character.color_tag || 'primary.main'
                : colorCards && character.color_tag
                ? alpha(character.color_tag, 0.4)
                : 'divider',
              bgcolor: colorCards && character.color_tag ? alpha(character.color_tag, 0.08) : 'background.paper',
              boxShadow: selected
                ? `0 0 0 3px ${alpha(character.color_tag || DEFAULT_ENTITY_COLOR, 0.35)}`
                : '0 2px 6px rgba(0,0,0,0.04)',
              transition: 'all 0.22s cubic-bezier(0.4, 0, 0.2, 1)',
              display: 'flex',
              flexDirection: 'column',
              '&:hover': {
                transform: 'translateY(-4px)',
                borderColor: character.color_tag || 'primary.main',
                boxShadow: colorCards && character.color_tag
                  ? `0 8px 20px ${alpha(character.color_tag, 0.22)}`
                  : '0 6px 18px rgba(0,0,0,0.1)',
                '& .portrait-img': {
                  transform: 'scale(1.06)',
                },
              },
            }}
          >
            {/* Contenedor de la ilustración / retrato (Proporción 1:1) */}
            <Box
              sx={{
                width: '100%',
                aspectRatio: '1 / 1',
                position: 'relative',
                overflow: 'hidden',
                bgcolor: character.color_tag ? alpha(character.color_tag, 0.15) : 'background.subtle',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {character.avatar_url ? (
                <Box
                  component="img"
                  className="portrait-img"
                  src={character.avatar_url}
                  alt={character.name}
                  sx={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    display: 'block',
                    transition: 'transform 0.35s cubic-bezier(0.4, 0, 0.2, 1)',
                  }}
                />
              ) : (
                <Box
                  sx={{
                    width: '100%',
                    height: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: character.color_tag
                      ? `linear-gradient(135deg, ${alpha(character.color_tag, 0.35)}, ${alpha(character.color_tag, 0.1)})`
                      : 'linear-gradient(135deg, rgba(140,109,83,0.3), rgba(140,109,83,0.08))',
                    color: character.color_tag || 'primary.main',
                    fontWeight: 800,
                    fontSize: '2.4rem',
                  }}
                >
                  {character.name?.charAt(0) || '?'}
                </Box>
              )}

              {/* Badges superiores (Global / Especial) */}
              {character.is_global && (
                <Box
                  sx={{
                    position: 'absolute',
                    top: 6,
                    left: 6,
                    bgcolor: 'rgba(0,0,0,0.65)',
                    backdropFilter: 'blur(4px)',
                    color: '#fff',
                    borderRadius: 1,
                    px: 0.6,
                    py: 0.2,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 0.3,
                  }}
                >
                  <PublicOutlinedIcon sx={{ fontSize: 11 }} />
                </Box>
              )}

              {character.attributes?.is_special && (
                <Box
                  sx={{
                    position: 'absolute',
                    top: 6,
                    right: selected ? 30 : 6,
                    bgcolor: 'rgba(0,0,0,0.65)',
                    backdropFilter: 'blur(4px)',
                    borderRadius: '50%',
                    width: 20,
                    height: 20,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '0.68rem',
                  }}
                >
                  ⭐
                </Box>
              )}

              {/* Checkmark de Selección */}
              {selected && (
                <Box
                  sx={{
                    position: 'absolute',
                    top: 6,
                    right: 6,
                    bgcolor: character.color_tag || 'primary.main',
                    color: '#fff',
                    borderRadius: '50%',
                    width: 20,
                    height: 20,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 2px 6px rgba(0,0,0,0.35)',
                    zIndex: 2,
                  }}
                >
                  <CheckIcon sx={{ fontSize: 13, fontWeight: 900 }} />
                </Box>
              )}
            </Box>

            {/* Nombre justo debajo de la imagen */}
            <Box
              sx={{
                py: 0.9,
                px: 0.8,
                textAlign: 'center',
                bgcolor: 'background.paper',
                borderTop: '1px solid',
                borderColor: 'divider',
              }}
            >
              <Typography
                variant="subtitle2"
                sx={{
                  fontWeight: 800,
                  fontSize: '0.8rem',
                  lineHeight: 1.25,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {character.name}
              </Typography>
            </Box>
          </Card>
        </Tooltip>

        {renderMenu()}
        {renderRoleMenu()}
      </>
    );
  }

  // ─── MODO ESTÁNDAR (COMPACTO / MEDIO / DETALLADO) ───
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
          : colorCards && character.color_tag
          ? alpha(character.color_tag, 0.4)
          : 'divider',
        // Modo neutro: acento lateral con el color del personaje sobre fondo neutro
        borderLeft: !colorCards && character.color_tag ? `4px solid ${character.color_tag}` : undefined,
        borderRadius: isCompact ? 2.5 : 3,
        background: 'none',
        bgcolor: colorCards && character.color_tag ? alpha(character.color_tag, 0.15) : 'background.paper',
        boxShadow: selected
          ? `0 0 0 3px ${alpha(character.color_tag || DEFAULT_ENTITY_COLOR, 0.3)}`
          : colorCards && character.color_tag
          ? `0 2px 4px ${alpha(character.color_tag, 0.12)}`
          : '0 1px 3px rgba(0,0,0,0.04)',
        animation: selected ? 'selected-character-bounce 260ms ease-out' : 'none',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        cursor: selectable ? 'pointer' : 'default',
        transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
        '&:hover': {
          transform: 'translateY(-4px)',
          borderColor: character.color_tag || 'primary.main',
          background: 'none',
          bgcolor: colorCards && character.color_tag ? alpha(character.color_tag, 0.25) : 'action.hover',
          boxShadow: colorCards && character.color_tag
            ? `0 6px 16px ${alpha(character.color_tag, 0.2)}`
            : '0 4px 12px rgba(0,0,0,0.08)',
        },
      }}
      onClick={handleCardClick}
      onContextMenu={handleContextMenu}
    >
      {/* Esquina superior derecha: Menú de opciones (Tres puntos) */}
      <Box sx={{ position: 'absolute', top: isCompact ? 6 : 8, right: isCompact ? 6 : 8, zIndex: 1 }}>
        <Tooltip title="Opciones de personaje">
          <IconButton
            size="small"
            onClick={(event) => {
              event.stopPropagation();
              handleMenuClick(event);
            }}
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

        {renderMenu()}
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
            border: `1.5px solid ${character.color_tag || 'transparent'}`,
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
            {renderRoleMenu()}

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
                bgcolor: tag.color || DEFAULT_ENTITY_COLOR,
                borderRadius: 1,
                px: 0.2,
                '& .MuiChip-label': { px: 0.6 },
              }}
            />
          ))}
          {characterTags.length > (isCompact ? 3 : 5) && (
            <Typography variant="caption" sx={{ fontSize: '0.68rem', color: 'text.secondary', fontWeight: 700, alignSelf: 'center' }}>
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