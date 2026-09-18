import React, { useState } from 'react';
import {
  Box,
  Typography,
  TextField,
  IconButton,
  Tooltip,
  Divider,
  List,
  ListItem,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import LocalOfferOutlinedIcon from '@mui/icons-material/LocalOfferOutlined';
import AddIcon from '@mui/icons-material/Add';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import CheckIcon from '@mui/icons-material/Check';
import CloseIcon from '@mui/icons-material/Close';
import CustomModal from '../common/CustomModal';
import CustomButton from '../common/CustomButton';

const TAG_PALETTE = [
  '#8c6d53', '#0284c7', '#16a34a', '#ea580c',
  '#7c3aed', '#be123c', '#0d9488', '#eab308',
  '#be185d', '#64748b', '#475569', '#334155',
];

export default function CharacterTagManagerModal({
  open,
  onClose,
  tags = [],
  characters = [],
  onCreateTag,
  onUpdateTag,
  onDeleteTag,
}) {
  const [newTagName, setNewTagName] = useState('');
  const [newTagColor, setNewTagColor] = useState(TAG_PALETTE[0]);
  const [editingTagId, setEditingTagId] = useState(null);
  const [editName, setEditName] = useState('');
  const [editColor, setEditColor] = useState('');

  // Confirmation state for deleting tag
  const [confirmDeleteTag, setConfirmDeleteTag] = useState(null);

  const handleCreate = async (e) => {
    e?.preventDefault();
    const trimmed = newTagName.trim();
    if (!trimmed) return;
    if (onCreateTag) {
      await onCreateTag({ name: trimmed, color: newTagColor });
      setNewTagName('');
      // Pick a different color for next tag
      const nextIdx = (TAG_PALETTE.indexOf(newTagColor) + 1) % TAG_PALETTE.length;
      setNewTagColor(TAG_PALETTE[nextIdx]);
    }
  };

  const handleStartEdit = (tag) => {
    setEditingTagId(tag.id);
    setEditName(tag.name);
    setEditColor(tag.color || TAG_PALETTE[0]);
  };

  const handleSaveEdit = async () => {
    const trimmed = editName.trim();
    if (!trimmed || !editingTagId) return;
    if (onUpdateTag) {
      await onUpdateTag(editingTagId, { name: trimmed, color: editColor });
    }
    setEditingTagId(null);
  };

  const handleConfirmDelete = async () => {
    if (!confirmDeleteTag) return;
    if (onDeleteTag) {
      await onDeleteTag(confirmDeleteTag.id);
    }
    setConfirmDeleteTag(null);
  };

  const getCharacterCountForTag = (tagId) => {
    return characters.filter((c) => Array.isArray(c.custom_tag_ids) && c.custom_tag_ids.includes(tagId)).length;
  };

  return (
    <>
      <CustomModal
        open={open}
        onClose={onClose}
        title="Gestor de Etiquetas Personalizadas"
        subtitle="Crea y personaliza etiquetas temáticas para clasificar a los personajes de tu historia"
        icon={LocalOfferOutlinedIcon}
        maxWidth="sm"
      >
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
          {/* Creator Form */}
          <Box
            component="form"
            onSubmit={handleCreate}
            sx={{
              p: 1.5,
              borderRadius: 2.5,
              bgcolor: 'background.subtle',
              border: 1,
              borderColor: 'divider',
              display: 'flex',
              flexDirection: 'column',
              gap: 1.2,
            }}
          >
            <Typography variant="caption" sx={{ fontWeight: 800, color: 'text.secondary', textTransform: 'uppercase', fontSize: '0.7rem' }}>
              Nueva Etiqueta
            </Typography>

            <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
              <TextField
                placeholder="Nombre de la etiqueta (ej: Nobleza, Mago, Gremio, Traidor...)"
                value={newTagName}
                onChange={(e) => setNewTagName(e.target.value)}
                size="small"
                fullWidth
                InputProps={{
                  sx: { borderRadius: 2, fontSize: '0.85rem' },
                }}
              />
              <CustomButton
                type="submit"
                variant="contained"
                size="small"
                disabled={!newTagName.trim()}
                startIcon={<AddIcon fontSize="small" />}
                sx={{ flexShrink: 0, py: 0.8, borderRadius: 2 }}
              >
                Crear
              </CustomButton>
            </Box>

            {/* Color Palette Selector for New Tag */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8, flexWrap: 'wrap', pt: 0.2 }}>
              <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.72rem', fontWeight: 600 }}>
                Color:
              </Typography>
              {TAG_PALETTE.map((c) => (
                <Box
                  key={c}
                  onClick={() => setNewTagColor(c)}
                  sx={{
                    width: 20,
                    height: 20,
                    borderRadius: '50%',
                    bgcolor: c,
                    cursor: 'pointer',
                    border: newTagColor === c ? '2px solid white' : '1px solid rgba(0,0,0,0.15)',
                    boxShadow: newTagColor === c ? `0 0 0 2px ${c}` : 'none',
                    transform: newTagColor === c ? 'scale(1.2)' : 'scale(1)',
                    transition: 'all 0.12s ease',
                    '&:hover': { transform: 'scale(1.2)' },
                  }}
                />
              ))}
            </Box>
          </Box>

          <Divider />

          {/* Existing Tags List */}
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="caption" sx={{ fontWeight: 800, color: 'text.secondary', textTransform: 'uppercase', fontSize: '0.7rem' }}>
                Etiquetas Existentes ({tags.length})
              </Typography>
            </Box>

            {tags.length === 0 ? (
              <Box sx={{ textAlign: 'center', py: 3, px: 2, bgcolor: 'background.paper', borderRadius: 2, border: '1px dashed', borderColor: 'divider' }}>
                <LocalOfferOutlinedIcon sx={{ fontSize: 28, color: 'text.disabled', mb: 0.5 }} />
                <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.8rem' }}>
                  Aún no has creado etiquetas personalizadas para esta historia.
                </Typography>
              </Box>
            ) : (
              <List dense sx={{ maxHeight: 260, overflowY: 'auto', p: 0 }}>
                {tags.map((tag) => {
                  const isEditing = editingTagId === tag.id;
                  const count = getCharacterCountForTag(tag.id);

                  return (
                    <ListItem
                      key={tag.id}
                      sx={{
                        p: 1,
                        mb: 0.8,
                        borderRadius: 2,
                        bgcolor: 'background.paper',
                        border: 1,
                        borderColor: isEditing ? 'primary.main' : 'divider',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: 1,
                      }}
                    >
                      {isEditing ? (
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.8, width: '100%' }}>
                          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                            <TextField
                              value={editName}
                              onChange={(e) => setEditName(e.target.value)}
                              size="small"
                              fullWidth
                              autoFocus
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') handleSaveEdit();
                                if (e.key === 'Escape') setEditingTagId(null);
                              }}
                              InputProps={{
                                sx: { borderRadius: 1.5, fontSize: '0.82rem', height: 32 },
                              }}
                            />
                            <IconButton size="small" onClick={handleSaveEdit} color="primary" sx={{ p: 0.4 }}>
                              <CheckIcon fontSize="small" />
                            </IconButton>
                            <IconButton size="small" onClick={() => setEditingTagId(null)} sx={{ p: 0.4 }}>
                              <CloseIcon fontSize="small" />
                            </IconButton>
                          </Box>
                          <Box sx={{ display: 'flex', gap: 0.6, flexWrap: 'wrap' }}>
                            {TAG_PALETTE.map((c) => (
                              <Box
                                key={c}
                                onClick={() => setEditColor(c)}
                                sx={{
                                  width: 16,
                                  height: 16,
                                  borderRadius: '50%',
                                  bgcolor: c,
                                  cursor: 'pointer',
                                  border: editColor === c ? '2px solid white' : '1px solid rgba(0,0,0,0.15)',
                                  boxShadow: editColor === c ? `0 0 0 2px ${c}` : 'none',
                                }}
                              />
                            ))}
                          </Box>
                        </Box>
                      ) : (
                        <>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Box
                              sx={{
                                width: 12,
                                height: 12,
                                borderRadius: '50%',
                                bgcolor: tag.color || '#8c6d53',
                                flexShrink: 0,
                              }}
                            />
                            <Typography variant="body2" sx={{ fontWeight: 700, fontSize: '0.85rem' }}>
                              {tag.name}
                            </Typography>
                            <Chip
                              label={`${count} personaje${count === 1 ? '' : 's'}`}
                              size="small"
                              sx={{ height: 20, fontSize: '0.65rem', fontWeight: 600, bgcolor: 'background.subtle' }}
                            />
                          </Box>

                          <Box sx={{ display: 'flex', gap: 0.5 }}>
                            <Tooltip title="Editar etiqueta">
                              <IconButton size="small" onClick={() => handleStartEdit(tag)} sx={{ p: 0.4 }}>
                                <EditOutlinedIcon sx={{ fontSize: 16 }} />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Eliminar etiqueta">
                              <IconButton
                                size="small"
                                onClick={() => setConfirmDeleteTag(tag)}
                                sx={{ p: 0.4, color: 'error.main' }}
                              >
                                <DeleteOutlineIcon sx={{ fontSize: 16 }} />
                              </IconButton>
                            </Tooltip>
                          </Box>
                        </>
                      )}
                    </ListItem>
                  );
                })}
              </List>
            )}
          </Box>

          <Divider />

          <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
            <CustomButton onClick={onClose} variant="contained">
              Listo
            </CustomButton>
          </Box>
        </Box>
      </CustomModal>

      {/* Confirmation Dialog for Deleting Tag */}
      <Dialog
        open={Boolean(confirmDeleteTag)}
        onClose={() => setConfirmDeleteTag(null)}
        maxWidth="xs"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3, p: 1 } }}
      >
        <DialogTitle sx={{ fontWeight: 700, fontSize: '1rem' }}>
          Eliminar Etiqueta
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary">
            ¿Estás seguro de que deseas eliminar la etiqueta <strong>{confirmDeleteTag?.name}</strong>? Se desvinculará de los personajes que la tengan asignada.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <CustomButton variant="outlined" color="inherit" onClick={() => setConfirmDeleteTag(null)}>
            Cancelar
          </CustomButton>
          <CustomButton color="error" onClick={handleConfirmDelete}>
            Eliminar
          </CustomButton>
        </DialogActions>
      </Dialog>
    </>
  );
}
