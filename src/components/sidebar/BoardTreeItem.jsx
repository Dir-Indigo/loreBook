import React, { useState, useRef, useEffect } from 'react';
import {
  Box,
  Typography,
  IconButton,
  Tooltip,
  Collapse,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Divider,
  TextField,
} from '@mui/material';
import FolderOpenIcon from '@mui/icons-material/FolderOpen';
import FolderIcon from '@mui/icons-material/Folder';
import AddIcon from '@mui/icons-material/Add';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import PaletteOutlinedIcon from '@mui/icons-material/PaletteOutlined';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import AccountTreeOutlinedIcon from '@mui/icons-material/AccountTreeOutlined';
import FlareIcon from '@mui/icons-material/Flare';
import PostAddOutlinedIcon from '@mui/icons-material/PostAddOutlined';

const BOARD_COLORS = [
  '#8c6d53', '#6d7a8c', '#5a8c6d', '#8c5a6d',
  '#7a6d8c', '#8c7a5a', '#5a6d8c', '#6d8c5a',
  '#8c6d6d', '#6d8c8c', '#8c8c5a', '#7a5a8c',
];

export function InlineFolderInput({ level = 0, onCommit, onCancel }) {
  const [name, setName] = useState('');
  const inputRef = useRef(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      const trimmed = name.trim();
      if (trimmed) onCommit(trimmed);
      else onCancel();
    } else if (e.key === 'Escape') {
      onCancel();
    }
  };

  const handleBlur = () => {
    const trimmed = name.trim();
    if (trimmed) onCommit(trimmed);
    else onCancel();
  };

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 0.8,
        pl: `${8 + level * 16}px`,
        pr: 1,
        py: 0.45,
        borderRadius: 1.5,
        bgcolor: 'action.hover',
        border: '1px solid',
        borderColor: 'primary.main',
        my: 0.3,
      }}
    >
      <FolderIcon sx={{ fontSize: 16, color: 'primary.main', flexShrink: 0 }} />
      <TextField
        inputRef={inputRef}
        value={name}
        placeholder="Nombre de la carpeta..."
        onChange={(e) => setName(e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={handleBlur}
        size="small"
        variant="standard"
        InputProps={{
          disableUnderline: true,
          style: { fontSize: '0.8rem', fontWeight: 600, padding: 0 },
        }}
        sx={{ flexGrow: 1 }}
      />
    </Box>
  );
}

