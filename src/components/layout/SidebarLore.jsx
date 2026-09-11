import React, { useState, useMemo } from "react";
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
} from "@mui/material";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import PeopleOutlineIcon from "@mui/icons-material/PeopleOutline";
import LayersOutlinedIcon from "@mui/icons-material/LayersOutlined";
import AddIcon from "@mui/icons-material/Add";
import PhotoCameraIcon from "@mui/icons-material/PhotoCamera";
import AddPhotoAlternateIcon from "@mui/icons-material/AddPhotoAlternate";
import AccountTreeOutlinedIcon from "@mui/icons-material/AccountTreeOutlined";
import CustomButton from "../common/CustomButton";
import BoardTreeItem from "../sidebar/BoardTreeItem";

export default function SidebarLore({
  story,
  characters = [],
  events = [],
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
}) {
  const [collapsed, setCollapsed] = useState(false);
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
          gap: 2,
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
        <Tooltip title={`Personajes (${characters.length})`} placement="right">
          <IconButton size="small" onClick={onOpenCharactersDrawer}>
            <Badge badgeContent={characters.length} color="primary">
              <PeopleOutlineIcon fontSize="small" color="action" />
            </Badge>
          </IconButton>
        </Tooltip>
        <Tooltip title="Crear Evento" placement="right">
          <IconButton
            size="small"
            onClick={onOpenCreateEvent}
            sx={{ bgcolor: "primary.main", color: "#fff", "&:hover": { bgcolor: "primary.dark" } }}
          >
            <AddIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      </Box>
    );
  }

  const hasCover = Boolean(story?.cover_url);

  return (
    <Box
      sx={{
        width: 300,
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
          p: 1.5,
          px: 2,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          borderBottom: 1,
          borderColor: "divider",
        }}
      >
        <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
          Estructura de la Historia
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
          p: 2,
          px: 2.2,
          position: "relative",
          overflow: "hidden",
          borderBottom: 1,
          borderColor: "divider",
          bgcolor: hasCover ? "transparent" : "background.subtle",
          backgroundImage: hasCover
            ? `linear-gradient(to bottom, rgba(16, 20, 26, 0.45) 0%, rgba(16, 20, 26, 0.88) 100%), url(${story.cover_url})`
            : "none",
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
          color: hasCover ? "#f8fafc" : "text.primary",
          display: "flex",
          flexDirection: "column",
          gap: 1.2,
          transition: "all 0.25s ease",
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <Chip
            label="Proyecto Activo"
            size="small"
            sx={{
              height: 20,
              fontSize: "0.65rem",
              fontWeight: 700,
              textTransform: "uppercase",
              bgcolor: hasCover ? "rgba(0, 0, 0, 0.55)" : "background.subtle",
              color: hasCover ? "#e2e8f0" : "text.secondary",
              border: hasCover ? "1px solid rgba(255,255,255,0.2)" : "none",
              backdropFilter: hasCover ? "blur(4px)" : "none",
            }}
          />
          {story && (
            <Tooltip title={hasCover ? "Cambiar portada de la historia" : "Asignar imagen de fondo / portada"}>
              <IconButton
                size="small"
                onClick={handleOpenQuickCover}
                sx={{
                  p: 0.4,
                  bgcolor: hasCover ? "rgba(0, 0, 0, 0.5)" : "background.subtle",
                  color: hasCover ? "#fff" : "text.secondary",
                  border: hasCover ? "1px solid rgba(255,255,255,0.25)" : "none",
                  backdropFilter: hasCover ? "blur(4px)" : "none",
                  "&:hover": { bgcolor: hasCover ? "rgba(0, 0, 0, 0.8)" : "divider" },
                }}
              >
                {hasCover ? <PhotoCameraIcon sx={{ fontSize: 15 }} /> : <AddPhotoAlternateIcon sx={{ fontSize: 15 }} />}
              </IconButton>
            </Tooltip>
          )}
        </Box>

        <Typography
          variant="subtitle1"
          sx={{
            fontWeight: 800,
            fontSize: "1.05rem",
            lineHeight: 1.25,
            textShadow: hasCover ? "0 2px 6px rgba(0,0,0,0.85)" : "none",
            color: hasCover ? "#ffffff" : "text.primary",
          }}
          noWrap
        >
          {story ? story.title : "Sin historia seleccionada"}
        </Typography>

        {story?.synopsis && (
          <Typography
            variant="caption"
            sx={{
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
              lineHeight: 1.35,
              color: hasCover ? "rgba(255, 255, 255, 0.88)" : "text.secondary",
              textShadow: hasCover ? "0 1px 4px rgba(0,0,0,0.8)" : "none",
            }}
          >
            {story.synopsis}
          </Typography>
        )}

        <Box sx={{ display: "flex", gap: 1, mt: 0.5 }}>
          <CustomButton
            variant={hasCover ? "contained" : "outlined"}
            size="small"
            fullWidth
            startIcon={<LayersOutlinedIcon fontSize="small" />}
            onClick={onOpenStorySelector}
            sx={{
              fontSize: "0.74rem",
              py: 0.45,
              fontWeight: 700,
              bgcolor: hasCover ? "rgba(255, 255, 255, 0.18)" : undefined,
              color: hasCover ? "#ffffff" : undefined,
              borderColor: hasCover ? "rgba(255, 255, 255, 0.35)" : undefined,
              backdropFilter: hasCover ? "blur(6px)" : "none",
              "&:hover": { bgcolor: hasCover ? "rgba(255, 255, 255, 0.32)" : undefined },
            }}
          >
            Historias
          </CustomButton>
          <CustomButton
            variant={hasCover ? "contained" : "outlined"}
            size="small"
            fullWidth
            startIcon={<PeopleOutlineIcon fontSize="small" />}
            onClick={onOpenCharactersDrawer}
            sx={{
              fontSize: "0.74rem",
              py: 0.45,
              fontWeight: 700,
              bgcolor: hasCover ? "rgba(255, 255, 255, 0.18)" : undefined,
              color: hasCover ? "#ffffff" : undefined,
              borderColor: hasCover ? "rgba(255, 255, 255, 0.35)" : undefined,
              backdropFilter: hasCover ? "blur(6px)" : "none",
              "&:hover": { bgcolor: hasCover ? "rgba(255, 255, 255, 0.32)" : undefined },
            }}
          >
            Personajes ({characters.length})
          </CustomButton>
        </Box>
      </Box>

      {/* Boards Tree Section Header */}
      <Box
        sx={{
          p: 1.5,
          pb: 0.5,
          px: 2,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 0.8 }}>
          <AccountTreeOutlinedIcon sx={{ fontSize: 14, color: "text.secondary" }} />
          <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, textTransform: "uppercase" }}>
            Lineas Narrativas
          </Typography>
          <Typography
            variant="caption"
            sx={{
              fontSize: "0.65rem",
              color: "text.disabled",
              bgcolor: "background.subtle",
              border: "1px solid",
              borderColor: "divider",
              borderRadius: 0.8,
              px: 0.6,
            }}
          >
            {boards.length}
          </Typography>
        </Box>
        <Tooltip title="Crear nuevo tablero raiz">
          <IconButton
            size="small"
            onClick={() => handleRequestCreateBoard(null)}
            sx={{ color: "primary.main", p: 0.3 }}
          >
            <AddIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      </Box>

      {/* Boards Tree */}
      <Box sx={{ flexGrow: 1, overflowY: "auto", px: 1, pb: 2 }}>
        {boards.length === 0 ? (
          <Box sx={{ p: 2, textAlign: "center" }}>
            <Typography variant="caption" color="text.disabled">
              No hay tableros en esta historia.
            </Typography>
            <Box sx={{ mt: 1.5 }}>
              <CustomButton
                size="small"
                startIcon={<AddIcon fontSize="small" />}
                onClick={() => handleRequestCreateBoard(null)}
                variant="outlined"
              >
                Crear tablero
              </CustomButton>
            </Box>
          </Box>
        ) : (
          rootBoards.map((board) => (
            <BoardTreeItem
              key={board.id}
              board={board}
              boards={boards}
              events={events}
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
            />
          ))
        )}
      </Box>

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
            placeholder="Arco 1, Flashback, Linea alternativa..."
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
            Ingresa la URL de la imagen que servira de fondo panoramico en el panel de Proyecto Activo.
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
