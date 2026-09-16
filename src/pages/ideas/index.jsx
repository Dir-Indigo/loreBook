import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/router';
import {
  Box,
  Typography,
  Container,
  Grid,
  Divider,
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
import AddIcon from '@mui/icons-material/Add';
import SendIcon from '@mui/icons-material/Send';
import SearchIcon from '@mui/icons-material/Search';
import ViewModuleIcon from '@mui/icons-material/ViewModule';
import ViewColumnIcon from '@mui/icons-material/ViewColumn';
import AutoStoriesIcon from '@mui/icons-material/AutoStories';
import PublicIcon from '@mui/icons-material/Public';
import BookmarkBorderIcon from '@mui/icons-material/BookmarkBorder';
import { useAuth } from '../../context/AuthContext';
import { useStory } from '../../context/StoryContext';
import { useQuickNotes, NOTE_COLORS, NOTE_STATUSES } from '../../context/QuickNotesContext';
import SidebarLore from '../../components/layout/SidebarLore';
import CustomLoading from '../../components/common/CustomLoading';
import CustomButton from '../../components/common/CustomButton';

// ─── Idea Management Card with Story Tagging ──────────────────────────────────
function CentralizedIdeaCard({ note, stories = [], onUpdate, onDelete, onTogglePin }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(note.content);
  const [colorAnchor, setColorAnchor] = useState(null);
  const [statusAnchor, setStatusAnchor] = useState(null);
  const [storyAnchor, setStoryAnchor] = useState(null);

  useEffect(() => {
    setDraft(note.content);
  }, [note.content]);

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
    <Card
      elevation={note.is_pinned ? 4 : 1}
      sx={{
        bgcolor: note.color,
        borderRadius: 3,
        border: note.is_pinned ? '2px solid rgba(0,0,0,0.25)' : '1px solid rgba(0,0,0,0.08)',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        transition: 'all 0.2s ease',
        '&:hover': {
          transform: 'translateY(-3px)',
          boxShadow: '0 8px 24px rgba(0,0,0,0.14)',
        },
      }}
    >
      <CardContent sx={{ p: { xs: 2, sm: 2.2 }, pb: 1 }}>
        {/* Header row: Status chip + Story Tag + Pin */}
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.2, gap: 1, flexWrap: 'wrap' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8 }}>
            <Chip
              label={statusInfo.label}
              size="small"
              onClick={(e) => setStatusAnchor(e.currentTarget)}
              sx={{
                height: 22,
                fontSize: '0.7rem',
                fontWeight: 700,
                bgcolor: statusInfo.color,
                color: '#fff',
                cursor: 'pointer',
                boxShadow: '0 2px 6px rgba(0,0,0,0.18)',
                '&:hover': { opacity: 0.9 },
              }}
            />

            {/* Story Tag Chip (Click to assign/change story) */}
            <Tooltip title="Asignar o cambiar historia vinculada">
              <Chip
                icon={assignedStory ? <BookmarkBorderIcon sx={{ fontSize: '14px !important' }} /> : <PublicIcon sx={{ fontSize: '14px !important' }} />}
                label={assignedStory ? assignedStory.title : 'Global (Sin historia)'}
                size="small"
                onClick={(e) => setStoryAnchor(e.currentTarget)}
                sx={{
                  height: 22,
                  fontSize: '0.68rem',
                  fontWeight: 600,
                  maxWidth: 160,
                  bgcolor: assignedStory ? 'rgba(0,0,0,0.08)' : 'rgba(0,0,0,0.04)',
                  color: isDark ? '#fff' : 'inherit',
                  cursor: 'pointer',
                  border: '1px solid rgba(0,0,0,0.12)',
                  '&:hover': { bgcolor: 'rgba(0,0,0,0.15)' },
                }}
              />
            </Tooltip>
          </Box>

          <Tooltip title={note.is_pinned ? 'Desanclar' : 'Anclar al inicio'}>
            <IconButton size="small" onClick={() => onTogglePin(note.id)}>
              {note.is_pinned ? (
                <PushPinIcon sx={{ fontSize: 18, color: isDark ? '#ffca28' : '#e65100' }} />
              ) : (
                <PushPinOutlinedIcon sx={{ fontSize: 18, color: isDark ? '#b0bec5' : '#757575' }} />
              )}
            </IconButton>
          </Tooltip>
        </Box>

        {/* Content Body */}
        {editing ? (
          <TextField
            multiline
            fullWidth
            autoFocus
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
              style: { fontSize: '0.95rem', lineHeight: 1.6, fontWeight: 500 },
            }}
            sx={{
              '& textarea': {
                color: isDark ? '#eceff1' : '#212121',
                resize: 'none',
              },
            }}
          />
        ) : (
          <Typography
            variant="body1"
            onClick={() => setEditing(true)}
            sx={{
              fontSize: '0.95rem',
              lineHeight: 1.6,
              fontWeight: 500,
              color: isDark ? '#eceff1' : '#212121',
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
              cursor: 'text',
              minHeight: 55,
            }}
          >
            {note.content || <em style={{ opacity: 0.4 }}>Toca aquí para escribir el contenido…</em>}
          </Typography>
        )}
      </CardContent>

      {/* Footer row: Date & Actions */}
      <CardActions
        sx={{
          px: 2,
          pb: 1.5,
          pt: 0,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderTop: '1px solid rgba(0,0,0,0.06)',
          mt: 1,
        }}
      >
        <Typography
          variant="caption"
          sx={{
            fontSize: '0.7rem',
            opacity: 0.55,
            color: isDark ? '#b0bec5' : '#616161',
          }}
        >
          {new Date(note.updated_at).toLocaleDateString('es', {
            day: 'numeric',
            month: 'short',
            hour: '2-digit',
            minute: '2-digit',
          })}
        </Typography>

        <Box sx={{ display: 'flex', gap: 0.5 }}>
          <Tooltip title="Cambiar color">
            <IconButton size="small" onClick={(e) => setColorAnchor(e.currentTarget)}>
              <PaletteOutlinedIcon sx={{ fontSize: 18, color: isDark ? '#b0bec5' : '#616161' }} />
            </IconButton>
          </Tooltip>

          <Tooltip title="Eliminar idea">
            <IconButton size="small" onClick={() => onDelete(note.id)}>
              <DeleteOutlineIcon sx={{ fontSize: 18, color: '#e53935' }} />
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
          <ListItemText primary="🌐 Global (Sin historia)" secondary="Disponible en todo el workspace" />
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
    </Card>
  );
}

