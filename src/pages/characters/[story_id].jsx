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
  Collapse,
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
import CharacterFolderTreeItem, { InlineFolderInput } from '../../components/characters/CharacterFolderTree';
import CharacterTagManagerModal from '../../components/characters/CharacterTagManagerModal';
import CharacterArchetypeManagerModal from '../../components/characters/CharacterArchetypeManagerModal';
import BatchTagAssignModal from '../../components/characters/BatchTagAssignModal';
import MoveToFolderModal from '../../components/characters/MoveToFolderModal';
import CustomButton from '../../components/common/CustomButton';
import PublicOutlinedIcon from '@mui/icons-material/PublicOutlined';
import PeopleOutlineIcon from '@mui/icons-material/PeopleOutline';
import FolderIcon from '@mui/icons-material/Folder';
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
import LocalOfferOutlinedIcon from '@mui/icons-material/LocalOfferOutlined';
import PsychologyOutlinedIcon from '@mui/icons-material/PsychologyOutlined';
import DriveFileMoveOutlinedIcon from '@mui/icons-material/DriveFileMoveOutlined';
import FolderOutlinedIcon from '@mui/icons-material/FolderOutlined';
import FolderSpecialIcon from '@mui/icons-material/FolderSpecial';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import CreateNewFolderOutlinedIcon from '@mui/icons-material/CreateNewFolderOutlined';
import {
  CHARACTER_ALIGNMENTS,
  CHARACTER_LIFE_STAGES,
  CHARACTER_VITAL_STATUSES,
  CHARACTER_GENDERS,
  CHARACTER_ARCHETYPES,
} from '../../constants/constants';

