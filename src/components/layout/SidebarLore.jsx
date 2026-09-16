import React, { useState, useMemo } from "react";
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
import AccountTreeOutlinedIcon from "@mui/icons-material/AccountTreeOutlined";
import LightbulbOutlinedIcon from "@mui/icons-material/LightbulbOutlined";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import SearchIcon from "@mui/icons-material/Search";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import BookmarkBorderIcon from "@mui/icons-material/BookmarkBorder";
import CustomButton from "../common/CustomButton";
import BoardTreeItem from "../sidebar/BoardTreeItem";

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
  const { notes, toggleOpen: toggleNotesPanel } = useQuickNotes();

  const [collapsed, setCollapsed] = useState(false);
  const [sidebarTab, setSidebarTab] = useState(0); // 0=Tramas, 1=Personajes, 2=Ideas, 3=Ficha
  
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
    if (!charSearch.trim()) return characters;
    const q = charSearch.toLowerCase();
    return characters.filter((c) => c.name.toLowerCase().includes(q) || c.role_archetype?.toLowerCase().includes(q));
  }, [characters, charSearch]);

  const eventOrderMap = useEventOrder(events, eventConnections);

  const handleOpenQuickCover = () => {
    setNewCoverUrl(story?.cover_url || "");
    setQuickCoverOpen(true);
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

        <Tooltip title={`Personajes (${characters.length})`} placement="right">
          <IconButton
            size="small"
            onClick={() => { setSidebarTab(1); setCollapsed(false); }}
          >
            <Badge badgeContent={characters.length} color="primary">
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
      sx={{
        width: 320,
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
          p: 1.8,
          px: 2,
          position: "relative",
          overflow: "hidden",
          borderBottom: 1,
          borderColor: "divider",
          bgcolor: hasCover ? "transparent" : "background.subtle",
          backgroundImage: hasCover
            ? `linear-gradient(to bottom, rgba(16, 20, 26, 0.5) 0%, rgba(16, 20, 26, 0.9) 100%), url(${story.cover_url})`
            : "none",
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
          color: hasCover ? "#f8fafc" : "text.primary",
          display: "flex",
          flexDirection: "column",
          gap: 0.8,
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <Chip
            size="small"
            icon={<BookmarkBorderIcon fontSize="inherit" />}
            label={story?.universe ? `Universo: ${story.universe.title}` : "Historia Activa"}
            variant="outlined"
            sx={{
              height: 20,
              fontSize: "0.68rem",
              fontWeight: 700,
              borderColor: hasCover ? "rgba(255,255,255,0.4)" : "divider",
              color: hasCover ? "#fff" : "primary.main",
            }}
          />
          <Tooltip title="Cambiar portada">
            <IconButton
              size="small"
              onClick={handleOpenQuickCover}
              sx={{ color: hasCover ? "#fff" : "text.secondary", p: 0.4 }}
            >
              <PhotoCameraIcon sx={{ fontSize: 16 }} />
            </IconButton>
          </Tooltip>
        </Box>

        <Typography variant="subtitle1" sx={{ fontWeight: 800, fontSize: "1.02rem" }} noWrap>
          {story ? story.title : "Sin historia seleccionada"}
        </Typography>

        {story && (
          <Typography variant="caption" sx={{ opacity: 0.75, fontSize: "0.72rem" }} noWrap>
            {events.length} escenas • {characters.length} personajes • {boards.length} tableros
          </Typography>
        )}
      </Box>

      {/* ─── Modular Section Tabs (Navigation Hub) ────────────────────────── */}
      <Tabs
        value={sidebarTab}
        onChange={(e, val) => setSidebarTab(val)}
        variant="fullWidth"
        sx={{
          minHeight: 38,
          borderBottom: 1,
          borderColor: 'divider',
          bgcolor: 'background.paper',
          '& .MuiTab-root': {
            minHeight: 38,
            py: 0.5,
            px: 0.5,
            fontSize: '0.72rem',
            fontWeight: 700,
            textTransform: 'none',
          },
        }}
      >
        <Tab icon={<AccountTreeOutlinedIcon sx={{ fontSize: 16 }} />} label="Tramas" />
        <Tab icon={<Badge badgeContent={characters.length} color="primary"><PeopleOutlineIcon sx={{ fontSize: 16 }} /></Badge>} label="Personajes" />
        <Tab icon={<Badge badgeContent={storyNotes.length} color="secondary"><LightbulbOutlinedIcon sx={{ fontSize: 16 }} /></Badge>} label="Ideas" />
        <Tab icon={<InfoOutlinedIcon sx={{ fontSize: 16 }} />} label="Ficha" />
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
              placeholder="Buscar personaje…"
              value={charSearch}
              onChange={(e) => setCharSearch(e.target.value)}
              fullWidth
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                  </InputAdornment>
                ),
                sx: { height: 32, fontSize: '0.8rem', borderRadius: 2 },
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
                        secondary={c.role_archetype || (c.is_global ? '🌐 Global' : 'Personaje')}
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
            {storyNotes.length === 0 ? (
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
              Abrir Gestor Express
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

      {/* Quick Cover Dialog */}
      <Dialog
        open={quickCoverOpen}
        onClose={() => setQuickCoverOpen(false)}
        maxWidth="xs"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3, p: 1 } }}
      >
        <DialogTitle sx={{ fontWeight: 700, fontSize: "1rem", pb: 1 }}>
          Portada de la Historia
        </DialogTitle>
        <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2, pt: 1 }}>
          <Typography variant="body2" color="text.secondary">
            Ingresa la URL de la imagen que servirá de fondo panorámico en el panel de Proyecto Activo.
          </Typography>
          <TextField
            label="URL de la imagen"
            placeholder="https://images.unsplash.com/..."
            value={newCoverUrl}
            onChange={(e) => setNewCoverUrl(e.target.value)}
            fullWidth
            autoFocus
          />
          {newCoverUrl && (
            <Box
              sx={{
                width: "100%",
                height: 110,
                borderRadius: 2,
                backgroundImage: `url(${newCoverUrl})`,
                backgroundSize: "cover",
                backgroundPosition: "center",
                border: 1,
                borderColor: "divider",
              }}
            />
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <CustomButton variant="outlined" color="inherit" onClick={() => setQuickCoverOpen(false)}>
            Cancelar
          </CustomButton>
          <CustomButton onClick={handleSaveCover}>Guardar Portada</CustomButton>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