// ─── Centralized Ideas Page ───────────────────────────────────────────────────
export default function CentralizedIdeasPage() {
  const router = useRouter();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const { activeStory, stories } = useStory();
  const { notes, notesLoading, loadNotes, createNote, updateNote, deleteNote, togglePin } = useQuickNotes();

  const [storyFilter, setStoryFilter] = useState('all'); // 'all' | 'global' | story_id
  const [activeTab, setActiveTab] = useState(0); // 0=Todas, 1=Ideas, 2=Pendientes, 3=Hechas, 4=Descartadas
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'kanban'
  const [searchQuery, setSearchQuery] = useState('');
  
  // Fast note creation
  const [quickInput, setQuickInput] = useState('');
  const [newColor, setNewColor] = useState(NOTE_COLORS[0]);
  const [targetStoryId, setTargetStoryId] = useState(activeStory?.id || '');

  // Keep targetStoryId in sync with activeStory initially
  useEffect(() => {
    if (activeStory?.id && !targetStoryId) {
      setTargetStoryId(activeStory.id);
    }
  }, [activeStory?.id, targetStoryId]);

  // Load all user notes (centralized)
  useEffect(() => {
    loadNotes(null);
  }, [loadNotes]);

  // Check query params if story_id was passed
  useEffect(() => {
    if (router.query.story_id) {
      setStoryFilter(router.query.story_id);
    }
  }, [router.query.story_id]);

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

  // Filtered notes based on story, status tab, and search
  const filteredNotes = useMemo(() => {
    let result = [...notes];

    // Story filter
    if (storyFilter === 'global') {
      result = result.filter((n) => !n.story_id);
    } else if (storyFilter !== 'all') {
      result = result.filter((n) => n.story_id === storyFilter);
    }

    // Status tab filter
    if (activeTab === 1) result = result.filter((n) => n.status === 'idea');
    else if (activeTab === 2) result = result.filter((n) => n.status === 'pending');
    else if (activeTab === 3) result = result.filter((n) => n.status === 'done');
    else if (activeTab === 4) result = result.filter((n) => n.status === 'discarded');

    // Search query filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter((n) => n.content?.toLowerCase().includes(q));
    }

    return result;
  }, [notes, storyFilter, activeTab, searchQuery]);

  // Status counts for current story scope
  const scopedNotes = useMemo(() => {
    if (storyFilter === 'global') return notes.filter((n) => !n.story_id);
    if (storyFilter !== 'all') return notes.filter((n) => n.story_id === storyFilter);
    return notes;
  }, [notes, storyFilter]);

  const counts = useMemo(() => {
    return {
      all: scopedNotes.length,
      idea: scopedNotes.filter((n) => n.status === 'idea').length,
      pending: scopedNotes.filter((n) => n.status === 'pending').length,
      done: scopedNotes.filter((n) => n.status === 'done').length,
      discarded: scopedNotes.filter((n) => n.status === 'discarded').length,
    };
  }, [scopedNotes]);

  return (
    <>
      <SidebarLore view="ideas" story={activeStory} />

      <Box sx={{ flexGrow: 1, overflowY: 'auto', p: { xs: 2, sm: 3, md: 4 }, bgcolor: 'background.default' }}>
        <Container maxWidth="xl">
          {/* Header row */}
          <Box
            sx={{
              display: 'flex',
              flexDirection: { xs: 'column', sm: 'row' },
              justifyContent: 'space-between',
              alignItems: { xs: 'flex-start', sm: 'center' },
              gap: 2,
              mb: 3,
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Box
                sx={{
                  width: 44,
                  height: 44,
                  borderRadius: 2.5,
                  bgcolor: 'primary.main',
                  color: '#fff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 4px 14px rgba(0,0,0,0.15)',
                }}
              >
                <LightbulbOutlinedIcon sx={{ fontSize: 26 }} />
              </Box>
              <Box>
                <Typography variant="h4" sx={{ fontWeight: 800, fontSize: { xs: '1.4rem', sm: '1.8rem' } }}>
                  Pizarra Central de Ideas
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Todas tus ideas organizadas por historia o globales en un solo lugar.
                </Typography>
              </Box>
            </Box>

            {/* View Mode Toggle & Canvas Link */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, width: { xs: '100%', sm: 'auto' } }}>
              <ButtonGroup size="small" variant="outlined">
                <Button
                  variant={viewMode === 'grid' ? 'contained' : 'outlined'}
                  onClick={() => setViewMode('grid')}
                  startIcon={<ViewModuleIcon />}
                >
                  Muro
                </Button>
                <Button
                  variant={viewMode === 'kanban' ? 'contained' : 'outlined'}
                  onClick={() => setViewMode('kanban')}
                  startIcon={<ViewColumnIcon />}
                >
                  Tablero
                </Button>
              </ButtonGroup>

              <CustomButton
                variant="outlined"
                size="small"
                startIcon={<AutoStoriesIcon fontSize="small" />}
                onClick={() => router.push('/dashboard')}
                sx={{ whiteSpace: 'nowrap' }}
              >
                Lienzo
              </CustomButton>
            </Box>
          </Box>

          {/* ─── Ultra-Fast Capture Banner ────────────────────────────────── */}
          <Paper
            elevation={2}
            component="form"
            onSubmit={handleCreateFast}
            sx={{
              p: { xs: 2, sm: 2.5 },
              mb: 3.5,
              borderRadius: 3.5,
              bgcolor: 'background.paper',
              border: 1,
              borderColor: 'divider',
              boxShadow: '0 4px 20px rgba(0,0,0,0.06)',
            }}
          >
            <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1.2, color: 'text.secondary', display: 'flex', alignItems: 'center', gap: 0.8 }}>
              <LightbulbOutlinedIcon fontSize="small" color="primary" /> Capturar idea instantánea
            </Typography>

            <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 1.5, alignItems: { md: 'center' } }}>
              <TextField
                value={quickInput}
                onChange={(e) => setQuickInput(e.target.value)}
                placeholder="Escribe tu idea aquí y presiona Enter…"
                fullWidth
                size="medium"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleCreateFast();
                  }
                }}
                InputProps={{
                  sx: { borderRadius: 2.5, bgcolor: 'background.subtle' },
                }}
              />

              {/* Story selector & Controls */}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: { xs: 'wrap', sm: 'nowrap' }, justifyContent: 'space-between' }}>
                <FormControl size="small" sx={{ minWidth: 160 }}>
                  <Select
                    value={targetStoryId}
                    onChange={(e) => setTargetStoryId(e.target.value)}
                    displayEmpty
                    sx={{ borderRadius: 2, fontSize: '0.85rem' }}
                  >
                    <MenuItem value="">
                      <em>🌐 Global (Sin historia)</em>
                    </MenuItem>
                    {stories.map((s) => (
                      <MenuItem key={s.id} value={s.id}>
                        📚 {s.title}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                {/* Color pickers */}
                <Box sx={{ display: 'flex', gap: 0.8, alignItems: 'center' }}>
                  {NOTE_COLORS.slice(0, 5).map((c) => (
                    <Box
                      key={c}
                      onClick={() => setNewColor(c)}
                      sx={{
                        width: 22,
                        height: 22,
                        borderRadius: '50%',
                        bgcolor: c,
                        border: c === newColor ? '2.5px solid #111' : '1.5px solid rgba(0,0,0,0.15)',
                        cursor: 'pointer',
                        transform: c === newColor ? 'scale(1.25)' : 'scale(1)',
                        transition: 'transform 0.15s ease',
                      }}
                    />
                  ))}
                </Box>

                <Button
                  type="submit"
                  variant="contained"
                  disabled={!quickInput.trim()}
                  startIcon={<SendIcon fontSize="small" />}
                  sx={{
                    borderRadius: 2.5,
                    px: 2.5,
                    py: 1,
                    fontWeight: 700,
                    textTransform: 'none',
                    whiteSpace: 'nowrap',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                  }}
                >
                  Crear
                </Button>
              </Box>
            </Box>
          </Paper>

          {/* ─── Story Filter Chips (Centralized Organizer) ──────────────── */}
          <Box sx={{ mb: 2.5 }}>
            <Typography variant="caption" sx={{ fontWeight: 800, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: '0.04em', display: 'block', mb: 1 }}>
              Filtrar por Historia:
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, overflowX: 'auto', pb: 0.5, alignItems: 'center' }}>
              <Chip
                label={`Todas (${notes.length})`}
                onClick={() => setStoryFilter('all')}
                color={storyFilter === 'all' ? 'primary' : 'default'}
                variant={storyFilter === 'all' ? 'filled' : 'outlined'}
                sx={{ fontWeight: 700, borderRadius: 2 }}
              />
              <Chip
                icon={<PublicIcon fontSize="small" />}
                label={`Globales (${notes.filter((n) => !n.story_id).length})`}
                onClick={() => setStoryFilter('global')}
                color={storyFilter === 'global' ? 'primary' : 'default'}
                variant={storyFilter === 'global' ? 'filled' : 'outlined'}
                sx={{ fontWeight: 700, borderRadius: 2 }}
              />
              <Divider orientation="vertical" flexItem sx={{ mx: 0.5 }} />
              {stories.map((s) => {
                const count = notes.filter((n) => n.story_id === s.id).length;
                return (
                  <Chip
                    key={s.id}
                    icon={<BookmarkBorderIcon fontSize="small" />}
                    label={`${s.title} (${count})`}
                    onClick={() => setStoryFilter(s.id)}
                    color={storyFilter === s.id ? 'primary' : 'default'}
                    variant={storyFilter === s.id ? 'filled' : 'outlined'}
                    sx={{ fontWeight: 700, borderRadius: 2 }}
                  />
                );
              })}
            </Box>
          </Box>

          {/* ─── Status Tabs and Search ──────────────────────────────────── */}
          <Box
            sx={{
              display: 'flex',
              flexDirection: { xs: 'column', md: 'row' },
              justifyContent: 'space-between',
              alignItems: { xs: 'stretch', md: 'center' },
              gap: 2,
              mb: 3,
              borderBottom: 1,
              borderColor: 'divider',
              pb: 1,
            }}
          >
            <Tabs
              value={activeTab}
              onChange={(e, val) => setActiveTab(val)}
              variant="scrollable"
              scrollButtons="auto"
              sx={{ '& .MuiTab-root': { fontWeight: 700, fontSize: '0.88rem', textTransform: 'none' } }}
            >
              <Tab label={`Todas (${counts.all})`} />
              <Tab label={`💡 Ideas (${counts.idea})`} />
              <Tab label={`⏳ Pendientes (${counts.pending})`} />
              <Tab label={`✅ Hechas (${counts.done})`} />
              <Tab label={`🗑️ Descartadas (${counts.discarded})`} />
            </Tabs>

            <TextField
              size="small"
              placeholder="Buscar en ideas…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon fontSize="small" sx={{ color: 'text.secondary' }} />
                  </InputAdornment>
                ),
                sx: { borderRadius: 2, bgcolor: 'background.paper', width: { xs: '100%', md: 260 } },
              }}
            />
          </Box>

          {/* ─── Main Content Display ─────────────────────────────────────── */}
          {notesLoading ? (
            <CustomLoading message="Cargando ideas centralizadas..." />
          ) : filteredNotes.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 8 }}>
              <LightbulbOutlinedIcon sx={{ fontSize: 60, color: 'text.disabled', mb: 2 }} />
              <Typography variant="h6" sx={{ fontWeight: 700, color: 'text.secondary' }}>
                {searchQuery ? 'No se encontraron ideas con esa búsqueda' : 'No hay ideas en este filtro'}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                Usa el cuadro superior para capturar tus notas y vincularlas a cualquier historia.
              </Typography>
            </Box>
          ) : viewMode === 'grid' ? (
            /* ─── GRID / WALL VIEW ─── */
            <Grid container spacing={2.5}>
              {filteredNotes.map((note) => (
                <Grid item key={note.id} xs={12} sm={6} md={4} lg={3}>
                  <CentralizedIdeaCard
                    note={note}
                    stories={stories}
                    onUpdate={updateNote}
                    onDelete={deleteNote}
                    onTogglePin={togglePin}
                  />
                </Grid>
              ))}
            </Grid>
          ) : (
            /* ─── KANBAN COLUMN VIEW ─── */
            <Grid container spacing={2}>
              {NOTE_STATUSES.map((statusObj) => {
                const columnNotes = scopedNotes.filter((n) => n.status === statusObj.value);
                return (
                  <Grid item key={statusObj.value} xs={12} sm={6} md={3}>
                    <Paper
                      elevation={0}
                      sx={{
                        p: 2,
                        borderRadius: 3,
                        bgcolor: 'background.subtle',
                        border: 1,
                        borderColor: 'divider',
                        minHeight: 450,
                        display: 'flex',
                        flexDirection: 'column',
                      }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: statusObj.color }} />
                          <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>
                            {statusObj.label}
                          </Typography>
                        </Box>
                        <Chip size="small" label={columnNotes.length} sx={{ height: 20, fontSize: '0.7rem', fontWeight: 700 }} />
                      </Box>

                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, flex: 1, overflowY: 'auto' }}>
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
    </>
  );
}
