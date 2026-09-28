import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import {
  Box,
  Typography,
  TextField,
  MenuItem,
  Checkbox,
  ListItemText,
  OutlinedInput,
  Select,
  InputLabel,
  FormControl,
  Chip,
  Avatar,
  FormControlLabel,
  Switch,
  Grid,
  Button,
  Collapse,
  Divider,
  Tooltip,
  IconButton,
  Menu,
  Badge,
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import EventIcon from '@mui/icons-material/Event';
import BookmarkBorderIcon from '@mui/icons-material/BookmarkBorder';
import TuneIcon from '@mui/icons-material/Tune';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';
import CustomModal from '../common/CustomModal';
import CustomButton from '../common/CustomButton';
import { APP_CONFIG, EVENT_IMPORTANCE } from '../../constants/constants';
import { useLoreTheme } from '../../context/ThemeContext';
import { useEventOrder } from '../../hooks/useEventOrder';

// ─── Swipe Hook ───────────────────────────────────────────────────────────────
function useSwipeNavigation({ onSwipeLeft, onSwipeRight, enabled = true }) {
  const touchStartX = useRef(null);
  const touchStartY = useRef(null);
  const handleTouchStart = useCallback((e) => {
    if (!enabled) return;
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
  }, [enabled]);
  const handleTouchEnd = useCallback((e) => {
    if (!enabled || touchStartX.current === null) return;
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    const dy = e.changedTouches[0].clientY - touchStartY.current;
    if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 60) {
      if (dx < 0) onSwipeLeft?.();
      else onSwipeRight?.();
    }
    touchStartX.current = null;
    touchStartY.current = null;
  }, [enabled, onSwipeLeft, onSwipeRight]);
  return { handleTouchStart, handleTouchEnd };
}

