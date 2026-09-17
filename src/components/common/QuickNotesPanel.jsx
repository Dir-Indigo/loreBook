import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useRouter } from 'next/router';
import {
  Box,
  Typography,
  IconButton,
  Tooltip,
  Chip,
  TextField,
  Drawer,
  Divider,
  Badge,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  InputAdornment,
  Button,
  ButtonGroup,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import CloseIcon from '@mui/icons-material/Close';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import PushPinIcon from '@mui/icons-material/PushPin';
import PushPinOutlinedIcon from '@mui/icons-material/PushPinOutlined';
import PaletteOutlinedIcon from '@mui/icons-material/PaletteOutlined';
import LightbulbOutlinedIcon from '@mui/icons-material/LightbulbOutlined';
import FilterListIcon from '@mui/icons-material/FilterList';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import SendIcon from '@mui/icons-material/Send';
import PublicIcon from '@mui/icons-material/Public';
import BookmarkBorderIcon from '@mui/icons-material/BookmarkBorder';
import ViewSidebarIcon from '@mui/icons-material/ViewSidebar';
import ViewSidebarOutlinedIcon from '@mui/icons-material/ViewSidebarOutlined';
import { useQuickNotes, NOTE_COLORS, NOTE_STATUSES } from '../../context/QuickNotesContext';
import { useStory } from '../../context/StoryContext';
import { useSwipeToClose } from '../../hooks/useSwipeToClose';

// ─── Single Editable Note Card ────────────────────────────────────────────────
function NoteCard({ note, stories = [], onUpdate, onDelete, onTogglePin }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(note.content);
  const [colorAnchor, setColorAnchor] = useState(null);
  const [storyAnchor, setStoryAnchor] = useState(null);
  const textRef = useRef(null);

  useEffect(() => {
    setDraft(note.content);
  }, [note.content]);

  useEffect(() => {
    if (editing && textRef.current) {
      textRef.current.focus();
    }
  }, [editing]);

  const handleBlur = () => {
    setEditing(false);
    if (draft.trim() !== note.content) {
      onUpdate(note.id, { content: draft.trim() || note.content });
    }
  };

  const statusInfo = NOTE_STATUSES.find((s) => s.value === note.status) || NOTE_STATUSES[0];
  const isDark = note.color === '#263238';
  const assignedStory = stories.find((s) => s.id === note.story_id);

  return (
    <Box
      sx={{
        position: 'relative',
        bgcolor: note.color,
        borderRadius: 2.5,
        p: { xs: 1.8, sm: 1.5 },
        mb: 1.4,
        boxShadow: note.is_pinned
          ? '0 4px 16px rgba(0,0,0,0.18)'
          : '0 2px 8px rgba(0,0,0,0.08)',
        border: note.is_pinned ? '1.5px solid rgba(0,0,0,0.22)' : '1px solid rgba(0,0,0,0.08)',
        transition: 'all 0.18s ease',
        '&:hover .note-actions': { opacity: 1 },
      }}
    >
      {/* Top row: status chip + story chip + actions */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1, gap: 0.8, flexWrap: 'wrap' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.6 }}>
          <Chip
            label={statusInfo.label}
            size="small"
            onClick={() => {
              const idx = NOTE_STATUSES.findIndex((s) => s.value === note.status);
              const next = NOTE_STATUSES[(idx + 1) % NOTE_STATUSES.length];
              onUpdate(note.id, { status: next.value });
            }}
            sx={{
              height: 20,
              fontSize: '0.68rem',
              fontWeight: 700,
              bgcolor: statusInfo.color,
              color: '#fff',
              cursor: 'pointer',
              boxShadow: '0 1px 4px rgba(0,0,0,0.2)',
              '& .MuiChip-label': { px: 0.8 },
            }}
          />

          {/* Story Tag Chip */}
          <Tooltip title="Asignar o cambiar historia vinculada">
            <Chip
              icon={assignedStory ? <BookmarkBorderIcon sx={{ fontSize: '12px !important' }} /> : <PublicIcon sx={{ fontSize: '12px !important' }} />}
              label={assignedStory ? assignedStory.title : 'Global'}
              size="small"
              onClick={(e) => setStoryAnchor(e.currentTarget)}
              sx={{
                height: 20,
                fontSize: '0.65rem',
                fontWeight: 600,
                maxWidth: 130,
                bgcolor: assignedStory ? 'rgba(0,0,0,0.08)' : 'rgba(0,0,0,0.04)',
                color: isDark ? '#fff' : 'inherit',
                cursor: 'pointer',
                border: '1px solid rgba(0,0,0,0.12)',
                '&:hover': { bgcolor: 'rgba(0,0,0,0.15)' },
                '& .MuiChip-label': { px: 0.6 },
              }}
            />
          </Tooltip>
        </Box>
        
        {/* Actions bar */}
        <Box
          className="note-actions"
          sx={{
            display: 'flex',
            gap: { xs: 0.8, sm: 0.4 },
            opacity: { xs: 1, sm: 0.6 },
            transition: 'opacity 0.15s',
          }}
        >
          <Tooltip title={note.is_pinned ? 'Desanclar' : 'Anclar'}>
            <IconButton
              size="small"
              sx={{ p: { xs: 0.6, sm: 0.3 } }}
              onClick={() => onTogglePin(note.id)}
            >
              {note.is_pinned
                ? <PushPinIcon sx={{ fontSize: 16, color: isDark ? '#ffca28' : '#e65100' }} />
                : <PushPinOutlinedIcon sx={{ fontSize: 16, color: isDark ? '#ccc' : '#666' }} />}
            </IconButton>
          </Tooltip>
          <Tooltip title="Cambiar color">
            <IconButton
              size="small"
              sx={{ p: { xs: 0.6, sm: 0.3 } }}
              onClick={(e) => setColorAnchor(e.currentTarget)}
            >
              <PaletteOutlinedIcon sx={{ fontSize: 16, color: isDark ? '#ccc' : '#666' }} />
            </IconButton>
          </Tooltip>
          <Tooltip title="Eliminar nota">
            <IconButton
              size="small"
              sx={{ p: { xs: 0.6, sm: 0.3 } }}
              onClick={() => onDelete(note.id)}
            >
              <DeleteOutlineIcon sx={{ fontSize: 16, color: '#e53935' }} />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {/* Note Content */}
      {editing ? (
        <TextField
          inputRef={textRef}
          multiline
          fullWidth
          variant="standard"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={handleBlur}
          onKeyDown={(e) => {
            if (e.key === 'Escape') {
              setDraft(note.content);
              setEditing(false);
            }
          }}
          InputProps={{
            disableUnderline: true,
            style: { fontSize: '0.9rem', lineHeight: 1.5, fontWeight: 500 },
          }}
          sx={{
            '& textarea': {
              color: isDark ? '#eceff1' : '#212121',
              resize: 'none',
              minHeight: '40px',
            },
          }}
        />
      ) : (
        <Typography
          variant="body2"
          onClick={() => setEditing(true)}
          sx={{
            fontSize: '0.9rem',
            lineHeight: 1.6,
            fontWeight: 500,
            color: isDark ? '#eceff1' : '#212121',
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word',
            cursor: 'text',
            minHeight: 28,
          }}
        >
          {note.content || <em style={{ opacity: 0.4 }}>Toca para escribir…</em>}
        </Typography>
      )}

      {/* Timestamp */}
      <Typography
        variant="caption"
        sx={{
          display: 'block',
          mt: 1,
          opacity: 0.5,
          fontSize: '0.68rem',
          color: isDark ? '#b0bec5' : '#757575',
        }}
      >
        {new Date(note.updated_at).toLocaleString('es', { dateStyle: 'short', timeStyle: 'short' })}
      </Typography>

      {/* Color picker menu */}
      <Menu
        anchorEl={colorAnchor}
        open={Boolean(colorAnchor)}
        onClose={() => setColorAnchor(null)}
        PaperProps={{ sx: { p: 1.2, borderRadius: 2.5 } }}
      >
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.8, width: 170 }}>
          {NOTE_COLORS.map((c) => (
            <Box
              key={c}
              onClick={() => {
                onUpdate(note.id, { color: c });
                setColorAnchor(null);
              }}
              sx={{
                width: 26,
                height: 26,
                borderRadius: '50%',
                bgcolor: c,
                border: c === note.color ? '2.5px solid #111' : '1.5px solid rgba(0,0,0,0.15)',
                cursor: 'pointer',
                transition: 'transform 0.15s ease',
                '&:hover': { transform: 'scale(1.2)' },
              }}
            />
          ))}
        </Box>
      </Menu>

      {/* Story assignment menu */}
      <Menu
        anchorEl={storyAnchor}
        open={Boolean(storyAnchor)}
        onClose={() => setStoryAnchor(null)}
        PaperProps={{ sx: { minWidth: 200, borderRadius: 2.5 } }}
      >
        <Typography variant="caption" sx={{ px: 2, py: 1, fontWeight: 700, color: 'text.secondary', display: 'block' }}>
          VINCULAR A HISTORIA:
        </Typography>
        <MenuItem
          selected={!note.story_id}
          onClick={() => {
            onUpdate(note.id, { story_id: null });
            setStoryAnchor(null);
          }}
        >
          <ListItemIcon>
            <PublicIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText primary="Global (Sin historia)" />
        </MenuItem>
        <Divider />
        {stories.map((s) => (
          <MenuItem
            key={s.id}
            selected={note.story_id === s.id}
            onClick={() => {
              onUpdate(note.id, { story_id: s.id });
              setStoryAnchor(null);
            }}
          >
            <ListItemIcon>
              <BookmarkBorderIcon fontSize="small" color="primary" />
            </ListItemIcon>
            <ListItemText primary={s.title} />
          </MenuItem>
        ))}
      </Menu>
    </Box>
  );
}

