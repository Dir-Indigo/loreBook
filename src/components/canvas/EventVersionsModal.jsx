import React from 'react';
import {
  Box,
  Typography,
  List,
  ListItem,
  ListItemText,
  Paper,
  Chip,
  Divider,
  CircularProgress,
} from '@mui/material';
import HistoryIcon from '@mui/icons-material/History';
import RestoreIcon from '@mui/icons-material/Restore';
import BookmarkIcon from '@mui/icons-material/Bookmark';
import CustomModal from '../common/CustomModal';
import CustomButton from '../common/CustomButton';

export default function EventVersionsModal({
  open,
  onClose,
  eventId,
  eventTitle,
  versions = [],
  onRestoreVersion,
  loading = false,
}) {
  return (
    <CustomModal
      open={open}
      onClose={onClose}
      title="Historial de Versiones del Evento"
      subtitle={`Copias de seguridad registradas para: "${eventTitle || ''}"`}
      icon={HistoryIcon}
      maxWidth="sm"
    >
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <Typography variant="body2" color="text.secondary">
          Puedes revisar los estados anteriores guardados y restaurar cualquier versión con un solo clic (RF-4.6).
        </Typography>

        {loading ? (
          <Box sx={{ p: 4, display: 'flex', justifyContent: 'center' }}>
            <CircularProgress size={32} />
          </Box>
        ) : versions.length === 0 ? (
          <Box sx={{ p: 4, textAlign: 'center', bgcolor: 'background.subtle', borderRadius: 2 }}>
            <HistoryIcon sx={{ fontSize: 36, color: 'text.disabled', mb: 1 }} />
            <Typography variant="body2" color="text.secondary">
              No hay versiones históricas adicionales registradas para este evento.
            </Typography>
          </Box>
        ) : (
          <List sx={{ p: 0, display: 'flex', flexDirection: 'column', gap: 1.5 }}>
            {versions.map((ver, idx) => {
              const snapshot = ver.snapshot_data || {};
              const isLatest = idx === 0;
              const dateStr = ver.created_at
                ? new Date(ver.created_at).toLocaleString()
                : 'Fecha no disponible';

              return (
                <Paper
                  key={ver.id}
                  elevation={0}
                  sx={{
                    p: 2,
                    border: 1,
                    borderColor: isLatest ? 'primary.main' : 'divider',
                    borderRadius: 2,
                    bgcolor: 'background.paper',
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Chip
                        icon={<BookmarkIcon fontSize="inherit" />}
                        label={`Versión ${ver.version_number}`}
                        size="small"
                        color={isLatest ? 'primary' : 'default'}
                        sx={{ fontWeight: 700 }}
                      />
                      <Typography variant="caption" color="text.secondary">
                        {dateStr}
                      </Typography>
                    </Box>

                    <CustomButton
                      size="small"
                      variant="outlined"
                      color="primary"
                      startIcon={<RestoreIcon fontSize="small" />}
                      onClick={() => onRestoreVersion(ver.id)}
                    >
                      Restaurar
                    </CustomButton>
                  </Box>

                  {ver.note && (
                    <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>
                      Nota: {ver.note}
                    </Typography>
                  )}

                  <Box sx={{ p: 1.2, bgcolor: 'background.subtle', borderRadius: 1.5, mt: 1 }}>
                    <Typography variant="caption" sx={{ fontWeight: 700, display: 'block' }}>
                      Título guardado: {snapshot.title || 'Sin título'}
                    </Typography>
                    {snapshot.summary && (
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.3 }}>
                        {snapshot.summary}
                      </Typography>
                    )}
                    <Typography variant="caption" color="text.disabled" sx={{ display: 'block', mt: 0.3 }}>
                      Orden Secuencial: #{snapshot.order_index} | Posición: ({Math.round(snapshot.pos_x || 0)}, {Math.round(snapshot.pos_y || 0)})
                    </Typography>
                  </Box>
                </Paper>
              );
            })}
          </List>
        )}

        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 1 }}>
          <CustomButton variant="outlined" color="inherit" onClick={onClose}>
            Cerrar
          </CustomButton>
        </Box>
      </Box>
    </CustomModal>
  );
}
