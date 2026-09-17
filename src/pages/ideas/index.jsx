import React, { useState, useEffect, useMemo } from 'react';
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
import { useStory } from '../../context/StoryContext';
import { useQuickNotes, NOTE_COLORS, NOTE_STATUSES } from '../../context/QuickNotesContext';
import { useWorkspace } from '../../context/WorkspaceContext';
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
      elevation={note.is_pinned ? 3 : 1}
      sx={{
        bgcolor: note.color,
        borderRadius: 3,
        border: note.is_pinned ? '2px solid rgba(0,0,0,0.25)' : '1px solid rgba(0,0,0,0.08)',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        justify: 'space-between',
        transition: 'all 0.2s ease',
        '&:hover': {
          transform: 'translateY(-3px)',
          boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
        },
      }}
    >
      <CardContent sx={{ p: { xs: 1.8, sm: 2 }, pb: 1 }}>
        {/* Header row: Status chip + Story Tag + Pin */}
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1, gap: 1, flexWrap: 'wrap' }}>
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
                boxShadow: '0 2px 5px rgba(0,0,0,0.15)',
                '&:hover': { opacity: 0.9 },
              }}
            />

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
                  maxWidth: 150,
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
              style: { fontSize: '0.92rem', lineHeight: 1.5, fontWeight: 500 },
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
              fontSize: '0.92rem',
              lineHeight: 1.5,
              fontWeight: 500,
              color: isDark ? '#eceff1' : '#212121',
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
              cursor: 'text',
              minHeight: 50,
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
          pb: 1.2,
          pt: 0,
          display: 'flex',
          justify: 'space-between',
          alignItems: 'center',
          borderTop: '1px solid rgba(0,0,0,0.06)',
          mt: 0.5,
        }}
      >
        <Typography
          variant="caption"
          sx={{
            fontSize: '0.68rem',
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
  const { notes, notesLoading, loadNotes, createNote, updateNote, deleteNote, togglePin } = useQuickNotes();
  const { characters } = useWorkspace();

  const [storyFilter, setStoryFilter] = useState('all'); // 'all' | 'global' | story_id
  const [activeTab, setActiveTab] = useState(0); // 0=Todas, 1=Ideas, 2=Pendientes, 3=Hechas, 4=Descartadas
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'kanban'
  const [searchQuery, setSearchQuery] = useState('');
  
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
    loadNotes(null);
  }, [loadNotes]);

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

  const filteredNotes = useMemo(() => {
    let result = [...notes];

    if (storyFilter === 'global') {
      result = result.filter((n) => !n.story_id);
    } else if (storyFilter !== 'all') {
      result = result.filter((n) => n.story_id === storyFilter);
    }

    if (activeTab === 1) result = result.filter((n) => n.status === 'idea');
    else if (activeTab === 2) result = result.filter((n) => n.status === 'pending');
    else if (activeTab === 3) result = result.filter((n) => n.status === 'done');
    else if (activeTab === 4) result = result.filter((n) => n.status === 'discarded');

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter((n) => n.content?.toLowerCase().includes(q));
    }

    return result;
  }, [notes, storyFilter, activeTab, searchQuery]);

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
      <SidebarLore view="ideas" story={activeStory} characters={characters} />

      <Box sx={{ flexGrow: 1, overflowY: 'auto', p: { xs: 0.8, sm: 2.5 }, bgcolor: 'background.default' }}>
        <Container maxWidth="xl" disableGutters sx={{ px: { xs: 0.5, sm: 2 } }}>
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

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, width: { xs: '100%', sm: 'auto' } }}>
              <ButtonGroup size="small" variant="outlined">
                <Button
                  variant={viewMode === 'grid' ? 'contained' : 'outlined'}
                  onClick={() => setViewMode('grid')}
                  startIcon={<ViewModuleIcon />}
                  sx={{ py: 0.4 }}
                >
                  Muro
                </Button>
                <Button
                  variant={viewMode === 'kanban' ? 'contained' : 'outlined'}
                  onClick={() => setViewMode('kanban')}
                  startIcon={<ViewColumnIcon />}
                  sx={{ py: 0.4 }}
                >
                  Tablero
                </Button>
              </ButtonGroup>
            </Box>
          </Box>

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

              <IconButton
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
              </IconButton>
            </Box>
          </Paper>

          {/* ─── Control Bar: Filter por Historia + Status Tabs + Buscador ─── */}
          <Paper
            elevation={0}
            sx={{
              display: 'flex',
              flexDirection: { xs: 'column', lg: 'row' },
              alignItems: { xs: 'stretch', lg: 'center' },
              justify: 'space-between',
              gap: 1.5,
              mb: 2,
              p: { xs: 0.6, sm: 0.8 },
              borderRadius: 2.5,
              bgcolor: 'background.paper',
              border: 1,
              borderColor: 'divider',
            }}
          >
            {/* Tabs de estado */}
            <Tabs
              value={activeTab}
              onChange={(e, val) => setActiveTab(val)}
              variant="scrollable"
              scrollButtons="auto"
              sx={{
                minHeight: 38,
                '& .MuiTab-root': { fontWeight: 700, fontSize: '0.82rem', textTransform: 'none', minHeight: 38, py: 0, px: { xs: 1.2, sm: 2 } },
              }}
            >
              <Tab label={`Todas (${counts.all})`} />
              <Tab icon={<LightbulbOutlinedIcon fontSize="small" />} iconPosition="start" label={`Ideas (${counts.idea})`} />
              <Tab icon={<AccessTimeIcon fontSize="small" />} iconPosition="start" label={`Pendientes (${counts.pending})`} />
              <Tab icon={<CheckCircleOutlineIcon fontSize="small" />} iconPosition="start" label={`Hechas (${counts.done})`} />
              <Tab icon={<DeleteOutlineIcon fontSize="small" />} iconPosition="start" label={`Descartadas (${counts.discarded})`} />
            </Tabs>

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: { xs: 'wrap', sm: 'nowrap' } }}>
              {/* Selector compacto de historias */}
              <FormControl size="small" sx={{ minWidth: 170 }}>
                <Select
                  value={storyFilter}
                  onChange={(e) => setStoryFilter(e.target.value)}
                  startAdornment={<FilterListIcon fontSize="small" sx={{ mr: 0.5, color: 'text.secondary' }} />}
                  sx={{ borderRadius: 2, fontSize: '0.82rem', height: 34 }}
                >
                  <MenuItem value="all">Ver: Todas las Historias ({notes.length})</MenuItem>
                  <MenuItem value="global"><PublicIcon fontSize="small" sx={{ mr: 1 }} /> Globales ({notes.filter((n) => !n.story_id).length})</MenuItem>
                  {stories.map((s) => (
                    <MenuItem key={s.id} value={s.id}>
                      <BookmarkBorderIcon fontSize="small" sx={{ mr: 1 }} /> {s.title} ({notes.filter((n) => n.story_id === s.id).length})
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              {/* Buscador */}
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
                  sx: { borderRadius: 2, bgcolor: 'background.subtle', height: 34, fontSize: '0.82rem', width: { xs: '100%', sm: 180 } },
                }}
              />
            </Box>
          </Paper>

          {/* ─── Main Content Display ─────────────────────────────────────── */}
          {notesLoading ? (
            <CustomLoading message="Cargando ideas centralizadas..." />
          ) : filteredNotes.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 6 }}>
              <LightbulbOutlinedIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 1 }} />
              <Typography variant="h6" sx={{ fontWeight: 700, color: 'text.secondary', fontSize: '1rem' }}>
                {searchQuery ? 'No se encontraron ideas con esa búsqueda' : 'No hay ideas en este filtro'}
              </Typography>
            </Box>
          ) : viewMode === 'grid' ? (
            /* GRID VIEW */
            <Grid container spacing={2}>
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
    </>
  );
}