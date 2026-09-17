import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/router';
import {
  Box,
  Typography,
  Container,
  Divider,
  Tabs,
  Tab,
  TextField,
  InputAdornment,
  FormControl,
  Select,
  MenuItem,
  ButtonGroup,
  Button,
  IconButton,
  Tooltip,
  Paper,
  Chip,
  Avatar,
} from '@mui/material';
import { useAuth } from '../../context/AuthContext';
import { useStory } from '../../context/StoryContext';
import { useLoading } from '../../context/LoadingContext';
import { ApiService } from '../../utils/ApiService';
import SidebarLore from '../../components/layout/SidebarLore';
import CustomLoading from '../../components/common/CustomLoading';
import CustomModal from '../../components/common/CustomModal';
import SelectionActionBar from '../../components/common/SelectionActionBar';
import CharacterModal from '../../components/characters/CharacterModal';
import CharacterCard from '../../components/characters/CharacterCard';
import CharacterExportModal from '../../components/characters/CharacterExportModal';
import CopyGlobalConfirmModal from '../../components/characters/CopyGlobalConfirmModal';
import CustomButton from '../../components/common/CustomButton';
import PublicOutlinedIcon from '@mui/icons-material/PublicOutlined';
import PeopleOutlineIcon from '@mui/icons-material/PeopleOutline';
import BookmarkAddOutlinedIcon from '@mui/icons-material/BookmarkAddOutlined';
import FileDownloadOutlinedIcon from '@mui/icons-material/FileDownloadOutlined';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import AddIcon from '@mui/icons-material/Add';
import SearchIcon from '@mui/icons-material/Search';
import ClearIcon from '@mui/icons-material/Clear';
import FilterListIcon from '@mui/icons-material/FilterList';
import SortByAlphaIcon from '@mui/icons-material/SortByAlpha';
import ViewModuleIcon from '@mui/icons-material/ViewModule';
import ViewComfyIcon from '@mui/icons-material/ViewComfy';
import ViewAgendaIcon from '@mui/icons-material/ViewAgenda';
import AccountTreeOutlinedIcon from '@mui/icons-material/AccountTreeOutlined';
import DescriptionOutlinedIcon from '@mui/icons-material/DescriptionOutlined';
import NotesIcon from '@mui/icons-material/Notes';
import StarOutlinedIcon from '@mui/icons-material/StarOutlined';
import { CHARACTER_ALIGNMENTS, CHARACTER_LIFE_STAGES, CHARACTER_VITAL_STATUSES, CHARACTER_GENDERS, CHARACTER_ARCHETYPES  } from '../../constants/constants';

