import React, { useState } from 'react';
import {
  Drawer,
  Box,
  Typography,
  Divider,
  List,
  ListItem,
  Chip,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import CommitIcon from '@mui/icons-material/Commit';
import HistoryIcon from '@mui/icons-material/History';
import RestoreIcon from '@mui/icons-material/Restore';
import DifferenceIcon from '@mui/icons-material/Difference';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import { useManuscriptCore } from '../../context/ManuscriptContext';
import IconAction from '../common/IconAction';

export default function VersionHistoryDrawer({ open, onClose }) {
  const {
    activeChapter,
    versions,
    versionsLoading,
    restoreVersion,
    setIsDiffModalOpen,
  } = useManuscriptCore();

  const [confirmVersionToRestore, setConfirmVersionToRestore] = useState(null);
  const [restoring, setRestoring] = useState(false);

  const handleConfirmRestore = async () => {
    if (!confirmVersionToRestore) return;
    setRestoring(true);
    await restoreVersion(confirmVersionToRestore);
    setRestoring(false);
    setConfirmVersionToRestore(null);
    onClose();
  };

  const formatDate = (isoStr) => {
    if (!isoStr) return '';
    const date = new Date(isoStr);
    return date.toLocaleDateString(undefined, {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <>
      <Drawer
        anchor="right"
        open={open}
        onClose={onClose}
        PaperProps={{
          sx: {
            width: { xs: '100%', sm: 420 },
            display: 'flex',
            flexDirection: 'column',
          },
        }}
      >
        {/* Drawer Header */}
        <Box sx={{ p: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: 1, borderColor: 'divider' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <HistoryIcon color="primary" />
            <Box>
              <Typography variant="subtitle1" sx={{ fontWeight: 800, lineHeight: 1.2 }}>
                Historial de Versiones
              </Typography>
              <Typography variant="caption" color="text.secondary" noWrap>
                {activeChapter?.title || 'Capítulo'}
              </Typography>
            </Box>
          </Box>
          <IconAction label="Cerrar historial" size="small" onClick={onClose}>
            <CloseIcon fontSize="small" />
          </IconAction>
        </Box>

        {/* Content list */}
        <Box sx={{ flexGrow: 1, overflowY: 'auto', p: 2 }}>
          {versionsLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
              <CircularProgress size={32} />
            </Box>
          ) : versions.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 8 }}>
              <CommitIcon sx={{ fontSize: 48, opacity: 0.3, mb: 1 }} />
              <Typography variant="body2" color="text.secondary">
                Aún no hay versiones guardadas en este capítulo.
              </Typography>
            </Box>
          ) : (
            <List disablePadding sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
              {versions.map((v, index) => {
                const isLatest = index === 0;
                return (
                  <ListItem
                    key={v.id}
                    disableGutters
                    sx={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'stretch',
                      p: 1.8,
                      borderRadius: 2.5,
                      border: 1,
                      borderColor: isLatest ? 'primary.main' : 'divider',
                      bgcolor: isLatest ? 'action.selected' : 'background.paper',
                      boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.8 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8 }}>
                        <Chip
                          size="small"
                          label={`v#${v.version_number}`}
                          color={isLatest ? 'primary' : 'default'}
                          sx={{ fontWeight: 800, height: 22, fontSize: '0.72rem' }}
                        />
                        {isLatest && (
                          <Chip
                            size="small"
                            label="Versión actual"
                            color="success"
                            variant="outlined"
                            sx={{ fontWeight: 700, height: 20, fontSize: '0.65rem' }}
                          />
                        )}
                      </Box>

                      <Typography variant="caption" sx={{ color: 'text.secondary', display: 'flex', alignItems: 'center', gap: 0.4 }}>
                        <AccessTimeIcon sx={{ fontSize: 13 }} />
                        {formatDate(v.created_at)}
                      </Typography>
                    </Box>

                    {/* Commit message */}
                    <Typography variant="body2" sx={{ fontWeight: 700, mb: 1, wordBreak: 'break-word' }}>
                      {v.commit_message}
                    </Typography>

                    {/* Stats & Actions */}
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mt: 0.5 }}>
                      <Typography variant="caption" color="text.secondary">
                        {v.word_count || 0} palabras
                      </Typography>

                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8 }}>
                        {!isLatest && (
                          <Button
                            size="small"
                            variant="outlined"
                            color="warning"
                            startIcon={<RestoreIcon sx={{ fontSize: 14 }} />}
                            onClick={() => setConfirmVersionToRestore(v)}
                            sx={{ fontSize: '0.7rem', py: 0.2, px: 0.8, textTransform: 'none', borderRadius: 1.5 }}
                          >
                            Restaurar
                          </Button>
                        )}
                      </Box>
                    </Box>
                  </ListItem>
                );
              })}
            </List>
          )}
        </Box>
      </Drawer>

      {/* Confirmation Dialog to Restore */}
      <Dialog
        open={Boolean(confirmVersionToRestore)}
        onClose={() => setConfirmVersionToRestore(null)}
        maxWidth="xs"
        PaperProps={{ sx: { borderRadius: 3, p: 1 } }}
      >
        <DialogTitle sx={{ fontWeight: 800 }}>¿Restaurar a esta versión?</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary">
            Se reemplazará el texto actual del capítulo por el snapshot de la{' '}
            <strong>Versión #{confirmVersionToRestore?.version_number}</strong> ({confirmVersionToRestore?.commit_message}).
          </Typography>
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
            Lorebook creará automáticamente un nuevo punto de control registrando esta restauración para que nunca pierdas nada.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setConfirmVersionToRestore(null)} color="inherit" disabled={restoring}>
            Cancelar
          </Button>
          <Button
            onClick={handleConfirmRestore}
            variant="contained"
            color="warning"
            disabled={restoring}
            sx={{ fontWeight: 700, borderRadius: 2 }}
          >
            {restoring ? 'Restaurando...' : 'Sí, Restaurar'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
