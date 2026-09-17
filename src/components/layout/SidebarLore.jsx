import React, { useState, useMemo, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/router";
import { useEventOrder } from '../../hooks/useEventOrder';
import { useQuickNotes } from '../../context/QuickNotesContext';
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
import { Button, ButtonGroup, CircularProgress } from "@mui/material";
import CustomButton from "../common/CustomButton";
import BoardTreeItem from "../sidebar/BoardTreeItem";
import ImageCropModal from "../common/ImageCropModal";
import { uploadStoryCover } from "../../services/storageService";
import { useSwipeToClose } from '../../hooks/useSwipeToClose';

export default function SidebarLore({
  view = 'dashboard',
  story,
  characters = [],
  events = [],
  eventConnections = [],
  boards = [],
  activeBoardId,
  onOpenStorySelector,
  onOpenCharactersDrawer,
  onOpenCreateEvent,
  onUpdateStoryCover,
  onSelectBoard,
  onCreateBoard,
  onRenameBoard,
  onDeleteBoard,
  onChangeBoardColor,
  onOpenEditEvent,
  onDeleteEvent,
}) {
  const router = useRouter();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { notes, notesLoading, toggleOpen: toggleNotesPanel } = useQuickNotes();

  const [collapsed, setCollapsed] = useState(false);
  const sidebarRef = useRef(null);

  // Swipe-to-close: swipe left → collapse (sidebar is on the left side)
  const handleCollapse = useCallback(() => setCollapsed(true), []);
  useSwipeToClose(sidebarRef, handleCollapse, 'left', 60, !collapsed);
  
  // Persist sidebarTab
  const [sidebarTab, setSidebarTab] = useState(() => {
    if (typeof window !== 'undefined') {
      return parseInt(localStorage.getItem('lorebook_sidebar_tab') || '0', 10);
    }
    return 0;
  });

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('lorebook_sidebar_tab', sidebarTab.toString());
    }
  }, [sidebarTab]);
  
  // Search states
  const [charSearch, setCharSearch] = useState("");

  // Default to collapsed on mobile/tablets upon initial mount or viewport resize
  React.useEffect(() => {
    if (isMobile) {
      setCollapsed(true);
    }
  }, [isMobile]);

  const [quickCoverOpen, setQuickCoverOpen] = useState(false);
  const [newCoverUrl, setNewCoverUrl] = useState("");
  const [coverMode, setCoverMode] = useState("upload"); // 'upload' | 'url'
  const [cropModalOpen, setCropModalOpen] = useState(false);
  const [rawCoverImageSrc, setRawCoverImageSrc] = useState(null);
  const [uploadingCover, setUploadingCover] = useState(false);
  const coverFileInputRef = useRef(null);

  const [newBoardDialogOpen, setNewBoardDialogOpen] = useState(false);
  const [newBoardName, setNewBoardName] = useState("");
  const [newBoardParentId, setNewBoardParentId] = useState(null);

  const eventCountMap = useMemo(() => {
    const map = {};
    events.forEach((ev) => {
      if (ev.board_id) {
        map[ev.board_id] = (map[ev.board_id] || 0) + 1;
      }
    });
    return map;
  }, [events]);

  const rootBoards = useMemo(
    () => boards.filter((b) => !b.parent_board_id),
    [boards]
  );

  const storyNotes = useMemo(() => {
    if (!story?.id) return [];
    return notes.filter((n) => n.story_id === story.id);
  }, [notes, story?.id]);

  const filteredCharacters = useMemo(() => {
    // Filtrar personajes:
    // Mostrar si:
    // 1. Pertenecen específicamente a esta historia (story_id === story.id)
    // 2. SON globales (is_global === true) Y NO tienen un story_id de otra historia.

    let availableCharacters = characters.filter(c => {
        if (c.story_id === story?.id) return true;
        if (c.is_global && (!c.story_id || c.story_id === story?.id)) return true;
        return false;
    });

    if (!charSearch.trim()) return availableCharacters;
    const q = charSearch.toLowerCase();
    return availableCharacters.filter((c) => c.name.toLowerCase().includes(q) || c.role_archetype?.toLowerCase().includes(q));
  }, [characters, charSearch, story?.id]);

  const eventOrderMap = useEventOrder(events, eventConnections);

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

  const handleConfirmCreateBoard = async () => {
    const name = newBoardName.trim() || "Nuevo tablero";
    onCreateBoard && onCreateBoard(name, newBoardParentId);
    setNewBoardDialogOpen(false);
  };

  // ─── Collapsed Slim Sidebar View ───────────────────────────────────────────
  if (collapsed) {
    return (
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

        <Tooltip title={`Historias (${story ? story.title : "Ninguna"})`} placement="right">
          <IconButton size="small" onClick={onOpenStorySelector}>
            <LayersOutlinedIcon fontSize="small" color="action" />
          </IconButton>
        </Tooltip>

        <Tooltip title={`Tramas (${boards.length} tableros)`} placement="right">
          <IconButton
            size="small"
            onClick={() => { setSidebarTab(0); setCollapsed(false); }}
            sx={{ color: sidebarTab === 0 ? 'primary.main' : 'action' }}
          >
            <AccountTreeOutlinedIcon fontSize="small" />
          </IconButton>
        </Tooltip>

        <Tooltip title={`Personajes (${filteredCharacters.length})`} placement="right">
          <IconButton
            size="small"
            onClick={() => { setSidebarTab(1); setCollapsed(false); }}
          >
            <Badge badgeContent={filteredCharacters.length} color="primary">
              <PeopleOutlineIcon fontSize="small" color={sidebarTab === 1 ? 'primary' : 'action'} />
            </Badge>
          </IconButton>
        </Tooltip>

        <Tooltip title={`Ideas de la historia (${storyNotes.length})`} placement="right">
          <IconButton
            size="small"
            onClick={() => { setSidebarTab(2); setCollapsed(false); }}
          >
            <Badge badgeContent={storyNotes.length} color="secondary">
              <LightbulbOutlinedIcon fontSize="small" color={sidebarTab === 2 ? 'primary' : 'action'} />
            </Badge>
          </IconButton>
        </Tooltip>

        <Tooltip title="Resumen e información" placement="right">
          <IconButton
            size="small"
            onClick={() => { setSidebarTab(3); setCollapsed(false); }}
          >
            <InfoOutlinedIcon fontSize="small" color={sidebarTab === 3 ? 'primary' : 'action'} />
          </IconButton>
        </Tooltip>

        {activeBoardId && (
          <Tooltip title="Crear Evento en Tablero Activo" placement="right">
            <IconButton
              size="small"
              onClick={() => onOpenCreateEvent && onOpenCreateEvent(activeBoardId)}
              sx={{ bgcolor: "primary.main", color: "#fff", mt: 'auto', '&:hover': { bgcolor: 'primary.dark' } }}
            >
              <AddIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        )}
      </Box>
    );
  }

  const hasCover = Boolean(story?.cover_url);

  return (
    <Box
      ref={sidebarRef}
      sx={{
        width: 340, // Aumentado ligeramente para mayor soltura visual
        height: "100%",
        bgcolor: "custom.sidebar",
        borderRight: 1,
        borderColor: "divider",
        display: "flex",
        flexDirection: "column",
        zIndex: 5,
        transition: "width 0.2s ease",
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
          {sidebarTab === 0 ? 'Líneas & Escenas' : sidebarTab === 1 ? 'Personajes' : sidebarTab === 2 ? 'Ideas del Proyecto' : 'Ficha de la Historia'}
        </Typography>
        <Tooltip title="Colapsar panel lateral">
          <IconButton size="small" onClick={() => setCollapsed(true)}>
            <ChevronLeftIcon fontSize="small" />
          </IconButton>
        </Tooltip>
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
            {events.length} escenas · {characters.length} personajes · {boards.length} tableros
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
                Tableros Narrativos ({boards.length})
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
                  boards={boards}
                  events={events}
                  eventOrderMap={eventOrderMap}
                  level={0}
                  activeBoardId={activeBoardId}
                  onSelect={(b) => onSelectBoard && onSelectBoard(b.id)}
                  onStartCreateBoard={(parentId) => handleRequestCreateBoard(parentId)}
                  onRename={(boardId, newName) => onRenameBoard && onRenameBoard(boardId, newName)}
                  onDelete={(b) => onDeleteBoard && onDeleteBoard(b)}
                  onChangeColor={(boardId, color) => onChangeBoardColor && onChangeBoardColor(boardId, color)}
                  onOpenCreateEventForBoard={(boardId) => {
                    onOpenCreateEvent && onOpenCreateEvent(boardId);
                  }}
                  onOpenEditEvent={onOpenEditEvent}
                  onDeleteEvent={onDeleteEvent}
                />
              ))
            )}
          </Box>
        </Box>
      )}

      {/* ─── SECTION 1: PERSONAJES (Directorio Rápido) ────────────────────── */}
      {sidebarTab === 1 && (
        <Box sx={{ display: 'flex', flexDirection: 'column', flexGrow: 1, overflow: 'hidden' }}>
          <Box sx={{ p: 1.2, px: 1.5, display: 'flex', gap: 1, alignItems: 'center' }}>
            <TextField
              size="small"
              placeholder="Buscar…"
              value={charSearch}
              onChange={(e) => setCharSearch(e.target.value)}
              fullWidth
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                  </InputAdornment>
                ),
                sx: { height: 30, fontSize: '0.8rem' },
              }}
            />
            <Tooltip title="Abrir gestor completo de personajes">
              <IconButton
                size="small"
                onClick={() => story?.id && router.push(`/characters/${story.id}`)}
                sx={{ border: 1, borderColor: 'divider', borderRadius: 1.5 }}
              >
                <OpenInNewIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Box>

          <Box sx={{ flexGrow: 1, overflowY: "auto", px: 0.5 }}>
            {filteredCharacters.length === 0 ? (
              <Box sx={{ textAlign: 'center', py: 4, px: 2 }}>
                <PeopleOutlineIcon sx={{ fontSize: 32, color: 'text.disabled', mb: 1 }} />
                <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.8rem' }}>
                  {charSearch ? 'Sin resultados' : 'No hay personajes en esta historia.'}
                </Typography>
              </Box>
            ) : (
              <List dense sx={{ py: 0 }}>
                {filteredCharacters.map((c) => (
                  <ListItem
                    key={c.id}
                    disablePadding
                    sx={{
                      mb: 0.8,
                      borderRadius: 2,
                      bgcolor: c.color_tag ? alpha(c.color_tag, 0.12) : 'background.paper',
                      borderLeft: c.color_tag ? `4px solid ${c.color_tag}` : '4px solid transparent',
                      borderTop: '1px solid',
                      borderRight: '1px solid',
                      borderBottom: '1px solid',
                      borderColor: c.color_tag ? alpha(c.color_tag, 0.3) : 'divider',
                      overflow: 'hidden',
                      transition: 'all 0.15s ease',
                      '&:hover': {
                        bgcolor: c.color_tag ? alpha(c.color_tag, 0.22) : 'action.hover',
                        transform: 'translateX(2px)',
                      },
                    }}
                  >
                    <ListItemButton
                      onClick={() => onOpenCharactersDrawer && onOpenCharactersDrawer(c)}
                      sx={{ py: 0.7, px: 1.2, borderRadius: 2 }}
                    >
                      <ListItemAvatar sx={{ minWidth: 36 }}>
                        <Avatar
                          src={c.avatar_url || ''}
                          sx={{
                            width: 28,
                            height: 28,
                            fontSize: '0.75rem',
                            bgcolor: c.color_tag || 'primary.light',
                            color: '#fff',
                            fontWeight: 700,
                          }}
                        >
                          {c.name.charAt(0)}
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={c.name}
                        primaryTypographyProps={{ fontSize: '0.84rem', fontWeight: 700, noWrap: true }}
                        secondary={c.role_archetype || (c.is_global ? 'Global' : 'Personaje')}
                        secondaryTypographyProps={{ fontSize: '0.7rem', noWrap: true }}
                      />
                      {c.is_global && (
                        <Chip label="Global" size="small" sx={{ height: 18, fontSize: '0.62rem', ml: 0.5 }} />
                      )}
                    </ListItemButton>
                  </ListItem>
                ))}
              </List>
            )}
          </Box>

          <Divider />
          <Box sx={{ p: 1.2, display: 'flex', gap: 1 }}>
            <CustomButton
              variant="outlined"
              size="small"
              fullWidth
              startIcon={<PeopleOutlineIcon fontSize="small" />}
              onClick={onOpenCharactersDrawer}
              sx={{ fontSize: '0.75rem', py: 0.5 }}
            >
              Cajón de Personajes
            </CustomButton>
          </Box>
        </Box>
      )}

      {/* ─── SECTION 2: IDEAS DE LA HISTORIA ─────────────────────────────── */}
      {sidebarTab === 2 && (
        <Box sx={{ display: 'flex', flexDirection: 'column', flexGrow: 1, overflow: 'hidden' }}>
          <Box sx={{ p: 1.2, px: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="caption" sx={{ fontWeight: 800, color: 'text.secondary', textTransform: 'uppercase', fontSize: '0.7rem' }}>
              Ideas Vinculadas ({storyNotes.length})
            </Typography>
            <Tooltip title="Abrir pizarra central de ideas">
              <IconButton size="small" onClick={() => router.push('/ideas')} sx={{ p: 0.4 }}>
                <OpenInNewIcon sx={{ fontSize: 16 }} />
              </IconButton>
            </Tooltip>
          </Box>

          <Box sx={{ flexGrow: 1, overflowY: "auto", px: 1.5, pb: 1 }}>
            {notesLoading && notes.length === 0 ? (
              <Box sx={{ textAlign: 'center', py: 4, px: 2 }}>
                <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.8rem' }}>
                  Cargando ideas...
                </Typography>
              </Box>
            ) : storyNotes.length === 0 ? (
              <Box sx={{ textAlign: 'center', py: 4, px: 2 }}>
                <LightbulbOutlinedIcon sx={{ fontSize: 32, color: 'text.disabled', mb: 1 }} />
                <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.8rem' }}>
                  No hay ideas vinculadas a esta historia. Usa el Gestor Express para capturar una.
                </Typography>
              </Box>
            ) : (
              storyNotes.map((n) => (
                <Box
                  key={n.id}
                  onClick={toggleNotesPanel}
                  sx={{
                    p: 1.2,
                    mb: 1,
                    borderRadius: 2,
                    bgcolor: n.color || 'background.paper',
                    border: '1px solid rgba(0,0,0,0.08)',
                    cursor: 'pointer',
                    transition: 'transform 0.12s ease',
                    '&:hover': { transform: 'translateX(2px)' },
                  }}
                >
                  <Typography variant="body2" sx={{ fontSize: '0.8rem', fontWeight: 600, color: '#111', whiteSpace: 'pre-wrap', maxHeight: 44, overflow: 'hidden' }}>
                    {n.content || 'Idea vacía'}
                  </Typography>
                  <Typography variant="caption" sx={{ fontSize: '0.62rem', opacity: 0.6, color: '#333', mt: 0.4, display: 'block' }}>
                    {new Date(n.updated_at).toLocaleDateString('es', { day: 'numeric', month: 'short' })}
                  </Typography>
                </Box>
              ))
            )}
          </Box>

          <Divider />
          <Box sx={{ p: 1.2 }}>
            <CustomButton
              variant="contained"
              size="small"
              fullWidth
              startIcon={<LightbulbOutlinedIcon fontSize="small" />}
              onClick={toggleNotesPanel}
              sx={{ fontSize: '0.75rem', py: 0.5 }}
            >
              Escribir nueva idea
            </CustomButton>
          </Box>
        </Box>
      )}

      {/* ─── SECTION 3: FICHA & METADATOS DE LA HISTORIA ─────────────────── */}
      {sidebarTab === 3 && (
        <Box sx={{ p: 2, flexGrow: 1, overflowY: "auto", display: 'flex', flexDirection: 'column', gap: 2 }}>
          <Box>
            <Typography variant="caption" sx={{ fontWeight: 800, color: 'text.secondary', textTransform: 'uppercase', fontSize: '0.7rem' }}>
              Descripción / Logline
            </Typography>
            <Typography variant="body2" sx={{ mt: 0.5, fontSize: '0.82rem', color: 'text.primary', lineHeight: 1.5 }}>
              {story?.description || 'Sin descripción redactada.'}
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
                <Typography variant="h6" sx={{ fontWeight: 800, fontSize: '1.1rem' }}>{events.length}</Typography>
              </Box>
              <Box sx={{ p: 1.2, borderRadius: 2, bgcolor: 'background.subtle', border: 1, borderColor: 'divider' }}>
                <Typography variant="caption" color="text.secondary">Personajes</Typography>
                <Typography variant="h6" sx={{ fontWeight: 800, fontSize: '1.1rem' }}>{characters.length}</Typography>
              </Box>
              <Box sx={{ p: 1.2, borderRadius: 2, bgcolor: 'background.subtle', border: 1, borderColor: 'divider' }}>
                <Typography variant="caption" color="text.secondary">Tableros</Typography>
                <Typography variant="h6" sx={{ fontWeight: 800, fontSize: '1.1rem' }}>{boards.length}</Typography>
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

      {/* ─── Dialogs ─────────────────────────────────────────────────────── */}
      {/* Create Board Dialog */}
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

          {/* Mode Selector Buttons */}
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