export default function BoardTreeItem({
  board,
  boards = [],
  events = [],
  level = 0,
  activeBoardId,
  isDefaultBoard = false,
  creatingInParentId = null,
  onStartCreateBoard,
  onCommitCreateBoard,
  onCancelCreateBoard,
  onSelect,
  onRename,
  onDelete,
  onChangeColor,
  onOpenCreateEventForBoard,
  onOpenEditEvent,
  onDeleteEvent,
}) {
  const [open, setOpen] = useState(true);
  const [menuAnchor, setMenuAnchor] = useState(null);
  const [editingName, setEditingName] = useState(false);
  const [draftName, setDraftName] = useState(board.name);
  const inputRef = useRef(null);

  const children = boards.filter((b) => b.parent_board_id === board.id);
  // Get events belonging to this board (or orphaned events if this is the default board)
  const boardEvents = events.filter(
    (ev) => ev.board_id === board.id || (isDefaultBoard && !ev.board_id)
  );

  const hasChildren = children.length > 0;
  const hasEvents = boardEvents.length > 0;
  const hasExpandableContent = hasChildren || hasEvents;
  const isActive = activeBoardId === board.id;
  const isCreatingChildHere = creatingInParentId === board.id;

  // Auto-expand if user starts creating child here
  useEffect(() => {
    if (isCreatingChildHere) {
      setOpen(true);
    }
  }, [isCreatingChildHere]);

  useEffect(() => {
    if (editingName && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editingName]);

  const handleCommitRename = () => {
    const trimmed = draftName.trim();
    if (trimmed && trimmed !== board.name) {
      onRename && onRename(board.id, trimmed);
    } else {
      setDraftName(board.name);
    }
    setEditingName(false);
  };

  const INDENT = 16;

  return (
    <Box>
      {/* Board / Folder Row */}
      <Box
        onClick={(e) => {
          e.stopPropagation();
          // Toggle expansion on click, but also select if not already active
          if (hasExpandableContent) {
            setOpen((v) => !v);
          }
          if (onSelect) onSelect(board);
        }}
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 0.5,
          pl: `${8 + level * INDENT}px`,
          pr: 0.5,
          py: 0.5,
          borderRadius: 1.5,
          cursor: 'pointer',
          bgcolor: isActive ? 'action.selected' : 'transparent',
          borderLeft: isActive
            ? `3px solid ${board.color || '#8c6d53'}`
            : '3px solid transparent',
          transition: 'all 0.15s ease',
          '&:hover': {
            bgcolor: isActive ? 'action.selected' : 'action.hover',
            '& .board-actions': { opacity: 1 },
          },
        }}
      >
        {/* Expand / Collapse arrow */}
        {hasExpandableContent ? (
          <IconButton
            size="small"
            onClick={(e) => {
              e.stopPropagation();
              setOpen((v) => !v);
            }}
            sx={{ p: 0.2, flexShrink: 0, color: 'text.secondary' }}
          >
            {open ? (
              <ExpandLessIcon sx={{ fontSize: 14 }} />
            ) : (
              <ExpandMoreIcon sx={{ fontSize: 14 }} />
            )}
          </IconButton>
        ) : (
          <Box sx={{ width: 22, flexShrink: 0 }} />
        )}

        {/* Folder Icon */}
        {open && hasExpandableContent ? (
          <FolderOpenIcon
            sx={{ fontSize: 16, color: board.color || 'primary.main', flexShrink: 0 }}
          />
        ) : (
          <FolderIcon
            sx={{ fontSize: 16, color: board.color || 'primary.main', flexShrink: 0 }}
          />
        )}

        {/* Folder Name (or Inline Renaming) */}
        {editingName ? (
          <TextField
            inputRef={inputRef}
            value={draftName}
            onChange={(e) => setDraftName(e.target.value)}
            onBlur={handleCommitRename}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleCommitRename();
              if (e.key === 'Escape') {
                setDraftName(board.name);
                setEditingName(false);
              }
              e.stopPropagation();
            }}
            onClick={(e) => e.stopPropagation()}
            size="small"
            variant="standard"
            sx={{ flexGrow: 1, ml: 0.5 }}
            inputProps={{ style: { fontSize: '0.8rem', fontWeight: 600, padding: '1px 0' } }}
          />
        ) : (
          <Typography
            noWrap
            sx={{
              flexGrow: 1,
              fontSize: '0.82rem',
              fontWeight: isActive ? 700 : 500,
              color: isActive ? 'text.primary' : 'text.secondary',
              lineHeight: 1.3,
              ml: 0.5,
            }}
          >
            {board.name}
          </Typography>
        )}

        {/* Event Count Badge */}
        {boardEvents.length > 0 && !editingName && (
          <Typography
            variant="caption"
            sx={{
              fontSize: '0.65rem',
              fontWeight: 700,
              color: 'text.disabled',
              bgcolor: 'background.subtle',
              border: '1px solid',
              borderColor: 'divider',
              borderRadius: 0.8,
              px: 0.6,
              flexShrink: 0,
            }}
          >
            {boardEvents.length}
          </Typography>
        )}

        {/* Hover Actions */}
        <Box
          className="board-actions"
          sx={{ display: 'flex', opacity: 0, transition: 'opacity 0.15s', flexShrink: 0 }}
        >
          <Tooltip title="Crear sub-carpeta (sub-tablero)">
            <IconButton
              size="small"
              onClick={(e) => {
                e.stopPropagation();
                onStartCreateBoard && onStartCreateBoard(board.id);
              }}
              sx={{ p: 0.3, color: 'text.secondary', '&:hover': { color: 'primary.main' } }}
            >
              <AddIcon sx={{ fontSize: 14 }} />
            </IconButton>
          </Tooltip>
          <IconButton
            size="small"
            onClick={(e) => {
              e.stopPropagation();
              setMenuAnchor(e.currentTarget);
            }}
            sx={{ p: 0.3, color: 'text.secondary' }}
          >
            <MoreVertIcon sx={{ fontSize: 14 }} />
          </IconButton>
        </Box>
      </Box>

      {/* Context Menu */}
      <Menu
        anchorEl={menuAnchor}
        open={Boolean(menuAnchor)}
        onClose={() => setMenuAnchor(null)}
        PaperProps={{ sx: { borderRadius: 2, minWidth: 190 } }}
      >
        <MenuItem
          onClick={() => {
            setMenuAnchor(null);
            setEditingName(true);
          }}
          dense
        >
          <ListItemIcon>
            <EditOutlinedIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText primary="Renombrar" />
        </MenuItem>

        <MenuItem
          onClick={() => {
            setMenuAnchor(null);
            onOpenCreateEventForBoard && onOpenCreateEventForBoard(board.id);
          }}
          dense
        >
          <ListItemIcon>
            <PostAddOutlinedIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText primary="Crear evento aquí" />
        </MenuItem>

        <MenuItem
          onClick={() => {
            setMenuAnchor(null);
            onStartCreateBoard && onStartCreateBoard(board.id);
          }}
          dense
        >
          <ListItemIcon>
            <AccountTreeOutlinedIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText primary="Crear sub-carpeta" />
        </MenuItem>

        <MenuItem dense disableRipple sx={{ flexDirection: 'column', alignItems: 'flex-start', py: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.8 }}>
            <PaletteOutlinedIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
            <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary' }}>
              Color de la carpeta
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.6 }}>
            {BOARD_COLORS.map((c) => (
              <Box
                key={c}
                onClick={(e) => {
                  e.stopPropagation();
                  onChangeColor && onChangeColor(board.id, c);
                  setMenuAnchor(null);
                }}
                sx={{
                  width: 18,
                  height: 18,
                  borderRadius: '50%',
                  bgcolor: c,
                  cursor: 'pointer',
                  border: board.color === c ? '2px solid white' : '2px solid transparent',
                  boxShadow: board.color === c ? `0 0 0 2px ${c}` : 'none',
                  '&:hover': { transform: 'scale(1.25)' },
                  transition: 'transform 0.12s',
                }}
              />
            ))}
          </Box>
        </MenuItem>

        <Divider />

        <MenuItem
          onClick={() => {
            setMenuAnchor(null);
            onDelete && onDelete(board);
          }}
          dense
          sx={{ color: 'error.main' }}
        >
          <ListItemIcon>
            <DeleteOutlineIcon fontSize="small" color="error" />
          </ListItemIcon>
          <ListItemText primary="Eliminar carpeta" />
        </MenuItem>
      </Menu>

      {/* Expanded Content: Sub-boards + Events */}
      <Collapse in={open} timeout="auto">
        {/* Inline Folder Creator for Sub-board */}
        {isCreatingChildHere && (
          <InlineFolderInput
            level={level + 1}
            onCommit={(name) => onCommitCreateBoard(name, board.id)}
            onCancel={onCancelCreateBoard}
          />
        )}

        {/* Sub-boards (Folders) */}
        {children.map((child) => (
          <BoardTreeItem
            key={child.id}
            board={child}
            boards={boards}
            events={events}
            level={level + 1}
            activeBoardId={activeBoardId}
            creatingInParentId={creatingInParentId}
            onStartCreateBoard={onStartCreateBoard}
            onCommitCreateBoard={onCommitCreateBoard}
            onCancelCreateBoard={onCancelCreateBoard}
            onSelect={onSelect}
            onRename={onRename}
            onDelete={onDelete}
            onChangeColor={onChangeColor}
            onOpenCreateEventForBoard={onOpenCreateEventForBoard}
            onOpenEditEvent={onOpenEditEvent}
            onDeleteEvent={onDeleteEvent}
          />
        ))}

        {/* Events (Files inside this folder) */}
        {boardEvents.map((ev) => (
          <Box
            key={ev.id}
            onClick={() => {
              if (activeBoardId !== board.id) {
                onSelect && onSelect(board);
              }
              onOpenEditEvent && onOpenEditEvent(ev);
            }}
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 0.8,
              pl: `${12 + (level + 1) * INDENT}px`,
              pr: 0.5,
              py: 0.45,
              borderRadius: 1.5,
              cursor: 'pointer',
              transition: 'all 0.12s ease',
              '&:hover': {
                bgcolor: 'action.hover',
                '& .ev-actions': { opacity: 1 },
              },
            }}
          >
            {/* Event Dot */}
            <Box
              sx={{
                width: 7,
                height: 7,
                borderRadius: '50%',
                bgcolor: ev.color_tag || board.color || 'primary.main',
                flexShrink: 0,
              }}
            />

            {/* Event Order */}
            <Typography
              variant="caption"
              sx={{
                fontSize: '0.68rem',
                fontWeight: 700,
                color: 'text.disabled',
                flexShrink: 0,
              }}
            >
              #{ev.order_index}
            </Typography>

            {/* Event Title */}
            <Typography
              noWrap
              sx={{
                flexGrow: 1,
                fontSize: '0.78rem',
                fontWeight: 500,
                color: 'text.secondary',
                lineHeight: 1.25,
              }}
            >
              {ev.title}
            </Typography>

            {/* Legendary / Major Event Icon */}
            {ev.importance_level === 'legendary' && (
              <FlareIcon sx={{ fontSize: 13, color: 'secondary.main', flexShrink: 0 }} />
            )}

            {/* Event Character color dots preview */}
            {ev.event_characters && ev.event_characters.length > 0 && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.3, flexShrink: 0 }}>
                {ev.event_characters.slice(0, 3).map((ec) => (
                  <Box
                    key={ec.id}
                    sx={{
                      width: 5,
                      height: 5,
                      borderRadius: '50%',
                      bgcolor: ec.character?.color_tag || 'text.disabled',
                    }}
                  />
                ))}
              </Box>
            )}

            {/* Hover Actions for Event */}
            <Box
              className="ev-actions"
              sx={{ display: 'flex', opacity: 0, transition: 'opacity 0.15s', flexShrink: 0 }}
            >
              <Tooltip title="Editar evento">
                <IconButton
                  size="small"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (activeBoardId !== board.id) {
                      onSelect && onSelect(board);
                    }
                    onOpenEditEvent && onOpenEditEvent(ev);
                  }}
                  sx={{ p: 0.2, color: 'text.secondary', '&:hover': { color: 'primary.main' } }}
                >
                  <EditOutlinedIcon sx={{ fontSize: 13 }} />
                </IconButton>
              </Tooltip>
              <Tooltip title="Eliminar evento">
                <IconButton
                  size="small"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteEvent && onDeleteEvent(ev.id);
                  }}
                  sx={{ p: 0.2, color: 'text.secondary', '&:hover': { color: 'error.main' } }}
                >
                  <DeleteOutlineIcon sx={{ fontSize: 13 }} />
                </IconButton>
              </Tooltip>
            </Box>
          </Box>
        ))}
      </Collapse>
    </Box>
  );
}