// ─── Header Connection Nav ───────────────────────────────────────────────────
function HeaderConnectionNav({ connectedEvents, computedOrderMap, allEvents, onNavigate }) {
  const [prevAnchorEl, setPrevAnchorEl] = useState(null);
  const [nextAnchorEl, setNextAnchorEl] = useState(null);

  const prevEvents = useMemo(() => connectedEvents.filter((c) => c.direction === 'prev'), [connectedEvents]);
  const nextEvents = useMemo(() => connectedEvents.filter((c) => c.direction === 'next'), [connectedEvents]);

  const getEventNumber = useCallback((ev) => {
    if (!ev) return 1;
    if (computedOrderMap && computedOrderMap.has(ev.id)) {
      return computedOrderMap.get(ev.id);
    }
    if (allEvents && allEvents.length > 0) {
      const idx = allEvents.findIndex((e) => e.id === ev.id);
      if (idx !== -1) return idx + 1;
    }
    return Math.round(ev.order_index ?? ev.orderIndex ?? 1);
  }, [computedOrderMap, allEvents]);

  if (!connectedEvents || connectedEvents.length === 0) return null;

  const handlePrevClick = (e) => {
    if (prevEvents.length === 1) {
      onNavigate(prevEvents[0].event, 'prev');
    } else if (prevEvents.length > 1) {
      setPrevAnchorEl(e.currentTarget);
    }
  };

  const handleNextClick = (e) => {
    if (nextEvents.length === 1) {
      onNavigate(nextEvents[0].event, 'next');
    } else if (nextEvents.length > 1) {
      setNextAnchorEl(e.currentTarget);
    }
  };

  const hasPrev = prevEvents.length > 0;
  const hasNext = nextEvents.length > 0;

  return (
    <Box
      sx={{
        display: 'inline-flex',
        alignItems: 'center',
        borderRadius: 2,
        p: '2px',
        bgcolor: (theme) => alpha(theme.palette.text.primary, 0.04),
        border: 1,
        borderColor: 'divider',
      }}
    >
      {/* ── BOTÓN ANTERIOR (←) ── */}
      <Tooltip
        title={
          !hasPrev
            ? 'Sin conexiones anteriores'
            : prevEvents.length === 1
            ? `Ir a (#${getEventNumber(prevEvents[0].event)}): ${prevEvents[0].event.title}`
            : `${prevEvents.length} eventos anteriores (clic para desplegar opciones)`
        }
        arrow
      >
        <Box
          component={hasPrev ? 'button' : 'div'}
          onClick={hasPrev ? handlePrevClick : undefined}
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 0.5,
            px: { xs: 0.6, sm: 0.9 },
            py: 0.35,
            borderRadius: 1.5,
            border: 'none',
            background: 'none',
            cursor: hasPrev ? 'pointer' : 'default',
            color: hasPrev ? 'text.primary' : 'text.disabled',
            opacity: hasPrev ? 1 : 0.4,
            transition: 'all 0.15s ease',
            '&:hover': hasPrev
              ? {
                  bgcolor: (theme) => alpha(theme.palette.primary.main, 0.12),
                  color: 'primary.main',
                }
              : {},
          }}
        >
          <ChevronLeftIcon sx={{ fontSize: { xs: 18, sm: 20 }, flexShrink: 0 }} />
          {hasPrev && prevEvents.length === 1 && (
            <>
              <Box
                sx={{
                  minWidth: 19,
                  height: 19,
                  px: 0.35,
                  borderRadius: '50%',
                  bgcolor: prevEvents[0].event.color_tag || 'primary.main',
                  color: '#fff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '0.62rem',
                  fontWeight: 800,
                  flexShrink: 0,
                  lineHeight: 1,
                }}
              >
                {getEventNumber(prevEvents[0].event)}
              </Box>
              <Typography
                variant="caption"
                noWrap
                sx={{
                  fontSize: '0.72rem',
                  fontWeight: 600,
                  maxWidth: { xs: 55, sm: 110 },
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  textAlign: 'left',
                }}
              >
                {prevEvents[0].event.title}
              </Typography>
            </>
          )}
          {hasPrev && prevEvents.length > 1 && (
            <>
              <Typography
                variant="caption"
                noWrap
                sx={{
                  fontSize: '0.72rem',
                  fontWeight: 600,
                  maxWidth: { xs: 60, sm: 110 },
                }}
              >
                {prevEvents.length} anteriores
              </Typography>
              <ArrowDropDownIcon sx={{ fontSize: 16, opacity: 0.8, flexShrink: 0, ml: -0.3 }} />
            </>
          )}
        </Box>
      </Tooltip>

      {/* Menú desplegable si hay más de 1 anterior */}
      {prevEvents.length > 1 && (
        <Menu
          anchorEl={prevAnchorEl}
          open={Boolean(prevAnchorEl)}
          onClose={() => setPrevAnchorEl(null)}
          PaperProps={{
            elevation: 4,
            sx: {
              mt: 0.8,
              borderRadius: 2.5,
              minWidth: 200,
              maxWidth: 300,
              p: 0.5,
            },
          }}
        >
          <Typography
            variant="caption"
            sx={{
              px: 1.5,
              py: 0.6,
              display: 'block',
              fontWeight: 700,
              color: 'text.secondary',
              textTransform: 'uppercase',
              fontSize: '0.65rem',
              letterSpacing: '0.04em',
            }}
          >
            Eventos Anteriores ({prevEvents.length})
          </Typography>
          {prevEvents.map(({ event: ev }) => (
            <MenuItem
              key={ev.id}
              onClick={() => {
                setPrevAnchorEl(null);
                onNavigate(ev, 'prev');
              }}
              sx={{
                borderRadius: 1.5,
                py: 0.8,
                px: 1.2,
                gap: 1.2,
                display: 'flex',
                alignItems: 'center',
              }}
            >
              <Box
                sx={{
                  minWidth: 22,
                  height: 22,
                  borderRadius: '50%',
                  bgcolor: ev.color_tag || 'primary.main',
                  color: '#fff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '0.68rem',
                  fontWeight: 800,
                  flexShrink: 0,
                }}
              >
                {getEventNumber(ev)}
              </Box>
              <Typography variant="body2" noWrap sx={{ fontSize: '0.82rem', fontWeight: 600 }}>
                {ev.title}
              </Typography>
            </MenuItem>
          ))}
        </Menu>
      )}

      <Divider orientation="vertical" flexItem sx={{ mx: 0.2, my: 0.5, opacity: 0.5 }} />

      {/* ── BOTÓN SIGUIENTE (→) ── */}
      <Tooltip
        title={
          !hasNext
            ? 'Sin conexiones siguientes'
            : nextEvents.length === 1
            ? `Ir a (#${getEventNumber(nextEvents[0].event)}): ${nextEvents[0].event.title}`
            : `${nextEvents.length} eventos siguientes (clic para desplegar opciones)`
        }
        arrow
      >
        <Box
          component={hasNext ? 'button' : 'div'}
          onClick={hasNext ? handleNextClick : undefined}
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 0.5,
            px: { xs: 0.6, sm: 0.9 },
            py: 0.35,
            borderRadius: 1.5,
            border: 'none',
            background: 'none',
            cursor: hasNext ? 'pointer' : 'default',
            color: hasNext ? 'text.primary' : 'text.disabled',
            opacity: hasNext ? 1 : 0.4,
            transition: 'all 0.15s ease',
            '&:hover': hasNext
              ? {
                  bgcolor: (theme) => alpha(theme.palette.primary.main, 0.12),
                  color: 'primary.main',
                }
              : {},
          }}
        >
          {hasNext && nextEvents.length === 1 && (
            <>
              <Typography
                variant="caption"
                noWrap
                sx={{
                  fontSize: '0.72rem',
                  fontWeight: 600,
                  maxWidth: { xs: 55, sm: 110 },
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  textAlign: 'right',
                }}
              >
                {nextEvents[0].event.title}
              </Typography>
              <Box
                sx={{
                  minWidth: 19,
                  height: 19,
                  px: 0.35,
                  borderRadius: '50%',
                  bgcolor: nextEvents[0].event.color_tag || 'primary.main',
                  color: '#fff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '0.62rem',
                  fontWeight: 800,
                  flexShrink: 0,
                  lineHeight: 1,
                }}
              >
                {getEventNumber(nextEvents[0].event)}
              </Box>
            </>
          )}
          {hasNext && nextEvents.length > 1 && (
            <>
              <Typography
                variant="caption"
                noWrap
                sx={{
                  fontSize: '0.72rem',
                  fontWeight: 600,
                  maxWidth: { xs: 60, sm: 110 },
                }}
              >
                {nextEvents.length} siguientes
              </Typography>
              <ArrowDropDownIcon sx={{ fontSize: 16, opacity: 0.8, flexShrink: 0, mr: -0.3 }} />
            </>
          )}
          <ChevronRightIcon sx={{ fontSize: { xs: 18, sm: 20 }, flexShrink: 0 }} />
        </Box>
      </Tooltip>

      {/* Menú desplegable si hay más de 1 siguiente */}
      {nextEvents.length > 1 && (
        <Menu
          anchorEl={nextAnchorEl}
          open={Boolean(nextAnchorEl)}
          onClose={() => setNextAnchorEl(null)}
          PaperProps={{
            elevation: 4,
            sx: {
              mt: 0.8,
              borderRadius: 2.5,
              minWidth: 200,
              maxWidth: 300,
              p: 0.5,
            },
          }}
        >
          <Typography
            variant="caption"
            sx={{
              px: 1.5,
              py: 0.6,
              display: 'block',
              fontWeight: 700,
              color: 'text.secondary',
              textTransform: 'uppercase',
              fontSize: '0.65rem',
              letterSpacing: '0.04em',
            }}
          >
            Conexiones Siguientes ({nextEvents.length})
          </Typography>
          {nextEvents.map(({ event: ev }) => (
            <MenuItem
              key={ev.id}
              onClick={() => {
                setNextAnchorEl(null);
                onNavigate(ev, 'next');
              }}
              sx={{
                borderRadius: 1.5,
                py: 0.8,
                px: 1.2,
                gap: 1.2,
                display: 'flex',
                alignItems: 'center',
              }}
            >
              <Box
                sx={{
                  minWidth: 22,
                  height: 22,
                  borderRadius: '50%',
                  bgcolor: ev.color_tag || 'primary.main',
                  color: '#fff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '0.68rem',
                  fontWeight: 800,
                  flexShrink: 0,
                }}
              >
                {getEventNumber(ev)}
              </Box>
              <Typography variant="body2" noWrap sx={{ fontSize: '0.82rem', fontWeight: 600 }}>
                {ev.title}
              </Typography>
            </MenuItem>
          ))}
        </Menu>
      )}
    </Box>
  );
}

