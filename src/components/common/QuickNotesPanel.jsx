import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useRouter } from 'next/router';
import { useWorkspaceView, WORKSPACE_VIEW_KEYS } from '../../context/WorkspaceViewContext';
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
  useMediaQuery,
  useTheme,
  CircularProgress,
} from '@mui/material';
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
import SearchIcon from '@mui/icons-material/Search';
import ClearIcon from '@mui/icons-material/Clear';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import { useQuickNotes, NOTE_COLORS, NOTE_STATUSES } from '../../context/QuickNotesContext';
import { useStory } from '../../context/StoryContext';
import { useSwipeToClose } from '../../hooks/useSwipeToClose';
import IconAction from './IconAction';

// ─── Compact Editable Note Card (Ultra-Optimized Space Management) ─────────────
function NoteCard({ note, stories = [], onUpdate, onDelete, onTogglePin }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(note.content);
  const [colorAnchor, setColorAnchor] = useState(null);
  const [storyAnchor, setStoryAnchor] = useState(null);
  const [expandedText, setExpandedText] = useState(false);
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
        bgcolor: note.color || '#fff9c4',
        borderRadius: 2,
        p: { xs: 1.1, sm: 1 },
        mb: 0.8,
        boxShadow: note.is_pinned
          ? '0 3px 12px rgba(0,0,0,0.15)'
          : '0 1px 4px rgba(0,0,0,0.06)',
        border: note.is_pinned ? '1.5px solid rgba(0,0,0,0.25)' : '1px solid rgba(0,0,0,0.08)',
        transition: 'all 0.15s ease',
        '&:hover .note-actions': { opacity: 1 },
      }}
    >
      {/* Top Header: status chip + story chip + actions */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.5, gap: 0.5 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.4, minWidth: 0, flex: 1, overflow: 'hidden' }}>
          <Chip
            label={statusInfo.label}
            size="small"
            onClick={() => {
              const idx = NOTE_STATUSES.findIndex((s) => s.value === note.status);
              const next = NOTE_STATUSES[(idx + 1) % NOTE_STATUSES.length];
              onUpdate(note.id, { status: next.value });
            }}
            sx={{
              height: 18,
              fontSize: '0.68rem',
              fontWeight: 700,
              bgcolor: statusInfo.color,
              color: '#fff',
              cursor: 'pointer',
              flexShrink: 0,
              '& .MuiChip-label': { px: 0.6 },
            }}
          />

          <Tooltip title="Asignar o cambiar historia vinculada">
            <Chip
              icon={assignedStory ? <BookmarkBorderIcon sx={{ fontSize: '11px !important' }} /> : <PublicIcon sx={{ fontSize: '11px !important' }} />}
              label={assignedStory ? assignedStory.title : 'Global'}
              size="small"
              onClick={(e) => setStoryAnchor(e.currentTarget)}
              sx={{
                height: 18,
                fontSize: '0.68rem',
                fontWeight: 600,
                maxWidth: 110,
                bgcolor: assignedStory ? 'rgba(0,0,0,0.08)' : 'rgba(0,0,0,0.04)',
                color: isDark ? '#fff' : 'inherit',
                cursor: 'pointer',
                border: '1px solid rgba(0,0,0,0.1)',
                '& .MuiChip-label': { px: 0.5, overflow: 'hidden', textOverflow: 'ellipsis' },
              }}
            />
          </Tooltip>
        </Box>
        
        {/* Actions bar (Compact) */}
        <Box
          className="note-actions"
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 0.1,
            opacity: { xs: 1, sm: 0.6 },
            transition: 'opacity 0.15s',
            flexShrink: 0,
          }}
        >
          <Tooltip title={note.is_pinned ? 'Desanclar' : 'Anclar'}>
            <IconButton
              size="small"
              sx={{ p: 0.3 }}
              onClick={() => onTogglePin(note.id)}
            >
              {note.is_pinned
                ? <PushPinIcon sx={{ fontSize: 14, color: isDark ? '#ffca28' : '#e65100' }} />
                : <PushPinOutlinedIcon sx={{ fontSize: 14, color: isDark ? '#ccc' : '#666' }} />}
            </IconButton>
          </Tooltip>
          <Tooltip title="Cambiar color">
            <IconButton
              size="small"
              sx={{ p: 0.3 }}
              onClick={(e) => setColorAnchor(e.currentTarget)}
            >
              <PaletteOutlinedIcon sx={{ fontSize: 14, color: isDark ? '#ccc' : '#666' }} />
            </IconButton>
          </Tooltip>
          <Tooltip title="Eliminar nota">
            <IconButton
              size="small"
              sx={{ p: 0.3 }}
              onClick={() => onDelete(note.id)}
            >
              <DeleteOutlineIcon sx={{ fontSize: 14, color: 'error.main' }} />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {/* Note Content (Dense, elegant typography) */}
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
            style: { fontSize: '0.82rem', lineHeight: 1.35, fontWeight: 500 },
          }}
          sx={{
            '& textarea': {
              color: isDark ? '#eceff1' : '#212121',
              resize: 'none',
              minHeight: '32px',
            },
          }}
        />
      ) : (
        <Typography
          variant="body2"
          onClick={() => setEditing(true)}
          sx={{
            fontSize: '0.82rem',
            lineHeight: 1.35,
            fontWeight: 500,
            color: isDark ? '#eceff1' : '#212121',
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word',
            cursor: 'text',
            display: '-webkit-box',
            WebkitLineClamp: expandedText ? 'unset' : 4,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}
        >
          {note.content || <em style={{ opacity: 0.4 }}>Toca para escribir…</em>}
        </Typography>
      )}

      {/* Bottom Metadata & Expand */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mt: 0.4 }}>
        <Typography
          variant="caption"
          sx={{
            opacity: 0.55,
            fontSize: '0.68rem',
            color: isDark ? '#b0bec5' : '#757575',
          }}
        >
          {new Date(note.updated_at).toLocaleString('es', { dateStyle: 'short', timeStyle: 'short' })}
        </Typography>

        {note.content && note.content.length > 120 && (
          <Typography
            variant="caption"
            onClick={(e) => {
              e.stopPropagation();
              setExpandedText((prev) => !prev);
            }}
            sx={{
              fontSize: '0.68rem',
              fontWeight: 700,
              cursor: 'pointer',
              color: isDark ? '#90caf9' : 'primary.main',
              '&:hover': { textDecoration: 'underline' },
            }}
          >
            {expandedText ? 'Menos' : 'Ver más'}
          </Typography>
        )}
      </Box>

      {/* Color picker menu */}
      <Menu
        anchorEl={colorAnchor}
        open={Boolean(colorAnchor)}
        onClose={() => setColorAnchor(null)}
        PaperProps={{ sx: { p: 0.8, borderRadius: 2 } }}
      >
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.6, width: 150 }}>
          {NOTE_COLORS.map((c) => (
            <Box
              key={c}
              onClick={() => {
                onUpdate(note.id, { color: c });
                setColorAnchor(null);
              }}
              sx={{
                width: 20,
                height: 20,
                borderRadius: '50%',
                bgcolor: c,
                border: c === note.color ? '2px solid #000' : '1px solid rgba(0,0,0,0.15)',
                cursor: 'pointer',
                transition: 'transform 0.12s ease',
                '&:hover': { transform: 'scale(1.15)' },
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
        PaperProps={{ sx: { minWidth: 190, maxHeight: 220, borderRadius: 2 } }}
      >
        <Typography variant="caption" sx={{ px: 1.5, py: 0.5, fontWeight: 700, color: 'text.secondary', display: 'block', fontSize: '0.68rem' }}>
          VINCULAR A HISTORIA:
        </Typography>
        <MenuItem
          selected={!note.story_id}
          onClick={() => {
            onUpdate(note.id, { story_id: null });
            setStoryAnchor(null);
          }}
          sx={{ fontSize: '0.78rem', py: 0.4 }}
        >
          <ListItemIcon sx={{ minWidth: 24 }}>
            <PublicIcon sx={{ fontSize: 15 }} />
          </ListItemIcon>
          <ListItemText primaryTypographyProps={{ fontSize: '0.75rem' }} primary="Global (Sin historia)" />
        </MenuItem>
        <Divider sx={{ my: 0.4 }} />
        {stories.map((s) => (
          <MenuItem
            key={s.id}
            selected={note.story_id === s.id}
            onClick={() => {
              onUpdate(note.id, { story_id: s.id });
              setStoryAnchor(null);
            }}
            sx={{ fontSize: '0.78rem', py: 0.4 }}
          >
            <ListItemIcon sx={{ minWidth: 24 }}>
              <BookmarkBorderIcon sx={{ fontSize: 15 }} />
            </ListItemIcon>
            <ListItemText primaryTypographyProps={{ fontSize: '0.75rem', noWrap: true }} primary={s.title} />
          </MenuItem>
        ))}
      </Menu>
    </Box>
  );
}

// ─── Quick Notes Panel (Secondary Extension Sidebar - Capaz de Crecer) ─────────
export default function QuickNotesPanel({ variant = 'extension', onClose }) {
  const router = useRouter();
  const { setActiveView } = useWorkspaceView();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  const {
    notes,
    notesLoading,
    totalCount,
    page,
    totalPages,
    nextPage,
    prevPage,
    scopeFilter,
    setScopeFilter,
    statusFilter,
    setStatusFilter,
    searchQuery,
    setSearchQuery,
    isOpen,
    setIsOpen,
    createNote,
    updateNote,
    deleteNote,
    togglePin,
  } = useQuickNotes();
  
  const { activeStoryId, activeStory, stories } = useStory();

  const [filterAnchor, setFilterAnchor] = useState(null);
  const [searchInput, setSearchInput] = useState(searchQuery || '');
  const [isSearchOpen, setIsSearchOpen] = useState(Boolean(searchQuery));
  const [isExpanded, setIsExpanded] = useState(false); // Capacidad de crecer (360px <-> 540px)

  // Fast capture state
  const [quickText, setQuickText] = useState('');
  const [selectedColor, setSelectedColor] = useState(NOTE_COLORS[0]);
  const [newColorAnchor, setNewColorAnchor] = useState(null);
  const panelRef = useRef(null);
  const quickInputRef = useRef(null);

  const handleClose = useCallback(() => {
    if (onClose) onClose();
    setIsOpen(false);
  }, [onClose, setIsOpen]);

  useSwipeToClose(panelRef, handleClose, 'left', 60, !isMobile && isOpen);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        if (quickInputRef.current) {
          quickInputRef.current.focus();
        }
      }, 150);
    }
  }, [isOpen]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchInput !== searchQuery) {
        setSearchQuery(searchInput);
      }
    }, 250);
    return () => clearTimeout(timer);
  }, [searchInput, searchQuery, setSearchQuery]);

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
    setIsOpen(false);
    setActiveView(WORKSPACE_VIEW_KEYS.IDEAS);
    if (router.pathname !== '/dashboard') {
      router.push('/dashboard');
    }
  };

  const statusLabel = statusFilter === 'all'
    ? 'Todas'
    : NOTE_STATUSES.find((s) => s.value === statusFilter)?.label || 'Todas';

  if (!isOpen) return null;

  const panelContent = (
    <Box
      ref={panelRef}
      sx={{
        width: {
          xs: '100vw',
          sm: isExpanded ? 520 : 360,
          md: isExpanded ? 540 : 360,
        },
        height: '100%',
        bgcolor: 'background.paper',
        display: 'flex',
        flexDirection: 'column',
        borderRight: { xs: 0, sm: 1 },
        borderColor: 'divider',
        boxShadow: { xs: 'none', sm: '4px 0 24px rgba(0,0,0,0.06)' },
        position: 'relative',
        zIndex: 8,
        flexShrink: 0,
        transition: 'width 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
      }}
    >
      {/* Mobile drag handle bar */}
      {isMobile && (
        <Box sx={{ display: 'flex', justifyContent: 'center', pt: 1.2, pb: 0.4 }}>
          <Box sx={{ width: 40, height: 4, borderRadius: 2, bgcolor: 'divider' }} />
        </Box>
      )}

      {/* ─── Ultra-Compact Header ────────────────────────────────────────── */}
      <Box
        sx={{
          px: 1.5,
          py: 0.8,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: 1,
          borderColor: 'divider',
          bgcolor: 'background.paper',
          minHeight: 40,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8 }}>
          <LightbulbOutlinedIcon sx={{ fontSize: 18, color: 'primary.main' }} />
          <Typography variant="subtitle2" sx={{ fontWeight: 800, fontSize: '0.86rem' }}>
            Notas e Ideas
          </Typography>
          <Badge
            badgeContent={totalCount}
            color="primary"
            max={999}
            sx={{ ml: 0.5, '& .MuiBadge-badge': { fontSize: '0.65rem', height: 16, minWidth: 16 } }}
          />
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.4 }}>
          {/* Grow / Expand Width Toggle on Desktop */}
          {!isMobile && (
            <Tooltip title={isExpanded ? 'Reducir a ancho estándar (360px)' : 'Expandir extensión (540px)'}>
              <IconButton
                size="small"
                onClick={() => setIsExpanded((prev) => !prev)}
                color={isExpanded ? 'primary' : 'default'}
                sx={{
                  p: 0.4,
                  border: 1,
                  borderColor: isExpanded ? 'primary.main' : 'divider',
                  bgcolor: isExpanded ? 'action.selected' : 'transparent',
                }}
              >
                {isExpanded ? <ChevronLeftIcon sx={{ fontSize: 16 }} /> : <ChevronRightIcon sx={{ fontSize: 16 }} />}
              </IconButton>
            </Tooltip>
          )}

          {/* Toggle search */}
          <Tooltip title={isSearchOpen ? 'Ocultar búsqueda' : 'Buscar notas'}>
            <IconButton
              size="small"
              onClick={() => setIsSearchOpen((prev) => !prev)}
              color={isSearchOpen || searchQuery ? 'primary' : 'default'}
              sx={{ p: 0.4 }}
            >
              <SearchIcon sx={{ fontSize: 16 }} />
            </IconButton>
          </Tooltip>

          {/* Filter menu */}
          <Tooltip title={`Filtrar estado (${statusLabel})`}>
            <IconButton
              size="small"
              onClick={(e) => setFilterAnchor(e.currentTarget)}
              color={statusFilter !== 'all' ? 'primary' : 'default'}
              sx={{ p: 0.4 }}
            >
              <FilterListIcon sx={{ fontSize: 16 }} />
            </IconButton>
          </Tooltip>

          {/* Open full page */}
          <Tooltip title="Abrir gestor completo en pantalla">
            <IconButton size="small" onClick={handleOpenFullPage} sx={{ color: 'primary.main', p: 0.4 }}>
              <OpenInNewIcon sx={{ fontSize: 16 }} />
            </IconButton>
          </Tooltip>

          {/* Close Button */}
          <IconAction label="Cerrar notas rápidas"
            size="small"
            onClick={handleClose}
            sx={{
              p: 0.4,
              border: 1,
              borderColor: 'divider',
              '&:hover': { bgcolor: 'error.main', color: '#fff' },
            }}
          >
            <CloseIcon sx={{ fontSize: 15 }} />
          </IconAction>
        </Box>
      </Box>

      {/* ─── Compact Scope Pills Bar ─────────────────────────────────────── */}
      <Box
        sx={{
          px: 1.2,
          py: 0.5,
          bgcolor: 'background.subtle',
          borderBottom: 1,
          borderColor: 'divider',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 0.6,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.4, overflowX: 'auto', flex: 1 }}>
          {activeStory && (
            <Tooltip title={`Ideas de ${activeStory.title}`}>
              <Chip
                size="small"
                label={activeStory.title}
                onClick={() => setScopeFilter('story')}
                color={scopeFilter === 'story' ? 'primary' : 'default'}
                variant={scopeFilter === 'story' ? 'filled' : 'outlined'}
                sx={{
                  height: 22,
                  fontSize: '0.68rem',
                  fontWeight: 700,
                  maxWidth: 140,
                  '& .MuiChip-label': { px: 0.8, overflow: 'hidden', textOverflow: 'ellipsis' },
                }}
              />
            </Tooltip>
          )}
          <Chip
            size="small"
            label="Globales"
            onClick={() => setScopeFilter('global')}
            color={scopeFilter === 'global' ? 'primary' : 'default'}
            variant={scopeFilter === 'global' ? 'filled' : 'outlined'}
            sx={{ height: 22, fontSize: '0.68rem', fontWeight: 700, '& .MuiChip-label': { px: 0.8 } }}
          />
          <Chip
            size="small"
            label="Todas"
            onClick={() => setScopeFilter('all')}
            color={scopeFilter === 'all' ? 'primary' : 'default'}
            variant={scopeFilter === 'all' ? 'filled' : 'outlined'}
            sx={{ height: 22, fontSize: '0.68rem', fontWeight: 700, '& .MuiChip-label': { px: 0.8 } }}
          />
        </Box>

        {statusFilter !== 'all' && (
          <Chip
            size="small"
            label={statusLabel}
            onDelete={() => setStatusFilter('all')}
            color="secondary"
            sx={{ height: 20, fontSize: '0.62rem', fontWeight: 700 }}
          />
        )}
      </Box>

      {/* ─── Collapsible Search Bar (Zero space wasted when closed!) ───────── */}
      {isSearchOpen && (
        <Box sx={{ px: 1.2, py: 0.5, bgcolor: 'background.paper', borderBottom: 1, borderColor: 'divider' }}>
          <TextField
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Buscar ideas por palabra clave…"
            size="small"
            autoFocus
            fullWidth
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                </InputAdornment>
              ),
              endAdornment: searchInput ? (
                <InputAdornment position="end">
                  <IconAction label="Limpiar búsqueda" size="small" onClick={() => setSearchInput('')} sx={{ p: 0.2 }}>
                    <ClearIcon sx={{ fontSize: 14 }} />
                  </IconAction>
                </InputAdornment>
              ) : null,
              sx: { fontSize: '0.78rem', borderRadius: 1.5, height: 28 },
            }}
          />
        </Box>
      )}

      {/* ─── Ultra-Compact 1-Line Capture Bar ──────────────────────────────── */}
      <Box
        component="form"
        onSubmit={handleQuickAdd}
        sx={{
          px: 1.2,
          py: 0.6,
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
              ? 'Idea global rápida (Enter)…'
              : `Idea para ${activeStory ? activeStory.title : 'historia'} (Enter)…`
          }
          fullWidth
          size="small"
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleQuickAdd();
            }
          }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Tooltip title="Elegir color de la idea">
                  <Box
                    onClick={(e) => setNewColorAnchor(e.currentTarget)}
                    sx={{
                      width: 15,
                      height: 15,
                      borderRadius: '50%',
                      bgcolor: selectedColor,
                      cursor: 'pointer',
                      border: '1.5px solid rgba(0,0,0,0.2)',
                      '&:hover': { transform: 'scale(1.2)' },
                      transition: 'transform 0.1s',
                    }}
                  />
                </Tooltip>
              </InputAdornment>
            ),
            endAdornment: (
              <InputAdornment position="end">
                <IconAction label="Agregar nota"
                  size="small"
                  onClick={handleQuickAdd}
                  disabled={!quickText.trim()}
                  color="primary"
                  sx={{
                    p: 0.3,
                    bgcolor: quickText.trim() ? 'primary.main' : 'transparent',
                    color: quickText.trim() ? '#fff' : 'action.disabled',
                    '&:hover': { bgcolor: 'primary.dark' },
                  }}
                >
                  <SendIcon sx={{ fontSize: 14 }} />
                </IconAction>
              </InputAdornment>
            ),
            sx: {
              fontSize: '0.8rem',
              height: 32,
              borderRadius: 2,
              bgcolor: 'background.subtle',
            },
          }}
        />

        {/* Color picker popup for new note */}
        <Menu
          anchorEl={newColorAnchor}
          open={Boolean(newColorAnchor)}
          onClose={() => setNewColorAnchor(null)}
          PaperProps={{ sx: { p: 0.8, borderRadius: 2 } }}
        >
          <Box sx={{ display: 'flex', gap: 0.6 }}>
            {NOTE_COLORS.slice(0, 6).map((c) => (
              <Box
                key={c}
                onClick={() => {
                  setSelectedColor(c);
                  setNewColorAnchor(null);
                }}
                sx={{
                  width: 20,
                  height: 20,
                  borderRadius: '50%',
                  bgcolor: c,
                  border: c === selectedColor ? '2px solid #000' : '1px solid rgba(0,0,0,0.15)',
                  cursor: 'pointer',
                  '&:hover': { transform: 'scale(1.15)' },
                }}
              />
            ))}
          </Box>
        </Menu>
      </Box>

      {/* ─── Notes List (Grid in expanded mode, clean list in compact mode) ─── */}
      <Box
        sx={{
          flex: 1,
          overflowY: 'auto',
          p: 1,
          display: isExpanded ? 'grid' : 'block',
          gridTemplateColumns: isExpanded ? 'repeat(auto-fill, minmax(230px, 1fr))' : '1fr',
          gap: 0.8,
          alignContent: 'start',
        }}
      >
        {notesLoading ? (
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', py: 5, gap: 1 }}>
            <CircularProgress size={22} />
            <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.72rem' }}>
              Cargando tus ideas…
            </Typography>
          </Box>
        ) : notes.length === 0 ? (
          <Box sx={{ textAlign: 'center', mt: 4, px: 2 }}>
            <LightbulbOutlinedIcon sx={{ fontSize: 30, color: 'text.disabled', mb: 0.8 }} />
            <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.secondary', fontSize: '0.78rem' }}>
              {searchQuery
                ? `Sin resultados para "${searchQuery}"`
                : statusFilter === 'all'
                ? '¡Escribe arriba para capturar tu primera idea al instante!'
                : 'No hay notas con este filtro.'}
            </Typography>
          </Box>
        ) : (
          notes.map((note) => (
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

      {/* ─── Slim Footer Pagination ────────────────────────────────────────── */}
      {totalPages > 1 && (
        <Box
          sx={{
            px: 1.5,
            py: 0.4,
            borderTop: 1,
            borderColor: 'divider',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            bgcolor: 'background.subtle',
            minHeight: 28,
          }}
        >
          <Typography variant="caption" sx={{ fontSize: '0.68rem', color: 'text.secondary', fontWeight: 600 }}>
            Pág. {page}/{totalPages} ({totalCount} ideas)
          </Typography>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.2 }}>
            <IconAction label="Página anterior"
              size="small"
              disabled={page <= 1}
              onClick={prevPage}
              sx={{ p: 0.2 }}
            >
              <ChevronLeftIcon sx={{ fontSize: 16 }} />
            </IconAction>

            <Typography variant="caption" sx={{ fontSize: '0.72rem', fontWeight: 700, px: 0.4 }}>
              {page}
            </Typography>

            <IconAction label="Página siguiente"
              size="small"
              disabled={page >= totalPages}
              onClick={nextPage}
              sx={{ p: 0.2 }}
            >
              <ChevronRightIcon sx={{ fontSize: 16 }} />
            </IconAction>
          </Box>
        </Box>
      )}

      {/* Status filter menu */}
      <Menu
        anchorEl={filterAnchor}
        open={Boolean(filterAnchor)}
        onClose={() => setFilterAnchor(null)}
        PaperProps={{ sx: { p: 0.5, borderRadius: 2 } }}
      >
        <MenuItem onClick={() => { setStatusFilter('all'); setFilterAnchor(null); }} sx={{ fontSize: '0.75rem', py: 0.4 }}>
          <ListItemText primaryTypographyProps={{ fontSize: '0.75rem' }}>Todas</ListItemText>
        </MenuItem>
        <Divider sx={{ my: 0.4 }} />
        {NOTE_STATUSES.map((s) => (
          <MenuItem
            key={s.value}
            onClick={() => {
              setStatusFilter(s.value);
              setFilterAnchor(null);
            }}
            sx={{ fontSize: '0.75rem', py: 0.4 }}
          >
            <ListItemIcon sx={{ minWidth: 20 }}>
              <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: s.color }} />
            </ListItemIcon>
            <ListItemText primaryTypographyProps={{ fontSize: '0.75rem' }}>{s.label}</ListItemText>
          </MenuItem>
        ))}
      </Menu>
    </Box>
  );

  // On desktop, render directly in the layout flow as the left sidebar extension
  if (!isMobile) {
    return panelContent;
  }

  // Otherwise on mobile render as bottom sheet modal
  return (
    <Drawer
      anchor="bottom"
      open={isOpen}
      onClose={handleClose}
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
