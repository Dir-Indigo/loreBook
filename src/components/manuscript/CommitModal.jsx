import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Typography,
  Box,
  Chip,
  Alert,
} from '@mui/material';
import CommitIcon from '@mui/icons-material/Commit';
import { useManuscriptCore } from '../../context/ManuscriptContext';

export default function CommitModal({ open, onClose }) {
  const {
    activeChapter,
    workingTitle,
    diffSummary,
    wordCount,
    versions,
    commitVersion,
  } = useManuscriptCore();

  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const nextVersionNumber = (versions?.[0]?.version_number || 0) + 1;

  const handleCommit = async () => {
    if (!message.trim()) {
      setError('Por favor ingresa un mensaje descriptivo para este commit / versión.');
      return;
    }
    setLoading(true);
    setError(null);
    const result = await commitVersion(message.trim());
    setLoading(false);
    if (result.success) {
      setMessage('');
      onClose();
    } else {
      setError(result.error || 'No se pudo guardar la versión');
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3,
          p: 1,
        },
      }}
    >
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1, fontWeight: 800 }}>
        <CommitIcon color="primary" />
        Guardar Punto de Control — Versión #{nextVersionNumber}
      </DialogTitle>

      <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
        <Typography variant="body2" color="text.secondary">
          Guardarás un punto de control inmutable de <strong>"{workingTitle || activeChapter?.title}"</strong>.
          Podrás comparar cambios futuros o restaurar este punto en cualquier momento.
        </Typography>

        {/* Diff Stats Banner */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1.5,
            p: 1.5,
            borderRadius: 2,
            bgcolor: 'background.subtle',
            border: 1,
            borderColor: 'divider',
          }}
        >
          <Chip
            size="small"
            label={`+${diffSummary.addedLines} líneas`}
            sx={{ bgcolor: 'custom.diff.addedBg', color: 'custom.diff.added', fontWeight: 700 }}
          />
          <Chip
            size="small"
            label={`-${diffSummary.removedLines} líneas`}
            sx={{ bgcolor: 'custom.diff.removedBg', color: 'custom.diff.removed', fontWeight: 700 }}
          />
          <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>
            {wordCount} palabras en borrador
          </Typography>
        </Box>

        {error && <Alert severity="error">{error}</Alert>}

        <TextField
          autoFocus
          label="Nota de la Versión"
          placeholder="Ej: Reescribí el diálogo inicial y añadí la descripción del bosque..."
          multiline
          rows={3}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          fullWidth
          variant="outlined"
          helperText="Describe brevemente qué cambios o avances hiciste en este punto de tu historia."
        />
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} color="inherit" disabled={loading}>
          Cancelar
        </Button>
        <Button
          onClick={handleCommit}
          variant="contained"
          color="primary"
          startIcon={<CommitIcon />}
          disabled={loading || !message.trim()}
          sx={{ fontWeight: 700, borderRadius: 2 }}
        >
          {loading ? 'Guardando...' : `Guardar Versión #${nextVersionNumber}`}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
