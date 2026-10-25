import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
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
import { useAuth } from '../../../context/AuthContext';
import { useStory } from '../../../context/StoryContext';
import { useLoading } from '../../../context/LoadingContext';
import { useWorkspaceView } from '../../../context/WorkspaceViewContext';
import { ApiService } from '../../../utils/ApiService';
import CustomLoading from '../../common/CustomLoading';
import LinearProgress from '@mui/material/LinearProgress';
import CustomModal from '../../common/CustomModal';
import SelectionActionBar from '../../common/SelectionActionBar';
import CharacterModal from '../../characters/CharacterModal';
import CharacterCard from '../../characters/CharacterCard';
import CharacterExportModal from '../../characters/CharacterExportModal';
import CopyGlobalConfirmModal from '../../characters/CopyGlobalConfirmModal';
import CharacterFolderTreeItem, { InlineFolderInput } from '../../characters/CharacterFolderTree';
import CharacterTagManagerModal from '../../characters/CharacterTagManagerModal';
import CharacterArchetypeManagerModal from '../../characters/CharacterArchetypeManagerModal';
import BatchTagAssignModal from '../../characters/BatchTagAssignModal';
import MoveToFolderModal from '../../characters/MoveToFolderModal';
import CustomButton from '../../common/CustomButton';
import CharactersToolbar from '../toolbars/CharactersToolbar';
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
import GridViewIcon from '@mui/icons-material/GridView';
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
import { CHARACTER_ALIGNMENTS,
  CHARACTER_LIFE_STAGES,
  CHARACTER_VITAL_STATUSES,
  CHARACTER_GENDERS,
  CHARACTER_ARCHETYPES, DEFAULT_ENTITY_COLOR } from '../../../constants/constants';
import { useNotify } from '../../../context/FeedbackContext';
import IconAction from '../../common/IconAction';

