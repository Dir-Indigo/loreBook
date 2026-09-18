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
  Avatar,
  Chip,
} from '@mui/material';
import FolderOpenIcon from '@mui/icons-material/FolderOpen';
import FolderIcon from '@mui/icons-material/Folder';
import FolderSpecialIcon from '@mui/icons-material/FolderSpecial';
import AddIcon from '@mui/icons-material/Add';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import PaletteOutlinedIcon from '@mui/icons-material/PaletteOutlined';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import LocalOfferOutlinedIcon from '@mui/icons-material/LocalOfferOutlined';
import DriveFileMoveOutlinedIcon from '@mui/icons-material/DriveFileMoveOutlined';
import AccountTreeOutlinedIcon from '@mui/icons-material/AccountTreeOutlined';
import PersonOutlineIcon from '@mui/icons-material/PersonOutline';
import PublicOutlinedIcon from '@mui/icons-material/PublicOutlined';

const FOLDER_COLORS = [
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

export default function CharacterFolderTreeItem({
  folder,
  folders = [],
  characters = [],
  level = 0,
  activeFolderId,
  creatingInParentId = null,
  onStartCreateFolder,
  onCommitCreateFolder,
  onCancelCreateFolder,
  onSelectFolder,
  onRenameFolder,
  onDeleteFolder,
  onChangeColorFolder,
  onTagAllInFolder,
  onSelectCharacter,
  onEditCharacter,
  onMoveCharacter,
  onMoveCharacterToFolder,
  onDeleteCharacter,
}) {
  const [open, setOpen] = useState(true);
  const [menuAnchor, setMenuAnchor] = useState(null);
  const [charMenuAnchor, setCharMenuAnchor] = useState(null);
  const [selectedCharForMenu, setSelectedCharForMenu] = useState(null);
  const [editingName, setEditingName] = useState(false);
  const [draftName, setDraftName] = useState(folder.name);
  const [isDragOverFolder, setIsDragOverFolder] = useState(false);
  const inputRef = useRef(null);

  const children = folders.filter((f) => f.parent_folder_id === folder.id);
  
  // Characters belonging to this folder (or if default/principal, also include characters with null folder_id)
  const isDefault = Boolean(folder.is_default || folder.name?.toLowerCase() === 'principal');
  const folderChars = characters.filter((c) => 
    c.folder_id === folder.id || (isDefault && !c.folder_id)
  );

  const hasChildren = children.length > 0;
  const hasCharacters = folderChars.length > 0;
  const hasExpandableContent = hasChildren || hasCharacters;
  const isActive = activeFolderId === folder.id;
  const isCreatingChildHere = creatingInParentId === folder.id;

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
    if (trimmed && trimmed !== folder.name) {
      onRenameFolder && onRenameFolder(folder.id, trimmed);
    } else {
      setDraftName(folder.name);
    }
    setEditingName(false);
  };

  const INDENT = 16;

  return (
    <Box>
      {/* Folder Row */}
      <Box
        onClick={(e) => {
          e.stopPropagation();
          const selectingAnotherFolder = activeFolderId !== folder.id;
          if (hasExpandableContent) {
            if (selectingAnotherFolder) {
              setOpen(true);
            } else {
              setOpen((v) => !v);
            }
          }
          if (onSelectFolder) onSelectFolder(folder.id);
        }}
        onDragOver={(e) => {
          if (e.dataTransfer.types.includes('application/lorebook-character-id') || e.dataTransfer.types.includes('text/plain')) {
            e.preventDefault();
            e.stopPropagation();
            e.dataTransfer.dropEffect = 'move';
            if (!isDragOverFolder) setIsDragOverFolder(true);
          }
        }}
        onDragLeave={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setIsDragOverFolder(false);
        }}
        onDrop={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setIsDragOverFolder(false);
          const charId = e.dataTransfer.getData('application/lorebook-character-id') || e.dataTransfer.getData('text/plain');
          if (charId && onMoveCharacterToFolder) {
            onMoveCharacterToFolder(charId, folder.id);
          }
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
          bgcolor: isDragOverFolder ? 'action.selected' : isActive ? 'action.selected' : 'transparent',
          borderLeft: isActive
            ? `3px solid ${folder.color || '#8c6d53'}`
            : '3px solid transparent',
          border: isDragOverFolder ? `2px dashed ${folder.color || 'primary.main'}` : undefined,
          boxShadow: isDragOverFolder ? '0 0 10px rgba(2, 132, 199, 0.25)' : 'none',
          transition: 'all 0.15s ease',
          '&:hover': {
            bgcolor: isActive ? 'action.selected' : 'action.hover',
            '& .folder-actions': { opacity: 1 },
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
        {isDefault ? (
          <FolderSpecialIcon
            sx={{ fontSize: 16, color: folder.color || 'primary.main', flexShrink: 0 }}
          />
        ) : open && hasExpandableContent ? (
          <FolderOpenIcon
            sx={{ fontSize: 16, color: folder.color || 'primary.main', flexShrink: 0 }}
          />
        ) : (
          <FolderIcon
            sx={{ fontSize: 16, color: folder.color || 'primary.main', flexShrink: 0 }}
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
                setDraftName(folder.name);
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
            {folder.name}
          </Typography>
        )}

        {/* Character Count Badge */}
        {!editingName && (
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
            {folderChars.length}
          </Typography>
        )}

        {/* Hover Actions */}
        <Box
          className="folder-actions"
          sx={{ display: 'flex', opacity: 0, transition: 'opacity 0.15s', flexShrink: 0 }}
        >
          <Tooltip title="Crear subcarpeta">
            <IconButton
              size="small"
              onClick={(e) => {
                e.stopPropagation();
                onStartCreateFolder && onStartCreateFolder(folder.id);
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

      {/* Context Menu for Folder */}
      <Menu
        anchorEl={menuAnchor}
        open={Boolean(menuAnchor)}
        onClose={() => setMenuAnchor(null)}
        PaperProps={{ sx: { borderRadius: 2, minWidth: 200 } }}
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
            onStartCreateFolder && onStartCreateFolder(folder.id);
          }}
          dense
        >
          <ListItemIcon>
            <AccountTreeOutlinedIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText primary="Crear subcarpeta" />
        </MenuItem>

        {folderChars.length > 0 && onTagAllInFolder && (
          <MenuItem
            onClick={() => {
              setMenuAnchor(null);
              onTagAllInFolder(folder, folderChars);
            }}
            dense
          >
            <ListItemIcon>
              <LocalOfferOutlinedIcon fontSize="small" color="primary" />
            </ListItemIcon>
            <ListItemText primary="Etiquetar personajes..." secondary={`${folderChars.length} en esta carpeta`} />
          </MenuItem>
        )}

        <MenuItem dense disableRipple sx={{ flexDirection: 'column', alignItems: 'flex-start', py: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.8 }}>
            <PaletteOutlinedIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
            <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary' }}>
              Color de la carpeta
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.6 }}>
            {FOLDER_COLORS.map((c) => (
              <Box
                key={c}
                onClick={(e) => {
                  e.stopPropagation();
                  onChangeColorFolder && onChangeColorFolder(folder.id, c);
                  setMenuAnchor(null);
                }}
                sx={{
                  width: 18,
                  height: 18,
                  borderRadius: '50%',
                  bgcolor: c,
                  cursor: 'pointer',
                  border: folder.color === c ? '2px solid white' : '2px solid transparent',
                  boxShadow: folder.color === c ? `0 0 0 2px ${c}` : 'none',
                  '&:hover': { transform: 'scale(1.25)' },
                  transition: 'transform 0.12s',
                }}
              />
            ))}
          </Box>
        </MenuItem>

        {!isDefault && (
          <>
            <Divider />
            <MenuItem
              onClick={() => {
                setMenuAnchor(null);
                onDeleteFolder && onDeleteFolder(folder);
              }}
              dense
              sx={{ color: 'error.main' }}
            >
              <ListItemIcon>
                <DeleteOutlineIcon fontSize="small" color="error" />
              </ListItemIcon>
              <ListItemText primary="Eliminar carpeta" secondary="Los personajes pasarán a Principal" />
            </MenuItem>
          </>
        )}
      </Menu>

      {/* Expanded Content: Sub-folders + Characters inside this folder */}
      <Collapse in={open} timeout="auto" sx={{ borderLeft: level > 0 ? '1px solid' : 0, borderColor: 'divider', ml: level > 0 ? 1.5 : 0 }}>
        {/* Inline Folder Creator for Sub-folder */}
        {isCreatingChildHere && (
          <InlineFolderInput
            level={level + 1}
            onCommit={(name) => onCommitCreateFolder(name, folder.id)}
            onCancel={onCancelCreateFolder}
          />
        )}

        {/* Sub-folders */}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.2 }}>
          {children.map((child) => (
            <CharacterFolderTreeItem
              key={child.id}
              folder={child}
              folders={folders}
              characters={characters}
              level={level + 1}
              activeFolderId={activeFolderId}
              creatingInParentId={creatingInParentId}
              onStartCreateFolder={onStartCreateFolder}
              onCommitCreateFolder={onCommitCreateFolder}
              onCancelCreateFolder={onCancelCreateFolder}
              onSelectFolder={onSelectFolder}
              onRenameFolder={onRenameFolder}
              onDeleteFolder={onDeleteFolder}
              onChangeColorFolder={onChangeColorFolder}
              onTagAllInFolder={onTagAllInFolder}
              onSelectCharacter={onSelectCharacter}
              onEditCharacter={onEditCharacter}
              onMoveCharacter={onMoveCharacter}
              onMoveCharacterToFolder={onMoveCharacterToFolder}
              onDeleteCharacter={onDeleteCharacter}
            />
          ))}
        </Box>

        {/* Characters inside this folder (File-manager style) */}
        {folderChars.map((char) => (
          <Box
            key={char.id}
            draggable
            onDragStart={(e) => {
              e.dataTransfer.setData('application/lorebook-character-id', char.id);
              e.dataTransfer.setData('text/plain', char.id);
              e.dataTransfer.effectAllowed = 'copyMove';
            }}
            onClick={() => {
              if (onSelectCharacter) onSelectCharacter(char);
            }}
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 0.8,
              pl: `${12 + (level + 1) * INDENT}px`,
              pr: 0.5,
              py: 0.4,
              borderRadius: 1.5,
              cursor: 'grab',
              transition: 'all 0.12s ease',
              borderLeft: '2px solid transparent',
              '&:active': { cursor: 'grabbing' },
              '&:hover': {
                borderLeftColor: char.color_tag || folder.color || 'primary.main',
                bgcolor: 'action.hover',
                '& .char-item-actions': { opacity: 1 },
              },
            }}
          >
            {/* Character Dot / Mini Avatar */}
            <Avatar
              src={char.avatar_url || ''}
              sx={{
                width: 18,
                height: 18,
                fontSize: '0.62rem',
                fontWeight: 700,
                bgcolor: char.color_tag || folder.color || 'primary.main',
                color: '#fff',
                flexShrink: 0,
              }}
            >
              {char.name?.charAt(0)}
            </Avatar>

            {/* Character Name */}
            <Typography
              noWrap
              sx={{
                flexGrow: 1,
                fontSize: '0.78rem',
                fontWeight: 600,
                color: 'text.secondary',
                lineHeight: 1.25,
              }}
            >
              {char.name}
            </Typography>

            {/* Character Role / Archetype Chip */}
            {char.role_archetype && (
              <Chip
                label={char.role_archetype}
                size="small"
                sx={{
                  height: 16,
                  fontSize: '0.58rem',
                  fontWeight: 600,
                  bgcolor: 'background.subtle',
                  flexShrink: 0,
                  maxWidth: 80,
                  '& .MuiChip-label': { px: 0.4 },
                }}
              />
            )}

            {/* Global Icon */}
            {char.is_global && (
              <PublicOutlinedIcon sx={{ fontSize: 12, color: 'secondary.main', flexShrink: 0 }} />
            )}

            {/* Hover Actions for Character */}
            <Box
              className="char-item-actions"
              sx={{ display: 'flex', opacity: 0, transition: 'opacity 0.15s', flexShrink: 0 }}
            >
              <Tooltip title="Mover a otra carpeta">
                <IconButton
                  size="small"
                  onClick={(e) => {
                    e.stopPropagation();
                    onMoveCharacter && onMoveCharacter(char);
                  }}
                  sx={{ p: 0.2, color: 'text.secondary', '&:hover': { color: 'primary.main' } }}
                >
                  <DriveFileMoveOutlinedIcon sx={{ fontSize: 13 }} />
                </IconButton>
              </Tooltip>

              <Tooltip title="Opciones">
                <IconButton
                  size="small"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedCharForMenu(char);
                    setCharMenuAnchor(e.currentTarget);
                  }}
                  sx={{ p: 0.2, color: 'text.secondary' }}
                >
                  <MoreVertIcon sx={{ fontSize: 13 }} />
                </IconButton>
              </Tooltip>
            </Box>
          </Box>
        ))}
      </Collapse>

      {/* Context Menu for Individual Character in Tree */}
      <Menu
        anchorEl={charMenuAnchor}
        open={Boolean(charMenuAnchor)}
        onClose={() => {
          setCharMenuAnchor(null);
          setSelectedCharForMenu(null);
        }}
        PaperProps={{ sx: { borderRadius: 2, minWidth: 160 } }}
      >
        <MenuItem
          onClick={() => {
            setCharMenuAnchor(null);
            if (selectedCharForMenu && onMoveCharacter) onMoveCharacter(selectedCharForMenu);
          }}
          dense
        >
          <ListItemIcon>
            <DriveFileMoveOutlinedIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText primary="Mover a carpeta..." />
        </MenuItem>

        <MenuItem
          onClick={() => {
            setCharMenuAnchor(null);
            if (selectedCharForMenu && onEditCharacter) onEditCharacter(selectedCharForMenu);
          }}
          dense
        >
          <ListItemIcon>
            <EditOutlinedIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText primary="Editar ficha" />
        </MenuItem>

        <MenuItem
          onClick={() => {
            setCharMenuAnchor(null);
            if (selectedCharForMenu && onDeleteCharacter) onDeleteCharacter(selectedCharForMenu.id);
          }}
          dense
          sx={{ color: 'error.main' }}
        >
          <ListItemIcon sx={{ color: 'error.main' }}>
            <DeleteOutlineIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText primary="Eliminar" />
        </MenuItem>
      </Menu>
    </Box>
  );
}
