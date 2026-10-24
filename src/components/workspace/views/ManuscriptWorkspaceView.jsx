import React, { useState, useCallback, useRef } from 'react';
import {
  Box,
  Typography,
  TextField,
  Button,
  IconButton,
  Chip,
  Tooltip,
  Divider,
  Paper,
  Container,
  Select,
  MenuItem,
  FormControl,
  Collapse,
} from '@mui/material';
import AutoStoriesIcon from '@mui/icons-material/AutoStories';
import AddIcon from '@mui/icons-material/Add';
import CommitIcon from '@mui/icons-material/Commit';
import HistoryIcon from '@mui/icons-material/History';
import DifferenceIcon from '@mui/icons-material/Difference';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import EditNoteIcon from '@mui/icons-material/EditNote';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import CloudDoneOutlinedIcon from '@mui/icons-material/CloudDoneOutlined';
import RateReviewOutlinedIcon from '@mui/icons-material/RateReviewOutlined';

import { useManuscript } from '../../../context/ManuscriptContext';
import CommitModal from '../../manuscript/CommitModal';
import DiffViewerModal from '../../manuscript/DiffViewerModal';
import VersionHistoryDrawer from '../../manuscript/VersionHistoryDrawer';

// ── Componente de Diff estilo literario idéntico a DiffViewerModal ───────────
function ManuscriptDiffPanel({ diffSummary, versions }) {
  const lastVersion = versions?.[0] || null;

  if (diffSummary.isClean) {
    return (
      <Box
        sx={{
          py: 8,
          px: 2,
          textAlign: 'center',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 1.5,
          color: 'text.secondary',
        }}
      >
        <CheckCircleOutlineIcon sx={{ fontSize: 44, color: 'success.main', opacity: 0.85 }} />
        <Typography variant="subtitle2" sx={{ fontWeight: 700, color: 'text.primary' }}>
          El borrador está completamente al día
        </Typography>
        <Typography variant="caption" sx={{ maxWidth: 320 }}>
          No hay cambios pendientes respecto a la versión base:{' '}
          <strong>{lastVersion ? `v${lastVersion.version_number} (${lastVersion.commit_message})` : 'Sin versión previa'}</strong>.
        </Typography>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        fontFamily: 'Merriweather, Georgia, "Times New Roman", serif, -apple-system',
        fontSize: { xs: '1rem', sm: '1.08rem' },
        lineHeight: 1.85,
        letterSpacing: '0.005em',
        color: 'text.primary',
        whiteSpace: 'pre-wrap',
        wordBreak: 'break-word',
      }}
    >
      {diffSummary.diffChunks.map((chunk, idx) => {
        const isAdded = chunk.type === 'added';
        const isRemoved = chunk.type === 'removed';
        const isEmpty = !chunk.text || chunk.text.trim() === '';

        // Si la línea está vacía, no saturar con cajas rojas/verdes gigantes
        if (isEmpty) {
          if (isRemoved) return null; // saltar líneas eliminadas vacías para evitar cajas rojas fantasma
          return <Box key={idx} sx={{ height: '1.4em' }} />;
        }

        const prefix = isAdded ? '+' : isRemoved ? '−' : ' ';

        const bg = isAdded
          ? 'rgba(46, 160, 67, 0.12)'
          : isRemoved
          ? 'rgba(248, 81, 73, 0.12)'
          : 'transparent';

        const color = isAdded
          ? '#2ea043'
          : isRemoved
          ? '#da3633'
          : 'text.primary';

        return (
          <Box
            key={idx}
            sx={{
              bgcolor: bg,
              color: color,
              px: 1,
              py: 0.2,
              borderRadius: 0.5,
              display: 'flex',
              alignItems: 'flex-start',
              gap: 1,
              my: 0.2,
              borderLeft: isAdded ? '3px solid #2ea043' : isRemoved ? '3px solid #da3633' : '3px solid transparent',
            }}
          >
            <Typography
              component="span"
              sx={{
                fontFamily: 'inherit',
                fontSize: '0.85rem',
                fontWeight: 700,
                userSelect: 'none',
                width: 14,
                flexShrink: 0,
                opacity: 0.6,
                lineHeight: 1.85,
              }}
            >
              {prefix}
            </Typography>
            <Typography
              component="span"
              sx={{
                fontFamily: 'inherit',
                fontSize: 'inherit',
                lineHeight: 'inherit',
                flexGrow: 1,
                fontWeight: 400,
                textDecoration: isRemoved ? 'line-through' : 'none',
              }}
            >
              {chunk.text}
            </Typography>
          </Box>
        );
      })}
    </Box>
  );
}

