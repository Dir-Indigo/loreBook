import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useRouter } from 'next/router';
import {
  Box,
  Typography,
  Container,
  Grid,
  Tabs,
  Tab,
  TextField,
  IconButton,
  Tooltip,
  Chip,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  InputAdornment,
  Paper,
  Card,
  CardContent,
  CardActions,
  Button,
  ButtonGroup,
  Select,
  FormControl,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import LightbulbOutlinedIcon from '@mui/icons-material/LightbulbOutlined';
import PushPinIcon from '@mui/icons-material/PushPin';
import PushPinOutlinedIcon from '@mui/icons-material/PushPinOutlined';
import PaletteOutlinedIcon from '@mui/icons-material/PaletteOutlined';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import SendIcon from '@mui/icons-material/Send';
import SearchIcon from '@mui/icons-material/Search';
import ViewModuleIcon from '@mui/icons-material/ViewModule';
import ViewColumnIcon from '@mui/icons-material/ViewColumn';
import AutoStoriesIcon from '@mui/icons-material/AutoStories';
import PublicIcon from '@mui/icons-material/Public';
import BookmarkBorderIcon from '@mui/icons-material/BookmarkBorder';
import FilterListIcon from '@mui/icons-material/FilterList';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import { useStory } from '../../../context/StoryContext';
import { useQuickNotes, NOTE_COLORS, NOTE_STATUSES } from '../../../context/QuickNotesContext';
import { useWorkspace } from '../../../context/WorkspaceContext';
import { useWorkspaceView } from '../../../context/WorkspaceViewContext';
import CustomLoading from '../../common/CustomLoading';
import CustomButton from '../../common/CustomButton';
import IconAction from '../../common/IconAction';
import IdeasToolbar from '../toolbars/IdeasToolbar';


// ─── Idea Management Card with Story Tagging ──────────────────────────────────
function CentralizedIdeaCard({ note, stories = [], onUpdate, onDelete, onTogglePin }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(note.content || '');
  const [isExpanded, setIsExpanded] = useState(false);
  const [colorAnchor, setColorAnchor] = useState(null);
  const [statusAnchor, setStatusAnchor] = useState(null);
  const [storyAnchor, setStoryAnchor] = useState(null);
  const textRef = useRef(null);

  useEffect(() => {
    setDraft(note.content || '');
  }, [note.content]);

  useEffect(() => {
    if (editing && textRef.current) {
      textRef.current.focus();
    }
  }, [editing]);

  const handleBlur = () => {
    setEditing(false);
    if (draft.trim() !== (note.content || '').trim()) {
      onUpdate(note.id, { content: draft.trim() || note.content });
    }
  };

  const statusInfo = NOTE_STATUSES.find((s) => s.value === note.status) || NOTE_STATUSES[0];
  const isDark = note.color === '#263238';
  const assignedStory = stories.find((s) => s.id === note.story_id);
  const contentText = note.content || '';
  const isLong = contentText.length > 220 || (contentText.match(/\n/g) || []).length >= 5;

  return (
    <Card
      elevation={0}
      sx={{
        bgcolor: note.color || '#f5e6c8',
        borderRadius: 2.5,
        border: '1px solid',
        borderColor: note.is_pinned
          ? (isDark ? 'rgba(255, 179, 0, 0.5)' : 'rgba(230, 81, 0, 0.4)')
          : (isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.08)'),
        height: 'auto',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        boxShadow: note.is_pinned
          ? '0 4px 14px -2px rgba(0,0,0,0.12), 0 2px 6px -1px rgba(0,0,0,0.06)'
          : '0 2px 8px -2px rgba(0,0,0,0.06), 0 1px 3px -1px rgba(0,0,0,0.03)',
        transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
        '&:hover': {
          transform: 'translateY(-2px)',
          boxShadow: '0 8px 24px -4px rgba(0,0,0,0.14), 0 4px 12px -2px rgba(0,0,0,0.07)',
          borderColor: note.is_pinned
            ? (isDark ? 'rgba(255, 179, 0, 0.7)' : 'rgba(230, 81, 0, 0.6)')
            : (isDark ? 'rgba(255, 255, 255, 0.22)' : 'rgba(0, 0, 0, 0.16)'),
          '& .card-actions-hover': {
            opacity: 1,
          },
        },
      }}
    >
      <CardContent sx={{ p: { xs: 1.5, sm: 1.8 }, pb: '10px !important' }}>
        {/* Header row: Status chip + Story Tag + Pin */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            mb: 1.2,
            gap: 0.8,
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.6, flexWrap: 'wrap', minWidth: 0, flex: 1 }}>
            {/* Status Pill */}
            <Tooltip title="Cambiar estado">
              <Chip
                size="small"
                onClick={(e) => setStatusAnchor(e.currentTarget)}
                icon={
                  <Box
                    sx={{
                      width: 7,
                      height: 7,
                      borderRadius: '50%',
                      bgcolor: statusInfo.color,
                      ml: '6px !important',
                      flexShrink: 0,
                    }}
                  />
                }
                label={statusInfo.label}
                sx={{
                  height: 22,
                  fontSize: '0.68rem',
                  fontWeight: 700,
                  bgcolor: isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.06)',
                  color: isDark ? '#fff' : 'rgba(0,0,0,0.8)',
                  border: '1px solid',
                  borderColor: isDark ? 'rgba(255,255,255,0.14)' : 'rgba(0,0,0,0.08)',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  '&:hover': {
                    bgcolor: isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.12)',
                  },
                  '& .MuiChip-label': { px: 0.8 },
                }}
              />
            </Tooltip>

            {/* Story Tag */}
            <Tooltip title={assignedStory ? `Historia vinculada: ${assignedStory.title}` : 'Idea global (sin historia vinculada)'}>
              <Chip
                icon={
                  assignedStory ? (
                    <BookmarkBorderIcon sx={{ fontSize: '13px !important', color: isDark ? '#90caf9' : '#1976d2' }} />
                  ) : (
                    <PublicIcon sx={{ fontSize: '13px !important', opacity: 0.65 }} />
                  )
                }
                label={assignedStory ? assignedStory.title : 'Global'}
                size="small"
                onClick={(e) => setStoryAnchor(e.currentTarget)}
                sx={{
                  height: 22,
                  fontSize: '0.68rem',
                  fontWeight: 600,
                  maxWidth: 135,
                  bgcolor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.04)',
                  color: isDark ? '#e0e0e0' : 'rgba(0,0,0,0.7)',
                  cursor: 'pointer',
                  border: '1px solid',
                  borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)',
                  transition: 'all 0.15s ease',
                  '&:hover': {
                    bgcolor: isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.08)',
                  },
                  '& .MuiChip-label': { px: 0.7, overflow: 'hidden', textOverflow: 'ellipsis' },
                }}
              />
            </Tooltip>
          </Box>

          {/* Pin Icon */}
          <Tooltip title={note.is_pinned ? 'Desanclar idea' : 'Anclar al inicio'}>
            <IconButton
              size="small"
              onClick={() => onTogglePin(note.id)}
              sx={{
                p: 0.4,
                color: note.is_pinned
                  ? (isDark ? '#ffca28' : '#e65100')
                  : (isDark ? 'rgba(255,255,255,0.45)' : 'rgba(0,0,0,0.35)'),
                bgcolor: note.is_pinned
                  ? (isDark ? 'rgba(255, 202, 40, 0.16)' : 'rgba(230, 81, 0, 0.08)')
                  : 'transparent',
                transform: note.is_pinned ? 'rotate(-20deg)' : 'none',
                transition: 'all 0.2s ease',
                '&:hover': {
                  bgcolor: note.is_pinned
                    ? (isDark ? 'rgba(255, 202, 40, 0.25)' : 'rgba(230, 81, 0, 0.15)')
                    : (isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)'),
                  color: note.is_pinned ? (isDark ? '#ffd54f' : '#f57c00') : (isDark ? '#fff' : '#000'),
                },
              }}
            >
              {note.is_pinned ? <PushPinIcon sx={{ fontSize: 17 }} /> : <PushPinOutlinedIcon sx={{ fontSize: 17 }} />}
            </IconButton>
          </Tooltip>
        </Box>

        {/* Content Body */}
        {editing ? (
          <TextField
            inputRef={textRef}
            multiline
            fullWidth
            autoFocus
            variant="standard"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onBlur={handleBlur}
            onKeyDown={(e) => {
              if (e.key === 'Escape') {
                setDraft(note.content || '');
                setEditing(false);
              }
            }}
            InputProps={{
              disableUnderline: true,
              style: {
                fontSize: '0.88rem',
                lineHeight: 1.6,
                fontWeight: 500,
                color: isDark ? '#eceff1' : '#1e293b',
              },
            }}
            sx={{
              '& textarea': {
                resize: 'none',
              },
            }}
          />
        ) : (
          <Box sx={{ position: 'relative' }}>
            <Box
              sx={{
                maxHeight: !isExpanded && isLong ? 170 : 'none',
                overflow: 'hidden',
                position: 'relative',
              }}
            >
              <Typography
                variant="body2"
                onClick={() => setEditing(true)}
                sx={{
                  fontSize: '0.88rem',
                  lineHeight: 1.6,
                  fontWeight: 500,
                  color: isDark ? '#f1f5f9' : '#1e293b',
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word',
                  cursor: 'text',
                  letterSpacing: '-0.01em',
                }}
              >
                {note.content || <em style={{ opacity: 0.4 }}>Toca aquí para escribir el contenido…</em>}
              </Typography>

              {/* Gradient fade if truncated */}
              {isLong && !isExpanded && (
                <Box
                  sx={{
                    position: 'absolute',
                    bottom: 0,
                    left: 0,
                    right: 0,
                    height: 52,
                    background: `linear-gradient(to bottom, transparent, ${note.color || '#f5e6c8'})`,
                    pointerEvents: 'none',
                  }}
                />
              )}
            </Box>

            {/* Toggle show more / show less */}
            {isLong && (
              <Box sx={{ display: 'flex', justifyContent: 'flex-start', mt: 0.6 }}>
                <Button
                  size="small"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsExpanded(!isExpanded);
                  }}
                  sx={{
                    p: 0,
                    minWidth: 'auto',
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    color: isDark ? '#90caf9' : '#1976d2',
                    textTransform: 'none',
                    '&:hover': { bgcolor: 'transparent', textDecoration: 'underline' },
                  }}
                >
                  {isExpanded ? 'Ver menos ▲' : 'Ver más… ▼'}
                </Button>
              </Box>
            )}
          </Box>
        )}
      </CardContent>

      {/* Footer row: Date & Actions */}
      <CardActions
        sx={{
          px: { xs: 1.5, sm: 1.8 },
          py: 0.8,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderTop: '1px solid',
          borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
          mt: 'auto',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <AccessTimeIcon sx={{ fontSize: 13, color: isDark ? 'rgba(255,255,255,0.45)' : 'rgba(0,0,0,0.4)' }} />
          <Typography
            variant="caption"
            sx={{
              fontSize: '0.68rem',
              fontWeight: 500,
              color: isDark ? 'rgba(255,255,255,0.45)' : 'rgba(0,0,0,0.45)',
            }}
          >
            {new Date(note.updated_at || note.created_at).toLocaleDateString('es', {
              day: 'numeric',
              month: 'short',
              hour: '2-digit',
              minute: '2-digit',
            })}
          </Typography>
        </Box>

        <Box
          className="card-actions-hover"
          sx={{
            display: 'flex',
            gap: 0.4,
            opacity: { xs: 1, sm: 0.7 },
            transition: 'opacity 0.15s ease',
          }}
        >
          <Tooltip title="Cambiar color de nota">
            <IconButton
              size="small"
              onClick={(e) => setColorAnchor(e.currentTarget)}
              sx={{
                p: 0.4,
                color: isDark ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.5)',
                '&:hover': {
                  bgcolor: isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.08)',
                  color: isDark ? '#fff' : '#000',
                },
              }}
            >
              <PaletteOutlinedIcon sx={{ fontSize: 16 }} />
            </IconButton>
          </Tooltip>

          <Tooltip title="Eliminar idea">
            <IconButton
              size="small"
              onClick={() => onDelete(note.id)}
              sx={{
                p: 0.4,
                color: isDark ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.5)',
                '&:hover': {
                  bgcolor: 'rgba(229, 57, 53, 0.12)',
                  color: 'error.main',
                },
              }}
            >
              <DeleteOutlineIcon sx={{ fontSize: 16 }} />
            </IconButton>
          </Tooltip>
        </Box>
      </CardActions>

      {/* Color menu */}
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

      {/* Status menu */}
      <Menu
        anchorEl={statusAnchor}
        open={Boolean(statusAnchor)}
        onClose={() => setStatusAnchor(null)}
      >
        {NOTE_STATUSES.map((s) => (
          <MenuItem
            key={s.value}
            onClick={() => {
              onUpdate(note.id, { status: s.value });
              setStatusAnchor(null);
            }}
          >
            <ListItemIcon>
              <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: s.color }} />
            </ListItemIcon>
            <ListItemText>{s.label}</ListItemText>
          </MenuItem>
        ))}
      </Menu>

      {/* Story Tag Assignment Menu */}
      <Menu
        anchorEl={storyAnchor}
        open={Boolean(storyAnchor)}
        onClose={() => setStoryAnchor(null)}
        PaperProps={{ sx: { minWidth: 220, borderRadius: 2.5 } }}
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
          <ListItemText primary="Global (Sin historia)" secondary="Disponible en todo el workspace" />
        </MenuItem>
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
    </Card>
  );
}