// ─── Slide animation wrapper ──────────────────────────────────────────────────
const SLIDE_DURATION = 230;
function SlideContainer({ children, slideKey, direction = 'next' }) {
  const [animClass, setAnimClass] = useState('');
  const prevKey = useRef(slideKey);

  useEffect(() => {
    if (slideKey && slideKey !== prevKey.current) {
      prevKey.current = slideKey;
      const cls = direction === 'next' ? 'ev-slide-from-right' : 'ev-slide-from-left';
      setAnimClass(cls);
      const t = setTimeout(() => setAnimClass(''), SLIDE_DURATION);
      return () => clearTimeout(t);
    }
  }, [slideKey, direction]);

  return (
    <>
      <style>{`
        @keyframes evSlideFromRight {
          0% {
            opacity: 0;
            transform: translateX(28px);
          }
          100% {
            opacity: 1;
            transform: translateX(0);
          }
        }
        @keyframes evSlideFromLeft {
          0% {
            opacity: 0;
            transform: translateX(-28px);
          }
          100% {
            opacity: 1;
            transform: translateX(0);
          }
        }
        .ev-slide-from-right {
          animation: evSlideFromRight ${SLIDE_DURATION}ms cubic-bezier(0.16, 1, 0.3, 1) both;
          will-change: transform, opacity;
        }
        .ev-slide-from-left {
          animation: evSlideFromLeft ${SLIDE_DURATION}ms cubic-bezier(0.16, 1, 0.3, 1) both;
          will-change: transform, opacity;
        }
      `}</style>
      <Box className={animClass}>{children}</Box>
    </>
  );
}

