import React from 'react';
import {
  Box,
  Button,
  ButtonGroup,
  Chip,
  Divider,
  FormControl,
  IconButton,
  InputAdornment,
  MenuItem,
  Select,
  TextField,
  Tooltip,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import ClearIcon from '@mui/icons-material/Clear';
import FilterListIcon from '@mui/icons-material/FilterList';
import SortByAlphaIcon from '@mui/icons-material/SortByAlpha';
import LocalOfferOutlinedIcon from '@mui/icons-material/LocalOfferOutlined';
import PsychologyOutlinedIcon from '@mui/icons-material/PsychologyOutlined';
import FileDownloadOutlinedIcon from '@mui/icons-material/FileDownloadOutlined';
import GridViewIcon from '@mui/icons-material/GridView';
import ViewModuleIcon from '@mui/icons-material/ViewModule';
import ViewComfyIcon from '@mui/icons-material/ViewComfy';
import ViewAgendaIcon from '@mui/icons-material/ViewAgenda';
import DescriptionOutlinedIcon from '@mui/icons-material/DescriptionOutlined';
import AccountTreeOutlinedIcon from '@mui/icons-material/AccountTreeOutlined';

import { useWorkspaceView } from '../../../context/WorkspaceViewContext';
import { DEFAULT_ENTITY_COLOR } from '../../../constants/constants';
import IconAction from '../../common/IconAction';

const SCOPES = [
  { label: 'Locales', value: 0, countKey: 'local' },
  { label: 'Globales', value: 1, countKey: 'global' },
  { label: 'Todos', value: 2, countKey: 'all' },
];

const VIEW_MODES = [
  { value: 'gallery', label: 'Mosaico (galería de retratos)', Icon: GridViewIcon },
  { value: 'compact', label: 'Vista compacta', Icon: ViewModuleIcon },
  { value: 'medium', label: 'Vista media', Icon: ViewComfyIcon },
  { value: 'detailed', label: 'Vista detallada', Icon: ViewAgendaIcon },
];

const selectSx = {
  borderRadius: 1.8,
  fontSize: '0.75rem',
  fontWeight: 600,
  height: 28,
  bgcolor: 'background.paper',
  '& .MuiSelect-select': { py: 0 },
};

const toggleSx = (active) => ({
  border: 1,
  borderColor: active ? 'primary.main' : 'divider',
  bgcolor: active ? 'action.selected' : 'background.paper',
  color: active ? 'primary.main' : 'text.secondary',
  borderRadius: 1.8,
  p: 0.5,
  height: 28,
  width: 28,
});

const manageBtnSx = {
  height: 28,
  py: 0,
  px: 1.1,
  fontSize: '0.72rem',
  fontWeight: 700,
  textTransform: 'none',
  borderRadius: 1.8,
  borderColor: 'divider',
  bgcolor: 'background.paper',
  color: 'text.primary',
  whiteSpace: 'nowrap',
};

/**
 * CharactersToolbar — Controles contextuales de la vista de Personajes.
 * Se renderiza en el piso 2 del WorkspaceNavbar (o dentro de la vista si no hay navbar).
 * Los datos (tags, roles, conteos) y los modales los registra CharactersWorkspaceView vía contexto.
 */
export default function CharactersToolbar() {
  const {
    charactersSearch,
    setCharactersSearch,
    charactersRoleFilter,
    setCharactersRoleFilter,
    charactersScope,
    setCharactersScope,
    charactersTag,
    setCharactersTag,
    charactersSort,
    setCharactersSort,
    charactersViewMode,
    setCharactersViewMode,
    charactersShowDescriptions,
    setCharactersShowDescriptions,
    charactersGroupByRole,
    setCharactersGroupByRole,
    charactersToolbar,
  } = useWorkspaceView();

  const {
    counts = { local: 0, global: 0, all: 0, shown: 0 },
    tags = [],
    roles = [],
    archetypesCount = 0,
    onOpenArchetypes,
    onOpenTags,
    onOpenExport,
  } = charactersToolbar || {};

  return (
    <>
      {/* ── Izquierda: búsqueda y filtros ── */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
        <TextField
          size="small"
          placeholder="Buscar personaje o etiqueta…"
          value={charactersSearch}
          onChange={(e) => setCharactersSearch(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
              </InputAdornment>
            ),
            endAdornment: charactersSearch ? (
              <InputAdornment position="end">
                <IconAction label="Limpiar búsqueda" size="small" onClick={() => setCharactersSearch('')} sx={{ p: 0.2 }}>
                  <ClearIcon sx={{ fontSize: 14 }} />
                </IconAction>
              </InputAdornment>
            ) : null,
          }}
          sx={{
            width: { xs: 160, sm: 230 },
            '& .MuiInputBase-root': { height: 28, fontSize: '0.78rem', bgcolor: 'background.paper', borderRadius: 1.8 },
          }}
        />

        {/* Ámbito: Locales / Globales / Todos (con conteo) */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            bgcolor: 'background.paper',
            p: '2px',
            borderRadius: 1.8,
            border: 1,
            borderColor: 'divider',
          }}
        >
          {SCOPES.map((s) => {
            const active = charactersScope === s.value;
            return (
              <Button
                key={s.value}
                size="small"
                onClick={() => setCharactersScope(s.value)}
                sx={{
                  py: 0.1,
                  px: 1,
                  fontSize: '0.7rem',
                  fontWeight: active ? 800 : 500,
                  textTransform: 'none',
                  minWidth: 0,
                  borderRadius: 1.4,
                  bgcolor: active ? 'primary.main' : 'transparent',
                  color: active ? 'primary.contrastText' : 'text.secondary',
                  '&:hover': { bgcolor: active ? 'primary.dark' : 'action.hover' },
                }}
              >
                {s.label} ({counts[s.countKey] ?? 0})
              </Button>
            );
          })}
        </Box>

        {/* Etiqueta */}
        <FormControl size="small" sx={{ minWidth: 150 }}>
          <Select
            value={charactersTag}
            onChange={(e) => setCharactersTag(e.target.value)}
            startAdornment={<LocalOfferOutlinedIcon sx={{ fontSize: 16, mr: 0.5, color: 'text.secondary' }} />}
            sx={selectSx}
          >
            <MenuItem value="all">Todas las etiquetas</MenuItem>
            {tags.map((tag) => (
              <MenuItem key={tag.id} value={tag.id}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8 }}>
                  <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: tag.color || DEFAULT_ENTITY_COLOR }} />
                  {tag.name}
                </Box>
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        {/* Rol / arquetipo */}
        <FormControl size="small" sx={{ minWidth: 140 }}>
          <Select
            value={charactersRoleFilter}
            onChange={(e) => setCharactersRoleFilter(e.target.value)}
            startAdornment={<FilterListIcon sx={{ fontSize: 16, mr: 0.5, color: 'text.secondary' }} />}
            sx={selectSx}
          >
            <MenuItem value="all">Todos los roles</MenuItem>
            {roles.map((role) => (
              <MenuItem key={role} value={role}>
                {role}
              </MenuItem>
            ))}
            <MenuItem value="Sin rol">Sin rol</MenuItem>
          </Select>
        </FormControl>

        {/* Orden */}
        <FormControl size="small" sx={{ minWidth: 160 }}>
          <Select
            value={charactersSort}
            onChange={(e) => setCharactersSort(e.target.value)}
            startAdornment={<SortByAlphaIcon sx={{ fontSize: 16, mr: 0.5, color: 'text.secondary' }} />}
            sx={selectSx}
          >
            <MenuItem value="name-asc">Nombre A-Z</MenuItem>
            <MenuItem value="name-desc">Nombre Z-A</MenuItem>
            <MenuItem value="recent">Más recientes</MenuItem>
            <MenuItem value="has-image">Con imagen primero</MenuItem>
            <MenuItem value="special">Especiales primero</MenuItem>
            <MenuItem value="vital">Estado Vital</MenuItem>
            <MenuItem value="life-stage">Etapa de Vida</MenuItem>
            <MenuItem value="alignment">Alineamiento</MenuItem>
            <MenuItem value="gender">Género</MenuItem>
          </Select>
        </FormControl>
      </Box>

      {/* ── Fila 2: vista, gestión y total ── */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1, flexWrap: 'wrap', width: '100%' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
        <ButtonGroup size="small" variant="outlined" sx={{ flexShrink: 0 }}>
          {VIEW_MODES.map(({ value, label, Icon }) => (
            <Tooltip key={value} title={label}>
              <Button
                variant={charactersViewMode === value ? 'contained' : 'outlined'}
                onClick={() => setCharactersViewMode(value)}
                sx={{ p: 0.4, minWidth: 30, height: 28 }}
              >
                <Icon sx={{ fontSize: 17 }} />
              </Button>
            </Tooltip>
          ))}
        </ButtonGroup>

        <Tooltip title={charactersShowDescriptions ? 'Ocultar descripciones' : 'Mostrar descripciones'}>
          <IconButton size="small" onClick={() => setCharactersShowDescriptions(!charactersShowDescriptions)} sx={toggleSx(!charactersShowDescriptions)}>
            <DescriptionOutlinedIcon sx={{ fontSize: 17 }} />
          </IconButton>
        </Tooltip>

        <Tooltip title={charactersGroupByRole ? 'Desagrupar secciones' : 'Agrupar secciones'}>
          <IconButton size="small" onClick={() => setCharactersGroupByRole(!charactersGroupByRole)} sx={toggleSx(charactersGroupByRole)}>
            <AccountTreeOutlinedIcon sx={{ fontSize: 17 }} />
          </IconButton>
        </Tooltip>

        <Divider orientation="vertical" flexItem sx={{ my: 0.4 }} />

        <Button size="small" variant="outlined" startIcon={<PsychologyOutlinedIcon sx={{ fontSize: 15 }} />} onClick={onOpenArchetypes} sx={manageBtnSx}>
          Arquetipos ({archetypesCount})
        </Button>
        <Button size="small" variant="outlined" startIcon={<LocalOfferOutlinedIcon sx={{ fontSize: 15 }} />} onClick={onOpenTags} sx={manageBtnSx}>
          Etiquetas ({tags.length})
        </Button>
        <Button size="small" variant="outlined" startIcon={<FileDownloadOutlinedIcon sx={{ fontSize: 15 }} />} onClick={onOpenExport} sx={manageBtnSx}>
          Exportar
        </Button>
      </Box>

        <Chip
          size="small"
          label={`${counts.shown} mostrados`}
          variant="outlined"
          sx={{ height: 24, fontSize: '0.72rem', fontWeight: 600, borderColor: 'divider', bgcolor: 'background.paper' }}
        />
      </Box>
    </>
  );
}
