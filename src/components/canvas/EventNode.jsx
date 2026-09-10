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
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import HistoryIcon from '@mui/icons-material/History';
import BookmarkBorderIcon from '@mui/icons-material/BookmarkBorder';
import FlareIcon from '@mui/icons-material/Flare';
import FiberManualRecordIcon from '@mui/icons-material/FiberManualRecord';
import PersonOutlineIcon from '@mui/icons-material/PersonOutline';
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
    isCompact = false, // multiscale flag (RNF-6)
    onEdit,
    onDelete,
    onOpenVersions,
    onCreateBackup,
  } = data;

  const [expanded, setExpanded] = useState(false);

  // Character limit truncation (RF-4.5)
  const displayTitle = title.length > APP_CONFIG.EVENT_TITLE_MAX_LENGTH
    ? `${title.substring(0, APP_CONFIG.EVENT_TITLE_MAX_LENGTH)}...`
    : title;

  // COMPACT MULTISCALE VIEW (Zoom Out mode - RNF-6)
  if (isCompact) {
    return (
      <Box
        sx={{
          bgcolor: 'background.paper',
          border: '2px solid',
          borderColor: selected ? 'primary.main' : colorTag || 'divider',
          borderRadius: 2,
          p: 1,
          px: 1.5,
          minWidth: 160,
          maxWidth: 220,
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          boxShadow: selected ? '0 0 0 2px rgba(140, 109, 83, 0.3)' : 'none',
          transition: 'all 0.15s ease',
          userSelect: 'none',
        }}
      >
        <Handle type="target" position={Position.Left} style={{ background: colorTag, width: 8, height: 8 }} />
        <Handle type="source" position={Position.Right} style={{ background: colorTag, width: 8, height: 8 }} />

        <Box
          sx={{
            width: 24,
            height: 24,
            borderRadius: '50%',
            bgcolor: colorTag,
            color: '#fff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '0.7rem',
            fontWeight: 700,
            flexShrink: 0,
          }}
        >
          {Math.round(orderIndex)}
        </Box>

        <Typography
          variant="caption"
          noWrap
          sx={{
            fontWeight: 700,
            color: 'text.primary',
            fontSize: '0.78rem',
            flexGrow: 1,
          }}
        >
          {displayTitle}
        </Typography>

        {characters.length > 0 && (
          <Tooltip title={`${characters.length} personajes en este evento`}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <PersonOutlineIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
            </Box>
          </Tooltip>
        )}
      </Box>
    );
  }

  // FULL EXTENDED VIEW (Zoom In mode)
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
      }}
    >
      <Handle type="target" position={Position.Left} style={{ background: colorTag, width: 9, height: 9 }} />
      <Handle type="source" position={Position.Right} style={{ background: colorTag, width: 9, height: 9 }} />

      {/* Node Header */}
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

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.2 }}>
          <Tooltip title={expanded ? 'Colapsar detalles' : 'Desplegar detalles (RF-4.4)'}>
            <IconButton
              size="small"
              onClick={() => setExpanded(!expanded)}
              sx={{ p: 0.5, color: 'text.secondary' }}
            >
              {expanded ? <ExpandLessIcon fontSize="small" /> : <ExpandMoreIcon fontSize="small" />}
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

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

      {/* Linked Characters (RF-4.2) */}
      {characters.length > 0 && (
        <Box sx={{ px: 1.5, pb: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <AvatarGroup
            max={4}
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
                <Avatar src={char.avatar_url} alt={char.name}>
                  {char.name?.charAt(0)}
                </Avatar>
              </Tooltip>
            ))}
          </AvatarGroup>

          {importanceLevel === 'high' || importanceLevel === 'legendary' ? (
            <Chip
              icon={<FlareIcon fontSize="inherit" />}
              label={importanceLevel === 'legendary' ? 'Hito' : 'Clímax'}
              size="small"
              color={importanceLevel === 'legendary' ? 'secondary' : 'primary'}
              sx={{ height: 18, fontSize: '0.65rem' }}
            />
          ) : null}
        </Box>
      )}

      {/* Expandable Extended Details (RF-4.4) */}
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

      {/* Footer Node Actions (RF-4.6, Edit, Delete) */}
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
          <Tooltip title={`Historial de versiones (${versionsCount}) - RF-4.6`}>
            <IconButton
              size="small"
              onClick={() => onOpenVersions && onOpenVersions(id)}
              sx={{ p: 0.5, color: 'text.secondary' }}
            >
              <Badge badgeContent={versionsCount > 1 ? versionsCount : 0} color="primary" variant="dot">
                <HistoryIcon fontSize="small" />
              </Badge>
            </IconButton>
          </Tooltip>

          <Tooltip title="Crear respaldo rápido de versión">
            <IconButton
              size="small"
              onClick={() => onCreateBackup && onCreateBackup(id)}
              sx={{ p: 0.5, color: 'text.secondary' }}
            >
              <BookmarkBorderIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <Tooltip title="Editar evento">
            <IconButton
              size="small"
              onClick={() => onEdit && onEdit(data)}
              sx={{ p: 0.5, color: 'text.secondary' }}
            >
              <EditOutlinedIcon fontSize="small" />
            </IconButton>
          </Tooltip>

          <Tooltip title="Eliminar evento">
            <IconButton
              size="small"
              onClick={() => onDelete && onDelete(id)}
              sx={{ p: 0.5, color: 'error.main' }}
            >
              <DeleteOutlineIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>
    </Box>
  );
}

export default memo(EventNodeComponent);
