import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Chip,
  Divider,
  Paper,
} from '@mui/material';
import DifferenceIcon from '@mui/icons-material/Difference';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import { useManuscriptCore } from '../../context/ManuscriptContext';

export default function DiffViewerModal({ open, onClose }) {
  const {
    workingTitle,
    diffSummary,
    versions,
    setIsCommitModalOpen,
  } = useManuscriptCore();

  const lastVersion = versions?.[0] || null;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3,
          maxHeight: '85vh',
          display: 'flex',
          flexDirection: 'column',
        },
      }}
    >
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', pb: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <DifferenceIcon color="primary" />
          <Typography variant="h6" sx={{ fontWeight: 800 }}>
            Cambios desde la última versión
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Chip
            size="small"
            label={`+${diffSummary.addedLines} agregadas`}
            sx={{ bgcolor: 'custom.diff.addedBg', color: 'custom.diff.added', fontWeight: 700 }}
          />
          <Chip
            size="small"
            label={`-${diffSummary.removedLines} eliminadas`}
            sx={{ bgcolor: 'custom.diff.removedBg', color: 'custom.diff.removed', fontWeight: 700 }}
          />
        </Box>
      </DialogTitle>

      <Box sx={{ px: 3, pb: 1.5 }}>
        <Typography variant="caption" color="text.secondary">
          Comparando borrador de <strong>"{workingTitle}"</strong> contra la versión base:{' '}
          {lastVersion ? (
            <span>
              <strong>Versión #{lastVersion.version_number}</strong> ({lastVersion.commit_message})
            </span>
          ) : (
            'Sin versión previa'
          )}
        </Typography>
      </Box>

      <Divider />

      <DialogContent sx={{ p: 0, flexGrow: 1, overflowY: 'auto', bgcolor: 'background.default' }}>
        {diffSummary.isClean ? (
          <Box sx={{ p: 6, textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
            <CheckCircleOutlineIcon sx={{ fontSize: 48, color: 'success.main', opacity: 0.8 }} />
            <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
              El borrador está completamente al día
            </Typography>
            <Typography variant="body2" color="text.secondary">
              No hay líneas modificadas respecto al último commit guardado.
            </Typography>
          </Box>
        ) : (
          <Box
            component="pre"
            sx={{
              m: 0,
              p: 2,
              fontFamily: 'Consolas, Monaco, "Courier New", monospace',
              fontSize: '0.82rem',
              lineHeight: 1.5,
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
            }}
          >
            {diffSummary.diffChunks.map((chunk, idx) => {
              const isAdded = chunk.type === 'added';
              const isRemoved = chunk.type === 'removed';
              const prefix = isAdded ? '+ ' : isRemoved ? '- ' : '  ';

              const bg = isAdded
                ? 'custom.diff.addedBg'
                : isRemoved
                ? 'custom.diff.removedBg'
                : 'transparent';

              const color = isAdded
                ? 'custom.diff.added'
                : isRemoved
                ? 'custom.diff.removed'
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
                  }}
                >
                  <Typography
                    component="span"
                    sx={{
                      fontFamily: 'inherit',
                      fontSize: 'inherit',
                      fontWeight: isAdded || isRemoved ? 700 : 400,
                      userSelect: 'none',
                      width: 24,
                      flexShrink: 0,
                      opacity: 0.7,
                    }}
                  >
                    {prefix}
                  </Typography>
                  <Typography
                    component="span"
                    sx={{
                      fontFamily: 'inherit',
                      fontSize: 'inherit',
                      flexGrow: 1,
                      textDecoration: isRemoved ? 'line-through' : 'none',
                    }}
                  >
                    {chunk.text || ' '}
                  </Typography>
                </Box>
              );
            })}
          </Box>
        )}
      </DialogContent>

      <Divider />

      <DialogActions sx={{ p: 2, px: 3, justifyContent: 'space-between' }}>
        <Button onClick={onClose} color="inherit">
          Cerrar
        </Button>

        {!diffSummary.isClean && (
          <Button
            variant="contained"
            color="primary"
            onClick={() => {
              onClose();
              setIsCommitModalOpen(true);
            }}
            sx={{ fontWeight: 700, borderRadius: 2 }}
          >
            Guardar esta versión
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
}