// ─── Centralized Ideas Page ───────────────────────────────────────────────────
export default function CentralizedIdeasPage() {
  const router = useRouter();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const { activeStory, stories } = useStory();
  const hasLoadedRef = useRef(false);
  const { notes, notesLoading, loadNotes, createNote, updateNote, deleteNote, togglePin } = useQuickNotes();
  const { characters } = useWorkspace();
  const {
    ideasSearch,
    ideasStatus,
    ideasStoryFilter: storyFilter,
    setIdeasStoryFilter: setStoryFilter,
    ideasViewMode: viewMode,
    hasWorkspaceNavbar,
  } = useWorkspaceView();

  // Fast note creation
  const [quickInput, setQuickInput] = useState('');
  const [newColor, setNewColor] = useState(NOTE_COLORS[0]);
  const [targetStoryId, setTargetStoryId] = useState(activeStory?.id || '');

  useEffect(() => {
    if (activeStory?.id && !targetStoryId) {
      setTargetStoryId(activeStory.id);
    }
  }, [activeStory?.id, targetStoryId]);

  useEffect(() => {
    // Solo cargar si aún no hay datos — evita re-fetch al alternar tabs
    if (!hasLoadedRef.current && !notes.length) {
      loadNotes(null);
      hasLoadedRef.current = true;
    } else if (!hasLoadedRef.current) {
      hasLoadedRef.current = true;
    }
  }, [loadNotes, notes.length]);

  useEffect(() => {
    if (router.query.story_id) {
      setStoryFilter(router.query.story_id);
    }
  }, [router.query.story_id, setStoryFilter]);

  const handleCreateFast = async (e) => {
    if (e) e.preventDefault();
    const text = quickInput.trim();
    if (!text) return;

    await createNote({
      content: text,
      color: newColor,
      story_id: targetStoryId ? targetStoryId : null,
      status: 'idea',
    });

    setQuickInput('');
  };

  const filteredNotes = useMemo(() => {
    let result = [...notes];

    if (storyFilter === 'global') {
      result = result.filter((n) => !n.story_id);
    } else if (storyFilter !== 'all') {
      result = result.filter((n) => n.story_id === storyFilter);
    }

    if (ideasStatus !== 'all') {
      result = result.filter((n) => n.status === ideasStatus);
    }

    const effectiveQuery = (ideasSearch || '').trim().toLowerCase();
    if (effectiveQuery) {
      result = result.filter((n) => n.content?.toLowerCase().includes(effectiveQuery));
    }

    // Ordenar notas: fijadas primero, luego por fecha más reciente
    result.sort((a, b) => {
      if (a.is_pinned !== b.is_pinned) {
        return a.is_pinned ? -1 : 1;
      }
      return new Date(b.updated_at || b.created_at || 0) - new Date(a.updated_at || a.created_at || 0);
    });

    return result;
  }, [notes, storyFilter, ideasStatus, ideasSearch]);

  const scopedNotes = useMemo(() => {
    if (storyFilter === 'global') return notes.filter((n) => !n.story_id);
    if (storyFilter !== 'all') return notes.filter((n) => n.story_id === storyFilter);
    return notes;
  }, [notes, storyFilter]);

  return (
    <Box sx={{ flexGrow: 1, overflowY: 'auto', p: { xs: 0.8, sm: 2.5 }, bgcolor: 'background.default' }}>
        <Container maxWidth="xl" disableGutters sx={{ px: { xs: 0.5, sm: 2 } }}>
          {!hasWorkspaceNavbar && (
            <>
          {/* Header Compacto */}
          <Box
            sx={{
              display: 'flex',
              flexDirection: { xs: 'column', sm: 'row' },
              justify: 'space-between',
              alignItems: { xs: 'flex-start', sm: 'center' },
              gap: 1.5,
              mb: 1.5,
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2 }}>
              <Box
                sx={{
                  width: 36,
                  height: 36,
                  borderRadius: 2,
                  bgcolor: 'primary.main',
                  color: '#fff',
                  display: 'flex',
                  alignItems: 'center',
                  justify: 'center',
                }}
              >
                <LightbulbOutlinedIcon sx={{ fontSize: 22 }} />
              </Box>
              <Typography variant="h5" sx={{ fontWeight: 800, fontSize: { xs: '1.2rem', sm: '1.4rem' } }}>
                Pizarra Central de Ideas
              </Typography>
            </Box>

          </Box>

            </>
          )}

          {/* ─── Captura Instantánea Compacta ─── */}
          <Paper
            elevation={1}
            component="form"
            onSubmit={handleCreateFast}
            sx={{
              p: { xs: 1, sm: 1.2 },
              mb: 1.8,
              borderRadius: 3,
              bgcolor: 'background.paper',
              border: 1,
              borderColor: 'divider',
              display: 'flex',
              flexDirection: { xs: 'column', md: 'row' },
              gap: 1,
              alignItems: { xs: 'stretch', md: 'center' },
            }}
          >
            <TextField
              value={quickInput}
              onChange={(e) => setQuickInput(e.target.value)}
              placeholder="Capturar idea instantánea y presiona Enter..."
              fullWidth
              size="small"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleCreateFast();
                }
              }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <LightbulbOutlinedIcon fontSize="small" color="primary" />
                  </InputAdornment>
                ),
                sx: { borderRadius: 2, bgcolor: 'background.subtle', fontSize: '0.88rem' },
              }}
            />

            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: { xs: 0.6, sm: 1 },
                width: { xs: '100%', md: 'auto' },
                justifyContent: 'space-between',
                flexWrap: { xs: 'nowrap', sm: 'nowrap' },
              }}
            >
              <FormControl size="small" sx={{ flexGrow: 1, minWidth: { xs: 100, sm: 150 }, maxWidth: { xs: 160, sm: 220 } }}>
                <Select
                  value={targetStoryId}
                  onChange={(e) => setTargetStoryId(e.target.value)}
                  displayEmpty
                  sx={{ borderRadius: 2, fontSize: '0.82rem', height: 36 }}
                >
                  <MenuItem value="">
                    <em><PublicIcon sx={{ fontSize: 16, mr: 1, verticalAlign: 'middle' }} /> Global</em>
                  </MenuItem>
                  {stories.map((s) => (
                    <MenuItem key={s.id} value={s.id}>
                      <BookmarkBorderIcon sx={{ fontSize: 16, mr: 1, verticalAlign: 'middle' }} /> {s.title}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <Box sx={{ display: 'flex', gap: 0.5, alignItems: 'center', flexShrink: 0 }}>
                {NOTE_COLORS.slice(0, 5).map((c) => (
                  <Box
                    key={c}
                    onClick={() => setNewColor(c)}
                    sx={{
                      width: 18,
                      height: 18,
                      borderRadius: '50%',
                      bgcolor: c,
                      border: c === newColor ? '2px solid #111' : '1px solid rgba(0,0,0,0.15)',
                      cursor: 'pointer',
                      transform: c === newColor ? 'scale(1.2)' : 'scale(1)',
                      transition: 'transform 0.15s ease',
                    }}
                  />
                ))}
              </Box>

              <IconAction label="Agregar idea"
                type="submit"
                disabled={!quickInput.trim()}
                sx={{
                  borderRadius: 2,
                  width: 36,
                  height: 36,
                  bgcolor: 'primary.main',
                  color: '#fff',
                  flexShrink: 0,
                  '&:hover': { bgcolor: 'primary.dark' },
                  '&.Mui-disabled': {
                    bgcolor: 'action.disabledBackground',
                    color: 'action.disabled',
                  },
                }}
              >
                <SendIcon fontSize="small" />
              </IconAction>
            </Box>
          </Paper>

          {/* ─── Controles: viven en el WorkspaceNavbar; aquí solo como respaldo en páginas sueltas ─── */}
          {!hasWorkspaceNavbar && (
            <Paper
              elevation={0}
              sx={{
                display: 'flex',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: 1,
                mb: 2,
                p: 1,
                borderRadius: 2.5,
                bgcolor: 'background.paper',
                border: 1,
                borderColor: 'divider',
              }}
            >
              <IdeasToolbar />
            </Paper>
          )}

          {/* ─── Main Content Display ─────────────────────────────────────── */}
          {notesLoading ? (
            <CustomLoading message="Cargando ideas centralizadas..." />
          ) : filteredNotes.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 6 }}>
              <LightbulbOutlinedIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 1 }} />
              <Typography variant="h6" sx={{ fontWeight: 700, color: 'text.secondary', fontSize: '1rem' }}>
                {ideasSearch ? 'No se encontraron ideas con esa búsqueda' : 'No hay ideas en este filtro'}
              </Typography>
            </Box>
          ) : viewMode === 'grid' ? (
            /* MASONRY WALL VIEW (Columnas orgánicas sin espacios vacíos ni estiramiento) */
            <Box
              sx={{
                columns: { xs: 1, sm: 2, md: 3, lg: 4, xl: 4 },
                columnGap: 2,
                width: '100%',
                '& > *': {
                  breakInside: 'avoid-column',
                  pageBreakInside: 'avoid',
                  display: 'inline-block',
                  width: '100%',
                  mb: 2,
                  verticalAlign: 'top',
                },
              }}
            >
              {filteredNotes.map((note) => (
                <Box key={note.id}>
                  <CentralizedIdeaCard
                    note={note}
                    stories={stories}
                    onUpdate={updateNote}
                    onDelete={deleteNote}
                    onTogglePin={togglePin}
                  />
                </Box>
              ))}
            </Box>
          ) : (
            /* KANBAN VIEW */
            <Grid container spacing={2}>
              {NOTE_STATUSES.map((statusObj) => {
                const columnNotes = scopedNotes.filter((n) => n.status === statusObj.value);
                return (
                  <Grid item key={statusObj.value} xs={12} sm={6} md={3}>
                    <Paper
                      elevation={0}
                      sx={{
                        p: 1.5,
                        borderRadius: 3,
                        bgcolor: 'background.subtle',
                        border: 1,
                        borderColor: 'divider',
                        minHeight: 400,
                        display: 'flex',
                        flexDirection: 'column',
                      }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: statusObj.color }} />
                          <Typography variant="subtitle2" sx={{ fontWeight: 800, fontSize: '0.85rem' }}>
                            {statusObj.label}
                          </Typography>
                        </Box>
                        <Chip size="small" label={columnNotes.length} sx={{ height: 18, fontSize: '0.68rem', fontWeight: 700 }} />
                      </Box>

                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, flex: 1, overflowY: 'auto' }}>
                        {columnNotes.map((note) => (
                          <CentralizedIdeaCard
                            key={note.id}
                            note={note}
                            stories={stories}
                            onUpdate={updateNote}
                            onDelete={deleteNote}
                            onTogglePin={togglePin}
                          />
                        ))}
                      </Box>
                    </Paper>
                  </Grid>
                );
              })}
            </Grid>
          )}
        </Container>
      </Box>
  );
}