import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useRouter } from 'next/router';
import {
  Box,
  Typography,
  IconButton,
  Tooltip,
  Chip,
  TextField,
  Menu,
  MenuItem,
  InputAdornment,
  CircularProgress,
  Button,
} from '@mui/material';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import PushPinIcon from '@mui/icons-material/PushPin';
import PushPinOutlinedIcon from '@mui/icons-material/PushPinOutlined';
import PaletteOutlinedIcon from '@mui/icons-material/PaletteOutlined';
import FilterListIcon from '@mui/icons-material/FilterList';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import SendIcon from '@mui/icons-material/Send';
import PublicIcon from '@mui/icons-material/Public';
import BookmarkBorderIcon from '@mui/icons-material/BookmarkBorder';
import SearchIcon from '@mui/icons-material/Search';
import ClearIcon from '@mui/icons-material/Clear';
import ViewAgendaOutlinedIcon from '@mui/icons-material/ViewAgendaOutlined';
import ViewListOutlinedIcon from '@mui/icons-material/ViewListOutlined';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import { useQuickNotes, NOTE_COLORS, NOTE_STATUSES } from '../../../context/QuickNotesContext';
import { useStory } from '../../../context/StoryContext';
import { useWorkspaceView, WORKSPACE_VIEW_KEYS } from '../../../context/WorkspaceViewContext';
import IconAction from '../../common/IconAction';