// ── Vista Principal ──────────────────────────────────────────────────────────
export default function ManuscriptWorkspaceView() {
  const {
    chapters,
    activeChapter,
    activeChapterId,
    workingTitle,
    setWorkingTitle,
    workingDraft,
    setWorkingDraft,
    workingSummary,
    setWorkingSummary,
    workingStatus,
    setWorkingStatus,
    diffSummary,
    wordDiff,
    lastCommittedContent,
    isDirty,
    wordCount,
    totalManuscriptWords,
    versions,
    createChapter,
    isCommitModalOpen,
    setIsCommitModalOpen,
    isHistoryDrawerOpen,
    setIsHistoryDrawerOpen,
    isDiffModalOpen,
    setIsDiffModalOpen,
    reviewMode,
    setReviewMode,
  } = useManuscript();

  const [showSummary, setShowSummary] = useState(false);

  // Scroll sincronizado proporcional para la vista dividida
  const syncTopRef = useRef(null);
  const syncBottomRef = useRef(null);
  const isSyncing = useRef(false);

  const handleSyncTop = useCallback(() => {
    if (isSyncing.current || !syncTopRef.current || !syncBottomRef.current) return;
    isSyncing.current = true;
    const topEl = syncTopRef.current;
    const bottomEl = syncBottomRef.current;
    const topMax = topEl.scrollHeight - topEl.clientHeight;
    const bottomMax = bottomEl.scrollHeight - bottomEl.clientHeight;
    if (topMax > 0 && bottomMax > 0) {
      const ratio = topEl.scrollTop / topMax;
      bottomEl.scrollTop = ratio * bottomMax;
    } else {
      bottomEl.scrollTop = topEl.scrollTop;
    }
    requestAnimationFrame(() => {
      isSyncing.current = false;
    });
  }, []);

  const handleSyncBottom = useCallback(() => {
    if (isSyncing.current || !syncTopRef.current || !syncBottomRef.current) return;
    isSyncing.current = true;
    const topEl = syncTopRef.current;
    const bottomEl = syncBottomRef.current;
    const topMax = topEl.scrollHeight - topEl.clientHeight;
    const bottomMax = bottomEl.scrollHeight - bottomEl.clientHeight;
    if (topMax > 0 && bottomMax > 0) {
      const ratio = bottomEl.scrollTop / bottomMax;
      topEl.scrollTop = ratio * topMax;
    } else {
      topEl.scrollTop = bottomEl.scrollTop;
    }
    requestAnimationFrame(() => {
      isSyncing.current = false;
    });
  }, []);

  // Si no hay capítulos en la historia
  if (!chapters.length) {
    return (
      <Box
        sx={{
          flexGrow: 1,
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          p: 4,
          textAlign: 'center',
          bgcolor: 'background.default',
        }}
      >
        <Box
          sx={{
            width: 72,
            height: 72,
            borderRadius: 4,
            bgcolor: 'primary.light',
            color: 'primary.main',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            mb: 2.5,
            boxShadow: '0 8px 24px rgba(0,0,0,0.08)',
          }}
        >
          <AutoStoriesIcon sx={{ fontSize: 38 }} />
        </Box>
        <Typography variant="h5" sx={{ fontWeight: 800, mb: 1 }}>
          Comienza a escribir tu Manuscrito
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 480, mb: 3 }}>
          Escribe por capítulos o escenas continuas. Lorebook registrará tus cambios en tiempo real y te permitirá
          crear puntos de control (commits) para ver qué has cambiado y restaurar versiones cuando quieras.
        </Typography>
        <Button
          variant="contained"
          color="primary"
          size="large"
          startIcon={<AddIcon />}
          onClick={() => createChapter('Capítulo 1')}
          sx={{ fontWeight: 700, borderRadius: 2.5, px: 3, py: 1 }}
        >
          Crear Primer Capítulo
        </Button>
      </Box>
    );
  }

  const latestVersion = versions?.[0];
  const reviewHasChanges = isDirty && wordDiff && wordDiff.some((t) => t.type !== 'same');

  return (
    <Box
      sx={{
        flexGrow: 1,
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        bgcolor: 'background.default',
        overflow: 'hidden',
      }}
    >
      {/* ── Banner informativo del Modo Revisión ────────────────────────────── */}
      <Collapse in={reviewMode}>
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            px: { xs: 2, sm: 3.5 },
            py: 0.6,
            bgcolor: 'rgba(46, 160, 67, 0.08)',
            borderBottom: '1px solid rgba(46, 160, 67, 0.22)',
          }}
        >
          <RateReviewOutlinedIcon sx={{ fontSize: 15, color: 'success.main' }} />
          <Typography variant="caption" sx={{ color: 'success.main', fontWeight: 800 }}>
            Modo Revisión Activo:
          </Typography>
          <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.75rem' }}>
            Escribe en el panel izquierdo y compara los cambios en tiempo real frente a la última versión guardada a la derecha.
          </Typography>
          <Button
            size="small"
            onClick={() => setReviewMode(false)}
            sx={{ ml: 'auto', fontSize: '0.7rem', textTransform: 'none', py: 0.1, px: 1, fontWeight: 700 }}
          >
            Cerrar
          </Button>
        </Box>
      </Collapse>

      {/* ── Lienzo Principal de Escritura ─────────────────────────────────── */}
      <Box
        sx={{
          flexGrow: 1,
          overflowY: reviewMode ? 'hidden' : 'auto',
          p: { xs: 1.5, sm: 3 },
          pb: reviewMode ? 2 : 10,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          minHeight: 0,
        }}
      >
        <Container
          maxWidth={reviewMode ? false : 'md'}
          disableGutters
          sx={{
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            flexGrow: reviewMode ? 1 : 1,
            minHeight: reviewMode ? 0 : 'fit-content',
            height: reviewMode ? '100%' : 'auto',
          }}
        >
          <Paper
            elevation={0}
            sx={{
              p: { xs: 2.5, sm: 5 },
              borderRadius: 3,
              border: 1,
              borderColor: 'divider',
              bgcolor: 'background.paper',
              boxShadow: '0 2px 16px rgba(0,0,0,0.04)',
              width: '100%',
              display: 'flex',
              flexDirection: 'column',
              flexGrow: reviewMode ? 1 : 1,
              minHeight: reviewMode ? 0 : 'calc(100vh - 180px)',
              height: reviewMode ? '100%' : 'auto',
              gap: 2,
              overflow: reviewMode ? 'hidden' : 'visible',
            }}
          >
            {/* Título del Capítulo (Estilo libro sin bordes duros) */}
            <TextField
              value={workingTitle}
              onChange={(e) => setWorkingTitle(e.target.value)}
              placeholder="Título del Capítulo..."
              variant="standard"
              fullWidth
              InputProps={{
                disableUnderline: true,
                sx: {
                  fontSize: { xs: '1.5rem', sm: '2rem' },
                  fontWeight: 900,
                  letterSpacing: '-0.02em',
                  color: 'text.primary',
                  lineHeight: 1.2,
                },
              }}
            />

            {/* Toggle de Sinopsis / Notas de Escena */}
            <Box>
              <Button
                size="small"
                onClick={() => setShowSummary((prev) => !prev)}
                endIcon={showSummary ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                startIcon={<EditNoteIcon sx={{ fontSize: 16 }} />}
                sx={{
                  color: 'text.secondary',
                  fontSize: '0.72rem',
                  textTransform: 'none',
                  fontWeight: 600,
                  p: 0,
                  '&:hover': { bgcolor: 'transparent', color: 'primary.main' },
                }}
              >
                {showSummary ? 'Ocultar sinopsis de capítulo' : 'Añadir o ver sinopsis / notas de trama'}
              </Button>

              <Collapse in={showSummary}>
                <Box sx={{ mt: 1, p: 1.5, borderRadius: 2, bgcolor: 'background.subtle', border: 1, borderColor: 'divider' }}>
                  <TextField
                    multiline
                    rows={2}
                    fullWidth
                    placeholder="Escribe un breve resumen de lo que ocurre en este capítulo..."
                    value={workingSummary}
                    onChange={(e) => setWorkingSummary(e.target.value)}
                    variant="standard"
                    InputProps={{
                      disableUnderline: true,
                      sx: { fontSize: '0.85rem' },
                    }}
                  />
                </Box>
              </Collapse>
            </Box>

            <Divider sx={{ my: 0.5 }} />

            {/* ── Área de texto ──────────────────────────────────────── */}
            {!reviewMode ? (
              /* Editor normal */
              <TextField
                multiline
                fullWidth
                minRows={18}
                value={workingDraft}
                onChange={(e) => setWorkingDraft(e.target.value)}
                placeholder="Comienza a escribir aquí tu historia en prosa continua... Cada palabra se guarda automáticamente y puedes guardar versiones cuando alcances un hito narrativo."
                variant="standard"
                InputProps={{
                  disableUnderline: true,
                  sx: {
                    fontSize: { xs: '1rem', sm: '1.08rem' },
                    lineHeight: 1.85,
                    letterSpacing: '0.005em',
                    fontFamily: 'Merriweather, Georgia, "Times New Roman", serif, -apple-system',
                    color: 'text.primary',
                    alignItems: 'flex-start',
                    p: 0,
                  },
                }}
                sx={{
                  flexGrow: 1,
                  '& .MuiInputBase-root': { p: 0 },
                  '& .MuiInputBase-input': { p: 0 },
                }}
              />
            ) : (
              /* Vista dividida comparativa por defecto en Modo Revisión */
              <Box
                sx={{
                  display: 'grid',
                  gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
                  gap: 0,
                  flexGrow: 1,
                  minHeight: 0,
                  overflow: 'hidden',
                }}
              >
                {/* Panel izquierdo: editor normal limpio (sin marcas verdes ni rojas) */}
                <Box
                  ref={syncTopRef}
                  onScroll={handleSyncTop}
                  sx={{
                    overflowY: 'auto',
                    pr: { xs: 0, md: 2.5 },
                    display: 'flex',
                    flexDirection: 'column',
                  }}
                >
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      mb: 1.5,
                      position: 'sticky',
                      top: 0,
                      bgcolor: 'background.paper',
                      zIndex: 2,
                      pb: 0.8,
                      borderBottom: '1px solid',
                      borderColor: 'divider',
                    }}
                  >
                    <Typography
                      variant="caption"
                      sx={{
                        fontWeight: 800,
                        color: 'text.secondary',
                        letterSpacing: '0.04em',
                        textTransform: 'uppercase',
                        fontSize: '0.68rem',
                      }}
                    >
                      Borrador actual (editable)
                    </Typography>
                    <Typography variant="caption" sx={{ color: 'text.disabled', fontSize: '0.68rem' }}>
                      {wordCount} palabras
                    </Typography>
                  </Box>

                  <TextField
                    multiline
                    fullWidth
                    value={workingDraft}
                    onChange={(e) => setWorkingDraft(e.target.value)}
                    placeholder="Comienza a escribir aquí tu historia..."
                    variant="standard"
                    InputProps={{
                      disableUnderline: true,
                      sx: {
                        fontSize: { xs: '1rem', sm: '1.08rem' },
                        lineHeight: 1.85,
                        letterSpacing: '0.005em',
                        fontWeight: 400,
                        fontFamily: 'Merriweather, Georgia, "Times New Roman", serif, -apple-system',
                        color: 'text.primary',
                        alignItems: 'flex-start',
                        p: 0,
                      },
                    }}
                    sx={{
                      flexGrow: 1,
                      '& .MuiInputBase-root': { p: 0 },
                      '& .MuiInputBase-input': { p: 0 },
                    }}
                  />
                </Box>

                {/* Separador vertical y Panel derecho: diff estilo Git idéntico a DiffViewerModal */}
                <Box
                  ref={syncBottomRef}
                  onScroll={handleSyncBottom}
                  sx={{
                    overflowY: 'auto',
                    pl: { xs: 0, md: 2.5 },
                    borderLeft: { xs: 'none', md: '1px solid' },
                    borderColor: 'divider',
                    display: 'flex',
                    flexDirection: 'column',
                  }}
                >
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      mb: 1.5,
                      position: 'sticky',
                      top: 0,
                      bgcolor: 'background.paper',
                      zIndex: 2,
                      pb: 0.8,
                      borderBottom: '1px solid',
                      borderColor: 'divider',
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8 }}>
                      <DifferenceIcon sx={{ fontSize: 16, color: 'primary.main' }} />
                      <Typography
                        variant="caption"
                        sx={{
                          fontWeight: 800,
                          color: 'text.primary',
                          letterSpacing: '0.04em',
                          textTransform: 'uppercase',
                          fontSize: '0.68rem',
                        }}
                      >
                        Comparación vs versión guardada
                      </Typography>
                    </Box>

                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.6 }}>
                      <Chip
                        size="small"
                        label={`+${diffSummary.addedLines} agregadas`}
                        sx={{
                          height: 20,
                          fontSize: '0.68rem',
                          bgcolor: 'rgba(46, 160, 67, 0.15)',
                          color: '#2ea043',
                          fontWeight: 700,
                        }}
                      />
                      <Chip
                        size="small"
                        label={`-${diffSummary.removedLines} eliminadas`}
                        sx={{
                          height: 20,
                          fontSize: '0.68rem',
                          bgcolor: 'rgba(248, 81, 73, 0.15)',
                          color: '#f85149',
                          fontWeight: 700,
                        }}
                      />
                    </Box>
                  </Box>

                  <ManuscriptDiffPanel diffSummary={diffSummary} versions={versions} />
                </Box>
              </Box>
            )}

            <Divider sx={{ mt: 'auto', pt: 2 }} />

            {/* Footer del Lienzo de Escritura */}
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                color: 'text.secondary',
                fontSize: '0.75rem',
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <Typography variant="caption" sx={{ fontWeight: 700 }}>
                  {wordCount} palabras en este capítulo
                </Typography>
                <span>·</span>
                <Typography variant="caption">
                  {totalManuscriptWords} palabras en la obra total
                </Typography>
              </Box>

              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.6 }}>
                <CloudDoneOutlinedIcon sx={{ fontSize: 15, color: 'text.secondary' }} />
                <Typography variant="caption">Autoguardado activo</Typography>
              </Box>
            </Box>
          </Paper>
        </Container>
      </Box>

      {/* ── Modales y Drawers de Versionado Git ────────────────────────────── */}
      <CommitModal open={isCommitModalOpen} onClose={() => setIsCommitModalOpen(false)} />
      <DiffViewerModal open={isDiffModalOpen} onClose={() => setIsDiffModalOpen(false)} />
      <VersionHistoryDrawer open={isHistoryDrawerOpen} onClose={() => setIsHistoryDrawerOpen(false)} />
    </Box>
  );
}
