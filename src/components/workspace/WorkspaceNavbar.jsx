import React, { useState, useEffect } from 'react';
import {
  Box,
  Tabs,
  Tab,
  Badge,
  Tooltip,
  Typography,
  IconButton,
  Button,
  Chip,
  Menu,
  MenuItem,
  Divider,
  Switch,
  FormControl,
  Select,
  FormControlLabel,
  useTheme,
  useMediaQuery,
  Collapse,
} from '@mui/material';
import AccountTreeOutlinedIcon from '@mui/icons-material/AccountTreeOutlined';
import PeopleOutlineIcon from '@mui/icons-material/PeopleOutline';
import LightbulbOutlinedIcon from '@mui/icons-material/LightbulbOutlined';
import AutoStoriesIcon from '@mui/icons-material/AutoStories';
import AddIcon from '@mui/icons-material/Add';
import TuneIcon from '@mui/icons-material/Tune';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import CheckIcon from '@mui/icons-material/Check';
import ViewAgendaOutlinedIcon from '@mui/icons-material/ViewAgendaOutlined';
import ViewHeadlineIcon from '@mui/icons-material/ViewHeadline';
import FilterListIcon from '@mui/icons-material/FilterList';
import BookmarkAddOutlinedIcon from '@mui/icons-material/BookmarkAddOutlined';
import RateReviewOutlinedIcon from '@mui/icons-material/RateReviewOutlined';
import HistoryIcon from '@mui/icons-material/History';
import DifferenceIcon from '@mui/icons-material/Difference';

import { useWorkspaceView, WORKSPACE_VIEW_KEYS } from '../../context/WorkspaceViewContext';
import { useWorkspace } from '../../context/WorkspaceContext';
import { useQuickNotes } from '../../context/QuickNotesContext';
import { useGlobalActions } from '../../context/GlobalActionsContext';
import { useCharacterDrawer } from '../../context/CharacterDrawerContext';
import { useManuscriptCore } from '../../context/ManuscriptContext';
import CharactersToolbar from './toolbars/CharactersToolbar';
import IdeasToolbar from './toolbars/IdeasToolbar';

/**
 * WorkspaceNavbar — Barra de herramientas dedicada de 2 pisos para el área de trabajo / lienzo.
 * Piso 1: Navegación entre áreas de trabajo (Tramas, Personajes, Ideas, Manuscrito) y botón de acción principal.
 * Piso 2: Barra de herramientas contextual dinámica según la vista activa.
 */