// ─── Compact Editable Note Card ───────────────────────────────────────────────
function CompactNoteCard({ note, stories = [], onUpdate, onDelete, onTogglePin }) {
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
        p: 1.1,
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
              fontSize: '0.62rem',
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
                fontSize: '0.62rem',
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
          <Tooltip title={note.is_pinned ? 'Desfijar' : 'Fijar arriba'}>
            <IconButton
              size="small"
              onClick={() => onTogglePin(note.id, !note.is_pinned)}
              sx={{ p: 0.3, color: note.is_pinned ? 'error.main' : (isDark ? '#bbb' : 'rgba(0,0,0,0.55)') }}
            >
              {note.is_pinned ? <PushPinIcon sx={{ fontSize: 14 }} /> : <PushPinOutlinedIcon sx={{ fontSize: 14 }} />}
            </IconButton>
          </Tooltip>

          <Tooltip title="Cambiar color">
            <IconButton
              size="small"
              onClick={(e) => setColorAnchor(e.currentTarget)}
              sx={{ p: 0.3, color: isDark ? '#bbb' : 'rgba(0,0,0,0.55)' }}
            >
              <PaletteOutlinedIcon sx={{ fontSize: 14 }} />
            </IconButton>
          </Tooltip>

          <Tooltip title="Eliminar nota">
            <IconButton
              size="small"
              onClick={() => onDelete(note.id)}
              sx={{ p: 0.3, color: isDark ? '#bbb' : 'rgba(0,0,0,0.55)', '&:hover': { color: 'error.main' } }}
            >
              <DeleteOutlineIcon sx={{ fontSize: 14 }} />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {/* Note Content (Editable on click with clamp) */}
      {editing ? (
        <TextField
          inputRef={textRef}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={handleBlur}
          multiline
          size="small"
          fullWidth
          variant="standard"
          InputProps={{ disableUnderline: true }}
          sx={{
            '& .MuiInputBase-input': {
              fontSize: '0.8rem',
              color: isDark ? '#fff' : '#1a1a1a',
              lineHeight: 1.4,
              p: 0.2,
            },
          }}
        />
      ) : (
        <Box onClick={() => setEditing(true)} sx={{ cursor: 'text' }}>
          <Typography
            variant="body2"
            sx={{
              fontSize: '0.8rem',
              fontWeight: 500,
              lineHeight: 1.35,
              color: isDark ? '#fff' : '#1a1a1a',
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
              display: expandedText ? 'block' : '-webkit-box',
              WebkitLineClamp: expandedText ? 'none' : 4,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
            }}
          >
            {note.content || '(Nota sin texto)'}
          </Typography>

          {note.content && note.content.length > 140 && (
            <Typography
              component="span"
              onClick={(e) => {
                e.stopPropagation();
                setExpandedText((prev) => !prev);
              }}
              sx={{
                fontSize: '0.68rem',
                fontWeight: 700,
                color: isDark ? '#90caf9' : 'primary.main',
                cursor: 'pointer',
                mt: 0.3,
                display: 'inline-block',
                '&:hover': { textDecoration: 'underline' },
              }}
            >
              {expandedText ? 'Ver menos' : 'Ver más'}
            </Typography>
          )}
        </Box>
      )}

      {/* Footer: Date */}
      <Typography
        variant="caption"
        sx={{
          display: 'block',
          mt: 0.4,
          fontSize: '0.62rem',
          color: isDark ? 'rgba(255,255,255,0.45)' : 'rgba(0,0,0,0.45)',
        }}
      >
        {new Date(note.updated_at || note.created_at).toLocaleDateString('es-ES', {
          day: 'numeric',
          month: 'numeric',
          year: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
        })}
      </Typography>

      {/* Color Picker Menu */}
      <Menu
        anchorEl={colorAnchor}
        open={Boolean(colorAnchor)}
        onClose={() => setColorAnchor(null)}
        PaperProps={{ sx: { p: 0.6, bgcolor: 'background.paper', borderRadius: 2 } }}
      >
        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 0.6, p: 0.4 }}>
          {NOTE_COLORS.map((col) => (
            <Box
              key={col}
              onClick={() => {
                onUpdate(note.id, { color: col });
                setColorAnchor(null);
              }}
              sx={{
                width: 22,
                height: 22,
                borderRadius: '50%',
                bgcolor: col,
                border: note.color === col ? '2px solid #000' : '1px solid rgba(0,0,0,0.2)',
                cursor: 'pointer',
                '&:hover': { transform: 'scale(1.2)' },
                transition: 'transform 0.1s',
              }}
            />
          ))}
        </Box>
      </Menu>

      {/* Story Assignment Menu */}
      <Menu
        anchorEl={storyAnchor}
        open={Boolean(storyAnchor)}
        onClose={() => setStoryAnchor(null)}
      >
        <MenuItem
          dense
          selected={!note.story_id}
          onClick={() => {
            onUpdate(note.id, { story_id: null });
            setStoryAnchor(null);
          }}
          sx={{ fontSize: '0.75rem' }}
        >
          <PublicIcon sx={{ fontSize: 14, mr: 1, opacity: 0.7 }} />
          Global (Visible en todas las historias)
        </MenuItem>
        {stories.map((st) => (
          <MenuItem
            key={st.id}
            dense
            selected={note.story_id === st.id}
            onClick={() => {
              onUpdate(note.id, { story_id: st.id });
              setStoryAnchor(null);
            }}
            sx={{ fontSize: '0.75rem' }}
          >
            <BookmarkBorderIcon sx={{ fontSize: 14, mr: 1, opacity: 0.7 }} />
            {st.title}
          </MenuItem>
        ))}
      </Menu>
    </Box>
  );
}

// ─── Ultra-Dense Row View (List Mode) ─────────────────────────────────────────
function DenseNoteRow({ note, stories = [], onUpdate, onDelete }) {
  const statusInfo = NOTE_STATUSES.find((s) => s.value === note.status) || NOTE_STATUSES[0];
  const assignedStory = stories.find((s) => s.id === note.story_id);

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 0.8,
        py: 0.6,
        px: 1,
        borderRadius: 1.5,
        bgcolor: 'action.hover',
        borderLeft: 4,
        borderColor: note.color || statusInfo.color,
        transition: 'all 0.12s ease',
        '&:hover': { bgcolor: 'action.selected' },
      }}
    >
      <Box
        onClick={() => {
          const idx = NOTE_STATUSES.findIndex((s) => s.value === note.status);
          const next = NOTE_STATUSES[(idx + 1) % NOTE_STATUSES.length];
          onUpdate(note.id, { status: next.value });
        }}
        sx={{
          width: 8,
          height: 8,
          borderRadius: '50%',
          bgcolor: statusInfo.color,
          cursor: 'pointer',
          flexShrink: 0,
        }}
      />

      <Typography
        variant="body2"
        sx={{
          fontSize: '0.76rem',
          fontWeight: 600,
          flex: 1,
          minWidth: 0,
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
        }}
      >
        {note.content || '(Sin texto)'}
      </Typography>

      {assignedStory && (
        <Typography variant="caption" sx={{ fontSize: '0.62rem', opacity: 0.6, flexShrink: 0 }}>
          {assignedStory.title}
        </Typography>
      )}

      <IconAction label="Eliminar nota"
        size="small"
        onClick={() => onDelete(note.id)}
        sx={{ p: 0.2, color: 'text.disabled', '&:hover': { color: 'error.main' } }}
      >
        <DeleteOutlineIcon sx={{ fontSize: 13 }} />
      </IconAction>
    </Box>
  );
}

