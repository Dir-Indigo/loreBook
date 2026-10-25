import React from 'react';
import {
  Box,
  Button,
  ButtonGroup,
  Chip,
  Divider,
  FormControl,
  InputAdornment,
  MenuItem,
  Select,
  TextField,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import ClearIcon from '@mui/icons-material/Clear';
import FilterListIcon from '@mui/icons-material/FilterList';
import PublicIcon from '@mui/icons-material/Public';
import BookmarkBorderIcon from '@mui/icons-material/BookmarkBorder';
import ViewModuleIcon from '@mui/icons-material/ViewModule';
import ViewColumnIcon from '@mui/icons-material/ViewColumn';

import { useWorkspaceView } from '../../../context/WorkspaceViewContext';
import { useQuickNotes, NOTE_STATUSES } from '../../../context/QuickNotesContext';
import { useStory } from '../../../context/StoryContext';
import IconAction from '../../common/IconAction';

/**
 * IdeasToolbar — Controles contextuales de la Pizarra de Ideas.
 * Estado (estado de nota, historia, búsqueda, modo de vista) vive en WorkspaceViewContext.
 */
export default function IdeasToolbar() {
  const {
    ideasSearch,
    setIdeasSearch,
    ideasStatus,
    setIdeasStatus,
    ideasStoryFilter,
    setIdeasStoryFilter,
    ideasViewMode,
    setIdeasViewMode,
  } = useWorkspaceView();
  const { notes = [] } = useQuickNotes();
  const { stories = [] } = useStory();

  // Conteos por estado dentro de la historia seleccionada
  const scoped =
    ideasStoryFilter === 'global'
      ? notes.filter((n) => !n.story_id)
      : ideasStoryFilter !== 'all'
      ? notes.filter((n) => n.story_id === ideasStoryFilter)
      : notes;

  const statusChips = [{ value: 'all', label: 'Todas', count: scoped.length }].concat(
    NOTE_STATUSES.map((st) => ({
      value: st.value,
      label: st.label,
      count: scoped.filter((n) => n.status === st.value).length,
    }))
  );

  return (
    <>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, flexWrap: 'wrap' }}>
          {statusChips.map((st) => (
            <Chip
              key={st.value}
              size="small"
              label={`${st.label} (${st.count})`}
              clickable
              color={ideasStatus === st.value ? 'primary' : 'default'}
              onClick={() => setIdeasStatus(st.value)}
              sx={{ height: 26, fontSize: '0.72rem', fontWeight: ideasStatus === st.value ? 800 : 500 }}
            />
          ))}
        </Box>

        <Divider orientation="vertical" flexItem sx={{ my: 0.5 }} />

        <FormControl size="small" sx={{ minWidth: 180 }}>
          <Select
            value={ideasStoryFilter}
            onChange={(e) => setIdeasStoryFilter(e.target.value)}
            startAdornment={<FilterListIcon sx={{ fontSize: 16, mr: 0.5, color: 'text.secondary' }} />}
            sx={{ borderRadius: 1.8, fontSize: '0.75rem', fontWeight: 600, height: 28, bgcolor: 'background.paper', '& .MuiSelect-select': { py: 0 } }}
          >
            <MenuItem value="all">Todas las historias ({notes.length})</MenuItem>
            <MenuItem value="global">
              <PublicIcon fontSize="small" sx={{ mr: 1 }} /> Globales ({notes.filter((n) => !n.story_id).length})
            </MenuItem>
            {stories.map((s) => (
              <MenuItem key={s.id} value={s.id}>
                <BookmarkBorderIcon fontSize="small" sx={{ mr: 1 }} /> {s.title} ({notes.filter((n) => n.story_id === s.id).length})
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <TextField
          size="small"
          placeholder="Buscar en ideas…"
          value={ideasSearch}
          onChange={(e) => setIdeasSearch(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
              </InputAdornment>
            ),
            endAdornment: ideasSearch ? (
              <InputAdornment position="end">
                <IconAction label="Limpiar búsqueda" size="small" onClick={() => setIdeasSearch('')} sx={{ p: 0.2 }}>
                  <ClearIcon sx={{ fontSize: 14 }} />
                </IconAction>
              </InputAdornment>
            ) : null,
          }}
          sx={{
            width: { xs: 140, sm: 200 },
            '& .MuiInputBase-root': { height: 28, fontSize: '0.78rem', bgcolor: 'background.paper', borderRadius: 1.8 },
          }}
        />
      </Box>

      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, ml: 'auto' }}>
        <ButtonGroup size="small" variant="outlined">
          <Button
            variant={ideasViewMode === 'grid' ? 'contained' : 'outlined'}
            onClick={() => setIdeasViewMode('grid')}
            startIcon={<ViewModuleIcon sx={{ fontSize: 16 }} />}
            sx={{ py: 0, height: 28, fontSize: '0.72rem', textTransform: 'none', fontWeight: 700 }}
          >
            Muro
          </Button>
          <Button
            variant={ideasViewMode === 'kanban' ? 'contained' : 'outlined'}
            onClick={() => setIdeasViewMode('kanban')}
            startIcon={<ViewColumnIcon sx={{ fontSize: 16 }} />}
            sx={{ py: 0, height: 28, fontSize: '0.72rem', textTransform: 'none', fontWeight: 700 }}
          >
            Tablero
          </Button>
        </ButtonGroup>
      </Box>
    </>
  );
}
