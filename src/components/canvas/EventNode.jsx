import React, { useState, useEffect, memo } from 'react';
import { Handle, Position, useNodeConnections } from '@xyflow/react';
import { alpha } from '@mui/material/styles';
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
  InputBase,
  Popover,
  TextField,
  InputAdornment,
  Checkbox,
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
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import AddIcon from '@mui/icons-material/Add';
import SearchIcon from '@mui/icons-material/Search';
import PeopleOutlineIcon from '@mui/icons-material/PeopleOutline';
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
    allCharacters = [],
    versionsCount = 1,
    isCompact = false, // multiscale flag
    onEdit,
    onDelete,
    onOpenVersions,
    onCreateBackup,
    onDuplicate,
    onInlineUpdate,
    onUpdateCharacters,
    onQuickCreateConnected,
  } = data;

  const [expanded, setExpanded] = useState(false);
  // cardMode: null = auto (from zoom/switch), 'compact' = forced summary, 'expanded' = forced detailed
  const [cardMode, setCardMode] = useState(null);
  const [anchorEl, setAnchorEl] = useState(null);
  // summaryListMode: null = plain text, 'bullets' = • points, 'dashes' = - list
  const [summaryListMode, setSummaryListMode] = useState(null);
  const isMenuOpen = Boolean(anchorEl);

  // Inline title & summary local state
  const [localTitle, setLocalTitle] = useState(title);
  const [localSummary, setLocalSummary] = useState(summary);
  const [isCharDragOver, setIsCharDragOver] = useState(false);

  // Character Picker Popover state
  const [charPickerAnchorEl, setCharPickerAnchorEl] = useState(null);
  const isCharPickerOpen = Boolean(charPickerAnchorEl);
  const [charSearch, setCharSearch] = useState('');

  // Keep local state in sync when external event data updates
  useEffect(() => {
    setLocalTitle(title);
  }, [title]);

  useEffect(() => {
    setLocalSummary(summary);
  }, [summary]);

  // Show compact if forced compact, OR (auto and global isCompact is true, provided not forced expanded)
  const showCompact = cardMode === 'compact' ? true : cardMode === 'expanded' ? false : isCompact;
  const isVisuallySelected = selected;

  // Detect existing connections per side (to show + button only when unconnected)
  const targetConnections = useNodeConnections({ type: 'target' });
  const sourceConnections = useNodeConnections({ type: 'source' });
  const hasTargetConnection = targetConnections.length > 0;
  const hasSourceConnection = sourceConnections.length > 0;

  // Filter characters for inline picker
  const filteredAllCharacters = (allCharacters || []).filter((c) => {
    if (!charSearch.trim()) return true;
    const q = charSearch.toLowerCase();
    return c.name?.toLowerCase().includes(q) || c.role_archetype?.toLowerCase().includes(q);
  });

  const handleToggleCharacter = (charId) => {
    const currentIds = (characters || []).map((c) => c.id);
    const newIds = currentIds.includes(charId)
      ? currentIds.filter((id) => id !== charId)
      : [...currentIds, charId];

    if (onUpdateCharacters) {
      onUpdateCharacters(id, newIds);
    }
  };

  const handleDragOverCard = (e) => {
    if (e.dataTransfer.types.includes('application/lorebook-character-id') || e.dataTransfer.types.includes('text/plain')) {
      e.preventDefault();
      e.stopPropagation();
      e.dataTransfer.dropEffect = 'copy';
      if (!isCharDragOver) setIsCharDragOver(true);
    }
  };

  const handleDragLeaveCard = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsCharDragOver(false);
  };

  const handleDropCard = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsCharDragOver(false);
    const charId = e.dataTransfer.getData('application/lorebook-character-id') || e.dataTransfer.getData('text/plain');
    if (charId) {
      const currentIds = (characters || []).map((c) => c.id);
      if (!currentIds.includes(charId)) {
        onUpdateCharacters && onUpdateCharacters(id, [...currentIds, charId]);
      }
    }
  };

  const handleCommitTitle = () => {
    const trimmed = localTitle.trim();
    if (trimmed && trimmed !== title) {
      onInlineUpdate && onInlineUpdate(id, { title: trimmed });
    } else if (!trimmed) {
      setLocalTitle(title);
    }
  };

  const handleCommitSummary = () => {
    const trimmed = localSummary.trim();
    if (trimmed !== summary) {
      onInlineUpdate && onInlineUpdate(id, { summary: trimmed });
    }
  };

  // ─── COMPACT MULTISCALE VIEW (modo resumen) ───
  if (showCompact) {
    return (
      <Box
        onDragOver={handleDragOverCard}
        onDragLeave={handleDragLeaveCard}
        onDrop={handleDropCard}
        sx={{
          bgcolor: 'background.paper',
          border: isCharDragOver ? '3px dashed #16a34a' : '3px solid',
          borderColor: isCharDragOver ? '#16a34a' : isVisuallySelected ? 'primary.main' : colorTag || 'divider',
          boxSizing: 'border-box',
          borderRadius: 2.5,
          p: 1.2,
          px: 1.5,
          width: 310,
          display: 'flex',
          flexDirection: 'column',
          gap: 0.8,
          boxShadow: isCharDragOver
            ? '0 0 16px 4px rgba(22, 163, 74, 0.45)'
            : isVisuallySelected
            ? '0 0 12px 3px rgba(140, 109, 83, 0.4)'
            : '0 2px 8px rgba(0,0,0,0.06)',
          animation: isVisuallySelected ? 'selected-event-bounce 360ms ease-out' : 'none',
          transition: 'all 140ms ease',
          userSelect: 'none',
          position: 'relative',
        }}
      >
        {/* Connection handles — original design, fully draggable */}
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
            zIndex: 5,
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
            zIndex: 5,
          }}
        />

        {/* + quick-create: solo visible cuando el lado NO tiene conexión */}
        {!hasTargetConnection && (
          <Tooltip title="Crear evento conectado aquí" placement="left">
            <Box
              className="nodrag nopan"
              onClick={(e) => { e.stopPropagation(); onQuickCreateConnected && onQuickCreateConnected('left'); }}
              sx={{
                position: 'absolute', left: -32, top: '50%', transform: 'translateY(-50%)',
                width: 16, height: 16, borderRadius: '50%',
                bgcolor: (theme) => alpha(colorTag || theme.palette.primary.main, 0.85),
                border: '1.5px solid #fff',
                boxShadow: '0 1px 4px rgba(0,0,0,0.2)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer', zIndex: 4,
                transition: 'transform 120ms ease, opacity 120ms ease',
                opacity: 0.7,
                '&:hover': { transform: 'translateY(-50%) scale(1.4)', opacity: 1 },
              }}
            >
              <AddIcon sx={{ fontSize: 10, color: '#fff', pointerEvents: 'none' }} />
            </Box>
          </Tooltip>
        )}
        {!hasSourceConnection && (
          <Tooltip title="Crear evento conectado aquí" placement="right">
            <Box
              className="nodrag nopan"
              onClick={(e) => { e.stopPropagation(); onQuickCreateConnected && onQuickCreateConnected('right'); }}
              sx={{
                position: 'absolute', right: -32, top: '50%', transform: 'translateY(-50%)',
                width: 16, height: 16, borderRadius: '50%',
                bgcolor: (theme) => alpha(colorTag || theme.palette.primary.main, 0.85),
                border: '1.5px solid #fff',
                boxShadow: '0 1px 4px rgba(0,0,0,0.2)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer', zIndex: 4,
                transition: 'transform 120ms ease, opacity 120ms ease',
                opacity: 0.7,
                '&:hover': { transform: 'translateY(-50%) scale(1.4)', opacity: 1 },
              }}
            >
              <AddIcon sx={{ fontSize: 10, color: '#fff', pointerEvents: 'none' }} />
            </Box>
          </Tooltip>
        )}

        {/* Top Row: Order Badge + Editable Title + Card Expand Button */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8, width: '100%' }}>
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

          <InputBase
            value={localTitle}
            onChange={(e) => setLocalTitle(e.target.value.substring(0, APP_CONFIG.EVENT_TITLE_MAX_LENGTH))}
            onFocus={(e) => e.stopPropagation()}
            onBlur={handleCommitTitle}
            onKeyDown={(e) => {
              e.stopPropagation();
              if (e.key === 'Enter') e.target.blur();
            }}
            placeholder="Título del evento..."
            className="nodrag nopan nowheel"
            sx={{
              flexGrow: 1,
              minWidth: 0,
              fontWeight: 700,
              fontSize: '0.88rem',
              color: 'text.primary',
              px: 0.5,
              py: 0.1,
              borderRadius: 1,
              transition: 'all 0.15s ease',
              '&:hover': { bgcolor: 'action.hover' },
              '&.Mui-focused': {
                bgcolor: 'action.selected',
                boxShadow: (theme) => `0 0 0 1px ${theme.palette.primary.main}`,
              },
              '& input': { p: 0, textOverflow: 'ellipsis' },
            }}
          />

          {/* Expand Card Button */}
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
                transition: 'color 120ms ease, background-color 120ms ease, transform 120ms ease',
              }}
            >
              <ExpandMoreIcon sx={{ fontSize: 18 }} />
            </IconButton>
          </Tooltip>
        </Box>

        {/* Avatars + inline Add button in summary mode */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, pt: 0.2 }}>
          {characters.length > 0 && (
            <AvatarGroup
              max={8}
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
          )}

          {/* Inline "+" Character Picker Button */}
          <Tooltip title="Gestionar personajes de este evento">
            <IconButton
              size="small"
              className="nodrag nopan nowheel"
              onClick={(e) => {
                e.stopPropagation();
                setCharPickerAnchorEl(e.currentTarget);
              }}
              sx={{
                width: 22,
                height: 22,
                p: 0,
                border: '1.5px dashed',
                borderColor: 'primary.main',
                color: 'primary.main',
                bgcolor: (theme) => alpha(theme.palette.primary.main, 0.08),
                '&:hover': {
                  bgcolor: 'primary.main',
                  color: '#ffffff',
                },
                transition: 'all 0.15s ease',
                flexShrink: 0,
              }}
            >
              <AddIcon sx={{ fontSize: 14 }} />
            </IconButton>
          </Tooltip>
        </Box>

        {/* Character Picker Popover (Reusable) */}
        {renderCharacterPickerPopover()}
      </Box>
    );
  }

  // Helper to render Character Picker Popover
  function renderCharacterPickerPopover() {
    return (
      <Popover
        open={isCharPickerOpen}
        anchorEl={charPickerAnchorEl}
        onClose={(e) => {
          e?.stopPropagation();
          setCharPickerAnchorEl(null);
          setCharSearch('');
        }}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
        transformOrigin={{ vertical: 'top', horizontal: 'left' }}
        className="nodrag nopan nowheel"
        onClick={(e) => e.stopPropagation()}
        PaperProps={{
          sx: {
            width: 280,
            maxHeight: 360,
            borderRadius: 2.5,
            p: 1.2,
            boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
            border: 1,
            borderColor: 'divider',
            display: 'flex',
            flexDirection: 'column',
            gap: 1,
          },
        }}
      >
        {/* Popover Header */}
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', pb: 0.8, borderBottom: 1, borderColor: 'divider' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8 }}>
            <PeopleOutlineIcon sx={{ fontSize: 18, color: 'primary.main' }} />
            <Typography variant="subtitle2" sx={{ fontWeight: 800, fontSize: '0.82rem' }}>
              Personajes en Evento
            </Typography>
          </Box>
          <Chip
            size="small"
            label={`${characters.length}/${allCharacters.length}`}
            sx={{ height: 18, fontSize: '0.65rem', fontWeight: 700 }}
          />
        </Box>

        {/* Search input */}
        {allCharacters.length > 4 && (
          <TextField
            size="small"
            placeholder="Filtrar personaje..."
            value={charSearch}
            onChange={(e) => setCharSearch(e.target.value)}
            className="nodrag nopan nowheel"
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                </InputAdornment>
              ),
              sx: { height: 30, fontSize: '0.78rem', borderRadius: 1.5 },
            }}
          />
        )}

        {/* Character List with toggle */}
        <Box sx={{ flexGrow: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 0.4, pr: 0.2, maxHeight: 220 }}>
          {filteredAllCharacters.length === 0 ? (
            <Typography variant="caption" color="text.secondary" sx={{ textAlign: 'center', py: 2 }}>
              {charSearch ? 'No coincide ningún personaje' : 'No hay personajes registrados en esta historia'}
            </Typography>
          ) : (
            filteredAllCharacters.map((char) => {
              const isAssigned = characters.some((c) => c.id === char.id);
              return (
                <Box
                  key={char.id}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleToggleCharacter(char.id);
                  }}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    px: 0.8,
                    py: 0.5,
                    borderRadius: 1.5,
                    cursor: 'pointer',
                    bgcolor: isAssigned ? (theme) => alpha(theme.palette.primary.main, 0.1) : 'transparent',
                    border: '1px solid',
                    borderColor: isAssigned ? 'primary.main' : 'transparent',
                    transition: 'all 0.12s ease',
                    '&:hover': {
                      bgcolor: isAssigned
                        ? (theme) => alpha(theme.palette.primary.main, 0.18)
                        : 'action.hover',
                    },
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 0, flexGrow: 1 }}>
                    <Avatar
                      src={char.avatar_url}
                      alt={char.name}
                      sx={{
                        width: 24,
                        height: 24,
                        fontSize: '0.65rem',
                        bgcolor: char.color_tag || 'primary.main',
                        color: '#fff',
                        fontWeight: 700,
                      }}
                    >
                      {char.name?.charAt(0)}
                    </Avatar>
                    <Box sx={{ minWidth: 0 }}>
                      <Typography variant="body2" sx={{ fontSize: '0.78rem', fontWeight: isAssigned ? 700 : 500 }} noWrap>
                        {char.name}
                      </Typography>
                      {char.role_archetype && (
                        <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.65rem', display: 'block' }} noWrap>
                          {char.role_archetype}
                        </Typography>
                      )}
                    </Box>
                  </Box>

                  <Checkbox
                    size="small"
                    checked={isAssigned}
                    sx={{ p: 0.2, color: 'text.disabled', '&.Mui-checked': { color: 'primary.main' } }}
                  />
                </Box>
              );
            })
          )}
        </Box>
      </Popover>
    );
  }

  // ─── FULL EXTENDED VIEW (Modo Completo con Edición Directa) ───
  return (
    <Box
      onDragOver={handleDragOverCard}
      onDragLeave={handleDragLeaveCard}
      onDrop={handleDropCard}
      sx={{
        bgcolor: 'background.paper',
        border: isCharDragOver ? '2.5px dashed #16a34a' : '2.5px solid',
        borderColor: isCharDragOver ? '#16a34a' : isVisuallySelected ? 'primary.main' : 'divider',
        boxSizing: 'border-box',
        borderTop: '4px solid',
        borderTopColor: isCharDragOver ? '#16a34a' : colorTag || 'primary.main',
        borderRadius: 2.5,
        width: 310,
        boxShadow: isCharDragOver
          ? '0 0 16px 4px rgba(22, 163, 74, 0.45)'
          : isVisuallySelected
          ? '0 8px 24px rgba(0,0,0,0.2)'
          : 'none',
        animation: isVisuallySelected ? 'selected-event-bounce 360ms ease-out' : 'none',
        transition: 'all 140ms ease',
        userSelect: 'none',
        overflow: 'visible',
        position: 'relative',
      }}
    >
      {/* Handles — original design, fully draggable — FULL VIEW */}
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
          zIndex: 5,
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
          zIndex: 5,
        }}
      />

      {/* + quick-create: solo visible cuando el lado NO tiene conexión */}
      {!hasTargetConnection && (
        <Tooltip title="Crear evento conectado a la izquierda" placement="left">
          <Box
            className="nodrag nopan"
            onClick={(e) => { e.stopPropagation(); onQuickCreateConnected && onQuickCreateConnected('left'); }}
            sx={{
              position: 'absolute', left: -32, top: '50%', transform: 'translateY(-50%)',
              width: 18, height: 18, borderRadius: '50%',
              bgcolor: (theme) => alpha(colorTag || theme.palette.primary.main, 0.85),
              border: '1.5px solid #fff',
              boxShadow: '0 1px 4px rgba(0,0,0,0.22)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', zIndex: 4,
              opacity: 0.7,
              transition: 'transform 120ms ease, opacity 120ms ease',
              '&:hover': { transform: 'translateY(-50%) scale(1.4)', opacity: 1 },
            }}
          >
            <AddIcon sx={{ fontSize: 11, color: '#fff', pointerEvents: 'none' }} />
          </Box>
        </Tooltip>
      )}
      {!hasSourceConnection && (
        <Tooltip title="Crear evento conectado a la derecha" placement="right">
          <Box
            className="nodrag nopan"
            onClick={(e) => { e.stopPropagation(); onQuickCreateConnected && onQuickCreateConnected('right'); }}
            sx={{
              position: 'absolute', right: -32, top: '50%', transform: 'translateY(-50%)',
              width: 18, height: 18, borderRadius: '50%',
              bgcolor: (theme) => alpha(colorTag || theme.palette.primary.main, 0.85),
              border: '1.5px solid #fff',
              boxShadow: '0 1px 4px rgba(0,0,0,0.22)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', zIndex: 4,
              opacity: 0.7,
              transition: 'transform 120ms ease, opacity 120ms ease',
              '&:hover': { transform: 'translateY(-50%) scale(1.4)', opacity: 1 },
            }}
          >
            <AddIcon sx={{ fontSize: 11, color: '#fff', pointerEvents: 'none' }} />
          </Box>
        </Tooltip>
      )}

      {/* Node Header: order chip + inline editable title + Collapse Button */}
      <Box sx={{ p: 1.5, pb: 0.8, display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 0.8 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8, minWidth: 0, flexGrow: 1 }}>
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

          {/* Inline Editable Title */}
          <InputBase
            value={localTitle}
            onChange={(e) => setLocalTitle(e.target.value.substring(0, APP_CONFIG.EVENT_TITLE_MAX_LENGTH))}
            onFocus={(e) => e.stopPropagation()}
            onBlur={handleCommitTitle}
            onKeyDown={(e) => {
              e.stopPropagation();
              if (e.key === 'Enter') e.target.blur();
            }}
            placeholder="Título del evento..."
            className="nodrag nopan nowheel"
            sx={{
              flexGrow: 1,
              minWidth: 0,
              fontWeight: 700,
              fontSize: '0.98rem',
              letterSpacing: '-0.02em',
              color: 'text.primary',
              px: 0.6,
              py: 0.1,
              borderRadius: 1.5,
              transition: 'all 0.15s ease',
              '&:hover': { bgcolor: 'action.hover' },
              '&.Mui-focused': {
                bgcolor: 'action.selected',
                boxShadow: (theme) => `0 0 0 1px ${theme.palette.primary.main}`,
              },
              '& input': { p: 0, textOverflow: 'ellipsis' },
            }}
          />
        </Box>

        {/* Card Collapse Button */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.2, flexShrink: 0 }}>
          <Tooltip title="Colapsar esta carta (modo resumen)">
            <IconButton
              size="small"
              onClick={(e) => {
                e.stopPropagation();
                setCardMode('compact');
              }}
              sx={{
                p: 0.5,
                color: 'text.secondary',
                '&:hover': { color: 'secondary.main' },
                transition: 'color 120ms ease, background-color 120ms ease, transform 120ms ease',
              }}
            >
              <ExpandLessIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {/* Linked Characters below title + Inline Add Button */}
      <Box sx={{ px: 1.5, pb: 0.8, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, flexWrap: 'wrap' }}>
          {characters.length > 0 && (
            <AvatarGroup
              max={10}
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
          )}

          {/* Inline "+" Button to open Character Selector */}
          <Tooltip title="Añadir o quitar personajes de este evento">
            <IconButton
              size="small"
              className="nodrag nopan nowheel"
              onClick={(e) => {
                e.stopPropagation();
                setCharPickerAnchorEl(e.currentTarget);
              }}
              sx={{
                width: 24,
                height: 24,
                p: 0,
                border: '1.5px dashed',
                borderColor: 'primary.main',
                color: 'primary.main',
                bgcolor: (theme) => alpha(theme.palette.primary.main, 0.08),
                '&:hover': {
                  bgcolor: 'primary.main',
                  color: '#ffffff',
                },
                transition: 'all 0.15s ease',
                flexShrink: 0,
              }}
            >
              <AddIcon sx={{ fontSize: 16 }} />
            </IconButton>
          </Tooltip>
        </Box>

        {(importanceLevel === 'high' || importanceLevel === 'legendary') && (
          <Chip
            icon={<FlareIcon fontSize="inherit" />}
            label={importanceLevel === 'legendary' ? 'Hito' : 'Clímax'}
            size="small"
            color={importanceLevel === 'legendary' ? 'secondary' : 'primary'}
            sx={{ height: 18, fontSize: '0.65rem', flexShrink: 0 }}
          />
        )}
      </Box>

      {/* Inline Editable Description / Summary — sección principal destacada */}
      <Box
        sx={{
          mx: 1.5,
          mb: 1,
          borderRadius: 2,
          border: '1.5px solid',
          borderColor: (theme) => alpha(colorTag || theme.palette.primary.main, 0.30),
          bgcolor: (theme) => alpha(colorTag || theme.palette.primary.main, 0.05),
          p: 1,
          transition: 'border-color 0.15s ease, background-color 0.15s ease',
          '&:focus-within': {
            borderColor: colorTag || 'primary.main',
            bgcolor: (theme) => alpha(colorTag || theme.palette.primary.main, 0.09),
            boxShadow: (theme) => `0 0 0 2px ${alpha(colorTag || theme.palette.primary.main, 0.15)}`,
          },
        }}
      >
        <InputBase
          multiline
          minRows={expanded ? 5 : 3}
          value={localSummary}
          onChange={(e) => {
            let val = e.target.value;
            // Si está en modo lista, al presionar Enter agrega el prefijo automáticamente
            setLocalSummary(val);
          }}
          onFocus={(e) => e.stopPropagation()}
          onBlur={handleCommitSummary}
          onKeyDown={(e) => {
            e.stopPropagation();
            // Auto-prefijo en nueva línea según modo
            if (e.key === 'Enter' && summaryListMode) {
              e.preventDefault();
              const prefix = summaryListMode === 'bullets' ? '• ' : '- ';
              const textarea = e.target;
              const pos = textarea.selectionStart;
              const before = localSummary.substring(0, pos);
              const after = localSummary.substring(pos);
              const updated = before + '\n' + prefix + after;
              setLocalSummary(updated);
              // Mueve el cursor después del prefijo
              setTimeout(() => {
                textarea.selectionStart = pos + 1 + prefix.length;
                textarea.selectionEnd = pos + 1 + prefix.length;
              }, 0);
            }
          }}
          placeholder={summaryListMode === 'bullets' ? '• Escribe el suceso del evento...' : summaryListMode === 'dashes' ? '- Escribe el suceso del evento...' : 'Describe el suceso de este evento...'}
          className="nodrag nopan nowheel"
          sx={{
            width: '100%',
            fontSize: '0.92rem',
            lineHeight: 1.6,
            fontWeight: 500,
            color: 'text.primary',
            px: 0.4,
            py: 0,
            '& textarea': {
              p: 0,
              cursor: 'text',
              resize: 'none',
            },
          }}
        />
      </Box>

      {/* Expandable Extended Details */}
      <Collapse in={expanded} timeout="auto" unmountOnExit>
        <Box sx={{ px: 1.5, py: 1, bgcolor: 'background.subtle', borderTop: 1, borderColor: 'divider' }}>
          {details ? (
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', whiteSpace: 'pre-wrap' }}>
              {details}
            </Typography>
          ) : (
            <Typography variant="caption" color="text.disabled" sx={{ fontStyle: 'italic' }}>
              Sin detalles adicionales registrados. Usa el botón de editar para agregar notas profundas.
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
              sx={{ p: 0.5, color: expanded ? 'primary.main' : 'text.secondary', transition: 'color 120ms ease, background-color 120ms ease, transform 120ms ease' }}
            >
              {expanded ? <ViewAgendaOutlinedIcon fontSize="small" /> : <ViewHeadlineIcon fontSize="small" />}
            </IconButton>
          </Tooltip>

          {/* List mode toggles for summary */}
          <Tooltip title={summaryListMode === 'bullets' ? 'Desactivar lista de puntitos' : 'Lista con puntitos (•)'}>
            <IconButton
              size="small"
              onClick={(e) => {
                e.stopPropagation();
                setSummaryListMode(summaryListMode === 'bullets' ? null : 'bullets');
              }}
              sx={{
                p: 0.5,
                color: summaryListMode === 'bullets' ? 'primary.main' : 'text.disabled',
                bgcolor: summaryListMode === 'bullets' ? (theme) => alpha(theme.palette.primary.main, 0.12) : 'transparent',
                
                fontSize: '0.75rem',
                fontWeight: 900,
                width: 24,
                height: 24,
                transition: 'all 120ms ease',
                '&:hover': { color: 'primary.main', bgcolor: (theme) => alpha(theme.palette.primary.main, 0.1) },
              }}
            >
              <Typography sx={{ fontSize: '0.82rem', lineHeight: 1, fontWeight: 900, userSelect: 'none' }}>•≡</Typography>
            </IconButton>
          </Tooltip>

          <Tooltip title={summaryListMode === 'dashes' ? 'Desactivar lista de guiones' : 'Lista con guiones (-)'}>
            <IconButton
              size="small"
              onClick={(e) => {
                e.stopPropagation();
                setSummaryListMode(summaryListMode === 'dashes' ? null : 'dashes');
              }}
              sx={{
                p: 0.5,
                color: summaryListMode === 'dashes' ? 'secondary.main' : 'text.disabled',
                bgcolor: summaryListMode === 'dashes' ? (theme) => alpha(theme.palette.secondary.main, 0.12) : 'transparent',
                borderRadius: 1,
                width: 24,
                height: 24,
                transition: 'all 120ms ease',
                '&:hover': { color: 'secondary.main', bgcolor: (theme) => alpha(theme.palette.secondary.main, 0.1) },
              }}
            >
              <Typography sx={{ fontSize: '0.82rem', lineHeight: 1, fontWeight: 900, userSelect: 'none' }}>-≡</Typography>
            </IconButton>
          </Tooltip>

          {/* Edit (Full Modal) */}
          <Tooltip title="Editar en modal completo">
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
              onDuplicate && onDuplicate(data);
            }}
          >
            <ListItemIcon>
              <ContentCopyIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText primary="Duplicar" />
          </MenuItem>
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

      {/* Character Picker Popover */}
      {renderCharacterPickerPopover()}
    </Box>
  );
}

const areCharactersEqual = (previous = [], next = []) => {
  if (previous.length !== next.length) return false;
  return previous.every((character, index) => {
    const nextCharacter = next[index];
    return character.id === nextCharacter?.id
      && character.name === nextCharacter?.name
      && character.avatar_url === nextCharacter?.avatar_url
      && character.color_tag === nextCharacter?.color_tag;
  });
};

const areEventNodesEqual = (previous, next) => {
  if (previous.selected !== next.selected) return false;

  const previousData = previous.data;
  const nextData = next.data;
  return previousData.id === nextData.id
    && previousData.title === nextData.title
    && previousData.summary === nextData.summary
    && previousData.details === nextData.details
    && previousData.orderIndex === nextData.orderIndex
    && previousData.colorTag === nextData.colorTag
    && previousData.importanceLevel === nextData.importanceLevel
    && previousData.versionsCount === nextData.versionsCount
    && previousData.isCompact === nextData.isCompact
    && (previousData.allCharacters?.length === nextData.allCharacters?.length)
    && areCharactersEqual(previousData.characters, nextData.characters);
};

export default memo(EventNodeComponent, areEventNodesEqual);