export default function CharacterManagementPage() {
  const router = useRouter();
  const { story_id } = router.query;
  const { user, loading: authLoading } = useAuth();
  const { activeStory } = useStory();
  const { setLoading } = useLoading();

  const [characters, setCharacters] = useState([]);
  const [relationships, setRelationships] = useState([]);
  const [folders, setFolders] = useState([]);
  const [tags, setTags] = useState([]);
  const [customArchetypes, setCustomArchetypes] = useState([]);
  const [dataLoading, setDataLoading] = useState(true);

  // Modals & Selection States
  const [charModalOpen, setCharModalOpen] = useState(false);
  const [exportModalOpen, setExportModalOpen] = useState(false);
  const [tagManagerOpen, setTagManagerOpen] = useState(false);
  const [archetypeManagerOpen, setArchetypeManagerOpen] = useState(false);
  const [moveToFolderOpen, setMoveToFolderOpen] = useState(false);
  const [batchTagModalOpen, setBatchTagModalOpen] = useState(false);
  const [selectedCharacter, setSelectedCharacter] = useState(null);
  const [isCloneCharMode, setIsCloneCharMode] = useState(false);
  const [selectedCharacterIds, setSelectedCharacterIds] = useState([]);
  const [targetCharsForBatch, setTargetCharsForBatch] = useState([]);

  // Folder selection state
  const [activeFolderId, setActiveFolderId] = useState('all'); // 'all' | folder.id
  const [creatingInParentId, setCreatingInParentId] = useState(null);
  const [isCreatingRootFolder, setIsCreatingRootFolder] = useState(false);

  // Filters & View states
  const [characterTab, setCharacterTab] = useState(0); // 0=Locales (Default), 1=Globales, 2=Todos
  const [showDescriptions, setShowDescriptions] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [tagFilter, setTagFilter] = useState('all'); // 'all' | tag.id
  const [sortBy, setSortBy] = useState('name-asc');
  const [viewMode, setViewMode] = useState('compact'); // 'compact' | 'medium' | 'detailed'
  const [groupByRole, setGroupByRole] = useState(true);

  const [confirmCopyOpen, setConfirmCopyOpen] = useState(false);
  const [pendingCopyList, setPendingCopyList] = useState([]);

  // Delete modal state
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);
  const pendingDeleteChar = useMemo(
    () => characters.find((c) => c.id === deleteConfirmId) || null,
    [characters, deleteConfirmId]
  );

  // Delete folder confirmation
  const [deleteFolderConfirm, setDeleteFolderConfirm] = useState(null);

  const loadData = useCallback(async () => {
    if (!router.isReady || !story_id) return;
    setDataLoading(true);
    try {
      // 1. Ensure default root folder "Principal" exists for this story
      await ApiService.characterFolders.ensureDefaultFolder(story_id, setLoading);

      // 2. Fetch all story data
      const [charResult, relResult, folderResult, tagResult, archResult] = await Promise.all([
        ApiService.characters.getAll(story_id, setLoading),
        ApiService.relationships.getAll(story_id, setLoading),
        ApiService.characterFolders.getAll(story_id, setLoading),
        ApiService.characterTags.getAll(story_id, setLoading),
        ApiService.characterArchetypes.getAll(story_id, setLoading),
      ]);

      setCharacters(charResult.data || []);
      setRelationships(relResult.data || []);
      setFolders(folderResult.data || []);
      setTags(tagResult.data || []);
      setCustomArchetypes(archResult.data || []);
    } catch (e) {
      console.error(e);
      setCharacters([]);
      setRelationships([]);
      setFolders([]);
      setTags([]);
      setCustomArchetypes([]);
    }
    setDataLoading(false);
  }, [router.isReady, story_id, setLoading]);

  useEffect(() => {
    if (router.isReady && story_id) {
      loadData();
    }
  }, [router.isReady, story_id, loadData]);

  // Root folders (folders without parent)
  const rootFolders = useMemo(() => {
    return folders.filter((f) => !f.parent_folder_id);
  }, [folders]);

  // Default "Principal" folder
  const defaultFolder = useMemo(() => {
    return folders.find((f) => f.is_default || f.name?.toLowerCase() === 'principal') || folders[0] || null;
  }, [folders]);

  // ─── Character Operations ──────────────────────────────────────────────
  const handleDelete = async (charId) => {
    setDeleteConfirmId(charId);
  };

  const handleConfirmDelete = async () => {
    if (!deleteConfirmId) return;
    const charId = deleteConfirmId;
    setDeleteConfirmId(null);
    setCharacters((current) => current.filter((c) => c.id !== charId));
    setSelectedCharacterIds((current) => current.filter((id) => id !== charId));
    await ApiService.characters.delete(charId, setLoading);
  };

  const toggleCharacterSelection = (characterId, event) => {
    if (!event?.ctrlKey && !event?.metaKey) {
      setSelectedCharacterIds([characterId]);
      return;
    }

    setSelectedCharacterIds((current) =>
      current.includes(characterId)
        ? current.filter((id) => id !== characterId)
        : [...current, characterId]
    );
  };

  const handleSetSelectedGlobal = async (isGlobal) => {
    if (!selectedCharacterIds.length) return;
    const previousCharacters = characters;
    const selectedIds = [...selectedCharacterIds];
    setCharacters((current) =>
      current.map((character) =>
        selectedIds.includes(character.id) ? { ...character, is_global: isGlobal } : character
      )
    );

    const results = await Promise.all(
      selectedIds.map((characterId) =>
        ApiService.characters.update(characterId, { is_global: isGlobal }, setLoading)
      )
    );

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
      setCharacters((current) =>
        [...current, ...result.data].sort((a, b) => a.name.localeCompare(b.name))
      );
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
    const result = await ApiService.characters.clone(
      originalCharId,
      {
        ...cloneOptions,
        targetStoryId: story_id,
      },
      setLoading
    );
    if (!result.error && result.data) {
      setCharacters((current) =>
        [...current, result.data].sort((a, b) => a.name.localeCompare(b.name))
      );
    }
    setCharModalOpen(false);
  };

  const handleSaveCharacter = async (charData) => {
    if (!story_id) return;

    // Default folder assignment if none specified
    const finalFolderId = charData.folder_id || (activeFolderId !== 'all' ? activeFolderId : defaultFolder?.id || null);

    const result =
      selectedCharacter && !isCloneCharMode
        ? await ApiService.characters.update(
            selectedCharacter.id,
            { ...charData, folder_id: charData.folder_id },
            setLoading
          )
        : await ApiService.characters.create(
            {
              ...charData,
              folder_id: finalFolderId,
              story_id,
            },
            setLoading
          );

    if (!result.error && result.data) {
      setCharacters((current) =>
        selectedCharacter && !isCloneCharMode
          ? current.map((character) =>
              character.id === selectedCharacter.id ? result.data : character
            )
          : [...current, result.data].sort((a, b) => a.name.localeCompare(b.name))
      );
    }
    setCharModalOpen(false);
  };

  const handleRoleChange = async (charId, newRole) => {
    const previousCharacters = characters;
    setCharacters((current) =>
      current.map((char) => (char.id === charId ? { ...char, role_archetype: newRole } : char))
    );

    const result = await ApiService.characters.update(charId, { role_archetype: newRole }, setLoading);
    if (result.error) {
      setCharacters(previousCharacters);
      window.alert('No se pudo actualizar el tipo del personaje.');
    }
  };

  // ─── Folder Operations ──────────────────────────────────────────────────
  const handleCommitCreateFolder = async (name, parentFolderId = null) => {
    if (!story_id || !name.trim()) return;
    const result = await ApiService.characterFolders.create(
      {
        story_id,
        name: name.trim(),
        parent_folder_id: parentFolderId,
        color: '#8c6d53',
        position: folders.length,
      },
      setLoading
    );

    if (!result.error && result.data) {
      setFolders((current) => [...current, result.data]);
      setActiveFolderId(result.data.id);
    }
    setCreatingInParentId(null);
    setIsCreatingRootFolder(false);
  };

  const handleRenameFolder = async (folderId, newName) => {
    setFolders((current) =>
      current.map((f) => (f.id === folderId ? { ...f, name: newName } : f))
    );
    await ApiService.characterFolders.update(folderId, { name: newName }, setLoading);
  };

  const handleChangeFolderColor = async (folderId, color) => {
    setFolders((current) =>
      current.map((f) => (f.id === folderId ? { ...f, color } : f))
    );
    await ApiService.characterFolders.update(folderId, { color }, setLoading);
  };

  const handleDeleteFolder = (folder) => {
    if (folder.is_default || folder.name?.toLowerCase() === 'principal') {
      window.alert('La carpeta Principal no se puede eliminar porque es la base del árbol.');
      return;
    }
    setDeleteFolderConfirm(folder);
  };

  const handleConfirmDeleteFolder = async () => {
    if (!deleteFolderConfirm) return;
    const folderId = deleteFolderConfirm.id;
    setDeleteFolderConfirm(null);

    // Optimistically update
    setFolders((current) => current.filter((f) => f.id !== folderId));
    setCharacters((current) =>
      current.map((c) => (c.folder_id === folderId ? { ...c, folder_id: defaultFolder?.id || null } : c))
    );
    if (activeFolderId === folderId) {
      setActiveFolderId('all');
    }

    await ApiService.characterFolders.delete(folderId, story_id, setLoading);
  };

  const handleOpenMoveToFolder = (chars) => {
    const list = Array.isArray(chars) ? chars : [chars];
    if (!list.length) return;
    setTargetCharsForBatch(list);
    setMoveToFolderOpen(true);
  };

  const handleConfirmMoveToFolder = async (characterIds, targetFolderId) => {
    const previousCharacters = characters;
    setCharacters((current) =>
      current.map((c) =>
        characterIds.includes(c.id) ? { ...c, folder_id: targetFolderId } : c
      )
    );

    const result = await ApiService.characters.moveToFolder(characterIds, targetFolderId, setLoading);
    if (result.error) {
      setCharacters(previousCharacters);
      window.alert('No se pudo mover uno o más personajes.');
      return;
    }
    setSelectedCharacterIds([]);
  };

  // ─── Custom Tag Operations ──────────────────────────────────────────────
  const handleCreateTag = async (tagData) => {
    if (!story_id) return;
    const result = await ApiService.characterTags.create(
      {
        ...tagData,
        story_id,
      },
      setLoading
    );
    if (!result.error && result.data) {
      setTags((current) => [...current, result.data]);
    }
  };

  const handleUpdateTag = async (tagId, tagData) => {
    setTags((current) =>
      current.map((t) => (t.id === tagId ? { ...t, ...tagData } : t))
    );
    await ApiService.characterTags.update(tagId, tagData, setLoading);
  };

  const handleDeleteTag = async (tagId) => {
    setTags((current) => current.filter((t) => t.id !== tagId));
    // Remove from active characters
    setCharacters((current) =>
      current.map((c) => ({
        ...c,
        custom_tag_ids: Array.isArray(c.custom_tag_ids)
          ? c.custom_tag_ids.filter((id) => id !== tagId)
          : [],
      }))
    );
    if (tagFilter === tagId) setTagFilter('all');
    await ApiService.characterTags.delete(tagId, setLoading);
  };

  // ─── Custom Archetype Operations ────────────────────────────────────────
  const handleCreateArchetype = async (archData) => {
    if (!story_id) return;
    const result = await ApiService.characterArchetypes.create(
      {
        ...archData,
        story_id,
      },
      setLoading
    );
    if (!result.error && result.data) {
      setCustomArchetypes((current) => [...current, result.data]);
    }
  };

  const handleUpdateArchetype = async (archId, archData) => {
    const oldArch = customArchetypes.find((a) => a.id === archId);
    setCustomArchetypes((current) =>
      current.map((a) => (a.id === archId ? { ...a, ...archData } : a))
    );

    // If archetype name was updated, update any characters using old name
    if (oldArch && archData.name && oldArch.name !== archData.name) {
      setCharacters((current) =>
        current.map((c) =>
          c.role_archetype === oldArch.name ? { ...c, role_archetype: archData.name } : c
        )
      );
    }

    await ApiService.characterArchetypes.update(archId, archData, setLoading);
  };

  const handleDeleteArchetype = async (arch) => {
    const archId = typeof arch === 'object' ? arch.id : arch;
    const archName = typeof arch === 'object' ? arch.name : customArchetypes.find((a) => a.id === archId)?.name;

    setCustomArchetypes((current) => current.filter((a) => a.id !== archId));

    // Reassign affected characters to default 'Secundario'
    if (archName) {
      setCharacters((current) =>
        current.map((c) =>
          c.role_archetype === archName ? { ...c, role_archetype: 'Secundario' } : c
        )
      );
      if (roleFilter === archName) setRoleFilter('all');
    }

    await ApiService.characterArchetypes.delete(archId, setLoading);
  };

  const handleOpenBatchTagAssign = (chars) => {
    const list = Array.isArray(chars) ? chars : [chars];
    if (!list.length) return;
    setTargetCharsForBatch(list);
    setBatchTagModalOpen(true);
  };

  const handleApplyBatchTags = async ({ addTagIds, removeTagIds, finalTagIds, characterIds }) => {
    const previousCharacters = characters;
    setCharacters((current) =>
      current.map((c) => {
        if (!characterIds.includes(c.id)) return c;
        let tagsArr = Array.isArray(c.custom_tag_ids) ? [...c.custom_tag_ids] : [];
        if (removeTagIds.length > 0) tagsArr = tagsArr.filter((t) => !removeTagIds.includes(t));
        if (addTagIds.length > 0) {
          addTagIds.forEach((t) => {
            if (!tagsArr.includes(t)) tagsArr.push(t);
          });
        }
        return { ...c, custom_tag_ids: tagsArr };
      })
    );

    const result = await ApiService.characters.assignTagsBatch(
      characterIds,
      { addTagIds, removeTagIds },
      setLoading
    );

    if (result.error) {
      setCharacters(previousCharacters);
      window.alert('No se pudieron actualizar las etiquetas de los personajes.');
      return;
    }
    setSelectedCharacterIds([]);
  };

  // Distinct roles: standard + custom archetypes + any custom character role
  const availableRoles = useMemo(() => {
    const roles = new Set(CHARACTER_ARCHETYPES);
    customArchetypes.forEach((a) => {
      if (a.name) roles.add(a.name);
    });
    characters.forEach((c) => {
      if (c.role_archetype) roles.add(c.role_archetype);
    });
    return Array.from(roles);
  }, [characters, customArchetypes]);

  // Filter & Sort Pipeline
  const processedCharacters = useMemo(() => {
    let result = [...characters];

    // Tab Filter (0=Locales, 1=Globales, 2=Todos)
    if (characterTab === 0) {
      result = result.filter((c) => !c.is_global);
    } else if (characterTab === 1) {
      result = result.filter((c) => c.is_global);
    }

    // Folder Filter
    if (activeFolderId !== 'all') {
      const isDefault = defaultFolder?.id === activeFolderId;
      result = result.filter((c) =>
        c.folder_id === activeFolderId || (isDefault && !c.folder_id)
      );
    }

    // Custom Tag Filter
    if (tagFilter !== 'all') {
      result = result.filter(
        (c) => Array.isArray(c.custom_tag_ids) && c.custom_tag_ids.includes(tagFilter)
      );
    }

    // Role Filter
    if (roleFilter !== 'all') {
      result = result.filter((c) => (c.role_archetype || 'Sin rol') === roleFilter);
    }

    // Search Query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (c) =>
          c.name?.toLowerCase().includes(q) ||
          c.role_archetype?.toLowerCase().includes(q) ||
          c.biography?.toLowerCase().includes(q) ||
          (Array.isArray(c.custom_tag_ids) &&
            c.custom_tag_ids.some((tid) => {
              const tagObj = tags.find((t) => t.id === tid);
              return tagObj?.name?.toLowerCase().includes(q);
            }))
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
        if (attrB.is_special && !attrA.is_special) return 1;
        if (attrA.is_special && !attrB.is_special) return -1;
        return (a.name || '').localeCompare(b.name || '');
      }
      if (sortBy === 'vital') {
        const ai = CHARACTER_VITAL_STATUSES.indexOf(attrA.vital_status || 'Vivo');
        const bi = CHARACTER_VITAL_STATUSES.indexOf(attrB.vital_status || 'Vivo');
        return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi);
      }
      if (sortBy === 'life-stage') {
        const ai = CHARACTER_LIFE_STAGES.indexOf(attrA.life_stage || '');
        const bi = CHARACTER_LIFE_STAGES.indexOf(attrB.life_stage || '');
        return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi);
      }
      if (sortBy === 'alignment') {
        const ai = CHARACTER_ALIGNMENTS.indexOf(attrA.alignment || '');
        const bi = CHARACTER_ALIGNMENTS.indexOf(attrB.alignment || '');
        return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi);
      }
      if (sortBy === 'gender') {
        const ai = CHARACTER_GENDERS.indexOf(attrA.gender || '');
        const bi = CHARACTER_GENDERS.indexOf(attrB.gender || '');
        return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi);
      }
      return 0;
    });

    return result;
  }, [characters, characterTab, activeFolderId, tagFilter, roleFilter, searchQuery, sortBy, tags, defaultFolder]);

  const allArchetypeOrder = useMemo(() => {
    return [...CHARACTER_ARCHETYPES, ...customArchetypes.map((a) => a.name)];
  }, [customArchetypes]);

  // Group by config
  const GROUP_BY_CONFIG = useMemo(() => ({
    'name-asc': { field: (c) => c.role_archetype || 'Sin Rol', order: allArchetypeOrder, label: 'Rol / Arquetipo', color: 'primary' },
    'name-desc': { field: (c) => c.role_archetype || 'Sin Rol', order: allArchetypeOrder, label: 'Rol / Arquetipo', color: 'primary' },
    'recent': { field: (c) => c.role_archetype || 'Sin Rol', order: allArchetypeOrder, label: 'Rol / Arquetipo', color: 'primary' },
    'special': { field: (c) => (c.attributes?.is_special ? '⭐ Especial' : 'Sin destacar'), order: ['⭐ Especial', 'Sin destacar'], label: 'Destacado', color: 'warning' },
    'vital': { field: (c) => c.attributes?.vital_status || 'Sin definir', order: CHARACTER_VITAL_STATUSES, label: 'Estado Vital', color: 'success' },
    'life-stage': { field: (c) => c.attributes?.life_stage || 'Sin definir', order: CHARACTER_LIFE_STAGES, label: 'Etapa de Vida', color: 'info' },
    'alignment': { field: (c) => c.attributes?.alignment || 'Sin definir', order: CHARACTER_ALIGNMENTS, label: 'Alineamiento', color: 'secondary' },
    'gender': { field: (c) => c.attributes?.gender || 'Sin definir', order: CHARACTER_GENDERS, label: 'Género', color: 'default' },
  }), [allArchetypeOrder]);

  const groupedCharacters = useMemo(() => {
    const config = GROUP_BY_CONFIG[sortBy] || GROUP_BY_CONFIG['name-asc'];
    const grouped = processedCharacters.reduce((acc, char) => {
      const key = config.field(char);
      if (!acc[key]) acc[key] = [];
      acc[key].push(char);
      return acc;
    }, {});

    const orderedKeys = [
      ...config.order.filter((k) => grouped[k]),
      ...Object.keys(grouped).filter((k) => !config.order.includes(k)),
    ];
    return Object.fromEntries(orderedKeys.map((k) => [k, grouped[k]]));
  }, [processedCharacters, sortBy, GROUP_BY_CONFIG]);

  const activeGroupLabel = (GROUP_BY_CONFIG[sortBy] || GROUP_BY_CONFIG['name-asc']).label;
  const activeGroupColor = (GROUP_BY_CONFIG[sortBy] || GROUP_BY_CONFIG['name-asc']).color;

  // Selected folder object
  const currentActiveFolder = useMemo(() => {
    if (activeFolderId === 'all') return null;
    return folders.find((f) => f.id === activeFolderId) || null;
  }, [folders, activeFolderId]);

  if (authLoading || dataLoading) {
    return <CustomLoading fullscreen message="Cargando personajes y carpetas..." />;
  }

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
      <SidebarLore
        view="characters"
        story={activeStory}
        characters={characters}
        characterFolders={folders}
        activeCharacterFolderId={activeFolderId}
        onSelectCharacterFolder={(fId) => setActiveFolderId(fId)}
        onCreateCharacterFolder={handleCommitCreateFolder}
        onRenameCharacterFolder={handleRenameFolder}
        onDeleteCharacterFolder={handleDeleteFolder}
        onChangeCharacterFolderColor={handleChangeFolderColor}
        onMoveCharacterToFolder={(charOrIds, targetFolderId) => {
          if (targetFolderId !== undefined && targetFolderId !== null) {
            const ids = Array.isArray(charOrIds) ? charOrIds : [charOrIds?.id || charOrIds];
            handleConfirmMoveToFolder(ids, targetFolderId);
          } else {
            handleOpenMoveToFolder(charOrIds);
          }
        }}
        onOpenArchetypeManager={() => setArchetypeManagerOpen(true)}
        onOpenTagManager={() => setTagManagerOpen(true)}
        onOpenCharacterModal={() => {
          setSelectedCharacter(null);
          setIsCloneCharMode(false);
          setCharModalOpen(true);
        }}
      />

      <Box sx={{ display: 'flex', flexGrow: 1, height: '100vh', overflow: 'hidden', bgcolor: 'background.default' }}>
        {/* ─── CONTENIDO PRINCIPAL: GESTOR DE PERSONAJES ─── */}
        <Box sx={{ flexGrow: 1, height: '100%', overflowY: 'auto', p: { xs: 1, sm: 2.5 }, minWidth: 0 }}>
          <Container maxWidth="xl" disableGutters sx={{ px: { xs: 0.5, sm: 2 } }}>
            
            {/* Header */}
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
                    width: { xs: 32, sm: 38 },
                    height: { xs: 32, sm: 38 },
                    borderRadius: 2.5,
                    bgcolor: 'primary.main',
                    color: '#fff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                  }}
                >
                  <PeopleOutlineIcon sx={{ fontSize: { xs: 18, sm: 22 } }} />
                </Box>
                <Box sx={{ minWidth: 0 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                    <Typography
                      variant="h5"
                      sx={{
                        fontWeight: 800,
                        fontSize: { xs: '1.05rem', sm: '1.35rem' },
                        lineHeight: 1.2,
                      }}
                      noWrap
                    >
                      Gestión de Personajes
                    </Typography>
                    {currentActiveFolder && (
                      <Chip
                        icon={<FolderIcon sx={{ fontSize: '13px !important', color: currentActiveFolder.color }} />}
                        label={`Carpeta: ${currentActiveFolder.name}`}
                        onDelete={() => setActiveFolderId('all')}
                        size="small"
                        sx={{
                          height: 24,
                          fontWeight: 700,
                          fontSize: '0.72rem',
                          bgcolor: 'background.paper',
                          border: '1px solid',
                          borderColor: currentActiveFolder.color || 'divider',
                        }}
                      />
                    )}
                  </Box>
                  <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, display: 'block' }} noWrap>
                    {processedCharacters.length} personaje(s) mostrados · {activeStory?.title || 'esta historia'}
                  </Typography>
                </Box>
              </Box>

              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexShrink: 0 }}>
                {/* Archetype Manager Button */}
                <CustomButton
                  variant="outlined"
                  color="inherit"
                  size="small"
                  startIcon={<PsychologyOutlinedIcon fontSize="small" />}
                  onClick={() => setArchetypeManagerOpen(true)}
                  sx={{ py: 0.6, px: 1.5, borderRadius: 2, display: { xs: 'none', lg: 'inline-flex' } }}
                >
                  Arquetipos ({customArchetypes.length})
                </CustomButton>

                {/* Tag Manager Button */}
                <CustomButton
                  variant="outlined"
                  color="inherit"
                  size="small"
                  startIcon={<LocalOfferOutlinedIcon fontSize="small" />}
                  onClick={() => setTagManagerOpen(true)}
                  sx={{ py: 0.6, px: 1.5, borderRadius: 2, display: { xs: 'none', md: 'inline-flex' } }}
                >
                  Etiquetas ({tags.length})
                </CustomButton>

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
                  onClick={() => {
                    setSelectedCharacter(null);
                    setIsCloneCharMode(false);
                    setCharModalOpen(true);
                  }}
                  sx={{ py: 0.6, px: 2, borderRadius: 2, display: { xs: 'none', sm: 'inline-flex' } }}
                >
                  Nuevo Personaje
                </CustomButton>

                {/* Create Character (Mobile) */}
                <Tooltip title="Nuevo Personaje">
                  <IconButton
                    onClick={() => {
                      setSelectedCharacter(null);
                      setIsCloneCharMode(false);
                      setCharModalOpen(true);
                    }}
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

            {/* ─── Control Bar: Tabs + Filtros + Buscador + Selector de Vista ─── */}
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
                  '& .MuiTab-root': {
                    fontWeight: 700,
                    fontSize: '0.82rem',
                    textTransform: 'none',
                    minHeight: 36,
                    py: 0,
                    px: { xs: 1.2, sm: 1.8 },
                  },
                }}
              >
                <Tab label={`Locales (${characters.filter((c) => !c.is_global).length})`} />
                <Tab
                  icon={<PublicOutlinedIcon fontSize="small" />}
                  iconPosition="start"
                  label={`Globales (${characters.filter((c) => c.is_global).length})`}
                />
                <Tab
                  icon={<PeopleOutlineIcon fontSize="small" />}
                  iconPosition="start"
                  label={`Todos (${characters.length})`}
                />
              </Tabs>

              {/* Filtros, etiquetas, orden y densidad */}
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                  flexWrap: { xs: 'wrap', sm: 'nowrap' },
                }}
              >
                {/* Filtro por Etiqueta Propia */}
                <FormControl size="small" sx={{ minWidth: { xs: '48%', sm: 140 } }}>
                  <Select
                    value={tagFilter}
                    onChange={(e) => setTagFilter(e.target.value)}
                    startAdornment={<LocalOfferOutlinedIcon fontSize="small" sx={{ mr: 0.5, color: 'text.secondary' }} />}
                    sx={{ borderRadius: 2, fontSize: '0.82rem', height: 34 }}
                  >
                    <MenuItem value="all">Todas las etiquetas</MenuItem>
                    {tags.map((tag) => (
                      <MenuItem key={tag.id} value={tag.id}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8 }}>
                          <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: tag.color || '#8c6d53' }} />
                          {tag.name}
                        </Box>
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                {/* Filtro por Rol */}
                <FormControl size="small" sx={{ minWidth: { xs: '48%', sm: 130 } }}>
                  <Select
                    value={roleFilter}
                    onChange={(e) => setRoleFilter(e.target.value)}
                    startAdornment={<FilterListIcon fontSize="small" sx={{ mr: 0.5, color: 'text.secondary' }} />}
                    sx={{ borderRadius: 2, fontSize: '0.82rem', height: 34 }}
                  >
                    <MenuItem value="all">Todos los roles</MenuItem>
                    {availableRoles.map((role) => (
                      <MenuItem key={role} value={role}>
                        {role}
                      </MenuItem>
                    ))}
                    <MenuItem value="Sin rol">Sin rol</MenuItem>
                  </Select>
                </FormControl>

                {/* Ordenar */}
                <FormControl size="small" sx={{ minWidth: { xs: '48%', sm: 140 } }}>
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
                  placeholder="Buscar personaje o etiqueta…"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  sx={{ width: { xs: '100%', sm: 170 } }}
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

                {/* Densidad de Vista */}
                <ButtonGroup size="small" variant="outlined" sx={{ flexShrink: 0 }}>
                  <Tooltip title="Vista Compacta">
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

                {/* Toggle Descripciones */}
                <Tooltip title={showDescriptions ? 'Ocultar descripciones' : 'Mostrar descripciones'}>
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
                <Tooltip title={groupByRole ? 'Desagrupar secciones' : 'Agrupar por rol'}>
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
                  {searchQuery || roleFilter !== 'all' || tagFilter !== 'all' || activeFolderId !== 'all'
                    ? 'No se encontraron personajes con estos filtros'
                    : 'No hay personajes en esta historia'}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  {searchQuery || roleFilter !== 'all' || tagFilter !== 'all' || activeFolderId !== 'all'
                    ? 'Intenta modificar el término de búsqueda, cambiar de carpeta o quitar los filtros.'
                    : 'Crea tu primer personaje para poblar este universo narrativo.'}
                </Typography>
                <CustomButton
                  startIcon={<AddIcon fontSize="small" />}
                  onClick={() => {
                    setSelectedCharacter(null);
                    setIsCloneCharMode(false);
                    setCharModalOpen(true);
                  }}
                >
                  Crear Personaje
                </CustomButton>
              </Box>
            ) : groupByRole ? (
              <>
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
                          color:
                            activeGroupColor === 'default' || activeGroupColor === 'primary'
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
                          allTags={tags}
                          allFolders={folders}
                          customArchetypes={customArchetypes}
                          viewMode={viewMode}
                          showBiography={showDescriptions}
                          selectable
                          selected={selectedCharacterIds.includes(char.id)}
                          onSelect={toggleCharacterSelection}
                          onEdit={(c) => {
                            setSelectedCharacter(c);
                            setIsCloneCharMode(false);
                            setCharModalOpen(true);
                          }}
                          onDelete={handleDelete}
                          onClone={handleClone}
                          onMakeLocalCopy={(c) => handleRequestCopyAsLocal([c])}
                          onRoleChange={handleRoleChange}
                          onMoveToFolder={(c) => handleOpenMoveToFolder([c])}
                          onAssignTags={(c) => handleOpenBatchTagAssign([c])}
                        />
                      ))}
                    </Box>
                  </Box>
                ))}
              </>
            ) : (
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
                    allTags={tags}
                    allFolders={folders}
                    customArchetypes={customArchetypes}
                    viewMode={viewMode}
                    showBiography={showDescriptions}
                    selectable
                    selected={selectedCharacterIds.includes(char.id)}
                    onSelect={toggleCharacterSelection}
                    onEdit={(c) => {
                      setSelectedCharacter(c);
                      setIsCloneCharMode(false);
                      setCharModalOpen(true);
                    }}
                    onDelete={handleDelete}
                    onClone={handleClone}
                    onMakeLocalCopy={(c) => handleRequestCopyAsLocal([c])}
                    onRoleChange={handleRoleChange}
                    onMoveToFolder={(c) => handleOpenMoveToFolder([c])}
                    onAssignTags={(c) => handleOpenBatchTagAssign([c])}
                  />
                ))}
              </Box>
            )}
          </Container>
        </Box>
      </Box>

      {/* ─── MODALS ─── */}
      <CharacterArchetypeManagerModal
        open={archetypeManagerOpen}
        onClose={() => setArchetypeManagerOpen(false)}
        customArchetypes={customArchetypes}
        characters={characters}
        onCreateArchetype={handleCreateArchetype}
        onUpdateArchetype={handleUpdateArchetype}
        onDeleteArchetype={handleDeleteArchetype}
      />

      <CharacterTagManagerModal
        open={tagManagerOpen}
        onClose={() => setTagManagerOpen(false)}
        tags={tags}
        characters={characters}
        onCreateTag={handleCreateTag}
        onUpdateTag={handleUpdateTag}
        onDeleteTag={handleDeleteTag}
      />

      <MoveToFolderModal
        open={moveToFolderOpen}
        onClose={() => setMoveToFolderOpen(false)}
        charactersToMove={targetCharsForBatch}
        folders={folders}
        onConfirmMove={handleConfirmMoveToFolder}
      />

      <BatchTagAssignModal
        open={batchTagModalOpen}
        onClose={() => setBatchTagModalOpen(false)}
        selectedCharacters={targetCharsForBatch}
        tags={tags}
        onApplyTags={handleApplyBatchTags}
      />

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
        availableTags={tags}
        availableFolders={folders}
        customArchetypes={customArchetypes}
        defaultFolderId={activeFolderId !== 'all' ? activeFolderId : defaultFolder?.id}
        onOpenTagManager={() => {
          setCharModalOpen(false);
          setTagManagerOpen(true);
        }}
        onOpenArchetypeManager={() => {
          setCharModalOpen(false);
          setArchetypeManagerOpen(true);
        }}
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
                src={pendingDeleteChar.avatar_url}
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

      {/* Modal de confirmación para eliminar carpeta */}
      <CustomModal
        open={Boolean(deleteFolderConfirm)}
        onClose={() => setDeleteFolderConfirm(null)}
        title="Eliminar Carpeta de Personajes"
        subtitle="Los personajes se reubicarán automáticamente"
        icon={DeleteOutlineIcon}
        maxWidth="xs"
        actions={
          <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end', width: '100%' }}>
            <CustomButton
              variant="outlined"
              color="inherit"
              onClick={() => setDeleteFolderConfirm(null)}
            >
              Cancelar
            </CustomButton>
            <CustomButton
              variant="contained"
              color="error"
              onClick={handleConfirmDeleteFolder}
            >
              Eliminar Carpeta
            </CustomButton>
          </Box>
        }
      >
        <Typography variant="body2" color="text.secondary">
          ¿Deseas eliminar la carpeta <strong>{deleteFolderConfirm?.name}</strong>? Los personajes que pertenecen a esta carpeta se conservarán y pasarán a la carpeta <strong>Principal</strong>.
        </Typography>
      </CustomModal>

      {/* ─── SELECTION ACTION BAR (ACCIONES MASIVAS) ─── */}
      <SelectionActionBar
        count={selectedCharacterIds.length}
        onClear={() => setSelectedCharacterIds([])}
        actions={[
          {
            key: 'move-folder',
            label: 'Mover a carpeta...',
            tooltip: 'Mover personajes seleccionados a otra carpeta',
            icon: <DriveFileMoveOutlinedIcon fontSize="small" />,
            onClick: () => {
              const selectedChars = characters.filter((c) => selectedCharacterIds.includes(c.id));
              handleOpenMoveToFolder(selectedChars);
            },
            color: 'primary',
          },
          {
            key: 'assign-tags',
            label: 'Etiquetar en grupo...',
            tooltip: 'Asignar o remover etiquetas a todos los seleccionados',
            icon: <LocalOfferOutlinedIcon fontSize="small" />,
            onClick: () => {
              const selectedChars = characters.filter((c) => selectedCharacterIds.includes(c.id));
              handleOpenBatchTagAssign(selectedChars);
            },
            color: 'secondary',
          },
          {
            key: 'copy-local',
            label: 'Crear una copia',
            tooltip: 'Crear copia local de los seleccionados para esta historia',
            icon: <BookmarkAddOutlinedIcon fontSize="small" />,
            onClick: () => handleRequestCopyAsLocal(selectedCharacterIds),
          },
          {
            key: 'make-global',
            label: 'Hacer globales',
            tooltip: 'Hacer globales',
            icon: <PublicOutlinedIcon fontSize="small" />,
            onClick: () => handleSetSelectedGlobal(true),
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