export default function CharactersWorkspaceView({ storyId = null }) {
  const notify = useNotify();
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { activeStory, activeStoryId } = useStory();
  const story_id = storyId || activeStoryId || router.query.story_id;
  const { setLoading } = useLoading();
  const {
    charactersSearch,
    charactersRoleFilter,
    setCharactersRoleFilter,
    charactersScope,
    setCharactersScope,
    charactersTag: tagFilter,
    setCharactersTag: setTagFilter,
    charactersSort: sortBy,
    charactersViewMode: viewMode,
    charactersShowDescriptions: showDescriptions,
    charactersGroupByRole: groupByRole,
    setCharactersToolbar,
    hasWorkspaceNavbar,
  } = useWorkspaceView();

  // Guard: solo cargar una vez por story_id (evita re-fetches al alternar tabs)
  const hasLoadedRef = useRef(false);
  const loadedStoryRef = useRef(null);

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

  // Filtros y modo de vista viven en WorkspaceViewContext (los controla el WorkspaceNavbar)

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
    if (!story_id) return;
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
      hasLoadedRef.current = true;
      loadedStoryRef.current = story_id;
    } catch (e) {
      console.error(e);
      setCharacters([]);
      setRelationships([]);
      setFolders([]);
      setTags([]);
      setCustomArchetypes([]);
    }
    setDataLoading(false);
  }, [story_id, setLoading]);

  useEffect(() => {
    // Si ya tenemos datos de esta misma historia, no volver a pedir al backend
    if (story_id && loadedStoryRef.current === story_id && hasLoadedRef.current) {
      return;
    }
    if (story_id) {
      loadData();
    }
  }, [story_id, loadData]);

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
      notify.error('No se pudo actualizar uno o más personajes.');
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
      setCharactersScope(0);
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

  const openCreateCharacter = () => {
    setSelectedCharacter(null);
    setIsCloneCharMode(false);
    setCharModalOpen(true);
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
      notify.error('No se pudo actualizar el tipo del personaje.');
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
        color: DEFAULT_ENTITY_COLOR,
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
      notify.warning('La carpeta Principal no se puede eliminar porque es la base del árbol.');
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
      notify.error('No se pudo mover uno o más personajes.');
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
      if (charactersRoleFilter === archName) setCharactersRoleFilter('all');
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
      notify.error('No se pudieron actualizar las etiquetas de los personajes.');
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

    // Scope Filter (0=Locales, 1=Globales, 2=Todos)
    if (charactersScope === 0) {
      result = result.filter((c) => !c.is_global);
    } else if (charactersScope === 1) {
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
    if (charactersRoleFilter !== 'all') {
      result = result.filter((c) => (c.role_archetype || 'Sin rol') === charactersRoleFilter);
    }

    // Search Query
    const effectiveSearch = (charactersSearch || '').trim().toLowerCase();
    if (effectiveSearch) {
      result = result.filter(
        (c) =>
          c.name?.toLowerCase().includes(effectiveSearch) ||
          c.role_archetype?.toLowerCase().includes(effectiveSearch) ||
          c.biography?.toLowerCase().includes(effectiveSearch) ||
          (Array.isArray(c.custom_tag_ids) &&
            c.custom_tag_ids.some((tid) => {
              const tagObj = tags.find((t) => t.id === tid);
              return tagObj?.name?.toLowerCase().includes(effectiveSearch);
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
      if (sortBy === 'has-image') {
        const hasA = Boolean(a.avatar_url);
        const hasB = Boolean(b.avatar_url);
        if (hasB && !hasA) return 1;
        if (hasA && !hasB) return -1;
        return (a.name || '').localeCompare(b.name || '');
      }
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
  }, [
    characters,
    charactersScope,
    activeFolderId,
    tagFilter,
    charactersRoleFilter,
    charactersSearch,
    sortBy,
    tags,
    defaultFolder,
  ]);

  const allArchetypeOrder = useMemo(() => {
    return [...CHARACTER_ARCHETYPES, ...customArchetypes.map((a) => a.name)];
  }, [customArchetypes]);

  // Group by config
  const GROUP_BY_CONFIG = useMemo(() => ({
    'name-asc': { field: (c) => c.role_archetype || 'Sin Rol', order: allArchetypeOrder, label: 'Rol / Arquetipo', color: 'primary' },
    'name-desc': { field: (c) => c.role_archetype || 'Sin Rol', order: allArchetypeOrder, label: 'Rol / Arquetipo', color: 'primary' },
    'recent': { field: (c) => c.role_archetype || 'Sin Rol', order: allArchetypeOrder, label: 'Rol / Arquetipo', color: 'primary' },
    'has-image': { field: (c) => (c.avatar_url ? '🖼️ Con Imagen' : 'Sin Imagen'), order: ['🖼️ Con Imagen', 'Sin Imagen'], label: 'Tiene Imagen', color: 'info' },
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

  // Publica datos y acciones para la barra del WorkspaceNavbar (conteos, etiquetas, roles, modales)
  const localCount = characters.filter((c) => !c.is_global).length;
  const globalCount = characters.filter((c) => c.is_global).length;
  const totalCount = characters.length;
  const shownCount = processedCharacters.length;
  const archetypesCount = customArchetypes.length;
  useEffect(() => {
    setCharactersToolbar({
      counts: { local: localCount, global: globalCount, all: totalCount, shown: shownCount },
      tags,
      roles: availableRoles,
      archetypesCount,
      onOpenArchetypes: () => setArchetypeManagerOpen(true),
      onOpenTags: () => setTagManagerOpen(true),
      onOpenExport: () => setExportModalOpen(true),
      onCreate: openCreateCharacter,
    });
  }, [setCharactersToolbar, localCount, globalCount, totalCount, shownCount, tags, availableRoles, archetypesCount]);

  useEffect(() => () => setCharactersToolbar(null), [setCharactersToolbar]);

  if (authLoading || dataLoading) {
    return (
      <Box sx={{ width: '100%', position: 'relative' }}>
        {/* Barra de progreso discreta en la parte superior — no bloquea la pantalla */}
        <LinearProgress
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            zIndex: 10,
            height: 3,
            borderRadius: 0,
          }}
        />
        {/* Espacio de contenido mientras carga: evita el salto de layout */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            height: '60vh',
            flexDirection: 'column',
            gap: 2,
            opacity: 0.7,
          }}
        >
          <CustomLoading message="Cargando personajes..." subtitle="" size={48} />
        </Box>
      </Box>
    );
  }

  const gridTemplateColumns = {
    gallery: {
      xs: 'repeat(auto-fill, minmax(105px, 1fr))',
      sm: 'repeat(auto-fill, minmax(130px, 1fr))',
      md: 'repeat(auto-fill, minmax(150px, 1fr))',
      lg: 'repeat(auto-fill, minmax(165px, 1fr))',
    },
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
  }[viewMode] || {
    xs: 'repeat(auto-fill, minmax(130px, 1fr))',
    md: 'repeat(auto-fill, minmax(160px, 1fr))',
  };

  return (
    <>
      <Box sx={{ display: 'flex', flexGrow: 1, height: '100%', overflow: 'hidden', bgcolor: 'background.default' }}>
        {/* ─── CONTENIDO PRINCIPAL: GESTOR DE PERSONAJES ─── */}
        <Box sx={{ flexGrow: 1, height: '100%', overflowY: 'auto', p: { xs: 1, sm: 2.5 }, minWidth: 0 }}>
          <Container maxWidth="xl" disableGutters sx={{ px: { xs: 0.5, sm: 2 } }}>
            
            {/* Con navbar solo se muestra la carpeta activa; el título lo da la pestaña */}
            {hasWorkspaceNavbar && currentActiveFolder && (
              <Box sx={{ mb: 1.5 }}>
                <Chip
                  icon={<FolderIcon sx={{ fontSize: '13px !important', color: currentActiveFolder.color }} />}
                  label={`Carpeta: ${currentActiveFolder.name}`}
                  onDelete={() => setActiveFolderId('all')}
                  size="small"
                  sx={{ height: 24, fontWeight: 700, fontSize: '0.72rem', bgcolor: 'background.paper', border: '1px solid', borderColor: currentActiveFolder.color || 'divider' }}
                />
              </Box>
            )}

            {!hasWorkspaceNavbar && (
              <>
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

              {/* Sin WorkspaceNavbar (página suelta) la acción de crear vive aquí */}
              {!hasWorkspaceNavbar && (
                <CustomButton
                  variant="contained"
                  color="primary"
                  size="small"
                  startIcon={<AddIcon fontSize="small" />}
                  onClick={openCreateCharacter}
                  sx={{ py: 0.6, px: 2, borderRadius: 2, flexShrink: 0 }}
                >
                  Nuevo Personaje
                </CustomButton>
              )}
            </Box>

              </>
            )}

            {/* ─── Controles: viven en el WorkspaceNavbar; aquí solo como respaldo en páginas sueltas ─── */}
            {!hasWorkspaceNavbar && (
              <Paper
                elevation={0}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: 1,
                  mb: 2.5,
                  p: 1,
                  borderRadius: 2.5,
                  bgcolor: 'background.paper',
                  border: 1,
                  borderColor: 'divider',
                }}
              >
                <CharactersToolbar />
              </Paper>
            )}

            {/* ─── Listado de Personajes ─── */}
            {processedCharacters.length === 0 ? (
              <Box sx={{ textAlign: 'center', py: 8, bgcolor: 'background.paper', borderRadius: 3, border: 1, borderColor: 'divider' }}>
                <PeopleOutlineIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 1.5 }} />
                <Typography variant="h6" sx={{ fontWeight: 700, color: 'text.secondary', mb: 1 }}>
                  {charactersSearch || charactersRoleFilter !== 'all' || tagFilter !== 'all' || activeFolderId !== 'all'
                    ? 'No se encontraron personajes con estos filtros'
                    : 'No hay personajes en esta historia'}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  {charactersSearch || charactersRoleFilter !== 'all' || tagFilter !== 'all' || activeFolderId !== 'all'
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
                        gap: viewMode === 'gallery' ? 1 : viewMode === 'compact' ? 1.2 : 1.8,
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
                  gap: viewMode === 'gallery' ? 1 : viewMode === 'compact' ? 1.2 : 1.8,
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
