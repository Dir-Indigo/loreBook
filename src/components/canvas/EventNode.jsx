import React, { useState, memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import {
  Box,
  Typography,
  IconButton,
  Avatar,
  AvatarGroup,
  Chip,
  Tooltip,
  Collapse,
  Badge,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Divider,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import HistoryIcon from '@mui/icons-material/History';
import BookmarkBorderIcon from '@mui/icons-material/BookmarkBorder';
import FlareIcon from '@mui/icons-material/Flare';
import ViewHeadlineIcon from '@mui/icons-material/ViewHeadline';
import ViewAgendaOutlinedIcon from '@mui/icons-material/ViewAgendaOutlined';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import { APP_CONFIG } from '../../constants/constants';

function EventNodeComponent({ data, selected }) {
  const {
    id,
    title = '',
    summary = '',
    details = '',
    orderIndex = 1,
    colorTag = '#8c6d53',
    importanceLevel = 'medium',
    characters = [],
    versionsCount = 1,
    isCompact = false, // multiscale flag
    onEdit,
    onDelete,
    onOpenVersions,
    onCreateBackup,
  } = data;

  const [expanded, setExpanded] = useState(false);
  // cardMode: null = auto (from zoom/switch), 'compact' = forced summary, 'expanded' = forced detailed
  const [cardMode, setCardMode] = useState(null);
  const [anchorEl, setAnchorEl] = useState(null);
  const isMenuOpen = Boolean(anchorEl);

  // Show compact if forced compact, OR (auto and global isCompact is true, provided not forced expanded)
  const showCompact = cardMode === 'compact' ? true : cardMode === 'expanded' ? false : isCompact;

  const displayTitle = title.length > APP_CONFIG.EVENT_TITLE_MAX_LENGTH
    ? `${title.substring(0, APP_CONFIG.EVENT_TITLE_MAX_LENGTH)}...`
    : title;

  // COMPACT MULTISCALE VIEW (modo chico / resumen)
  if (showCompact) {
    return (
      <Box
        sx={{
          bgcolor: 'background.paper',
          border: '2px solid',
          borderColor: selected ? 'primary.main' : colorTag || 'divider',
          borderRadius: 2.5,
          p: 1.2,
          px: 1.5,
          width: 300,
          display: 'flex',
          flexDirection: 'column',
          gap: 0.8,
          boxShadow: selected ? '0 0 0 2px rgba(140, 109, 83, 0.3)' : '0 2px 8px rgba(0,0,0,0.06)',
          transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
          userSelect: 'none',
          position: 'relative',
        }}
      >
        {/* Prominent connection handles for easy cable linking & detachment */}
        <Handle
          type="target"
          position={Position.Left}
          style={{
            background: colorTag || '#8c6d53',
            width: 14,
            height: 14,
            border: '2px solid #ffffff',
            boxShadow: '0 0 6px rgba(0,0,0,0.3)',
            cursor: 'crosshair',
          }}
        />
        <Handle
          type="source"
          position={Position.Right}
          style={{
            background: colorTag || '#8c6d53',
            width: 14,
            height: 14,
            border: '2px solid #ffffff',
            boxShadow: '0 0 6px rgba(0,0,0,0.3)',
            cursor: 'crosshair',
          }}
        />

        {/* Top Row: Order Badge + Title + Card Expand Button (Always visible in summary mode) */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, width: '100%' }}>
          <Box
            sx={{
              width: 22,
              height: 22,
              borderRadius: '50%',
              bgcolor: colorTag || 'primary.main',
              color: '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '0.68rem',
              fontWeight: 700,
              flexShrink: 0,
            }}
          >
            {Math.round(orderIndex)}
          </Box>

          <Typography
            variant="caption"
            noWrap
            title={title}
            sx={{
              fontWeight: 700,
              color: 'text.primary',
              fontSize: '0.9rem',
              flexGrow: 1,
              minWidth: 0,
            }}
          >
            {displayTitle}
          </Typography>

          {/* Top-Right Slot: ALWAYS VISIBLE Expand Card Button */}
          <Tooltip title="Expandir esta carta (modo completo)">
            <IconButton
              size="small"
              onClick={(e) => {
                e.stopPropagation();
                setCardMode('expanded');
              }}
              sx={{
                p: 0.4,
                bgcolor: 'background.subtle',
                color: 'secondary.main',
                '&:hover': { bgcolor: 'divider' },
                flexShrink: 0,
                transition: 'all 0.4s ease',
              }}
            >
              <ExpandMoreIcon sx={{ fontSize: 18 }} />
            </IconButton>
          </Tooltip>
        </Box>

        {/* Avatars directly below title in summary mode */}
        {characters.length > 0 && (
          <Box sx={{ display: 'flex', alignItems: 'center', pt: 0.2 }}>
            <AvatarGroup
              max={12}
              sx={{
                '& .MuiAvatar-root': {
                  width: 22,
                  height: 22,
                  fontSize: '0.6rem',
                  border: '1.5px solid',
                  borderColor: 'background.paper',
                },
              }}
            >
              {characters.map((char) => (
                <Tooltip key={char.id} title={`${char.name} (${char.role_archetype || 'Rol no definido'})`}>
                  <Avatar
                    src={char.avatar_url}
                    alt={char.name}
                    sx={{
                      bgcolor: char.color_tag || 'primary.main',
                      color: '#ffffff',
                    }}
                  >
                    {char.name?.charAt(0)}
                  </Avatar>
                </Tooltip>
              ))}
            </AvatarGroup>
          </Box>
        )}
      </Box>
    );
  }

  // FULL EXTENDED VIEW (Modo Completo)
  return (
    <Box
      sx={{
        bgcolor: 'background.paper',
        border: '1.5px solid',
        borderColor: selected ? 'primary.main' : 'divider',
        borderTop: '4px solid',
        borderTopColor: colorTag || 'primary.main',
        borderRadius: 2.5,
        width: 300,
        boxShadow: selected ? '0 4px 16px rgba(0,0,0,0.12)' : 'none',
        transition: 'all 0.2s ease',
        userSelect: 'none',
        overflow: 'hidden',
        position: 'relative',
      }}
    >
      {/* Prominent connection handles for easy cable linking & detachment */}
      <Handle
        type="target"
        position={Position.Left}
        style={{
          background: colorTag || '#8c6d53',
          width: 14,
          height: 14,
          border: '2px solid #ffffff',
          boxShadow: '0 0 6px rgba(0,0,0,0.3)',
          cursor: 'crosshair',
        }}
      />
      <Handle
        type="source"
        position={Position.Right}
        style={{
          background: colorTag || '#8c6d53',
          width: 14,
          height: 14,
          border: '2px solid #ffffff',
          boxShadow: '0 0 6px rgba(0,0,0,0.3)',
          cursor: 'crosshair',
        }}
      />

      {/* Node Header: order chip + title + Top-Right Card Collapse Button */}
      <Box sx={{ p: 1.5, pb: 1, display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 0, flexGrow: 1 }}>
          <Chip
            size="small"
            label={`#${orderIndex}`}
            sx={{
              height: 20,
              fontSize: '0.65rem',
              fontWeight: 700,
              bgcolor: 'background.subtle',
              color: 'text.primary',
              flexShrink: 0,
            }}
          />
          <Typography
            variant="subtitle2"
            noWrap
            title={title}
            sx={{
              fontWeight: 700,
              fontSize: '0.9rem',
              color: 'text.primary',
            }}
          >
            {displayTitle}
          </Typography>
        </Box>

        {/* Top-Right Slot: ALWAYS VISIBLE Card Collapse Button */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.2, flexShrink: 0 }}>
          <Tooltip title="Colapsar esta carta (modo resumen)">
            <IconButton
              size="small"
              onClick={(e) => {
                e.stopPropagation();
                setCardMode('compact');
              }}
              sx={{ p: 0.5, color: 'text.secondary', '&:hover': { color: 'secondary.main' }, transition: 'all 0.4s ease' }}
            >
              <ExpandLessIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {/* Linked Characters below title */}
      {characters.length > 0 && (
        <Box sx={{ px: 1.5, pb: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <AvatarGroup
            max={12}
            sx={{
              '& .MuiAvatar-root': {
                width: 24,
                height: 24,
                fontSize: '0.65rem',
                border: '1.5px solid',
                borderColor: 'background.paper',
              },
            }}
          >
            {characters.map((char) => (
              <Tooltip key={char.id} title={`${char.name} (${char.role_archetype || 'Rol no definido'})`}>
                <Avatar
                  src={char.avatar_url}
                  alt={char.name}
                  sx={{
                    bgcolor: char.color_tag || 'primary.main',
                    color: '#ffffff',
                  }}
                >
                  {char.name?.charAt(0)}
                </Avatar>
              </Tooltip>
            ))}
          </AvatarGroup>

          {(importanceLevel === 'high' || importanceLevel === 'legendary') && (
            <Chip
              icon={<FlareIcon fontSize="inherit" />}
              label={importanceLevel === 'legendary' ? 'Hito' : 'Clímax'}
              size="small"
              color={importanceLevel === 'legendary' ? 'secondary' : 'primary'}
              sx={{ height: 18, fontSize: '0.65rem' }}
            />
          )}
        </Box>
      )}

      {/* Summary preview */}
      {summary && (
        <Box sx={{ px: 1.5, pb: 1 }}>
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{
              fontSize: '0.8rem',
              lineHeight: 1.35,
              display: '-webkit-box',
              WebkitLineClamp: expanded ? 10 : 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
            }}
          >
            {summary}
          </Typography>
        </Box>
      )}

      {/* Expandable Extended Details */}
      <Collapse in={expanded} timeout="auto" unmountOnExit>
        <Box sx={{ px: 1.5, py: 1, bgcolor: 'background.subtle', borderTop: 1, borderColor: 'divider' }}>
          {details ? (
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', whiteSpace: 'pre-wrap' }}>
              {details}
            </Typography>
          ) : (
            <Typography variant="caption" color="text.disabled" sx={{ fontStyle: 'italic' }}>
              Sin detalles adicionales registrados.
            </Typography>
          )}
        </Box>
      </Collapse>

      {/* Footer Node Actions */}
      <Box
        sx={{
          p: 0.8,
          px: 1.5,
          borderTop: 1,
          borderColor: 'divider',
          bgcolor: 'background.subtle',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          {/* Details Toggle Button */}
          <Tooltip title={expanded ? 'Ocultar detalles extendidos' : 'Desplegar detalles extendidos'}>
            <IconButton
              size="small"
              onClick={(e) => {
                e.stopPropagation();
                setExpanded(!expanded);
              }}
              sx={{ p: 0.5, color: expanded ? 'primary.main' : 'text.secondary', transition: 'all 0.4s ease' }}
            >
              {expanded ? <ViewAgendaOutlinedIcon fontSize="small" /> : <ViewHeadlineIcon fontSize="small" />}
            </IconButton>
          </Tooltip>

          {/* Edit */}
          <Tooltip title="Editar evento">
            <IconButton
              size="small"
              onClick={(e) => {
                e.stopPropagation();
                onEdit && onEdit(data);
              }}
              sx={{ p: 0.5, color: 'text.secondary' }}
            >
              <EditOutlinedIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>

        {/* More Menu */}
        <IconButton
          size="small"
          onClick={(e) => {
            e.stopPropagation();
            setAnchorEl(e.currentTarget);
          }}
          sx={{ p: 0.5, color: 'text.secondary' }}
        >
          <MoreVertIcon fontSize="small" />
        </IconButton>
        <Menu
          anchorEl={anchorEl}
          open={isMenuOpen}
          onClose={(e) => {
            e?.stopPropagation();
            setAnchorEl(null);
          }}
        >
          <MenuItem
            onClick={(e) => {
              e.stopPropagation();
              setAnchorEl(null);
              onOpenVersions && onOpenVersions(id);
            }}
          >
            <ListItemIcon>
              <Badge badgeContent={versionsCount > 1 ? versionsCount : 0} color="primary" variant="dot">
                <HistoryIcon fontSize="small" />
              </Badge>
            </ListItemIcon>
            <ListItemText primary="Historial" />
          </MenuItem>
          <MenuItem
            onClick={(e) => {
              e.stopPropagation();
              setAnchorEl(null);
              onCreateBackup && onCreateBackup(id);
            }}
          >
            <ListItemIcon>
              <BookmarkBorderIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText primary="Respaldar" />
          </MenuItem>
          <Divider />
          <MenuItem
            onClick={(e) => {
              e.stopPropagation();
              setAnchorEl(null);
              onDelete && onDelete(id);
            }}
            sx={{ color: 'error.main' }}
          >
            <ListItemIcon>
              <DeleteOutlineIcon fontSize="small" color="error" />
            </ListItemIcon>
            <ListItemText primary="Eliminar" />
          </MenuItem>
        </Menu>
      </Box>
    </Box>
  );
}

export default memo(EventNodeComponent);