// ─── Quick Notes Panel (Drawer / Docked Persistent Sidebar) ───────────────────
export default function QuickNotesPanel() {
  const router = useRouter();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  const {
    notes,
    notesLoading,
    isOpen,
    setIsOpen,
    isPinned,
    togglePinned,
    loadNotes,
    createNote,
    updateNote,
    deleteNote,
    togglePin,
  } = useQuickNotes();
  
  const { activeStoryId, activeStory, stories } = useStory();

  // Scope filter: 'story' | 'global' | 'all'
  const [scopeFilter, setScopeFilter] = useState('story');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterAnchor, setFilterAnchor] = useState(null);

  // Fast capture state
  const [quickText, setQuickText] = useState('');
  const [selectedColor, setSelectedColor] = useState(NOTE_COLORS[0]);
  const panelRef = useRef(null);
  const quickInputRef = useRef(null);

  // Swipe-to-close: swipe right → close (panel comes from the right side)
  const handleClose = useCallback(() => setIsOpen(false), [setIsOpen]);
  useSwipeToClose(panelRef, handleClose, 'right', 60, !isMobile);

  // Load all notes when panel opens or story changes
  useEffect(() => {
    if (isOpen) {
      loadNotes(null);
      // Auto-focus quick input
      setTimeout(() => {
        if (quickInputRef.current) {
          quickInputRef.current.focus();
        }
      }, 150);
    }
  }, [isOpen, loadNotes]);

  // Fast 1-step note creation (Enter or click Send)
  const handleQuickAdd = async (e) => {
    if (e) e.preventDefault();
    const text = quickText.trim();
    if (!text) return;

    const targetStory = scopeFilter === 'global' ? null : (activeStoryId || null);

    await createNote({
      content: text,
      color: selectedColor,
      story_id: targetStory,
      status: 'idea',
    });

    setQuickText('');
    if (quickInputRef.current) {
      quickInputRef.current.focus();
    }
  };

  const handleOpenFullPage = () => {
    if (!isPinned) setIsOpen(false);
    router.push('/ideas');
  };

  // Filter notes by scope and status
  const filtered = notes.filter((n) => {
    // Scope filter
    if (scopeFilter === 'story' && activeStoryId) {
      if (n.story_id !== activeStoryId) return false;
    } else if (scopeFilter === 'global') {
      if (n.story_id !== null) return false;
    }

    // Status filter
    if (filterStatus !== 'all') {
      if (n.status !== filterStatus) return false;
    }

    return true;
  });

  const statusLabel = filterStatus === 'all'
    ? 'Todas'
    : NOTE_STATUSES.find((s) => s.value === filterStatus)?.label || 'Todas';

  // If panel is not open, don't render anything
  if (!isOpen) return null;

  const panelContent = (
    <Box
      ref={panelRef}
      sx={{
        width: { xs: '100vw', sm: 350, md: 360 },
        height: '100%',
        bgcolor: 'background.paper',
        display: 'flex',
        flexDirection: 'column',
        borderLeft: { xs: 0, sm: 1 },
        borderColor: 'divider',
      }}
    >
      {/* Mobile drag handle bar */}
      {isMobile && (
        <Box sx={{ display: 'flex', justifyContent: 'center', pt: 1.5, pb: 0.5 }}>
          <Box sx={{ width: 40, height: 4, borderRadius: 2, bgcolor: 'divider' }} />
        </Box>
      )}

      {/* Header */}
      <Box
        sx={{
          px: 2,
          py: 1.3,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: 1,
          borderColor: 'divider',
          bgcolor: 'background.paper',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <LightbulbOutlinedIcon sx={{ fontSize: 22, color: 'primary.main' }} />
          <Typography variant="subtitle1" sx={{ fontWeight: 800, fontSize: '0.98rem' }}>
            Gestor Express
          </Typography>
          <Badge
            badgeContent={filtered.length}
            color="primary"
            max={99}
            sx={{ ml: 0.6 }}
          />
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.6 }}>
          {/* Pin/Dock Button for Desktop */}
          {!isMobile && (
            <Tooltip title={isPinned ? 'Desacoplar panel (flotante)' : 'Fijar panel a la derecha'}>
              <IconButton
                size="small"
                onClick={togglePinned}
                color={isPinned ? 'primary' : 'default'}
                sx={{
                  border: 1,
                  borderColor: isPinned ? 'primary.main' : 'divider',
                  bgcolor: isPinned ? 'primary.lighter' : 'transparent',
                  p: 0.6,
                }}
              >
                {isPinned ? <ViewSidebarIcon fontSize="small" /> : <ViewSidebarOutlinedIcon fontSize="small" />}
              </IconButton>
            </Tooltip>
          )}

          <Tooltip title="Abrir gestor centralizado de ideas">
            <IconButton size="small" onClick={handleOpenFullPage} sx={{ color: 'primary.main' }}>
              <OpenInNewIcon fontSize="small" />
            </IconButton>
          </Tooltip>

          <Tooltip title={`Filtro de estado: ${statusLabel}`}>
            <IconButton size="small" onClick={(e) => setFilterAnchor(e.currentTarget)}>
              <FilterListIcon fontSize="small" />
            </IconButton>
          </Tooltip>

          {/* Obvious, Prominent Close Button */}
          <Button
            size="small"
            variant="outlined"
            color="inherit"
            startIcon={<CloseIcon fontSize="small" />}
            onClick={() => setIsOpen(false)}
            sx={{
              fontWeight: 700,
              fontSize: '0.78rem',
              textTransform: 'none',
              borderRadius: 2,
              px: { xs: 1.2, sm: 1.4 },
              py: 0.35,
              borderColor: 'divider',
              bgcolor: 'action.hover',
              '&:hover': {
                bgcolor: 'error.main',
                color: '#fff',
                borderColor: 'error.main',
              },
              transition: 'all 0.15s ease',
            }}
          >
            Cerrar
          </Button>
        </Box>
      </Box>

      {/* Scope Segmented Buttons (Esta Historia | Globales | Todas) */}
      <Box sx={{ px: 1.5, py: 1, bgcolor: 'background.subtle', borderBottom: 1, borderColor: 'divider' }}>
        <ButtonGroup size="small" fullWidth variant="outlined" sx={{ borderRadius: 2 }}>
          <Button
            variant={scopeFilter === 'story' ? 'contained' : 'outlined'}
            onClick={() => setScopeFilter('story')}
            disabled={!activeStoryId}
            sx={{ fontSize: '0.72rem', py: 0.4, fontWeight: 700, textTransform: 'none' }}
          >
            {activeStory ? activeStory.title.slice(0, 12) + '…' : 'Historia'}
          </Button>
          <Button
            variant={scopeFilter === 'global' ? 'contained' : 'outlined'}
            onClick={() => setScopeFilter('global')}
            sx={{ fontSize: '0.72rem', py: 0.4, fontWeight: 700, textTransform: 'none' }}
          >
            Globales
          </Button>
          <Button
            variant={scopeFilter === 'all' ? 'contained' : 'outlined'}
            onClick={() => setScopeFilter('all')}
            sx={{ fontSize: '0.72rem', py: 0.4, fontWeight: 700, textTransform: 'none' }}
          >
            Todas
          </Button>
        </ButtonGroup>
      </Box>

      {/* ─── Ultra-Fast Capture Bar (Escribe y Enter) ───────────────────────── */}
      <Box
        component="form"
        onSubmit={handleQuickAdd}
        sx={{
          p: 1.5,
          bgcolor: 'background.paper',
          borderBottom: 1,
          borderColor: 'divider',
        }}
      >
        <TextField
          inputRef={quickInputRef}
          value={quickText}
          onChange={(e) => setQuickText(e.target.value)}
          placeholder={
            scopeFilter === 'global'
              ? 'Idea global rápida (Enter para guardar)…'
              : `Idea para ${activeStory ? activeStory.title : 'historia'} (Enter)…`
          }
          fullWidth
          size="small"
          multiline
          maxRows={3}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleQuickAdd();
            }
          }}
          InputProps={{
            endAdornment: (
              <InputAdornment position="end">
                <IconButton
                  size="small"
                  onClick={handleQuickAdd}
                  disabled={!quickText.trim()}
                  color="primary"
                  sx={{
                    bgcolor: quickText.trim() ? 'primary.main' : 'transparent',
                    color: quickText.trim() ? '#fff' : 'action.disabled',
                    '&:hover': { bgcolor: 'primary.dark' },
                  }}
                >
                  <SendIcon sx={{ fontSize: 16 }} />
                </IconButton>
              </InputAdornment>
            ),
          }}
          sx={{
            bgcolor: 'background.subtle',
            borderRadius: 2,
            '& .MuiOutlinedInput-root': {
              borderRadius: 2,
              fontSize: '0.86rem',
            },
          }}
        />

        {/* Color picker pills for new note */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1, px: 0.5 }}>
          <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600, fontSize: '0.7rem' }}>
            Color:
          </Typography>
          <Box sx={{ display: 'flex', gap: 0.8 }}>
            {NOTE_COLORS.slice(0, 5).map((c) => (
              <Box
                key={c}
                onClick={() => setSelectedColor(c)}
                sx={{
                  width: 18,
                  height: 18,
                  borderRadius: '50%',
                  bgcolor: c,
                  border: c === selectedColor ? '2px solid #222' : '1px solid rgba(0,0,0,0.15)',
                  cursor: 'pointer',
                  transform: c === selectedColor ? 'scale(1.25)' : 'scale(1)',
                  transition: 'transform 0.12s ease',
                }}
              />
            ))}
          </Box>
        </Box>
      </Box>

      {/* Filter indicator */}
      {filterStatus !== 'all' && (
        <Box sx={{ px: 2, pt: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
          <Chip
            size="small"
            label={`Filtrado por: ${statusLabel}`}
            onDelete={() => setFilterStatus('all')}
            color="primary"
            variant="outlined"
          />
        </Box>
      )}

      {/* Notes list */}
      <Box sx={{ flex: 1, overflowY: 'auto', p: 1.5 }}>
        {notesLoading ? (
          <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', mt: 4 }}>
            Cargando tus ideas…
          </Typography>
        ) : filtered.length === 0 ? (
          <Box sx={{ textAlign: 'center', mt: 5, px: 2 }}>
            <LightbulbOutlinedIcon sx={{ fontSize: 40, color: 'text.disabled', mb: 1 }} />
            <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.secondary', fontSize: '0.85rem' }}>
              {filterStatus === 'all'
                ? '¡Escribe arriba para capturar tu primera idea al instante!'
                : 'No hay notas con este filtro.'}
            </Typography>
          </Box>
        ) : (
          filtered.map((note) => (
            <NoteCard
              key={note.id}
              note={note}
              stories={stories}
              onUpdate={updateNote}
              onDelete={deleteNote}
              onTogglePin={togglePin}
            />
          ))
        )}
      </Box>

      {/* Footer link to full management page */}
      <Divider />
      <Box sx={{ p: 1.2, bgcolor: 'background.paper', display: 'flex', justifyContent: 'center' }}>
        <Button
          size="small"
          startIcon={<OpenInNewIcon fontSize="small" />}
          onClick={handleOpenFullPage}
          sx={{ textTransform: 'none', fontWeight: 600, fontSize: '0.8rem' }}
        >
          Abrir Gestor Centralizado
        </Button>
      </Box>

      {/* Status filter menu */}
      <Menu
        anchorEl={filterAnchor}
        open={Boolean(filterAnchor)}
        onClose={() => setFilterAnchor(null)}
      >
        <MenuItem onClick={() => { setFilterStatus('all'); setFilterAnchor(null); }}>
          <ListItemText>Todas</ListItemText>
        </MenuItem>
        <Divider />
        {NOTE_STATUSES.map((s) => (
          <MenuItem
            key={s.value}
            onClick={() => {
              setFilterStatus(s.value);
              setFilterAnchor(null);
            }}
          >
            <ListItemIcon>
              <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: s.color }} />
            </ListItemIcon>
            <ListItemText>{s.label}</ListItemText>
          </MenuItem>
        ))}
      </Menu>
    </Box>
  );

  // On desktop, render directly in the layout (MainLayout flex row) so clicks in the canvas and rest of the app are NEVER blocked!
  if (!isMobile) {
    return panelContent;
  }

  // Otherwise on mobile render as bottom sheet modal
  return (
    <Drawer
      anchor="bottom"
      open={isOpen}
      onClose={() => setIsOpen(false)}
      variant="temporary"
      PaperProps={{
        sx: {
          width: '100vw',
          maxHeight: '88vh',
          height: '88vh',
          borderTopLeftRadius: 20,
          borderTopRightRadius: 20,
          bgcolor: 'background.paper',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 -4px 30px rgba(0,0,0,0.2)',
        },
      }}
    >
      {panelContent}
    </Drawer>
  );
}
