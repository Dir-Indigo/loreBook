import React, { useState, useMemo, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/router";
import { useEventOrder } from '../../hooks/useEventOrder';
import { useQuickNotes } from '../../context/QuickNotesContext';
import { useStory } from '../../context/StoryContext';
import { useWorkspace } from '../../context/WorkspaceContext';
import { useGlobalActions } from '../../context/GlobalActionsContext';
import { alpha } from '@mui/material/styles';
import {
  Box,
  Typography,
  IconButton,
  Tooltip,
  Divider,
  Chip,
  Badge,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Tabs,
  Tab,
  Avatar,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  ListItemButton,
  InputAdornment,
  useMediaQuery,
  useTheme,
  Button,
  ButtonGroup,
  CircularProgress,
} from "@mui/material";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import PeopleOutlineIcon from "@mui/icons-material/PeopleOutline";
import LayersOutlinedIcon from "@mui/icons-material/LayersOutlined";
import AddIcon from "@mui/icons-material/Add";
import PhotoCameraIcon from "@mui/icons-material/PhotoCamera";
import FileUploadOutlinedIcon from "@mui/icons-material/FileUploadOutlined";
import LinkIcon from "@mui/icons-material/Link";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import AccountTreeOutlinedIcon from "@mui/icons-material/AccountTreeOutlined";
import LightbulbOutlinedIcon from "@mui/icons-material/LightbulbOutlined";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import SearchIcon from "@mui/icons-material/Search";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import BookmarkBorderIcon from "@mui/icons-material/BookmarkBorder";
import PsychologyOutlinedIcon from "@mui/icons-material/PsychologyOutlined";
import LocalOfferOutlinedIcon from "@mui/icons-material/LocalOfferOutlined";
import CreateNewFolderOutlinedIcon from "@mui/icons-material/CreateNewFolderOutlined";
import FolderSpecialIcon from "@mui/icons-material/FolderSpecial";
import CustomButton from "../common/CustomButton";
import BoardTreeItem from "../sidebar/BoardTreeItem";
import CharacterFolderTreeItem, { InlineFolderInput as InlineCharFolderInput } from "../characters/CharacterFolderTree";
import MoveToFolderModal from "../characters/MoveToFolderModal";
import ImageCropModal from "../common/ImageCropModal";
import SidebarIdeasSection from "./sidebar-lore/SidebarIdeasSection";
import SidebarManuscriptSection from "./sidebar-lore/SidebarManuscriptSection";
import AutoStoriesIcon from "@mui/icons-material/AutoStories";
import ViewSidebarOutlinedIcon from "@mui/icons-material/ViewSidebarOutlined";
import { useSidebarDetail, DETAIL_VIEWS } from "../../context/SidebarDetailContext";
import { useWorkspaceView, WORKSPACE_VIEW_KEYS } from "../../context/WorkspaceViewContext";
import { uploadStoryCover } from "../../services/storageService";
import { useSwipeToClose } from '../../hooks/useSwipeToClose';
import { APP_CONFIG } from '../../constants/constants';
import { ApiService } from '../../utils/ApiService';

export default function SidebarLore({
  view = 'dashboard',
  story,
  characters = [],
  events = [],
  eventConnections = [],
  boards = [],
  activeBoardId,
  characterFolders = null,
  activeCharacterFolderId = 'all',
  onSelectCharacterFolder,
  onCreateCharacterFolder,
  onRenameCharacterFolder,
  onDeleteCharacterFolder,
  onChangeCharacterFolderColor,
  onMoveCharacterToFolder,
  onOpenStorySelector,
  onOpenCharactersDrawer,
  onOpenCharacterModal,
  onOpenArchetypeManager,
  onOpenTagManager,
  onOpenCreateEvent,
  onUpdateStoryCover,
  onSelectBoard,
  onCreateBoard,
  onRenameBoard,
  onDeleteBoard,
  onChangeBoardColor,
  onOpenEditEvent,
  onDeleteEvent,
  onDeleteCharacter,
}) {
  const router = useRouter();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  // Global Contexts
  const { activeStory, changeActiveStory } = useStory();
  const {
    characters: ctxCharacters,
    allEvents: ctxAllEvents,
    events: ctxEvents,
    eventConnections: ctxEventConnections,
    boards: ctxBoards,
    activeBoardId: ctxActiveBoardId,
    selectBoard: ctxSelectBoard,
    createBoard: ctxCreateBoard,
    updateBoard: ctxUpdateBoard,
    deleteBoard: ctxDeleteBoard,
  } = useWorkspace();
  const { openCreateEvent, openCreateChar } = useGlobalActions();
  const {
    notes,
    notesLoading,
    totalCount: notesTotalCount,
    isOpen: isNotesOpen,
    setIsOpen: setIsNotesOpen,
    toggleOpen: toggleNotesPanel,
  } = useQuickNotes();
  const { openDetail, closeDetail, activeView, isOpen: isDetailOpen } = useSidebarDetail();
  const { activeView: workspaceActiveView, setActiveView: setWorkspaceActiveView } = useWorkspaceView();

  // Effective fallbacks so SidebarLore works anywhere without missing data
  const effectiveStory = story || activeStory;
  const effectiveCharacters = (characters && characters.length > 0) ? characters : (ctxCharacters || []);
  const effectiveEvents = (events && events.length > 0) ? events : (ctxAllEvents && ctxAllEvents.length > 0 ? ctxAllEvents : (ctxEvents || []));
  const effectiveConnections = (eventConnections && eventConnections.length > 0) ? eventConnections : (ctxEventConnections || []);
  const effectiveBoards = (boards && boards.length > 0) ? boards : (ctxBoards || []);
  const effectiveActiveBoardId = activeBoardId || ctxActiveBoardId;

  const [collapsed, setCollapsed] = useState(false);
  const sidebarRef = useRef(null);

  // Swipe-to-close: swipe left → collapse (sidebar is on the left side)
  const handleCollapse = useCallback(() => setCollapsed(true), []);
  useSwipeToClose(sidebarRef, handleCollapse, 'left', 60, !collapsed);
  
  // Persist sidebarTab (safe against SSR hydration mismatch)
  const [sidebarTab, setSidebarTab] = useState(0);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('lorebook_sidebar_tab');
      if (saved !== null) {
        setSidebarTab(parseInt(saved, 10));
      }
    }
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('lorebook_sidebar_tab', sidebarTab.toString());
    }
  }, [sidebarTab]);

  // Tabs of sidebar and workspace are fully independent (no forced synchronization)
  
  // Search states
  const [charSearch, setCharSearch] = useState("");


  // Internal character folders state if not provided as props
  const [localFolders, setLocalFolders] = useState([]);
  const [isCreatingRootCharFolder, setIsCreatingRootCharFolder] = useState(false);
  const [creatingCharChildInParentId, setCreatingCharChildInParentId] = useState(null);

  // Move character modal in sidebar
  const [sidebarMoveChar, setSidebarMoveChar] = useState(null);

  useEffect(() => {
    if (characterFolders) {
      setLocalFolders(characterFolders);
    } else if (effectiveStory?.id) {
      ApiService.characterFolders.ensureDefaultFolder(effectiveStory.id).then(() => {
        ApiService.characterFolders.getAll(effectiveStory.id).then((res) => {
          if (res.data) setLocalFolders(res.data);
        });
      });
    }
  }, [characterFolders, effectiveStory?.id]);

  const effectiveFolders = characterFolders || localFolders;

  // Root character folders
  const rootCharacterFolders = useMemo(() => {
    return effectiveFolders.filter((f) => !f.parent_folder_id);
  }, [effectiveFolders]);

  // Default character folder
  const defaultCharFolder = useMemo(() => {
    return effectiveFolders.find((f) => f.is_default || f.name?.toLowerCase() === 'principal') || effectiveFolders[0] || null;
  }, [effectiveFolders]);

  // Default to collapsed on mobile/tablets upon initial mount or viewport resize
  useEffect(() => {
    if (isMobile) {
      setCollapsed(true);
    }
  }, [isMobile]);

  const [quickCoverOpen, setQuickCoverOpen] = useState(false);
  const [newCoverUrl, setNewCoverUrl] = useState("");
  const [coverMode, setCoverMode] = useState("upload");
  const [cropModalOpen, setCropModalOpen] = useState(false);
  const [rawCoverImageSrc, setRawCoverImageSrc] = useState(null);
  const [uploadingCover, setUploadingCover] = useState(false);
  const coverFileInputRef = useRef(null);

  const [newBoardDialogOpen, setNewBoardDialogOpen] = useState(false);
  const [newBoardName, setNewBoardName] = useState("");
  const [newBoardParentId, setNewBoardParentId] = useState(null);

  const rootBoards = useMemo(
    () => effectiveBoards.filter((b) => !b.parent_board_id),
    [effectiveBoards]
  );

  const storyNotes = useMemo(() => {
    if (!effectiveStory?.id) return [];
    return notes.filter((n) => n.story_id === effectiveStory.id);
  }, [notes, effectiveStory?.id]);

  const filteredCharacters = useMemo(() => {
    let availableCharacters = effectiveCharacters.filter((c) => {
      if (c.story_id === effectiveStory?.id) return true;
      if (c.is_global && (!c.story_id || c.story_id === effectiveStory?.id)) return true;
      return false;
    });

    if (!charSearch.trim()) return availableCharacters;
    const q = charSearch.toLowerCase();
    return availableCharacters.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.role_archetype?.toLowerCase().includes(q)
    );
  }, [effectiveCharacters, charSearch, effectiveStory?.id]);

  const eventOrderMap = useEventOrder(effectiveEvents, effectiveConnections);

  const handleOpenQuickCover = () => {
    const currentUrl = story?.cover_url || "";
    setNewCoverUrl(currentUrl);
    setCoverMode(currentUrl && !currentUrl.includes('supabase.co/storage') && currentUrl.startsWith('http') ? 'url' : 'upload');
    setQuickCoverOpen(true);
  };

  const handleCoverFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      setRawCoverImageSrc(reader.result);
      setCropModalOpen(true);
      e.target.value = '';
    };
    reader.readAsDataURL(file);
  };

  const handleCropComplete = async (optimizedBlob, previewUrl) => {
    setUploadingCover(true);
    try {
      const result = await uploadStoryCover(optimizedBlob, story?.id || 'new');
      if (result?.url) {
        setNewCoverUrl(result.url);
        if (story && onUpdateStoryCover) {
          await onUpdateStoryCover(story.id, result.url);
        }
      } else {
        setNewCoverUrl(previewUrl);
      }
    } catch (err) {
      console.error('Error uploading story cover:', err);
      setNewCoverUrl(previewUrl);
    } finally {
      setUploadingCover(false);
      setQuickCoverOpen(false);
    }
  };

  const handleRemoveCover = async () => {
    setNewCoverUrl("");
    if (story && onUpdateStoryCover) {
      await onUpdateStoryCover(story.id, null);
    }
    setQuickCoverOpen(false);
  };

  const handleSaveCover = async () => {
    if (story && onUpdateStoryCover) {
      await onUpdateStoryCover(story.id, newCoverUrl.trim() || null);
    }
    setQuickCoverOpen(false);
  };

  const handleRequestCreateBoard = (parentBoardId = null) => {
    setNewBoardParentId(parentBoardId);
    setNewBoardName("");
    setNewBoardDialogOpen(true);
  };

  const handleSelectBoardAction = (boardId) => {
    if (onSelectBoard) {
      onSelectBoard(boardId);
    } else {
      ctxSelectBoard({ storyId: effectiveStory?.id, boardId });
      if (router.pathname !== '/dashboard') {
        router.push('/dashboard');
      }
    }
  };

  const handleConfirmCreateBoard = async () => {
    const name = newBoardName.trim() || "Nuevo tablero";
    if (onCreateBoard) {
      onCreateBoard(name, newBoardParentId);
    } else if (effectiveStory?.id) {
      await ctxCreateBoard({ storyId: effectiveStory.id, name, parentBoardId: newBoardParentId });
    }
    setNewBoardDialogOpen(false);
  };

  const handleRenameBoardAction = async (boardId, name) => {
    if (onRenameBoard) {
      onRenameBoard(boardId, name);
    } else {
      await ctxUpdateBoard({ boardId, patch: { name } });
    }
  };

  const handleDeleteBoardAction = async (board) => {
    const boardId = board?.id || board;
    if (onDeleteBoard) {
      onDeleteBoard(board);
    } else if (effectiveStory?.id) {
      await ctxDeleteBoard({ storyId: effectiveStory.id, boardId });
    }
  };

  const handleChangeBoardColorAction = async (boardId, color) => {
    if (onChangeBoardColor) {
      onChangeBoardColor(boardId, color);
    } else {
      await ctxUpdateBoard({ boardId, patch: { color } });
    }
  };

  const handleOpenCreateEventAction = (targetBoardId) => {
    const bId = targetBoardId || effectiveActiveBoardId;
    if (onOpenCreateEvent) {
      onOpenCreateEvent(bId);
    } else if (openCreateEvent) {
      openCreateEvent(bId);
    } else {
      router.push('/dashboard');
    }
  };

  const handleOpenCharModalAction = () => {
    if (onOpenCharacterModal) {
      onOpenCharacterModal();
    } else if (openCreateChar) {
      openCreateChar();
    } else {
      // Switch to characters view without a full page reload
      setWorkspaceActiveView(WORKSPACE_VIEW_KEYS.CHARACTERS);
      if (router.pathname !== '/dashboard') router.push('/dashboard');
    }
  };

  // Character folder creation handler in Sidebar
  const handleCommitCreateCharFolder = async (name, parentFolderId = null) => {
    if (!story?.id || !name.trim()) return;
    if (onCreateCharacterFolder) {
      await onCreateCharacterFolder(name.trim(), parentFolderId);
    } else {
      const result = await ApiService.characterFolders.create({
        story_id: story.id,
        name: name.trim(),
        parent_folder_id: parentFolderId,
        color: '#8c6d53',
        position: effectiveFolders.length,
      });
      if (result.data) {
        setLocalFolders((prev) => [...prev, result.data]);
      }
    }
    setIsCreatingRootCharFolder(false);
    setCreatingCharChildInParentId(null);
  };

  const handleRenameCharFolder = async (folderId, newName) => {
    if (onRenameCharacterFolder) {
      await onRenameCharacterFolder(folderId, newName);
    } else {
      setLocalFolders((prev) => prev.map((f) => f.id === folderId ? { ...f, name: newName } : f));
      await ApiService.characterFolders.update(folderId, { name: newName });
    }
  };

  const handleChangeCharFolderColor = async (folderId, color) => {
    if (onChangeCharacterFolderColor) {
      await onChangeCharacterFolderColor(folderId, color);
    } else {
      setLocalFolders((prev) => prev.map((f) => f.id === folderId ? { ...f, color } : f));
      await ApiService.characterFolders.update(folderId, { color });
    }
  };

  const handleDeleteCharFolder = async (folder) => {
    if (folder.is_default || folder.name?.toLowerCase() === 'principal') {
      window.alert('La carpeta Principal no se puede eliminar.');
      return;
    }
    if (onDeleteCharacterFolder) {
      await onDeleteCharacterFolder(folder);
    } else {
      setLocalFolders((prev) => prev.filter((f) => f.id !== folder.id));
      await ApiService.characterFolders.delete(folder.id, story.id);
    }
  };

  const handleConfirmSidebarMoveChar = async (charIds, targetFolderId) => {
    if (onMoveCharacterToFolder) {
      await onMoveCharacterToFolder(charIds, targetFolderId);
    } else {
      await ApiService.characters.moveToFolder(charIds, targetFolderId);
      if (router.pathname.includes('/characters')) {
        router.replace(router.asPath);
      }
    }
    setSidebarMoveChar(null);
  };

  const hasCover = Boolean(effectiveStory?.cover_url);

  return (
    <Box
      sx={{
        display: "flex",
        height: "100%",
        flexShrink: 0,
        position: "relative",
        zIndex: 10,
      }}
    >
      {/* ─── Collapsed Slim Sidebar View (54px) ─────────────────────────── */}
      {collapsed ? (
        <Box
          sx={{
            width: 54,
            height: "100%",
            bgcolor: "custom.sidebar",
            borderRight: 1,
            borderColor: "divider",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            py: 1.5,
            gap: 1.5,
            zIndex: 5,
          }}
        >
          <Tooltip title="Expandir barra lateral" placement="right">
            <IconButton size="small" onClick={() => setCollapsed(false)}>
              <ChevronRightIcon fontSize="small" />
            </IconButton>
          </Tooltip>

          <Divider sx={{ width: "80%" }} />

          <Tooltip title={`Historias (${effectiveStory ? effectiveStory.title : "Ninguna"})`} placement="right">
            <IconButton size="small" onClick={onOpenStorySelector}>
              <LayersOutlinedIcon fontSize="small" color="action" />
            </IconButton>
          </Tooltip>

          <Tooltip title={`Tramas (${effectiveBoards.length} tableros)`} placement="right">
            <IconButton
              size="small"
              onClick={() => {
                setSidebarTab(0);
                setCollapsed(false);
              }}
              sx={{ color: sidebarTab === 0 ? 'primary.main' : 'action' }}
            >
              <AccountTreeOutlinedIcon fontSize="small" />
            </IconButton>
          </Tooltip>

          <Tooltip title={`Personajes y Carpetas (${filteredCharacters.length})`} placement="right">
            <IconButton
              size="small"
              onClick={() => {
                setSidebarTab(1);
                setCollapsed(false);
              }}
            >
              <Badge badgeContent={filteredCharacters.length} color="primary">
                <PeopleOutlineIcon fontSize="small" color={sidebarTab === 1 ? 'primary' : 'action'} />
              </Badge>
            </IconButton>
          </Tooltip>

          <Tooltip title={`Ideas de la historia (${storyNotes.length})`} placement="right">
            <IconButton
              size="small"
              onClick={() => {
                setSidebarTab(2);
                setCollapsed(false);
              }}
            >
              <Badge badgeContent={storyNotes.length} color="secondary">
                <LightbulbOutlinedIcon fontSize="small" color={isDetailOpen && activeView === DETAIL_VIEWS.NOTES ? 'primary' : 'action'} />
              </Badge>
            </IconButton>
          </Tooltip>

          <Tooltip title="Capítulos del Manuscrito" placement="right">
            <IconButton
              size="small"
              onClick={() => { setSidebarTab(3); setCollapsed(false); }}
            >
              <AutoStoriesIcon fontSize="small" color={sidebarTab === 3 ? 'primary' : 'action'} />
            </IconButton>
          </Tooltip>

          <Tooltip title="Resumen e información" placement="right">
            <IconButton
              size="small"
              onClick={() => { setSidebarTab(4); setCollapsed(false); }}
            >
              <InfoOutlinedIcon fontSize="small" color={sidebarTab === 4 ? 'primary' : 'action'} />
            </IconButton>
          </Tooltip>

          <Divider sx={{ width: "80%" }} />

          {/* Botón de Detalles en modo colapsado */}
          <Tooltip title="Abrir / Cerrar panel de detalles" placement="right">
            <IconButton
              size="small"
              onClick={() => {
                if (isDetailOpen) {
                  closeDetail();
                } else {
                  // Abre la vista correspondiente al tab activo
                  const tabToDetail = [
                    DETAIL_VIEWS.PLOTS,
                    DETAIL_VIEWS.CHARACTERS,
                    DETAIL_VIEWS.NOTES,
                    DETAIL_VIEWS.PLOTS,
                    DETAIL_VIEWS.NOTES,
                  ];
                  openDetail(tabToDetail[sidebarTab] ?? DETAIL_VIEWS.NOTES);
                }
              }}
              sx={{
                color: isDetailOpen ? 'primary.main' : 'action',
                bgcolor: isDetailOpen ? 'action.selected' : 'transparent',
              }}
            >
              <ViewSidebarOutlinedIcon fontSize="small" />
            </IconButton>
          </Tooltip>

          {effectiveActiveBoardId && (
            <Tooltip title="Crear Evento en Tablero Activo" placement="right">
              <IconButton
                size="small"
                onClick={() => handleOpenCreateEventAction(effectiveActiveBoardId)}
                sx={{ bgcolor: "primary.main", color: "#fff", mt: 'auto', '&:hover': { bgcolor: 'primary.dark' } }}
              >
                <AddIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
        </Box>
      ) : (
        <Box
          ref={sidebarRef}
          sx={{
            width: 340,
            minWidth: 340,
            height: "100%",
            bgcolor: "custom.sidebar",
            borderRight: 1,
            borderColor: "divider",
            display: "flex",
            flexDirection: "column",
            zIndex: 5,
            transition: "width 0.2s ease",
            position: 'relative',
            overflowX: 'hidden',
          }}
        >
      {/* Top Header */}
      <Box
        sx={{
          p: 1.2,
          px: 2,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          borderBottom: 1,
          borderColor: "divider",
        }}
      >
        <Typography variant="subtitle2" sx={{ fontWeight: 800, fontSize: '0.88rem' }}>
          {sidebarTab === 0
            ? 'Líneas & Escenas'
            : sidebarTab === 1
            ? 'Personajes & Carpetas'
            : sidebarTab === 2
            ? 'Ideas del Proyecto'
            : sidebarTab === 3
            ? 'Capítulos & Manuscrito'
            : 'Ficha de la Historia'}
        </Typography>

        {/* Grupo de acciones del header: botón Detalles + colapsar */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.4 }}>
          {/* Botón universal de Detalles — abre SidebarDetail según el tab activo */}
          {(() => {
            // Mapeo: tab del sidebar → vista del SidebarDetail
            const tabToDetail = [
              DETAIL_VIEWS.PLOTS,      // tab 0: Tramas
              DETAIL_VIEWS.CHARACTERS, // tab 1: Personajes
              DETAIL_VIEWS.NOTES,      // tab 2: Ideas
              DETAIL_VIEWS.PLOTS,      // tab 3: Capítulos (reusa PLOTS)
              DETAIL_VIEWS.NOTES,      // tab 4: Ficha → Notas
            ];
            const targetView = tabToDetail[sidebarTab] ?? DETAIL_VIEWS.NOTES;
            const isActive = isDetailOpen && activeView === targetView;

            return (
              <Tooltip
                title={isActive ? 'Cerrar panel de detalles' : 'Abrir panel de detalles'}
                placement="bottom"
              >
                <IconButton
                  size="small"
                  onClick={() => {
                    if (isActive) {
                      closeDetail();
                    } else {
                      openDetail(targetView);
                    }
                  }}
                  sx={{
                    border: 1,
                    borderRadius: 1.5,
                    p: 0.5,
                    borderColor: isActive ? 'primary.main' : 'divider',
                    color: isActive ? 'primary.main' : 'text.secondary',
                    bgcolor: isActive ? 'action.selected' : 'transparent',
                    transition: 'all 0.18s cubic-bezier(0.4,0,0.2,1)',
                    '&:hover': {
                      borderColor: 'primary.main',
                      color: 'primary.main',
                      bgcolor: 'action.hover',
                    },
                  }}
                >
                  <ViewSidebarOutlinedIcon sx={{ fontSize: 17 }} />
                </IconButton>
              </Tooltip>
            );
          })()}

          <Tooltip title="Colapsar panel lateral">
            <IconButton size="small" onClick={() => setCollapsed(true)}>
              <ChevronLeftIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {/* Story Summary Banner */}
      <Box
        sx={{
          width: "100%",
          p: 1.5,
          px: 2,
          position: "relative",
          borderBottom: 1,
          borderColor: "divider",
          bgcolor: hasCover ? "transparent" : "background.subtle",
          backgroundImage: hasCover
            ? `linear-gradient(to bottom, rgba(15, 23, 42, 0.6) 0%, rgba(15, 23, 42, 0.92) 100%), url(${story.cover_url})`
            : "none",
          backgroundSize: "cover",
          backgroundPosition: "center",
          color: "#fff",
          display: "flex",
          flexDirection: "column",
          gap: 0.5,
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <Chip
            size="small"
            icon={<BookmarkBorderIcon style={{ fontSize: 12, color: '#fff' }} />}
            label={story?.universe ? story.universe.title : "Historia Activa"}
            variant="outlined"
            sx={{
              height: 18,
              fontSize: "0.62rem",
              fontWeight: 700,
              borderColor: "rgba(255,255,255,0.3)",
              color: "#fff",
              bgcolor: "rgba(0,0,0,0.25)",
            }}
          />
          <Tooltip title="Cambiar portada">
            <IconButton
              size="small"
              onClick={handleOpenQuickCover}
              sx={{ color: "rgba(255,255,255,0.8)", p: 0.2 }}
            >
              <PhotoCameraIcon sx={{ fontSize: 15 }} />
            </IconButton>
          </Tooltip>
        </Box>

        <Typography variant="subtitle1" sx={{ fontWeight: 800, fontSize: "0.95rem", lineHeight: 1.2 }} noWrap>
          {story ? story.title : "Sin historia seleccionada"}
        </Typography>

        {story && (
          <Typography variant="caption" sx={{ opacity: 0.8, fontSize: "0.68rem" }} noWrap>
            {events.length} escenas · {characters.length} personajes · {effectiveFolders.length} carpetas
          </Typography>
        )}
      </Box>

      {/* ─── Modular Section Tabs (Navigation Hub) ────────────────────────── */}
      <Tabs
        value={sidebarTab}
        onChange={(e, val) => setSidebarTab(val)}
        variant="fullWidth"
        sx={{
          minHeight: 44,
          borderBottom: 1,
          borderColor: 'divider',
          bgcolor: 'background.paper',
          '& .MuiTab-root': {
            minHeight: 44,
            py: 1,
            px: 0.5,
            fontSize: '0.68rem',
            fontWeight: 700,
            textTransform: 'none',
          },
        }}
      >
        <Tab icon={<AccountTreeOutlinedIcon sx={{ fontSize: 18 }} />} label="Tramas" />
        <Tab 
          icon={
            <Badge badgeContent={filteredCharacters.length} color="primary" slotProps={{ badge: { sx: { fontSize: '0.6rem', height: 14, minWidth: 14, p: '0 2px' } } }}>
              <PeopleOutlineIcon sx={{ fontSize: 18 }} />
            </Badge>
          } 
          label="Personajes" 
        />
        <Tab 
          icon={
            <Badge badgeContent={storyNotes.length} color="secondary" slotProps={{ badge: { sx: { fontSize: '0.6rem', height: 14, minWidth: 14, p: '0 2px' } } }}>
              <LightbulbOutlinedIcon sx={{ fontSize: 18 }} />
            </Badge>
          } 
          label="Ideas" 
        />
        <Tab icon={<AutoStoriesIcon sx={{ fontSize: 18 }} />} label="Capítulos" />
        <Tab icon={<InfoOutlinedIcon sx={{ fontSize: 18 }} />} label="Ficha" />
      </Tabs>

      {/* ─── SECTION 0: TRAMAS (Líneas Narrativas & Eventos) ──────────────── */}
      {sidebarTab === 0 && (
        <Box sx={{ display: 'flex', flexDirection: 'column', flexGrow: 1, overflow: 'hidden' }}>
          <Box
            sx={{
              p: 1.2,
              px: 2,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              borderBottom: '1px solid rgba(0,0,0,0.05)',
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center", gap: 0.8 }}>
              <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 800, textTransform: "uppercase", fontSize: '0.7rem' }}>
                Tableros Narrativos ({effectiveBoards.length})
              </Typography>
            </Box>
            <Tooltip title="Crear nuevo tablero raíz">
              <IconButton
                size="small"
                onClick={() => handleRequestCreateBoard(null)}
                sx={{ color: "primary.main", p: 0.4 }}
              >
                <AddIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Box>

          <Box sx={{ flexGrow: 1, overflowY: "auto", px: 1, pb: 2 }}>
            {rootBoards.length === 0 ? (
              <Box sx={{ textAlign: 'center', py: 4, px: 2 }}>
                <AccountTreeOutlinedIcon sx={{ fontSize: 32, color: 'text.disabled', mb: 1 }} />
                <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.8rem' }}>
                  No hay tableros creados. Haz clic en + para crear tu primera línea narrativa.
                </Typography>
              </Box>
            ) : (
              rootBoards.map((board) => (
                <BoardTreeItem
                  key={board.id}
                  board={board}
                  boards={effectiveBoards}
                  events={effectiveEvents}
                  eventOrderMap={eventOrderMap}
                  level={0}
                  activeBoardId={effectiveActiveBoardId}
                  onSelect={(b) => handleSelectBoardAction(b.id)}
                  onStartCreateBoard={(parentId) => handleRequestCreateBoard(parentId)}
                  onRename={(boardId, newName) => handleRenameBoardAction(boardId, newName)}
                  onDelete={(b) => handleDeleteBoardAction(b)}
                  onChangeColor={(boardId, color) => handleChangeBoardColorAction(boardId, color)}
                  onOpenCreateEventForBoard={(boardId) => handleOpenCreateEventAction(boardId)}
                  onOpenEditEvent={onOpenEditEvent}
                  onDeleteEvent={onDeleteEvent}
                />
              ))
            )}
          </Box>
        </Box>
      )}

      {/* ─── SECTION 1: PERSONAJES Y CARPETAS (Árbol de Archivos de Personajes) ────────────────────── */}
      {sidebarTab === 1 && (
        <Box sx={{ display: 'flex', flexDirection: 'column', flexGrow: 1, overflow: 'hidden' }}>
          {/* Top Actions & Search */}
          <Box sx={{ p: 1, px: 1.5, display: 'flex', gap: 0.8, alignItems: 'center', borderBottom: 1, borderColor: 'divider' }}>
            <TextField
              size="small"
              placeholder="Buscar personaje..."
              value={charSearch}
              onChange={(e) => setCharSearch(e.target.value)}
              fullWidth
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                  </InputAdornment>
                ),
                sx: { height: 30, fontSize: '0.8rem', borderRadius: 1.5 },
              }}
            />
            <Tooltip title="Abrir panel lateral de personajes">
              <IconButton
                size="small"
                onClick={() => {
                  openDetail(DETAIL_VIEWS.CHARACTERS);
                  if (onOpenCharactersDrawer) {
                    onOpenCharactersDrawer();
                  } else if (onOpenCharacterModal) {
                    onOpenCharacterModal();
                  } else if (openCreateChar) {
                    openCreateChar();
                  }
                }}
                sx={{ border: 1, borderColor: 'divider', borderRadius: 1.5, p: 0.5, color: 'primary.main' }}
              >
                <PeopleOutlineIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title="Crear carpeta de personajes">
              <IconButton
                size="small"
                onClick={() => setIsCreatingRootCharFolder(true)}
                sx={{ border: 1, borderColor: 'divider', borderRadius: 1.5, p: 0.5, color: 'text.secondary' }}
              >
                <CreateNewFolderOutlinedIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title="Abrir gestor completo de personajes">
              <IconButton
                size="small"
                onClick={() => setWorkspaceActiveView(WORKSPACE_VIEW_KEYS.CHARACTERS)}
                sx={{ border: 1, borderColor: 'divider', borderRadius: 1.5, p: 0.5 }}
              >
                <OpenInNewIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Box>

          {/* Character Folder Tree with Characters Inside */}
          <Box sx={{ flexGrow: 1, overflowY: "auto", px: 0.8, py: 1, display: 'flex', flexDirection: 'column', gap: 0.2 }}>
            {/* Option 'Todos los personajes' */}
            <Box
              onClick={() => {
                if (onSelectCharacterFolder) onSelectCharacterFolder('all');
              }}
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 0.8,
                px: 1,
                py: 0.5,
                borderRadius: 1.5,
                cursor: 'pointer',
                bgcolor: activeCharacterFolderId === 'all' ? 'action.selected' : 'transparent',
                borderLeft: activeCharacterFolderId === 'all' ? '3px solid' : '3px solid transparent',
                borderColor: activeCharacterFolderId === 'all' ? 'primary.main' : 'transparent',
                transition: 'all 0.15s ease',
                '&:hover': { bgcolor: 'action.hover' },
              }}
            >
              <PeopleOutlineIcon sx={{ fontSize: 16, color: 'primary.main' }} />
              <Typography
                sx={{
                  flexGrow: 1,
                  fontSize: '0.82rem',
                  fontWeight: activeCharacterFolderId === 'all' ? 700 : 500,
                }}
              >
                Todos los Personajes
              </Typography>
              <Typography
                variant="caption"
                sx={{
                  fontSize: '0.65rem',
                  fontWeight: 700,
                  color: 'text.disabled',
                  bgcolor: 'background.subtle',
                  border: '1px solid',
                  borderColor: 'divider',
                  borderRadius: 0.8,
                  px: 0.6,
                }}
              >
                {filteredCharacters.length}
              </Typography>
            </Box>

            <Divider sx={{ my: 0.4 }} />

            {/* Inline creator for root character folder */}
            {isCreatingRootCharFolder && (
              <InlineCharFolderInput
                level={0}
                onCommit={(name) => handleCommitCreateCharFolder(name, null)}
                onCancel={() => setIsCreatingRootCharFolder(false)}
              />
            )}

            {/* Tree of character folders with collapsible character lists */}
            {rootCharacterFolders.length === 0 ? (
              <Box sx={{ textAlign: 'center', py: 3, px: 2 }}>
                <PeopleOutlineIcon sx={{ fontSize: 28, color: 'text.disabled', mb: 0.5 }} />
                <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.78rem' }}>
                  No hay carpetas de personajes. Haz clic en el icono de carpeta + para crear una.
                </Typography>
              </Box>
            ) : (
              rootCharacterFolders.map((folder) => (
                <CharacterFolderTreeItem
                  key={folder.id}
                  folder={folder}
                  folders={effectiveFolders}
                  characters={filteredCharacters}
                  level={0}
                  activeFolderId={activeCharacterFolderId}
                  creatingInParentId={creatingCharChildInParentId}
                  onStartCreateFolder={(parentId) => setCreatingCharChildInParentId(parentId)}
                  onCommitCreateFolder={handleCommitCreateCharFolder}
                  onCancelCreateFolder={() => setCreatingCharChildInParentId(null)}
                  onSelectFolder={(fId) => onSelectCharacterFolder && onSelectCharacterFolder(fId)}
                  onRenameFolder={handleRenameCharFolder}
                  onDeleteFolder={handleDeleteCharFolder}
                  onChangeColorFolder={handleChangeCharFolderColor}
                  onSelectCharacter={(char) => onOpenCharactersDrawer ? onOpenCharactersDrawer(char) : onOpenCharacterModal ? onOpenCharacterModal(char) : null}
                  onEditCharacter={(char) => onOpenCharacterModal ? onOpenCharacterModal(char) : onOpenCharactersDrawer ? onOpenCharactersDrawer(char) : null}
                  onMoveCharacter={(char) => setSidebarMoveChar(char)}
                  onMoveCharacterToFolder={(charId, targetFolderId) => {
                    if (onMoveCharacterToFolder) {
                      onMoveCharacterToFolder(charId, targetFolderId);
                    } else {
                      handleConfirmSidebarMoveChar([charId], targetFolderId);
                    }
                  }}
                  onDeleteCharacter={(cId) => onDeleteCharacter ? onDeleteCharacter(cId) : null}
                />
              ))
            )}
          </Box>

          <Divider />

          {/* Bottom Bar: Arquetipos, Etiquetas y Cajón */}
          <Box sx={{ p: 1, display: 'flex', flexDirection: 'column', gap: 0.8, bgcolor: 'background.subtle' }}>
            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 0.8 }}>
              <CustomButton
                variant="outlined"
                size="small"
                startIcon={<PsychologyOutlinedIcon fontSize="small" />}
                onClick={() => {
                  if (onOpenArchetypeManager) {
                    onOpenArchetypeManager();
                  } else {
                    setWorkspaceActiveView(WORKSPACE_VIEW_KEYS.CHARACTERS);
                    if (router.pathname !== '/dashboard') router.push('/dashboard');
                  }
                }}
                sx={{ fontSize: '0.7rem', py: 0.4, px: 0.5, textTransform: 'none' }}
              >
                Arquetipos
              </CustomButton>
              <CustomButton
                variant="outlined"
                size="small"
                startIcon={<LocalOfferOutlinedIcon fontSize="small" />}
                onClick={() => {
                  if (onOpenTagManager) {
                    onOpenTagManager();
                  } else {
                    setWorkspaceActiveView(WORKSPACE_VIEW_KEYS.CHARACTERS);
                    if (router.pathname !== '/dashboard') router.push('/dashboard');
                  }
                }}
                sx={{ fontSize: '0.7rem', py: 0.4, px: 0.5, textTransform: 'none' }}
              >
                Etiquetas
              </CustomButton>
            </Box>

            <CustomButton
              variant="contained"
              size="small"
              fullWidth
              startIcon={<PeopleOutlineIcon fontSize="small" />}
              onClick={() => {
                openDetail(DETAIL_VIEWS.CHARACTERS);
                if (onOpenCharactersDrawer) {
                  onOpenCharactersDrawer();
                } else if (onOpenCharacterModal) {
                  onOpenCharacterModal();
                } else if (openCreateChar) {
                  openCreateChar();
                }
              }}
              sx={{ fontSize: '0.75rem', py: 0.4 }}
            >
              Cajón de Personajes
            </CustomButton>
          </Box>
        </Box>
      )}

      {/* ─── SECTION 2: IDEAS DE LA HISTORIA (Hub Estructural sin duplicación) ── */}
      {sidebarTab === 2 && (
        <SidebarIdeasSection
          story={effectiveStory}
          storyNotes={storyNotes}
        />
      )}

      {/* ─── SECTION 3: CAPÍTULOS & MANUSCRITO ────────────────────────────── */}
      {sidebarTab === 3 && (
        <SidebarManuscriptSection story={effectiveStory} />
      )}

      {/* ─── SECTION 4: FICHA & METADATOS DE LA HISTORIA ─────────────────── */}
      {sidebarTab === 4 && (
        <Box sx={{ p: 2, flexGrow: 1, overflowY: "auto", display: 'flex', flexDirection: 'column', gap: 2 }}>
          <Box>
            <Typography variant="caption" sx={{ fontWeight: 800, color: 'text.secondary', textTransform: 'uppercase', fontSize: '0.7rem' }}>
              Descripción / Logline
            </Typography>
            <Typography variant="body2" sx={{ mt: 0.5, fontSize: '0.82rem', color: 'text.primary', lineHeight: 1.5 }}>
              {effectiveStory?.description || 'Sin descripción redactada.'}
            </Typography>
          </Box>

          <Divider />

          <Box>
            <Typography variant="caption" sx={{ fontWeight: 800, color: 'text.secondary', textTransform: 'uppercase', fontSize: '0.7rem' }}>
              Métricas del Proyecto
            </Typography>
            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1.2, mt: 1 }}>
              <Box sx={{ p: 1.2, borderRadius: 2, bgcolor: 'background.subtle', border: 1, borderColor: 'divider' }}>
                <Typography variant="caption" color="text.secondary">Escenas / Nodos</Typography>
                <Typography variant="h6" sx={{ fontWeight: 800, fontSize: '1.1rem' }}>{effectiveEvents.length}</Typography>
              </Box>
              <Box sx={{ p: 1.2, borderRadius: 2, bgcolor: 'background.subtle', border: 1, borderColor: 'divider' }}>
                <Typography variant="caption" color="text.secondary">Personajes</Typography>
                <Typography variant="h6" sx={{ fontWeight: 800, fontSize: '1.1rem' }}>{effectiveCharacters.length}</Typography>
              </Box>
              <Box sx={{ p: 1.2, borderRadius: 2, bgcolor: 'background.subtle', border: 1, borderColor: 'divider' }}>
                <Typography variant="caption" color="text.secondary">Tableros</Typography>
                <Typography variant="h6" sx={{ fontWeight: 800, fontSize: '1.1rem' }}>{effectiveBoards.length}</Typography>
              </Box>
              <Box sx={{ p: 1.2, borderRadius: 2, bgcolor: 'background.subtle', border: 1, borderColor: 'divider' }}>
                <Typography variant="caption" color="text.secondary">Ideas Vinculadas</Typography>
                <Typography variant="h6" sx={{ fontWeight: 800, fontSize: '1.1rem' }}>{storyNotes.length}</Typography>
              </Box>
            </Box>
          </Box>

          <Divider />

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            <CustomButton
              variant="outlined"
              size="small"
              startIcon={<PhotoCameraIcon fontSize="small" />}
              onClick={handleOpenQuickCover}
              sx={{ fontSize: '0.75rem' }}
            >
              Cambiar Portada Panorámica
            </CustomButton>
          </Box>
        </Box>
      )}

      {/* Version display */}
      <Box sx={{ p: 1, pl: 2, textAlign: 'left', position: 'absolute', bottom: 0, width: '100%', pointerEvents: 'none' }}>
        <Typography variant="caption" sx={{ fontSize: '0.65rem', color: 'text.disabled' }}>
          {APP_CONFIG.VERSION}
        </Typography>
      </Box>
    </Box>
  )}


      {/* ─── Move Character Modal in Sidebar ──────────────────────────────── */}
      <MoveToFolderModal
        open={Boolean(sidebarMoveChar)}
        onClose={() => setSidebarMoveChar(null)}
        charactersToMove={sidebarMoveChar ? [sidebarMoveChar] : []}
        folders={effectiveFolders}
        onConfirmMove={handleConfirmSidebarMoveChar}
      />

      {/* ─── Dialogs ─────────────────────────────────────────────────────── */}
      <Dialog
        open={newBoardDialogOpen}
        onClose={() => setNewBoardDialogOpen(false)}
        maxWidth="xs"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3, p: 1 } }}
      >
        <DialogTitle sx={{ fontWeight: 700, fontSize: "1rem", pb: 1 }}>
          {newBoardParentId ? "Nuevo Sub-Tablero" : "Nuevo Tablero"}
        </DialogTitle>
        <DialogContent sx={{ pt: 1 }}>
          <TextField
            label="Nombre del tablero"
            placeholder="Arco 1, Flashback, Línea alternativa..."
            value={newBoardName}
            onChange={(e) => setNewBoardName(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") handleConfirmCreateBoard(); }}
            fullWidth
            autoFocus
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <CustomButton variant="outlined" color="inherit" onClick={() => setNewBoardDialogOpen(false)}>
            Cancelar
          </CustomButton>
          <CustomButton onClick={handleConfirmCreateBoard}>Crear</CustomButton>
        </DialogActions>
      </Dialog>

      {/* Hidden File Input for Story Cover Selection */}
      <input
        ref={coverFileInputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/gif"
        style={{ display: 'none' }}
        onChange={handleCoverFileChange}
      />

      <ImageCropModal
        open={cropModalOpen}
        imageSrc={rawCoverImageSrc}
        aspectRatio="panoramic"
        shape="rounded"
        title="Recortar y Optimizar Portada"
        onClose={() => setCropModalOpen(false)}
        onCropComplete={handleCropComplete}
      />

      {/* Quick Cover Dialog */}
      <Dialog
        open={quickCoverOpen}
        onClose={() => setQuickCoverOpen(false)}
        maxWidth="xs"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3, p: 1 } }}
      >
        <DialogTitle sx={{ fontWeight: 700, fontSize: "1rem", pb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
          <PhotoCameraIcon color="primary" fontSize="small" />
          Portada de la Historia
        </DialogTitle>
        <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2, pt: 1 }}>
          <Typography variant="body2" color="text.secondary">
            Personaliza la portada panorámica que identifica a tu historia activa.
          </Typography>

          <ButtonGroup size="small" fullWidth sx={{ mb: 0.5 }}>
            <Button
              variant={coverMode === 'upload' ? 'contained' : 'outlined'}
              onClick={() => setCoverMode('upload')}
              startIcon={<FileUploadOutlinedIcon fontSize="small" />}
              sx={{ textTransform: 'none', fontWeight: 600, fontSize: '0.78rem' }}
            >
              Subir Imagen
            </Button>
            <Button
              variant={coverMode === 'url' ? 'contained' : 'outlined'}
              onClick={() => setCoverMode('url')}
              startIcon={<LinkIcon fontSize="small" />}
              sx={{ textTransform: 'none', fontWeight: 600, fontSize: '0.78rem' }}
            >
              Enlace URL
            </Button>
          </ButtonGroup>

          {coverMode === 'upload' ? (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, alignItems: 'center' }}>
              <CustomButton
                variant="outlined"
                fullWidth
                startIcon={uploadingCover ? <CircularProgress size={16} /> : <FileUploadOutlinedIcon fontSize="small" />}
                onClick={() => coverFileInputRef.current?.click()}
                disabled={uploadingCover}
                sx={{ py: 1.2, fontSize: '0.84rem' }}
              >
                {uploadingCover ? 'Subiendo y optimizando...' : 'Seleccionar imagen desde tu dispositivo'}
              </CustomButton>

              <Typography variant="caption" color="text.secondary" sx={{ textAlign: 'center', fontSize: '0.72rem' }}>
                Formatos: JPG, PNG o WebP. Se abrirá la herramienta de encuadre panorámico HD.
              </Typography>
            </Box>
          ) : (
            <TextField
              label="URL de la imagen"
              placeholder="https://images.unsplash.com/..."
              value={newCoverUrl}
              onChange={(e) => setNewCoverUrl(e.target.value)}
              fullWidth
              autoFocus
              size="small"
              InputProps={{ sx: { borderRadius: 2 } }}
            />
          )}

          {newCoverUrl && (
            <Box sx={{ position: 'relative', width: "100%" }}>
              <Box
                sx={{
                  width: "100%",
                  height: 110,
                  borderRadius: 2,
                  backgroundImage: `linear-gradient(to bottom, rgba(0,0,0,0.1), rgba(0,0,0,0.6)), url(${newCoverUrl})`,
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                  border: 1,
                  borderColor: "divider",
                  display: 'flex',
                  alignItems: 'flex-end',
                  p: 1,
                }}
              >
                <Typography variant="caption" sx={{ color: '#fff', fontWeight: 700, textShadow: '0 1px 3px rgba(0,0,0,0.8)' }}>
                  Vista previa: {story?.title || 'Historia'}
                </Typography>
              </Box>

              <Tooltip title="Eliminar portada actual">
                <IconButton
                  size="small"
                  onClick={handleRemoveCover}
                  sx={{
                    position: 'absolute',
                    top: 6,
                    right: 6,
                    bgcolor: 'rgba(0,0,0,0.6)',
                    color: '#fff',
                    '&:hover': { bgcolor: 'rgba(211, 47, 47, 0.9)' },
                  }}
                >
                  <DeleteOutlineIcon sx={{ fontSize: 16 }} />
                </IconButton>
              </Tooltip>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2, justifyContent: 'space-between' }}>
          <CustomButton variant="outlined" color="inherit" onClick={() => setQuickCoverOpen(false)}>
            Cancelar
          </CustomButton>
          {coverMode === 'url' && (
            <CustomButton onClick={handleSaveCover}>Guardar Portada</CustomButton>
          )}
        </DialogActions>
      </Dialog>
    </Box>
  );
}
