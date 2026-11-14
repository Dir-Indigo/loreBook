import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Alert,
  Box,
  Checkbox,
  Chip,
  FormControlLabel,
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import BookmarkAddOutlinedIcon from '@mui/icons-material/BookmarkAddOutlined';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import { useManuscriptCore } from '../../context/ManuscriptContext';

const formatDate = (iso) => (
  iso
    ? new Date(iso).toLocaleString('es', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
    : ''
);

// Fila con icono de color y su contenido
function Row({ icon: Icon, color, title, children }) {
  return (
    <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'flex-start' }}>
      <Box
        sx={{
          flexShrink: 0,
          width: 32,
          height: 32,
          borderRadius: 2,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          bgcolor: (t) => alpha(t.palette[color].main, 0.12),
          color: `${color}.main`,
        }}
      >
        <Icon sx={{ fontSize: 19 }} />
      </Box>
      <Box sx={{ minWidth: 0 }}>
        <Typography variant="body2" sx={{ fontWeight: 800, lineHeight: 1.3, pt: 0.5 }}>{title}</Typography>
        {children}
      </Box>
    </Box>
  );
}

/**
 * Confirmación para crear una copia de seguridad cuando ya se alcanzó el máximo.
 * Se muestra solo si crear la copia va a eliminar otra (si hay cupo, la copia se guarda directo).
 */
export default function CommitModal({ open, onClose }) {
  const { versions, commitVersion, copiesToReplace, maxVersions, setSkipCopyConfirm } = useManuscriptCore();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [dontShowAgain, setDontShowAgain] = useState(false);

  // versions viene de la más nueva a la más antigua: las primeras se conservan, el resto se elimina
  const keepCount = Math.max(0, maxVersions - 1);
  const toKeep = (versions || []).slice(0, keepCount);
  const toDelete = (versions || []).slice(keepCount);
  const oldest = toDelete[toDelete.length - 1];
  const newestDeleted = toDelete[0];

  const handleConfirm = async () => {
    setLoading(true);
    setError(null);
    const result = await commitVersion('');
    setLoading(false);
    if (result.success) {
      if (dontShowAgain) setSkipCopyConfirm(true);
      onClose();
    } else {
      setError(result.error || 'No se pudo crear la copia de seguridad');
    }
  };

  return (
    <Dialog open={open} onClose={loading ? undefined : onClose} maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: 3, p: 0.5 } }}>
      <DialogTitle sx={{ pb: 0.5 }}>
        <Typography component="span" sx={{ display: 'block', fontWeight: 800, fontSize: '1.15rem' }}>
          Crear copia de seguridad
        </Typography>
        <Typography component="span" variant="body2" color="text.secondary" sx={{ display: 'block', fontWeight: 400, mt: 0.3 }}>
          Tu texto ya se guarda solo. Se conservan las {maxVersions} copias más recientes por capítulo.
        </Typography>
      </DialogTitle>

      <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
        <Row icon={BookmarkAddOutlinedIcon} color="primary" title="Nueva copia · ahora" />

        {toKeep.length > 0 && (
          <Row icon={CheckCircleOutlineIcon} color="success" title="Se conservan">
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.6, mt: 0.6 }}>
              {toKeep.map((v) => (
                <Chip key={v.id} size="small" label={formatDate(v.created_at)} sx={{ height: 22, fontSize: '0.72rem', fontWeight: 600 }} />
              ))}
            </Box>
          </Row>
        )}

        {toDelete.length > 0 && (
          <Row icon={DeleteOutlineIcon} color="error" title={toDelete.length === 1 ? 'Se elimina 1 copia antigua' : `Se eliminan ${toDelete.length} copias antiguas`}>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.4 }}>
              {toDelete.length === 1
                ? formatDate(oldest?.created_at)
                : `Desde ${formatDate(oldest?.created_at)} hasta ${formatDate(newestDeleted?.created_at)}`}
              {' · no se puede deshacer'}
            </Typography>
          </Row>
        )}

        <FormControlLabel
          control={<Checkbox size="small" checked={dontShowAgain} onChange={(e) => setDontShowAgain(e.target.checked)} />}
          label={<Typography variant="body2" color="text.secondary">No volver a mostrar este aviso</Typography>}
          sx={{ ml: -0.5 }}
        />

        {error && <Alert severity="error">{error}</Alert>}
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} color="inherit" disabled={loading}>
          Cancelar
        </Button>
        <Button
          onClick={handleConfirm}
          variant="contained"
          disabled={loading || copiesToReplace === 0}
          sx={{ fontWeight: 700, borderRadius: 2 }}
        >
          {loading ? 'Creando…' : 'Crear copia'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