export default function CharacterManagementPage() {
  const router = useRouter();
  const { story_id } = router.query;
  const { user, loading: authLoading } = useAuth();
  const { activeStory } = useStory();
  const { setLoading } = useLoading();

  const [characters, setCharacters] = useState([]);
  const [relationships, setRelationships] = useState([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [charModalOpen, setCharModalOpen] = useState(false);
  const [exportModalOpen, setExportModalOpen] = useState(false);
  const [selectedCharacter, setSelectedCharacter] = useState(null);
  const [isCloneCharMode, setIsCloneCharMode] = useState(false);
  const [selectedCharacterIds, setSelectedCharacterIds] = useState([]);
  
  // Filters & View states
  const [characterTab, setCharacterTab] = useState(0); // 0=Locales (Default), 1=Globales, 2=Todos
  const [showDescriptions, setShowDescriptions] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [sortBy, setSortBy] = useState('name-asc'); // 'name-asc' | 'name-desc' | 'recent' | 'special' | 'vital' | 'life-stage' | 'alignment' | 'gender'
  const [viewMode, setViewMode] = useState('compact'); // 'compact' | 'medium' | 'detailed'
  const [groupByRole, setGroupByRole] = useState(true);

  const [confirmCopyOpen, setConfirmCopyOpen] = useState(false);
  const [pendingCopyList, setPendingCopyList] = useState([]);

  // Estado para modal de confirmación de eliminación
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);
  const pendingDeleteChar = useMemo(
    () => characters.find((c) => c.id === deleteConfirmId) || null,
    [characters, deleteConfirmId]
  );

  const loadData = useCallback(async () => {
    if (!router.isReady || !story_id) return;
    setDataLoading(true);
    try {
      const [charResult, relResult] = await Promise.all([
        ApiService.characters.getAll(story_id, setLoading),
        ApiService.relationships.getAll(story_id, setLoading),
      ]);
      setCharacters(charResult.data || []);
      setRelationships(relResult.data || []);
    } catch (e) {
      console.error(e);
      setCharacters([]);
      setRelationships([]);
    }
    setDataLoading(false);
  }, [router.isReady, story_id, setLoading]);

  useEffect(() => {
    if (router.isReady && story_id) {
      loadData();
    }
  }, [router.isReady, story_id, loadData]);

  const handleDelete = async (charId) => {
    setDeleteConfirmId(charId);
  };

  const handleConfirmDelete = async () => {
    if (!deleteConfirmId) return;
    const charId = deleteConfirmId;
    setDeleteConfirmId(null);
    // Optimistic: quitar del listado inmediatamente
    setCharacters((current) => current.filter((c) => c.id !== charId));
    setSelectedCharacterIds((current) => current.filter((id) => id !== charId));
    await ApiService.characters.delete(charId, setLoading);
  };

  const toggleCharacterSelection = (characterId, event) => {
    if (!event?.ctrlKey && !event?.metaKey) {
      setSelectedCharacterIds([characterId]);
      return;
    }

    setSelectedCharacterIds((current) => current.includes(characterId)
      ? current.filter((id) => id !== characterId)
      : [...current, characterId]);
  };

  const handleSetSelectedGlobal = async (isGlobal) => {
    if (!selectedCharacterIds.length) return;
    const previousCharacters = characters;
    const selectedIds = [...selectedCharacterIds];
    setCharacters((current) => current.map((character) => (
      selectedIds.includes(character.id) ? { ...character, is_global: isGlobal } : character
    )));

    const results = await Promise.all(selectedIds.map((characterId) =>
      ApiService.characters.update(characterId, { is_global: isGlobal }, setLoading)
    ));

    if (results.some((result) => result.error)) {
      setCharacters(previousCharacters);
      window.alert('No se pudo actualizar uno o más personajes.');
      return;
    }

    setSelectedCharacterIds([]);
  };
  
  const handleCopyAsLocal = async (idsToCopy) => {
    if (!story_id || !idsToCopy?.length) return;
    const result = await ApiService.characters.copyAsLocal(idsToCopy, story_id, setLoading);
    if (!result.error && result.data?.length) {
      setCharacters((current) => [...current, ...result.data].sort((a, b) => a.name.localeCompare(b.name)));
      setSelectedCharacterIds([]);
      setCharacterTab(0);
    }
  };

  const handleRequestCopyAsLocal = (charsOrIds) => {
    if (!charsOrIds || (Array.isArray(charsOrIds) && !charsOrIds.length)) return;
    const targetChars = Array.isArray(charsOrIds)
      ? typeof charsOrIds[0] === 'object'
        ? charsOrIds
        : characters.filter((c) => charsOrIds.includes(c.id))
      : typeof charsOrIds === 'object'
        ? [charsOrIds]
        : characters.filter((c) => c.id === charsOrIds);
    if (!targetChars.length) return;
    setPendingCopyList(targetChars);
    setConfirmCopyOpen(true);
  };

  const handleClone = (char) => {
    setSelectedCharacter(char);
    setIsCloneCharMode(true);
    setCharModalOpen(true);
  };

  const handleCloneCharacter = async (originalCharId, cloneOptions) => {
    if (!story_id) return;
    const result = await ApiService.characters.clone(originalCharId, {
      ...cloneOptions,
      targetStoryId: story_id,
    }, setLoading);
    if (!result.error && result.data) {
      setCharacters((current) => [...current, result.data].sort((a, b) => a.name.localeCompare(b.name)));
    }
    setCharModalOpen(false);
  };

  const handleSaveCharacter = async (charData) => {
    if (!story_id) return;

    const result = selectedCharacter && !isCloneCharMode
      ? await ApiService.characters.update(selectedCharacter.id, charData, setLoading)
      : await ApiService.characters.create({
          ...charData,
          story_id,
        }, setLoading);

    if (!result.error && result.data) {
      setCharacters((current) => selectedCharacter && !isCloneCharMode
        ? current.map((character) => character.id === selectedCharacter.id ? result.data : character)
        : [...current, result.data].sort((a, b) => a.name.localeCompare(b.name)));
    } else {
      return;
    }
    setCharModalOpen(false);
  };

  const handleRoleChange = async (charId, newRole) => {
    const previousCharacters = characters;
    // Optimistic UI update
    setCharacters((current) =>
      current.map((char) => (char.id === charId ? { ...char, role_archetype: newRole } : char))
    );

    const result = await ApiService.characters.update(charId, { role_archetype: newRole }, setLoading);
    if (result.error) {
      setCharacters(previousCharacters);
      window.alert('No se pudo actualizar el tipo del personaje.');
    }
  };

  // Distinct roles found in current character list
  const availableRoles = useMemo(() => {
    const roles = new Set();
    characters.forEach((c) => {
      if (c.role_archetype) roles.add(c.role_archetype);
    });
    return Array.from(roles).sort();
  }, [characters]);

  // Filter & Sort Pipeline
  const processedCharacters = useMemo(() => {
    let result = [...characters];

    // Tab Filter (0=Locales, 1=Globales, 2=Todos)
    if (characterTab === 0) {
      result = result.filter((c) => !c.is_global);
    } else if (characterTab === 1) {
      result = result.filter((c) => c.is_global);
    }

    // Role Filter
    if (roleFilter !== 'all') {
      result = result.filter((c) => (c.role_archetype || 'Sin rol') === roleFilter);
    }

    // Search Query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter((c) =>
        c.name?.toLowerCase().includes(q) ||
        c.role_archetype?.toLowerCase().includes(q) ||
        c.biography?.toLowerCase().includes(q)
      );
    }

    // Sorting
    result.sort((a, b) => {
      const attrA = a.attributes || {};
      const attrB = b.attributes || {};
      if (sortBy === 'name-asc') return (a.name || '').localeCompare(b.name || '');
      if (sortBy === 'name-desc') return (b.name || '').localeCompare(a.name || '');
      if (sortBy === 'recent') return new Date(b.created_at || 0) - new Date(a.created_at || 0);
      if (sortBy === 'special') {
        // Especiales primero, luego por nombre
        if (attrB.is_special && !attrA.is_special) return 1;
        if (attrA.is_special && !attrB.is_special) return -1;
        return (a.name || '').localeCompare(b.name || '');
      }
      if (sortBy === 'vital') {
        // Ordenar por índice canónico de CHARACTER_VITAL_STATUSES
        const ai = CHARACTER_VITAL_STATUSES.indexOf(attrA.vital_status || 'Vivo');
        const bi = CHARACTER_VITAL_STATUSES.indexOf(attrB.vital_status || 'Vivo');
        return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi);
      }
      if (sortBy === 'life-stage') {
        // Ordenar por índice canónico de CHARACTER_LIFE_STAGES (infante → anciano)
        const ai = CHARACTER_LIFE_STAGES.indexOf(attrA.life_stage || '');
        const bi = CHARACTER_LIFE_STAGES.indexOf(attrB.life_stage || '');
        return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi);
      }
      if (sortBy === 'alignment') {
        // Ordenar por índice canónico de CHARACTER_ALIGNMENTS
        const ai = CHARACTER_ALIGNMENTS.indexOf(attrA.alignment || '');
        const bi = CHARACTER_ALIGNMENTS.indexOf(attrB.alignment || '');
        return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi);
      }
      if (sortBy === 'gender') {
        // Ordenar por índice canónico de CHARACTER_GENDERS
        const ai = CHARACTER_GENDERS.indexOf(attrA.gender || '');
        const bi = CHARACTER_GENDERS.indexOf(attrB.gender || '');
        return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi);
      }
      return 0;
    });

    return result;
  }, [characters, characterTab, roleFilter, searchQuery, sortBy]);

  // Config de agrupado según el criterio de orden activo
  const GROUP_BY_CONFIG = {
    'name-asc':   { field: (c) => c.role_archetype || 'Sin Rol',              order: CHARACTER_ARCHETYPES,       label: 'Rol / Arquetipo', color: 'primary'   },
    'name-desc':  { field: (c) => c.role_archetype || 'Sin Rol',              order: CHARACTER_ARCHETYPES,       label: 'Rol / Arquetipo', color: 'primary'   },
    'recent':     { field: (c) => c.role_archetype || 'Sin Rol',              order: CHARACTER_ARCHETYPES,       label: 'Rol / Arquetipo', color: 'primary'   },
    'special':    { field: (c) => (c.attributes?.is_special ? '⭐ Especial' : 'Sin destacar'), order: ['⭐ Especial', 'Sin destacar'], label: 'Destacado',    color: 'warning'   },
    'vital':      { field: (c) => c.attributes?.vital_status || 'Sin definir', order: CHARACTER_VITAL_STATUSES,  label: 'Estado Vital',    color: 'success'   },
    'life-stage': { field: (c) => c.attributes?.life_stage   || 'Sin definir', order: CHARACTER_LIFE_STAGES,    label: 'Etapa de Vida',   color: 'info'      },
    'alignment':  { field: (c) => c.attributes?.alignment    || 'Sin definir', order: CHARACTER_ALIGNMENTS,     label: 'Alineamiento',    color: 'secondary' },
    'gender':     { field: (c) => c.attributes?.gender       || 'Sin definir', order: CHARACTER_GENDERS,        label: 'Género',          color: 'default'   },
  };

  // Agrupado dinámico según el criterio activo
  const groupedCharacters = useMemo(() => {
    const config = GROUP_BY_CONFIG[sortBy] || GROUP_BY_CONFIG['name-asc'];
    const grouped = processedCharacters.reduce((acc, char) => {
      const key = config.field(char);
      if (!acc[key]) acc[key] = [];
      acc[key].push(char);
      return acc;
    }, {});

    // Ordenar las claves según el orden canónico de la constante
    const orderedKeys = [
      ...config.order.filter((k) => grouped[k]),      // primero los que existen en orden canónico
      ...Object.keys(grouped).filter((k) => !config.order.includes(k)), // luego los que no tienen orden (ej: Sin definir)
    ];
    return Object.fromEntries(orderedKeys.map((k) => [k, grouped[k]]));
  }, [processedCharacters, sortBy]);

  // Label descriptivo del modo de agrupado activo
  const activeGroupLabel = (GROUP_BY_CONFIG[sortBy] || GROUP_BY_CONFIG['name-asc']).label;
  const activeGroupColor = (GROUP_BY_CONFIG[sortBy] || GROUP_BY_CONFIG['name-asc']).color;

  if (authLoading || dataLoading) {
    return <CustomLoading fullscreen message="Cargando personajes..." />;
  }

  // Grid column sizing based on view density
  const gridTemplateColumns = {
    compact: {
      xs: 'repeat(auto-fill, minmax(150px, 1fr))',
      sm: 'repeat(auto-fill, minmax(180px, 1fr))',
      md: 'repeat(auto-fill, minmax(200px, 1fr))',
      lg: 'repeat(auto-fill, minmax(220px, 1fr))',
    },
    medium: {
      xs: 'repeat(auto-fill, minmax(200px, 1fr))',
      sm: 'repeat(auto-fill, minmax(240px, 1fr))',
      md: 'repeat(auto-fill, minmax(270px, 1fr))',
      lg: 'repeat(auto-fill, minmax(290px, 1fr))',
    },
    detailed: {
      xs: '1fr',
      sm: 'repeat(auto-fill, minmax(300px, 1fr))',
      md: 'repeat(auto-fill, minmax(340px, 1fr))',
      lg: 'repeat(auto-fill, minmax(380px, 1fr))',
    },
  }[viewMode];

  return (
    <>
      <SidebarLore view="characters" story={activeStory} characters={characters} />
      <Box sx={{ flexGrow: 1, overflowY: 'auto', p: { xs: 1, sm: 2.5 }, bgcolor: 'background.default' }}>
        <Container maxWidth="xl" disableGutters sx={{ px: { xs: 0.5, sm: 2 } }}>
          
          {/* Header Compacto */}
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: 1.2,
              mb: 1.8,
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2, minWidth: 0, flexShrink: 1 }}>
              <Box
                sx={{
                  width: { xs: 32, sm: 36 },
                  height: { xs: 32, sm: 36 },
                  borderRadius: 2,
                  bgcolor: 'primary.main',
                  color: '#fff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <PeopleOutlineIcon sx={{ fontSize: { xs: 18, sm: 22 } }} />
              </Box>
              <Box sx={{ minWidth: 0 }}>
                <Typography
                  variant="h5"
                  sx={{
                    fontWeight: 800,
                    fontSize: { xs: '1.05rem', sm: '1.4rem' },
                    lineHeight: 1.2,
                  }}
                  noWrap
                >
                  Gestión de Personajes
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, display: 'block' }} noWrap>
                  {characters.length} personaje(s) en {activeStory?.title || 'esta historia'}
                </Typography>
              </Box>
            </Box>

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexShrink: 0 }}>
              {/* Export Button (Desktop) */}
              <CustomButton
                variant="outlined"
                color="inherit"
                size="small"
                startIcon={<FileDownloadOutlinedIcon fontSize="small" />}
                onClick={() => setExportModalOpen(true)}
                sx={{ py: 0.6, px: 1.5, borderRadius: 2, display: { xs: 'none', sm: 'inline-flex' } }}
              >
                Exportar
              </CustomButton>

              {/* Export Button (Mobile) */}
              <Tooltip title="Exportar Fichas de Personajes">
                <IconButton
                  onClick={() => setExportModalOpen(true)}
                  sx={{
                    display: { xs: 'flex', sm: 'none' },
                    border: 1,
                    borderColor: 'divider',
                    borderRadius: '50%',
                    width: 36,
                    height: 36,
                    bgcolor: 'background.paper',
                  }}
                >
                  <FileDownloadOutlinedIcon fontSize="small" />
                </IconButton>
              </Tooltip>

              {/* Create Character (Desktop) */}
              <CustomButton
                variant="contained"
                color="primary"
                size="small"
                startIcon={<AddIcon fontSize="small" />}
                onClick={() => { setSelectedCharacter(null); setIsCloneCharMode(false); setCharModalOpen(true); }}
                sx={{ py: 0.6, px: 2, borderRadius: 2, display: { xs: 'none', sm: 'inline-flex' } }}
              >
                Nuevo Personaje
              </CustomButton>

              {/* Create Character (Mobile Circular + Button) */}
              <Tooltip title="Nuevo Personaje">
                <IconButton
                  onClick={() => { setSelectedCharacter(null); setIsCloneCharMode(false); setCharModalOpen(true); }}
                  sx={{
                    display: { xs: 'flex', sm: 'none' },
                    bgcolor: 'primary.main',
                    color: '#fff',
                    width: 36,
                    height: 36,
                    borderRadius: '50%',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                    '&:hover': { bgcolor: 'primary.dark' },
                  }}
                >
                  <AddIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            </Box>
          </Box>

          {/* ─── Control Bar: Tabs + Filtro Rol + Buscador + Selector de Vista ─── */}
          <Paper
            elevation={0}
            sx={{
              display: 'flex',
              flexDirection: { xs: 'column', lg: 'row' },
              alignItems: { xs: 'stretch', lg: 'center' },
              justifyContent: 'space-between',
              gap: 1.2,
              mb: 2.5,
              p: { xs: 0.6, sm: 0.8 },
              borderRadius: 2.5,
              bgcolor: 'background.paper',
              border: 1,
              borderColor: 'divider',
            }}
          >
            {/* Tabs de tipo (Locales, Globales, Todos) */}
            <Tabs
              value={characterTab}
              onChange={(e, val) => setCharacterTab(val)}
              variant="scrollable"
              scrollButtons="auto"
              sx={{
                minHeight: 36,
                '& .MuiTab-root': { fontWeight: 700, fontSize: '0.82rem', textTransform: 'none', minHeight: 36, py: 0, px: { xs: 1.2, sm: 1.8 } },
              }}
            >
              <Tab label={`Locales (${characters.filter((c) => !c.is_global).length})`} />
              <Tab icon={<PublicOutlinedIcon fontSize="small" />} iconPosition="start" label={`Globales (${characters.filter((c) => c.is_global).length})`} />
              <Tab icon={<PeopleOutlineIcon fontSize="small" />} iconPosition="start" label={`Todos (${characters.length})`} />
            </Tabs>

            {/* Acciones de filtro, búsqueda y densidad */}
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                flexWrap: { xs: 'wrap', sm: 'nowrap' },
              }}
            >
              {/* Filtro por Rol */}
              <FormControl size="small" sx={{ minWidth: { xs: '48%', sm: 140 } }}>
                <Select
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value)}
                  startAdornment={<FilterListIcon fontSize="small" sx={{ mr: 0.5, color: 'text.secondary' }} />}
                  sx={{ borderRadius: 2, fontSize: '0.82rem', height: 34 }}
                >
                  <MenuItem value="all">Todos los roles</MenuItem>
                  {availableRoles.map((role) => (
                    <MenuItem key={role} value={role}>{role}</MenuItem>
                  ))}
                  <MenuItem value="Sin rol">Sin rol</MenuItem>
                </Select>
              </FormControl>

              {/* Ordenar */}
              <FormControl size="small" sx={{ minWidth: { xs: '48%', sm: 150 } }}>
                <Select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  startAdornment={<SortByAlphaIcon fontSize="small" sx={{ mr: 0.5, color: 'text.secondary' }} />}
                  sx={{ borderRadius: 2, fontSize: '0.82rem', height: 34 }}
                >
                  <MenuItem value="name-asc">Nombre A-Z</MenuItem>
                  <MenuItem value="name-desc">Nombre Z-A</MenuItem>
                  <MenuItem value="recent">Más recientes</MenuItem>
                  <MenuItem value="special">Especiales primero</MenuItem>
                  <MenuItem value="vital">Estado Vital</MenuItem>
                  <MenuItem value="life-stage">Etapa de Vida</MenuItem>
                  <MenuItem value="alignment">Alineamiento</MenuItem>
                  <MenuItem value="gender">Género</MenuItem>
                </Select>
              </FormControl>

              {/* Buscador */}
              <TextField
                size="small"
                placeholder="Buscar personaje…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                sx={{ width: { xs: '100%', sm: 180 } }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon fontSize="small" sx={{ color: 'text.secondary' }} />
                    </InputAdornment>
                  ),
                  endAdornment: searchQuery ? (
                    <InputAdornment position="end">
                      <IconButton size="small" onClick={() => setSearchQuery('')} sx={{ p: 0.2 }}>
                        <ClearIcon fontSize="small" />
                      </IconButton>
                    </InputAdornment>
                  ) : null,
                  sx: { borderRadius: 2, bgcolor: 'background.subtle', height: 34, fontSize: '0.82rem' },
                }}
              />

              {/* Selector de Densidad / Modo de Vista */}
              <ButtonGroup size="small" variant="outlined" sx={{ flexShrink: 0 }}>
                <Tooltip title="Vista Compacta (muchos personajes)">
                  <Button
                    variant={viewMode === 'compact' ? 'contained' : 'outlined'}
                    onClick={() => setViewMode('compact')}
                    sx={{ p: 0.6, minWidth: 34, height: 34 }}
                  >
                    <ViewModuleIcon fontSize="small" />
                  </Button>
                </Tooltip>
                <Tooltip title="Vista Media">
                  <Button
                    variant={viewMode === 'medium' ? 'contained' : 'outlined'}
                    onClick={() => setViewMode('medium')}
                    sx={{ p: 0.6, minWidth: 34, height: 34 }}
                  >
                    <ViewComfyIcon fontSize="small" />
                  </Button>
                </Tooltip>
                <Tooltip title="Vista Detallada">
                  <Button
                    variant={viewMode === 'detailed' ? 'contained' : 'outlined'}
                    onClick={() => setViewMode('detailed')}
                    sx={{ p: 0.6, minWidth: 34, height: 34 }}
                  >
                    <ViewAgendaIcon fontSize="small" />
                  </Button>
                </Tooltip>
              </ButtonGroup>

              {/* Toggle Ocultar/Mostrar Descripciones */}
              <Tooltip title={showDescriptions ? "Ocultar descripciones de todos" : "Mostrar descripciones"}>
                <IconButton
                  size="small"
                  onClick={() => setShowDescriptions(!showDescriptions)}
                  sx={{
                    border: 1,
                    borderColor: !showDescriptions ? 'primary.main' : 'divider',
                    bgcolor: !showDescriptions ? 'action.selected' : 'transparent',
                    color: !showDescriptions ? 'primary.main' : 'inherit',
                    borderRadius: 2,
                    p: 0.8,
                    height: 34,
                    width: 34,
                  }}
                >
                  <DescriptionOutlinedIcon fontSize="small" />
                </IconButton>
              </Tooltip>

              {/* Toggle Agrupar por Rol */}
              <Tooltip title={groupByRole ? "Desagrupar secciones" : "Agrupar por rol"}>
                <IconButton
                  size="small"
                  onClick={() => setGroupByRole(!groupByRole)}
                  sx={{
                    border: 1,
                    borderColor: groupByRole ? 'primary.main' : 'divider',
                    bgcolor: groupByRole ? 'action.selected' : 'transparent',
                    color: groupByRole ? 'primary.main' : 'inherit',
                    borderRadius: 2,
                    p: 0.8,
                    height: 34,
                    width: 34,
                  }}
                >
                  <AccountTreeOutlinedIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            </Box>
          </Paper>
          
          {/* ─── Listado de Personajes ─── */}
          {processedCharacters.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 8, bgcolor: 'background.paper', borderRadius: 3, border: 1, borderColor: 'divider' }}>
              <PeopleOutlineIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 1.5 }} />
              <Typography variant="h6" sx={{ fontWeight: 700, color: 'text.secondary', mb: 1 }}>
                {searchQuery || roleFilter !== 'all' ? 'No se encontraron personajes con estos filtros' : 'No hay personajes en esta historia'}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                {searchQuery || roleFilter !== 'all' ? 'Intenta modificar el término de búsqueda o quitar los filtros.' : 'Crea tu primer personaje para poblar este universo narrativo.'}
              </Typography>
              <CustomButton
                startIcon={<AddIcon fontSize="small" />}
                onClick={() => { setSelectedCharacter(null); setIsCloneCharMode(false); setCharModalOpen(true); }}
              >
                Crear Personaje
              </CustomButton>
            </Box>
          ) : groupByRole ? (
            /* Agrupado dinámico según criterio activo */
            <>
              {/* Indicador de agrupado activo */}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <AccountTreeOutlinedIcon sx={{ fontSize: 14, color: 'text.disabled' }} />
                <Typography variant="caption" sx={{ color: 'text.disabled', fontWeight: 600, fontSize: '0.72rem' }}>
                  Agrupando por:
                </Typography>
                <Chip
                  label={activeGroupLabel}
                  size="small"
                  color={activeGroupColor === 'default' ? undefined : activeGroupColor}
                  variant="outlined"
                  sx={{ height: 18, fontSize: '0.68rem', fontWeight: 700 }}
                />
              </Box>

              {Object.entries(groupedCharacters).map(([groupKey, chars]) => (
                <Box key={groupKey} sx={{ mb: 3.5 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.2 }}>
                    <Typography
                      variant="caption"
                      sx={{
                        fontWeight: 800,
                        textTransform: 'uppercase',
                        letterSpacing: '0.06em',
                        fontSize: '0.75rem',
                        color: activeGroupColor === 'default' || activeGroupColor === 'primary'
                          ? 'text.secondary'
                          : `${activeGroupColor}.main`,
                      }}
                    >
                      {groupKey}
                    </Typography>
                    <Chip
                      label={chars.length}
                      size="small"
                      sx={{ height: 18, fontSize: '0.68rem', fontWeight: 700 }}
                    />
                    <Divider sx={{ flexGrow: 1, ml: 1 }} />
                  </Box>

                  <Box
                    sx={{
                      display: 'grid',
                      gridTemplateColumns: gridTemplateColumns,
                      gap: viewMode === 'compact' ? 1.2 : 1.8,
                    }}
                  >
                    {chars.map((char) => (
                      <CharacterCard 
                        key={char.id}
                        character={char}
                        viewMode={viewMode}
                        showBiography={showDescriptions}
                        selectable
                        selected={selectedCharacterIds.includes(char.id)}
                        onSelect={toggleCharacterSelection}
                        onEdit={(c) => { setSelectedCharacter(c); setIsCloneCharMode(false); setCharModalOpen(true); }}
                        onDelete={handleDelete}
                        onClone={handleClone}
                        onMakeLocalCopy={(c) => handleRequestCopyAsLocal([c])}
                        onRoleChange={handleRoleChange}
                      />
                    ))}
                  </Box>
                </Box>
              ))}
            </>
          ) : (
            /* Cuadrícula Continua Fluida */
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: gridTemplateColumns,
                gap: viewMode === 'compact' ? 1.2 : 1.8,
              }}
            >
              {processedCharacters.map((char) => (
                <CharacterCard 
                  key={char.id}
                  character={char}
                  viewMode={viewMode}
                  showBiography={showDescriptions}
                  selectable
                  selected={selectedCharacterIds.includes(char.id)}
                  onSelect={toggleCharacterSelection}
                  onEdit={(c) => { setSelectedCharacter(c); setIsCloneCharMode(false); setCharModalOpen(true); }}
                  onDelete={handleDelete}
                  onClone={handleClone}
                  onMakeLocalCopy={(c) => handleRequestCopyAsLocal([c])}
                  onRoleChange={handleRoleChange}
                />
              ))}
            </Box>
          )}
        </Container>
      </Box>
      
      <CopyGlobalConfirmModal
        open={confirmCopyOpen}
        onClose={() => setConfirmCopyOpen(false)}
        onConfirm={() => handleCopyAsLocal(pendingCopyList.map((c) => c.id))}
        charactersToCopy={pendingCopyList}
        currentStoryId={story_id}
        currentStoryTitle={activeStory?.title || 'esta historia'}
      />

      <CharacterModal
        open={charModalOpen}
        onClose={() => setCharModalOpen(false)}
        character={selectedCharacter}
        isCloneMode={isCloneCharMode}
        onSave={handleSaveCharacter}
        onClone={handleCloneCharacter}
      />

      <CharacterExportModal
        open={exportModalOpen}
        onClose={() => setExportModalOpen(false)}
        characters={characters}
        filteredCharacters={processedCharacters}
        selectedCharacterIds={selectedCharacterIds}
        relationships={relationships}
        storyTitle={activeStory?.title || 'Historia'}
      />

      {/* Modal de confirmación para eliminar personaje */}
      <CustomModal
        open={Boolean(deleteConfirmId)}
        onClose={() => setDeleteConfirmId(null)}
        title="Eliminar personaje"
        subtitle="Esta acción no se puede deshacer"
        icon={DeleteOutlineIcon}
        maxWidth="xs"
        actions={
          <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end', width: '100%' }}>
            <CustomButton
              variant="outlined"
              color="inherit"
              onClick={() => setDeleteConfirmId(null)}
            >
              Cancelar
            </CustomButton>
            <CustomButton
              variant="contained"
              color="error"
              onClick={handleConfirmDelete}
            >
              Eliminar
            </CustomButton>
          </Box>
        }
      >
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 0.5 }}>
          {pendingDeleteChar && (
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1.5,
                p: 1.5,
                borderRadius: 2,
                bgcolor: 'action.hover',
                border: 1,
                borderColor: 'divider',
              }}
            >
              <Avatar
                src={pendingDeleteChar.avatar_url || pendingDeleteChar.image_url}
                sx={{ width: 44, height: 44, bgcolor: 'primary.main', fontSize: '1rem', fontWeight: 700 }}
              >
                {pendingDeleteChar.name?.charAt(0) || 'P'}
              </Avatar>
              <Box sx={{ minWidth: 0 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 700, noWrap: true }}>
                  {pendingDeleteChar.name}
                </Typography>
                {pendingDeleteChar.role_archetype && (
                  <Typography variant="caption" color="text.secondary">
                    {pendingDeleteChar.role_archetype}
                  </Typography>
                )}
              </Box>
            </Box>
          )}
          <Typography variant="body2" color="text.secondary">
            ¿Estás seguro de que deseas eliminar permanentemente a{' '}
            <strong style={{ color: 'inherit' }}>{pendingDeleteChar?.name || 'este personaje'}</strong>? Se perderán todas sus relaciones e historial asociado.
          </Typography>
        </Box>
      </CustomModal>

      <SelectionActionBar
        count={selectedCharacterIds.length}
        onClear={() => setSelectedCharacterIds([])}
        actions={[
          {
            key: 'copy-local',
            label: 'Crear una copia',
            tooltip: 'Crear copia local de los seleccionados para esta historia',
            icon: <BookmarkAddOutlinedIcon fontSize="small" />,
            onClick: () => handleRequestCopyAsLocal(selectedCharacterIds),
            color: 'primary',
          },
          {
            key: 'make-global',
            label: 'Hacer globales',
            tooltip: 'Hacer globales',
            icon: <PublicOutlinedIcon fontSize="small" />,
            onClick: () => handleSetSelectedGlobal(true),
            color: 'secondary',
          },
          {
            key: 'remove-global',
            label: 'Quitar global',
            tooltip: 'Quitar estado global',
            icon: <PeopleOutlineIcon fontSize="small" />,
            onClick: () => handleSetSelectedGlobal(false),
          },
        ]}
      />
    </>
  );
}