export default function EventModal({
  open,
  onClose,
  event = null,
  characters = [],
  allEvents = [],
  eventConnections = [],
  nextOrderIndex = 1,
  onSave,
  onNavigateToEvent,
  loading = false,
}) {
  const { currentThemeConfig } = useLoreTheme();
  const tagColorPalette = currentThemeConfig.palette.tagColors || [
    '#8c6d53',
    '#607d8b',
    '#558b2f',
    '#ad1457',
    '#e65100',
    '#4e342e',
  ];

  const [title, setTitle] = useState('');
  const [summary, setSummary] = useState('');
  const [details, setDetails] = useState('');
  const [orderIndex, setOrderIndex] = useState(nextOrderIndex);
  const [importanceLevel, setImportanceLevel] = useState('medium');
  const [colorTag, setColorTag] = useState(tagColorPalette[0]);
  const [selectedCharacterIds, setSelectedCharacterIds] = useState([]);
  const [createBackup, setCreateBackup] = useState(true);
  const [backupNote, setBackupNote] = useState('');

  // Progressive disclosure toggle
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Navigation slide tracking
  const [slideKey, setSlideKey] = useState('init');
  const [slideDirection, setSlideDirection] = useState('next');

  // Compute sequence rank / order index for each node based on DAG connections (matches TimelineCanvas and SidebarLore)
  const computedOrderMap = useEventOrder(allEvents, eventConnections);

  const currentCalculatedNumber = useMemo(() => {
    if (event && computedOrderMap && computedOrderMap.has(event.id)) {
      return computedOrderMap.get(event.id);
    }
    if (event && allEvents && allEvents.length > 0) {
      const idx = allEvents.findIndex((e) => e.id === event.id);
      if (idx !== -1) return idx + 1;
    }
    return Math.round(orderIndex || 1);
  }, [event, computedOrderMap, allEvents, orderIndex]);

  // Compute connected events from eventConnections
  const connectedEvents = useMemo(() => {
    if (!event || !allEvents.length || !eventConnections.length) return [];
    const result = [];
    for (const conn of eventConnections) {
      if (conn.source_event_id === event.id) {
        const targetEv = allEvents.find((e) => e.id === conn.target_event_id);
        if (targetEv) result.push({ direction: 'next', event: targetEv });
      } else if (conn.target_event_id === event.id) {
        const sourceEv = allEvents.find((e) => e.id === conn.source_event_id);
        if (sourceEv) result.push({ direction: 'prev', event: sourceEv });
      }
    }
    return result;
  }, [event, allEvents, eventConnections]);

  const handleNavigate = useCallback((targetEvent, direction) => {
    if (!targetEvent) return;
    const dir = direction === 'next' ? 'next' : 'prev';
    setSlideDirection(dir);
    setSlideKey(`${targetEvent.id}-${Date.now()}`);

    // Update form state immediately so the new event is already rendered inside the sliding container!
    setTitle(targetEvent.title || '');
    setSummary(targetEvent.summary || '');
    setDetails(targetEvent.details || '');
    setOrderIndex(targetEvent.order_index ?? nextOrderIndex);
    setImportanceLevel(targetEvent.importance_level || 'medium');
    setColorTag(targetEvent.color_tag || tagColorPalette[0]);
    const charIds = targetEvent.event_characters?.map(
      (ec) => ec.character?.id || ec.character_id
    ) || [];
    setSelectedCharacterIds(charIds.filter(Boolean));
    setCreateBackup(true);
    setBackupNote('');
    if (charIds.length > 0 || targetEvent.details) {
      setShowAdvanced(true);
    }

    if (onNavigateToEvent) {
      onNavigateToEvent(targetEvent);
    }
  }, [onNavigateToEvent, nextOrderIndex, tagColorPalette]);

  const firstNext = connectedEvents.find((c) => c.direction === 'next')?.event;
  const firstPrev = connectedEvents.find((c) => c.direction === 'prev')?.event;

  const { handleTouchStart, handleTouchEnd } = useSwipeNavigation({
    enabled: connectedEvents.length > 0,
    onSwipeLeft: firstNext ? () => handleNavigate(firstNext, 'next') : undefined,
    onSwipeRight: firstPrev ? () => handleNavigate(firstPrev, 'prev') : undefined,
  });

  useEffect(() => {
    if (event) {
      setTitle(event.title || '');
      setSummary(event.summary || '');
      setDetails(event.details || '');
      setOrderIndex(event.order_index ?? nextOrderIndex);
      setImportanceLevel(event.importance_level || 'medium');
      setColorTag(event.color_tag || tagColorPalette[0]);
      
      const charIds = event.event_characters?.map(
        (ec) => ec.character?.id || ec.character_id
      ) || [];
      setSelectedCharacterIds(charIds.filter(Boolean));
      setCreateBackup(true);
      setBackupNote('');

      // If event already has deep details or assigned characters, open advanced by default
      if (charIds.length > 0 || event.details) {
        setShowAdvanced(true);
      } else {
        setShowAdvanced(false);
      }
    } else {
      setTitle('');
      setSummary('');
      setDetails('');
      setOrderIndex(nextOrderIndex);
      setImportanceLevel('medium');
      setColorTag(tagColorPalette[0]);
      setSelectedCharacterIds([]);
      setCreateBackup(false);
      setBackupNote('');
      setShowAdvanced(false);
    }
  }, [event, open, nextOrderIndex]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim()) return;

    await onSave({
      eventData: {
        title: title.trim().substring(0, APP_CONFIG.EVENT_TITLE_MAX_LENGTH),
        summary: summary.trim(),
        details: details.trim(),
        order_index: event?.order_index || 1.0,
        importance_level: importanceLevel,
        color_tag: colorTag,
      },
      characterIds: selectedCharacterIds,
      createBackup: Boolean(event && createBackup),
      backupNote: backupNote.trim() || 'Copia previa a modificación',
    });
  };

  const handleCharacterChange = (e) => {
    const {
      target: { value },
    } = e;
    setSelectedCharacterIds(typeof value === 'string' ? value.split(',') : value);
  };

  const isEditing = Boolean(event);

  return (
    <CustomModal
      open={open}
      onClose={onClose}
      title={isEditing ? 'Editar Evento' : 'Nuevo Evento'}
      subtitle={isEditing ? `Secuencia #${currentCalculatedNumber} en la línea temporal` : 'Estructura la secuencia narrativa'}
      icon={
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: { xs: 32, sm: 38 },
            height: { xs: 32, sm: 38 },
            borderRadius: 2,
            bgcolor: colorTag || 'primary.main',
            color: '#fff',
            flexShrink: 0,
            fontSize: { xs: '0.88rem', sm: '1.05rem' },
            fontWeight: 800,
            boxShadow: (theme) => `0 2px 8px ${alpha(colorTag || theme.palette.primary.main, 0.4)}`,
            transition: 'background-color 0.2s ease',
          }}
        >
          {currentCalculatedNumber}
        </Box>
      }
      maxWidth="sm"
      headerActions={
        isEditing && connectedEvents.length > 0 ? (
          <HeaderConnectionNav
            connectedEvents={connectedEvents}
            computedOrderMap={computedOrderMap}
            allEvents={allEvents}
            onNavigate={handleNavigate}
          />
        ) : null
      }
    >
      <Box onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}>
        <SlideContainer slideKey={slideKey} direction={slideDirection}>
          <Box component="form" onSubmit={handleSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {/* ─── 1. TÍTULO DEL EVENTO (Input Principal Destacado) ─── */}
            <Box>
              <TextField
                label="Título del Evento *"
            placeholder="Ej: La emboscada en el muelle, La revelación del pacto..."
            value={title}
            onChange={(e) => setTitle(e.target.value.substring(0, APP_CONFIG.EVENT_TITLE_MAX_LENGTH))}
            required
            fullWidth
            autoFocus
            InputProps={{
              sx: { fontSize: '1.05rem', fontWeight: 700, borderRadius: 2.5 },
            }}
            helperText={`${title.length}/${APP_CONFIG.EVENT_TITLE_MAX_LENGTH} caracteres`}
              />
            </Box>

            {/* ─── 2. RELEVANCIA Y COLOR DISTINTIVO ─── */}
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} sm={6}>
            <TextField
              select
              label="Nivel de Relevancia"
              value={importanceLevel}
              onChange={(e) => setImportanceLevel(e.target.value)}
              fullWidth
              size="small"
              InputProps={{ sx: { borderRadius: 2 } }}
            >
              {EVENT_IMPORTANCE.map((imp) => (
                <MenuItem key={imp.value} value={imp.value}>
                  {imp.label}
                </MenuItem>
              ))}
            </TextField>
          </Grid>

          <Grid item xs={12} sm={6}>
            <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', flexWrap: 'wrap' }}>
              <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, fontSize: '0.72rem' }}>
                Color:
              </Typography>
              {tagColorPalette.map((color) => {
                const isSelected = colorTag === color;
                return (
                  <Box
                    key={color}
                    onClick={() => setColorTag(color)}
                    sx={{
                      width: 24,
                      height: 24,
                      borderRadius: '50%',
                      bgcolor: color,
                      cursor: 'pointer',
                      border: isSelected ? '2.5px solid #222' : '1px solid rgba(0,0,0,0.15)',
                      transform: isSelected ? 'scale(1.2)' : 'scale(1)',
                      transition: 'transform 0.12s ease',
                      '&:hover': { transform: 'scale(1.2)' },
                    }}
                  />
                );
              })}
            </Box>
              </Grid>
            </Grid>

            {/* ─── 3. RESUMEN BREVE DEL SUCESO (Básico) ─── */}
            <TextField
              label="Resumen Breve del Suceso"
              placeholder="Síntesis de lo que ocurre en este hito de la historia…"
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              multiline
              fullWidth
               InputProps={{
                sx: { 
                  borderRadius: 2, 
                  fontSize: '0.88rem',
                  '& textarea': {
                    maxHeight: '14em', // ~6 líneas
                    overflowY: 'auto !important'
                  }
                }
              }}
            />

            {/* ─── 4. TOGGLE MÁS OPCIONES (Colapsable) ─── */}
            <Box sx={{ pt: 0.5 }}>
          <Button
            variant="text"
            size="small"
            onClick={() => setShowAdvanced(!showAdvanced)}
            startIcon={showAdvanced ? <ExpandLessIcon /> : <TuneIcon />}
            sx={{
              textTransform: 'none',
              fontWeight: 700,
              fontSize: '0.82rem',
              color: 'primary.main',
              px: 1,
            }}
          >
            {showAdvanced ? 'Ocultar opciones avanzadas' : 'Más opciones (Personajes, Lore profundo, Respaldo…)'}
          </Button>
            </Box>

            <Collapse in={showAdvanced} timeout="auto" unmountOnExit>
          <Box
            sx={{
              p: 2,
              mt: 0.5,
              borderRadius: 2.5,
              bgcolor: 'background.subtle',
              border: 1,
              borderColor: 'divider',
              display: 'flex',
              flexDirection: 'column',
              gap: 2,
            }}
          >
            {/* Multi-select characters */}
            <FormControl fullWidth size="small">
              <InputLabel id="event-characters-label">Personajes Involucrados</InputLabel>
              <Select
                labelId="event-characters-label"
                multiple
                value={selectedCharacterIds}
                onChange={handleCharacterChange}
                input={<OutlinedInput label="Personajes Involucrados" sx={{ borderRadius: 2 }} />}
                renderValue={(selected) => (
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {selected.map((charId) => {
                      const char = characters.find((c) => c.id === charId);
                      return (
                        <Chip
                          key={charId}
                          size="small"
                          avatar={<Avatar src={char?.avatar_url} sx={{ bgcolor: char?.color_tag }}>{char?.name?.charAt(0)}</Avatar>}
                          label={char ? char.name : charId}
                          sx={{ height: 22, fontSize: '0.72rem', fontWeight: 600 }}
                        />
                      );
                    })}
                  </Box>
                )}
              >
                {characters.map((char) => (
                  <MenuItem key={char.id} value={char.id}>
                    <Checkbox checked={selectedCharacterIds.indexOf(char.id) > -1} size="small" />
                    <Avatar
                      src={char.avatar_url}
                      sx={{ width: 24, height: 24, mr: 1, fontSize: '0.7rem', bgcolor: char.color_tag }}
                    >
                      {char.name?.charAt(0)}
                    </Avatar>
                    <ListItemText primary={char.name} secondary={char.role_archetype} />
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            {/* Lore profundo / Detalles extendidos */}
            <TextField
              label="Detalles Extendidos / Lore Profundo"
              placeholder="Consecuencias, diálogos clave, secretos revelados, notas privadas…"
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              multiline
              fullWidth
              size="small"
              InputProps={{
                sx: { 
                  borderRadius: 2, 
                  fontSize: '0.88rem',
                  '& textarea': {
                    maxHeight: '10.8em', // ~6 líneas
                    overflowY: 'auto !important'
                  }
                }
              }}
            />

            {/* Versioning / Backup options when editing */}
            {isEditing && (
              <Box sx={{ p: 1.5, bgcolor: 'background.paper', borderRadius: 2, border: 1, borderColor: 'divider' }}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={createBackup}
                      onChange={(e) => setCreateBackup(e.target.checked)}
                      color="primary"
                      size="small"
                    />
                  }
                  label={
                    <Typography variant="body2" sx={{ fontWeight: 700, fontSize: '0.84rem', display: 'flex', alignItems: 'center', gap: 0.6 }}>
                      <BookmarkBorderIcon sx={{ fontSize: 16 }} color="primary" /> Crear punto de respaldo previo
                    </Typography>
                  }
                />
                
                {createBackup && (
                  <TextField
                    label="Nota del respaldo (opcional)"
                    placeholder="Ej: Ajustando la motivación de la escena"
                    value={backupNote}
                    onChange={(e) => setBackupNote(e.target.value)}
                    size="small"
                    fullWidth
                    sx={{ mt: 1.2 }}
                  />
                )}
              </Box>
            )}
          </Box>
        </Collapse>

            <Divider sx={{ my: 0.5 }} />

            {/* Modal Actions */}
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1.5, mt: 1 }}>
          <CustomButton variant="outlined" color="inherit" onClick={onClose} disabled={loading}>
            Cancelar
          </CustomButton>
          <CustomButton type="submit" loading={loading}>
            {isEditing ? 'Guardar Cambios' : 'Crear Evento'}
          </CustomButton>
            </Box>
          </Box>
        </SlideContainer>
      </Box>
    </CustomModal>
  );
}