// ─── Main Notes Detail View ───────────────────────────────────────────────────
export default function NotesDetailView({ isExpanded = false }) {
  const router = useRouter();
  const { stories, activeStory, activeStoryId } = useStory();
  const { setActiveView } = useWorkspaceView();

  const {
    notes,
    notesLoading,
    totalCount,
    page,
    pageSize,
    setPage,
    scopeFilter,
    setScopeFilter,
    statusFilter,
    setStatusFilter,
    searchQuery,
    setSearchQuery,
    createNote,
    updateNote,
    deleteNote,
    togglePinNote,
  } = useQuickNotes();

  const [quickText, setQuickText] = useState('');
  const [selectedColor, setSelectedColor] = useState(NOTE_COLORS[0]);
  const [colorPickerAnchor, setColorPickerAnchor] = useState(null);
  const [showSearch, setShowSearch] = useState(false);
  const [viewFormat, setViewFormat] = useState('cards'); // 'cards' | 'dense'
  const quickInputRef = useRef(null);

  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));

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

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', flexGrow: 1, overflow: 'hidden' }}>
      {/* ─── Compact Controls Bar: Scope Filters & View Toggles ──────────── */}
      <Box
        sx={{
          px: 1.2,
          py: 0.6,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: 1,
          borderColor: 'divider',
          gap: 0.5,
          bgcolor: 'background.paper',
        }}
      >
        {/* Scope Pill Buttons */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.4 }}>
          {activeStory && (
            <Chip
              label={activeStory.title}
              size="small"
              onClick={() => setScopeFilter('story')}
              color={scopeFilter === 'story' ? 'primary' : 'default'}
              variant={scopeFilter === 'story' ? 'filled' : 'outlined'}
              sx={{ height: 22, fontSize: '0.68rem', fontWeight: 700, maxWidth: 110 }}
            />
          )}

          <Chip
            label="Globales"
            size="small"
            onClick={() => setScopeFilter('global')}
            color={scopeFilter === 'global' ? 'primary' : 'default'}
            variant={scopeFilter === 'global' ? 'filled' : 'outlined'}
            sx={{ height: 22, fontSize: '0.68rem', fontWeight: 700 }}
          />

          <Chip
            label="Todas"
            size="small"
            onClick={() => setScopeFilter('all')}
            color={scopeFilter === 'all' ? 'primary' : 'default'}
            variant={scopeFilter === 'all' ? 'filled' : 'outlined'}
            sx={{ height: 22, fontSize: '0.68rem', fontWeight: 700 }}
          />
        </Box>

        {/* View Tools: Search Toggle + Cards/List Toggle */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.3 }}>
          <Tooltip title={showSearch ? 'Ocultar buscador' : 'Buscar ideas'}>
            <IconButton
              size="small"
              onClick={() => setShowSearch((prev) => !prev)}
              color={showSearch || searchQuery ? 'primary' : 'default'}
              sx={{ p: 0.4 }}
            >
              <SearchIcon sx={{ fontSize: 16 }} />
            </IconButton>
          </Tooltip>

          <Tooltip title={viewFormat === 'cards' ? 'Modo Lista Compacta' : 'Modo Tarjetas'}>
            <IconButton
              size="small"
              onClick={() => setViewFormat((prev) => (prev === 'cards' ? 'dense' : 'cards'))}
              sx={{ p: 0.4 }}
            >
              {viewFormat === 'cards' ? <ViewListOutlinedIcon sx={{ fontSize: 16 }} /> : <ViewAgendaOutlinedIcon sx={{ fontSize: 16 }} />}
            </IconButton>
          </Tooltip>

          <Tooltip title="Abrir Pizarra Central">
            <IconButton
              size="small"
              onClick={() => setActiveView(WORKSPACE_VIEW_KEYS.IDEAS)}
              sx={{ p: 0.4 }}
            >
              <OpenInNewIcon sx={{ fontSize: 15 }} />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {/* ─── Collapsible Search Bar (Zero waste when closed) ──────────────── */}
      {showSearch && (
        <Box sx={{ px: 1.2, py: 0.6, borderBottom: 1, borderColor: 'divider', bgcolor: 'action.hover' }}>
          <TextField
            size="small"
            fullWidth
            autoFocus
            placeholder="Buscar por texto o palabra clave..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon sx={{ fontSize: 15, color: 'text.secondary' }} />
                </InputAdornment>
              ),
              endAdornment: searchQuery ? (
                <InputAdornment position="end">
                  <IconAction label="Limpiar búsqueda" size="small" onClick={() => setSearchQuery('')} sx={{ p: 0.2 }}>
                    <ClearIcon sx={{ fontSize: 13 }} />
                  </IconAction>
                </InputAdornment>
              ) : null,
              sx: { height: 28, fontSize: '0.76rem', borderRadius: 1.5, bgcolor: 'background.paper' },
            }}
          />
        </Box>
      )}

      {/* ─── Ultra-Compact 1-Line Quick Add Note Form ─────────────────────── */}
      <Box
        component="form"
        onSubmit={handleQuickAdd}
        sx={{
          px: 1.2,
          py: 0.8,
          borderBottom: 1,
          borderColor: 'divider',
          bgcolor: 'background.paper',
        }}
      >
        <TextField
          inputRef={quickInputRef}
          size="small"
          fullWidth
          placeholder={
            scopeFilter === 'global'
              ? 'Capturar idea global (Enter)...'
              : activeStory
              ? `Idea para ${activeStory.title} (Enter)...`
              : 'Escribir una idea rápida...'
          }
          value={quickText}
          onChange={(e) => setQuickText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleQuickAdd();
            }
          }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Tooltip title="Elegir color de la nota">
                  <Box
                    onClick={(e) => setColorPickerAnchor(e.currentTarget)}
                    sx={{
                      width: 14,
                      height: 14,
                      borderRadius: '50%',
                      bgcolor: selectedColor,
                      border: '1.5px solid rgba(0,0,0,0.3)',
                      cursor: 'pointer',
                      transition: 'transform 0.1s',
                      '&:hover': { transform: 'scale(1.2)' },
                    }}
                  />
                </Tooltip>
              </InputAdornment>
            ),
            endAdornment: (
              <InputAdornment position="end">
                <IconAction label="Agregar nota"
                  size="small"
                  type="submit"
                  disabled={!quickText.trim()}
                  color="primary"
                  sx={{ p: 0.3 }}
                >
                  <SendIcon sx={{ fontSize: 14 }} />
                </IconAction>
              </InputAdornment>
            ),
            sx: {
              height: 32,
              fontSize: '0.78rem',
              borderRadius: 2,
              bgcolor: 'action.hover',
            },
          }}
        />

        {/* Color Picker Popover */}
        <Menu
          anchorEl={colorPickerAnchor}
          open={Boolean(colorPickerAnchor)}
          onClose={() => setColorPickerAnchor(null)}
          PaperProps={{ sx: { p: 0.8, borderRadius: 2 } }}
        >
          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 0.8 }}>
            {NOTE_COLORS.map((col) => (
              <Box
                key={col}
                onClick={() => {
                  setSelectedColor(col);
                  setColorPickerAnchor(null);
                }}
                sx={{
                  width: 22,
                  height: 22,
                  borderRadius: '50%',
                  bgcolor: col,
                  border: selectedColor === col ? '2px solid #000' : '1px solid rgba(0,0,0,0.2)',
                  cursor: 'pointer',
                  '&:hover': { transform: 'scale(1.2)' },
                  transition: 'transform 0.1s',
                }}
              />
            ))}
          </Box>
        </Menu>
      </Box>

      {/* ─── Status Filter Mini-Pills ─────────────────────────────────────── */}
      <Box sx={{ px: 1.2, py: 0.5, display: 'flex', alignItems: 'center', gap: 0.4, borderBottom: 1, borderColor: 'divider', overflowX: 'auto' }}>
        <Chip
          label="Todos los estados"
          size="small"
          onClick={() => setStatusFilter('all')}
          color={statusFilter === 'all' ? 'primary' : 'default'}
          sx={{ height: 20, fontSize: '0.64rem', fontWeight: 600 }}
        />
        {NOTE_STATUSES.map((st) => (
          <Chip
            key={st.value}
            label={st.label}
            size="small"
            onClick={() => setStatusFilter(st.value)}
            color={statusFilter === st.value ? 'primary' : 'default'}
            sx={{
              height: 20,
              fontSize: '0.64rem',
              fontWeight: 600,
              bgcolor: statusFilter === st.value ? st.color : 'transparent',
              color: statusFilter === st.value ? '#fff' : 'inherit',
            }}
          />
        ))}
      </Box>

      {/* ─── Notes List / Grid ────────────────────────────────────────────── */}
      <Box sx={{ flexGrow: 1, overflowY: 'auto', p: 1.2 }}>
        {notesLoading && notes.length === 0 ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress size={24} />
          </Box>
        ) : notes.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 5, color: 'text.secondary' }}>
            <Typography variant="body2" sx={{ fontSize: '0.8rem' }}>
              No se encontraron ideas con los filtros actuales.
            </Typography>
          </Box>
        ) : viewFormat === 'dense' ? (
          /* Dense List Mode */
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
            {notes.map((note) => (
              <DenseNoteRow
                key={note.id}
                note={note}
                stories={stories}
                onUpdate={updateNote}
                onDelete={deleteNote}
              />
            ))}
          </Box>
        ) : (
          /* Cards Grid Mode (Capaz de crecer: 2 columnas en modo expandido) */
          <Box
            sx={{
              display: isExpanded ? 'grid' : 'block',
              gridTemplateColumns: isExpanded ? 'repeat(auto-fill, minmax(230px, 1fr))' : 'none',
              gap: isExpanded ? 1 : 0,
            }}
          >
            {notes.map((note) => (
              <CompactNoteCard
                key={note.id}
                note={note}
                stories={stories}
                onUpdate={updateNote}
                onDelete={deleteNote}
                onTogglePin={togglePinNote}
              />
            ))}
          </Box>
        )}
      </Box>

      {/* ─── Minimalist Paginator Footer ─────────────────────────────────── */}
      <Box
        sx={{
          px: 1.5,
          py: 0.6,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderTop: 1,
          borderColor: 'divider',
          bgcolor: 'background.subtle',
          minHeight: 34,
        }}
      >
        <Typography variant="caption" sx={{ fontSize: '0.68rem', color: 'text.secondary' }}>
          Pág. {page} de {totalPages} ({totalCount} ideas)
        </Typography>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.3 }}>
          <IconAction label="Página anterior"
            size="small"
            disabled={page <= 1}
            onClick={() => setPage(page - 1)}
            sx={{ p: 0.2 }}
          >
            <ChevronLeftIcon sx={{ fontSize: 16 }} />
          </IconAction>
          <Typography variant="caption" sx={{ fontSize: '0.7rem', fontWeight: 700, px: 0.5 }}>
            {page}
          </Typography>
          <IconAction label="Página siguiente"
            size="small"
            disabled={page >= totalPages}
            onClick={() => setPage(page + 1)}
            sx={{ p: 0.2 }}
          >
            <ChevronRightIcon sx={{ fontSize: 16 }} />
          </IconAction>
        </Box>
      </Box>
    </Box>
  );
}