export default function WorkspaceNavbar() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.down('md'));

  const {
    activeView,
    setActiveView,
    views,
    isSubbarOpen,
    toggleSubbar,
    charactersToolbar,
    eventsCompact,
    setEventsCompact,
    setHasWorkspaceNavbar,
  } = useWorkspaceView();

  const {
    characters = [],
    events = [],
    eventConnections = [],
    boards = [],
    activeBoardId,
    setActiveBoardId,
  } = useWorkspace();

  const { totalCount: notesCount, openCreateModal: openCreateNoteModal } = useQuickNotes();
  const { openCreateEvent, openCreateChar } = useGlobalActions();
  const { prepareCreateChar } = useCharacterDrawer();

  const {
    chapters = [],
    activeChapter,
    activeChapterId,
    setActiveChapterId,
    workingStatus,
    setWorkingStatus,
    reviewMode,
    setReviewMode,
    wordCount: chapterWordCount,
    totalManuscriptWords,
    isDirty: isChapterDirty,
    diffSummary: chapterDiffSummary,
    createChapter,
    setIsCommitModalOpen,
    setIsHistoryDrawerOpen,
    setIsDiffModalOpen,
  } = useManuscriptCore();

  // Menu de tableros para la vista de eventos
  const [boardMenuAnchor, setBoardMenuAnchor] = useState(null);
  const activeBoard = boards.find((b) => b.id === activeBoardId) || boards[0] || null;

  // Menu de capítulos para el subbar de manuscrito
  const [chapterMenuAnchor, setChapterMenuAnchor] = useState(null);

  // Avisa a las vistas que el navbar existe (así no duplican su propia barra de controles)
  useEffect(() => {
    setHasWorkspaceNavbar(true);
    return () => setHasWorkspaceNavbar(false);
  }, [setHasWorkspaceNavbar]);

  // Badge count per view
  const getBadgeCount = (viewId) => {
    if (viewId === WORKSPACE_VIEW_KEYS.EVENTS) return events.length;
    if (viewId === WORKSPACE_VIEW_KEYS.CHARACTERS) return characters.length;
    if (viewId === WORKSPACE_VIEW_KEYS.IDEAS) return notesCount;
    if (viewId === WORKSPACE_VIEW_KEYS.MANUSCRIPT) return chapters.length;
    return 0;
  };

  // Botón de acción principal contextual (Lado derecho del Piso 1)
  const handlePrimaryAction = () => {
    if (activeView === WORKSPACE_VIEW_KEYS.EVENTS) {
      openCreateEvent(activeBoardId);
    } else if (activeView === WORKSPACE_VIEW_KEYS.CHARACTERS) {
      if (charactersToolbar?.onCreate) {
        charactersToolbar.onCreate();
      } else {
        prepareCreateChar();
        openCreateChar();
      }
    } else if (activeView === WORKSPACE_VIEW_KEYS.IDEAS) {
      if (openCreateNoteModal) {
        openCreateNoteModal();
      } else {
        setActiveView(WORKSPACE_VIEW_KEYS.IDEAS);
      }
    } else if (activeView === WORKSPACE_VIEW_KEYS.MANUSCRIPT) {
      createChapter();
    }
  };

  const primaryActionLabel = {
    [WORKSPACE_VIEW_KEYS.EVENTS]: 'Nueva Escena',
    [WORKSPACE_VIEW_KEYS.CHARACTERS]: 'Nuevo Personaje',
    [WORKSPACE_VIEW_KEYS.IDEAS]: 'Nueva Nota',
    [WORKSPACE_VIEW_KEYS.MANUSCRIPT]: 'Nuevo Capítulo',
  }[activeView] || 'Crear';

  return (
    <Box
      sx={{
        width: '100%',
        bgcolor: 'background.paper',
        borderBottom: 1,
        borderColor: 'divider',
        display: 'flex',
        flexDirection: 'column',
        zIndex: 4,
        flexShrink: 0,
        boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
      }}
    >
      {/* ═══════════════════════════════════════════════════════════════════════
          PISO 1: PESTAÑAS DE NAVEGACIÓN DEL WORKSPACE & BOTÓN HERO
          ═══════════════════════════════════════════════════════════════════════ */}
      <Box
        sx={{
          height: 48,
          minHeight: 48,
          px: { xs: 1, sm: 2 },
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 1.5,
        }}
      >
        {/* Lado Izquierdo: Pestañas de Áreas de Trabajo */}
        <Box sx={{ display: 'flex', alignItems: 'center', minWidth: 0, flex: 1 }}>
          <Tabs
            value={activeView}
            onChange={(e, val) => setActiveView(val)}
            variant={isMobile ? 'scrollable' : 'standard'}
            scrollButtons="auto"
            TabIndicatorProps={{
              sx: {
                height: 2.5,
                borderRadius: '2px 2px 0 0',
                bgcolor: 'primary.main',
              },
            }}
            sx={{
              minHeight: 48,
              width: '100%',
              '& .MuiTabs-flexContainer': {
                gap: 0.5,
              },
            }}
          >
            {views.map((v) => {
              const IconComponent = v.icon;
              const isSelected = activeView === v.id;
              const count = getBadgeCount(v.id);

              return (
                <Tab
                  key={v.id}
                  value={v.id}
                  icon={
                    <Badge
                      badgeContent={count > 0 ? count : null}
                      color={v.id === WORKSPACE_VIEW_KEYS.IDEAS ? 'secondary' : 'primary'}
                      max={99}
                      slotProps={{
                        badge: {
                          sx: {
                            fontSize: '0.68rem',
                            height: 15,
                            minWidth: 15,
                            px: '3px',
                          },
                        },
                      }}
                    >
                      <IconComponent
                        sx={{
                          fontSize: 18,
                          color: isSelected ? 'primary.main' : 'text.secondary',
                        }}
                      />
                    </Badge>
                  }
                  iconPosition="start"
                  label={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8 }}>
                      <Typography
                        variant="caption"
                        sx={{
                          fontWeight: isSelected ? 800 : 600,
                          fontSize: { xs: '0.72rem', sm: '0.76rem' },
                          letterSpacing: '0.06em',
                          textTransform: 'uppercase',
                          color: isSelected ? 'text.primary' : 'text.secondary',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {isTablet ? v.navShortLabel : v.navLabel}
                      </Typography>
                      {v.isUpcoming && (
                        <Chip
                          label="Pronto"
                          size="small"
                          sx={{
                            height: 16,
                            fontSize: '0.6rem',
                            fontWeight: 700,
                            bgcolor: 'action.hover',
                            color: 'text.secondary',
                            borderRadius: 1,
                          }}
                        />
                      )}
                    </Box>
                  }
                  sx={{
                    minHeight: 48,
                    py: 0,
                    px: { xs: 1.2, sm: 2 },
                    // En escritorio las pestañas reparten todo el ancho; la activa recibe más espacio
                    ...(!isMobile && {
                      flex: isSelected ? '1.7 1 0' : '1 1 0',
                      maxWidth: 'none',
                      minWidth: 0,
                    }),
                    bgcolor: isSelected ? 'action.selected' : 'transparent',
                    borderRadius: '8px 8px 0 0',
                    transition: 'all 0.2s ease',
                    '&:hover': {
                      bgcolor: 'action.hover',
                    },
                  }}
                />
              );
            })}
          </Tabs>
        </Box>

        {/* Lado Derecho: Botón de Acción Rápida & Toggle del Piso 2 */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexShrink: 0 }}>
          {/* Botón Principal Contextual */}
          <Button
            variant="contained"
            color="primary"
            size="small"
            startIcon={<AddIcon fontSize="small" />}
            onClick={handlePrimaryAction}
            sx={{
              fontWeight: 700,
              fontSize: { xs: '0.75rem', sm: '0.8rem' },
              textTransform: 'none',
              borderRadius: 2,
              px: { xs: 1.2, sm: 1.8 },
              py: 0.5,
              boxShadow: '0 2px 6px rgba(0,0,0,0.12)',
            }}
          >
            {isMobile ? 'Nuevo' : primaryActionLabel}
          </Button>

          {/* Toggle para mostrar/ocultar el Piso 2 */}
          <Tooltip title={isSubbarOpen ? 'Ocultar barra de herramientas' : 'Mostrar barra de herramientas'}>
            <IconButton
              size="small"
              onClick={toggleSubbar}
              sx={{
                border: 1,
                borderColor: 'divider',
                borderRadius: 1.8,
                p: 0.6,
                color: isSubbarOpen ? 'primary.main' : 'text.secondary',
                bgcolor: isSubbarOpen ? 'action.selected' : 'transparent',
              }}
            >
              <TuneIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {/* ═══════════════════════════════════════════════════════════════════════
          PISO 2: BARRA DE HERRAMIENTAS CONTEXTUAL DINÁMICA
          ═══════════════════════════════════════════════════════════════════════ */}
      <Collapse in={isSubbarOpen} timeout={180}>
        <Box
          sx={{
            minHeight: 42,
            py: 0.6,
            px: { xs: 1, sm: 2 },
            borderTop: 1,
            borderColor: 'divider',
            bgcolor: 'background.subtle',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            columnGap: 1.5,
            rowGap: 0.8,
            flexWrap: 'wrap',
          }}
        >
          {/* ── SUBBAR: TRAMAS & EVENTOS ─────────────────────────────────── */}
          {activeView === WORKSPACE_VIEW_KEYS.EVENTS && (
            <>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2 }}>
                {/* Selector de Tablero */}
                {boards.length > 0 && (
                  <>
                    <Button
                      size="small"
                      variant="outlined"
                      onClick={(e) => setBoardMenuAnchor(e.currentTarget)}
                      endIcon={<KeyboardArrowDownIcon fontSize="small" />}
                      sx={{
                        py: 0.3,
                        px: 1.2,
                        fontSize: '0.78rem',
                        fontWeight: 700,
                        textTransform: 'none',
                        borderRadius: 1.8,
                        borderColor: 'divider',
                        bgcolor: 'background.paper',
                        color: 'text.primary',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 0.8,
                      }}
                    >
                      <Box
                        sx={{
                          width: 10,
                          height: 10,
                          borderRadius: '50%',
                          bgcolor: activeBoard?.color || 'primary.main',
                          boxShadow: '0 0 4px rgba(0,0,0,0.2)',
                        }}
                      />
                      <Typography variant="caption" sx={{ fontWeight: 700 }}>
                        {activeBoard ? activeBoard.name : 'Tablero'}
                      </Typography>
                    </Button>

                    <Menu
                      anchorEl={boardMenuAnchor}
                      open={Boolean(boardMenuAnchor)}
                      onClose={() => setBoardMenuAnchor(null)}
                      PaperProps={{ sx: { minWidth: 180, borderRadius: 2 } }}
                    >
                      <Box sx={{ px: 2, py: 0.5, borderBottom: 1, borderColor: 'divider' }}>
                        <Typography variant="caption" sx={{ fontWeight: 800, color: 'text.secondary' }}>
                          TABLEROS DE TRAMA ({boards.length})
                        </Typography>
                      </Box>
                      {boards.map((b) => (
                        <MenuItem
                          key={b.id}
                          selected={b.id === activeBoardId}
                          onClick={() => {
                            setActiveBoardId(b.id);
                            setBoardMenuAnchor(null);
                          }}
                          sx={{ display: 'flex', alignItems: 'center', gap: 1.2, py: 0.8 }}
                        >
                          <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: b.color || 'primary.main' }} />
                          <Typography variant="body2" sx={{ fontWeight: b.id === activeBoardId ? 800 : 500, flexGrow: 1 }}>
                            {b.name}
                          </Typography>
                          {b.id === activeBoardId && <CheckIcon fontSize="small" color="primary" />}
                        </MenuItem>
                      ))}
                    </Menu>
                  </>
                )}

                <Divider orientation="vertical" flexItem sx={{ my: 0.5 }} />

                {/* Métricas rápidas */}
                <Chip
                  size="small"
                  label={`${events.length} Escenas`}
                  variant="outlined"
                  sx={{ height: 24, fontSize: '0.72rem', fontWeight: 600, borderColor: 'divider', bgcolor: 'background.paper' }}
                />
                <Chip
                  size="small"
                  label={`${eventConnections.length} Enlaces`}
                  variant="outlined"
                  sx={{ height: 24, fontSize: '0.72rem', fontWeight: 600, borderColor: 'divider', bgcolor: 'background.paper' }}
                />
              </Box>

              {/* Lado derecho de Tramas: Switch Vista Resumen / Detallada */}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <FormControlLabel
                  control={
                    <Switch
                      size="small"
                      checked={eventsCompact}
                      onChange={(e) => setEventsCompact(e.target.checked)}
                      color="secondary"
                    />
                  }
                  label={
                    <Typography variant="caption" sx={{ fontSize: '0.75rem', fontWeight: 600, color: 'text.secondary' }}>
                      {eventsCompact ? 'Vista Resumen' : 'Vista Detallada'}
                    </Typography>
                  }
                  sx={{ m: 0 }}
                />
              </Box>
            </>
          )}

          {/* ── SUBBAR: PERSONAJES ────────────────────────────────────────── */}
          {activeView === WORKSPACE_VIEW_KEYS.CHARACTERS && <CharactersToolbar />}

          {/* ── SUBBAR: PIZARRA DE IDEAS ─────────────────────────────────── */}
          {activeView === WORKSPACE_VIEW_KEYS.IDEAS && <IdeasToolbar />}

          {/* ── SUBBAR: MANUSCRITO ───────────────────────────────────────── */}
          {activeView === WORKSPACE_VIEW_KEYS.MANUSCRIPT && (
            <>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                {/* Selector de Capítulo Activo */}
                {chapters.length > 0 && (
                  <>
                    <Button
                      size="small"
                      variant="outlined"
                      onClick={(e) => setChapterMenuAnchor(e.currentTarget)}
                      endIcon={<KeyboardArrowDownIcon fontSize="small" />}
                      sx={{
                        py: 0.3,
                        px: 1.2,
                        fontSize: '0.78rem',
                        fontWeight: 700,
                        textTransform: 'none',
                        borderRadius: 1.8,
                        borderColor: 'divider',
                        bgcolor: 'background.paper',
                        color: 'text.primary',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 0.8,
                      }}
                    >
                      <AutoStoriesIcon sx={{ fontSize: 16, color: 'primary.main' }} />
                      <Typography variant="caption" sx={{ fontWeight: 700 }} noWrap>
                        {activeChapter ? activeChapter.title : 'Seleccionar Capítulo'}
                      </Typography>
                    </Button>

                    <Menu
                      anchorEl={chapterMenuAnchor}
                      open={Boolean(chapterMenuAnchor)}
                      onClose={() => setChapterMenuAnchor(null)}
                      PaperProps={{ sx: { minWidth: 200, borderRadius: 2 } }}
                    >
                      <Box sx={{ px: 2, py: 0.5, borderBottom: 1, borderColor: 'divider' }}>
                        <Typography variant="caption" sx={{ fontWeight: 800, color: 'text.secondary' }}>
                          CAPÍTULOS ({chapters.length})
                        </Typography>
                      </Box>
                      {chapters.map((ch, idx) => (
                        <MenuItem
                          key={ch.id}
                          selected={ch.id === activeChapterId}
                          onClick={() => {
                            setActiveChapterId(ch.id);
                            setChapterMenuAnchor(null);
                          }}
                          sx={{ display: 'flex', alignItems: 'center', gap: 1.2, py: 0.8 }}
                        >
                          <Typography variant="caption" sx={{ fontWeight: 800, color: 'text.secondary', width: 16 }}>
                            {idx + 1}
                          </Typography>
                          <Typography variant="body2" sx={{ fontWeight: ch.id === activeChapterId ? 800 : 500, flexGrow: 1 }} noWrap>
                            {ch.title}
                          </Typography>
                          {ch.id === activeChapterId && <CheckIcon fontSize="small" color="primary" />}
                        </MenuItem>
                      ))}
                    </Menu>
                  </>
                )}

                {/* Selector de estado narrativo */}
                <FormControl size="small">
                  <Select
                    value={workingStatus || 'draft'}
                    onChange={(e) => setWorkingStatus(e.target.value)}
                    sx={{
                      height: 26,
                      fontSize: '0.72rem',
                      fontWeight: 700,
                      borderRadius: 1.8,
                      bgcolor: 'background.paper',
                      '& .MuiSelect-select': { py: 0.2, px: 1 },
                    }}
                  >
                    <MenuItem value="draft" sx={{ fontSize: '0.75rem' }}>Borrador</MenuItem>
                    <MenuItem value="review" sx={{ fontSize: '0.75rem' }}>En Revisión</MenuItem>
                    <MenuItem value="done" sx={{ fontSize: '0.75rem' }}>Finalizado</MenuItem>
                  </Select>
                </FormControl>

                <Divider orientation="vertical" flexItem sx={{ my: 0.5 }} />

                {/* Estado de Versión (Para escritores: Cambios sin guardar / Versión al día) */}
                {isChapterDirty ? (
                  <Tooltip title="Ver los cambios pendientes frente a la última versión guardada">
                    <Chip
                      size="small"
                      label={`Cambios sin guardar (+${chapterDiffSummary?.addedLines || 0} -${chapterDiffSummary?.removedLines || 0})`}
                      onClick={() => setIsDiffModalOpen(true)}
                      sx={{
                        height: 24,
                        fontSize: '0.72rem',
                        fontWeight: 700,
                        bgcolor: 'rgba(234, 88, 12, 0.12)',
                        color: 'warning.main',
                        cursor: 'pointer',
                        '&:hover': { bgcolor: 'rgba(234, 88, 12, 0.20)' },
                      }}
                    />
                  </Tooltip>
                ) : (
                  <Chip
                    size="small"
                    label="Versión al día"
                    sx={{
                      height: 24,
                      fontSize: '0.72rem',
                      fontWeight: 700,
                      bgcolor: 'rgba(46, 160, 67, 0.12)',
                      color: 'success.main',
                    }}
                  />
                )}

                {/* Conteo de palabras */}
                <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600, fontSize: '0.75rem' }}>
                  {chapterWordCount} palabras
                </Typography>
              </Box>

              {/* Botones de acción narrativa del Subbar */}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8, ml: 'auto' }}>
                {/* Toggle Modo Revisión en Vivo */}
                <Tooltip title={reviewMode ? 'Cerrar vista de revisión comparativa' : 'Activar Modo Revisión comparativa en vivo'}>
                  <Button
                    size="small"
                    variant={reviewMode ? 'contained' : 'outlined'}
                    color={reviewMode ? 'success' : 'inherit'}
                    startIcon={<RateReviewOutlinedIcon sx={{ fontSize: 14 }} />}
                    onClick={() => setReviewMode((prev) => !prev)}
                    sx={{
                      fontSize: '0.72rem',
                      py: 0.3,
                      px: 1.2,
                      textTransform: 'none',
                      fontWeight: 700,
                      borderRadius: 1.8,
                    }}
                  >
                    {reviewMode ? 'Revisión Activa' : 'Modo Revisión'}
                  </Button>
                </Tooltip>

                {/* Botón Ver Cambios */}
                <Button
                  size="small"
                  variant="outlined"
                  startIcon={<DifferenceIcon sx={{ fontSize: 14 }} />}
                  onClick={() => setIsDiffModalOpen(true)}
                  sx={{
                    fontSize: '0.72rem',
                    py: 0.3,
                    px: 1.1,
                    textTransform: 'none',
                    borderRadius: 1.8,
                    color: 'text.secondary',
                    borderColor: 'divider',
                  }}
                >
                  Ver Cambios
                </Button>

                {/* Botón Guardar Versión (en lugar de Comitear) */}
                <Button
                  size="small"
                  variant="contained"
                  color="primary"
                  startIcon={<BookmarkAddOutlinedIcon sx={{ fontSize: 14 }} />}
                  onClick={() => setIsCommitModalOpen(true)}
                  disabled={!isChapterDirty}
                  sx={{
                    fontSize: '0.72rem',
                    py: 0.3,
                    px: 1.3,
                    fontWeight: 700,
                    textTransform: 'none',
                    borderRadius: 1.8,
                  }}
                >
                  Guardar Versión
                </Button>

                {/* Historial de Versiones */}
                <Tooltip title="Historial de versiones y puntos de control guardados">
                  <IconButton
                    size="small"
                    onClick={() => setIsHistoryDrawerOpen(true)}
                    sx={{
                      border: 1,
                      borderColor: 'divider',
                      borderRadius: 1.8,
                      p: 0.4,
                    }}
                  >
                    <HistoryIcon sx={{ fontSize: 18 }} />
                  </IconButton>
                </Tooltip>
              </Box>
            </>
          )}
        </Box>
      </Collapse>
    </Box>
  );
}
