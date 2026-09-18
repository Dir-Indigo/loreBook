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
import PsychologyOutlinedIcon from '@mui/icons-material/PsychologyOutlined';
import AddIcon from '@mui/icons-material/Add';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import CheckIcon from '@mui/icons-material/Check';
import CloseIcon from '@mui/icons-material/Close';
import CustomModal from '../common/CustomModal';
import CustomButton from '../common/CustomButton';
import { CHARACTER_ARCHETYPES } from '../../constants/constants';

const ARCHETYPE_PALETTE = [
  '#0284c7', '#eab308', '#be123c', '#16a34a',
  '#ea580c', '#7c3aed', '#0d9488', '#be185d',
  '#854d0e', '#64748b', '#8c6d53', '#334155',
];

export default function CharacterArchetypeManagerModal({
  open,
  onClose,
  customArchetypes = [],
  characters = [],
  onCreateArchetype,
  onUpdateArchetype,
  onDeleteArchetype,
}) {
  const [newArchName, setNewArchName] = useState('');
  const [newArchColor, setNewArchColor] = useState(ARCHETYPE_PALETTE[0]);
  const [newArchDesc, setNewArchDesc] = useState('');

  const [editingArchId, setEditingArchId] = useState(null);
  const [editName, setEditName] = useState('');
  const [editColor, setEditColor] = useState('');
  const [editDesc, setEditDesc] = useState('');

  const [confirmDeleteArch, setConfirmDeleteArch] = useState(null);

  const handleCreate = async (e) => {
    e?.preventDefault();
    const trimmed = newArchName.trim();
    if (!trimmed) return;

    if (onCreateArchetype) {
      await onCreateArchetype({
        name: trimmed,
        color: newArchColor,
        description: newArchDesc.trim() || null,
      });
      setNewArchName('');
      setNewArchDesc('');
      const nextIdx = (ARCHETYPE_PALETTE.indexOf(newArchColor) + 1) % ARCHETYPE_PALETTE.length;
      setNewArchColor(ARCHETYPE_PALETTE[nextIdx]);
    }
  };

  const handleStartEdit = (arch) => {
    setEditingArchId(arch.id);
    setEditName(arch.name);
    setEditColor(arch.color || ARCHETYPE_PALETTE[0]);
    setEditDesc(arch.description || '');
  };

  const handleSaveEdit = async () => {
    const trimmed = editName.trim();
    if (!trimmed || !editingArchId) return;
    if (onUpdateArchetype) {
      await onUpdateArchetype(editingArchId, {
        name: trimmed,
        color: editColor,
        description: editDesc.trim() || null,
      });
    }
    setEditingArchId(null);
  };

  const handleConfirmDelete = async () => {
    if (!confirmDeleteArch) return;
    if (onDeleteArchetype) {
      await onDeleteArchetype(confirmDeleteArch.id);
    }
    setConfirmDeleteArch(null);
  };

  const getCharacterCountForArchetype = (archName) => {
    return characters.filter((c) => (c.role_archetype || '').toLowerCase() === archName.toLowerCase()).length;
  };

  return (
    <>
      <CustomModal
        open={open}
        onClose={onClose}
        title="Gestor de Arquetipos / Roles de Personaje"
        subtitle="Crea arquetipos narrativos propios para esta historia además de los arquetipos estándar"
        icon={PsychologyOutlinedIcon}
        maxWidth="sm"
      >
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
          {/* Form to create new custom archetype */}
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
              Nuevo Arquetipo Propio
            </Typography>

            <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
              <TextField
                placeholder="Nombre del arquetipo (ej: Guía Espiritual, Antagonista Principal, Compañero Fiel...)"
                value={newArchName}
                onChange={(e) => setNewArchName(e.target.value)}
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
                disabled={!newArchName.trim()}
                startIcon={<AddIcon fontSize="small" />}
                sx={{ flexShrink: 0, py: 0.8, borderRadius: 2 }}
              >
                Crear
              </CustomButton>
            </Box>

            <TextField
              placeholder="Descripción breve del rol o función narrativa (opcional)..."
              value={newArchDesc}
              onChange={(e) => setNewArchDesc(e.target.value)}
              size="small"
              fullWidth
              InputProps={{
                sx: { borderRadius: 1.5, fontSize: '0.78rem' },
              }}
            />

            {/* Color Palette */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8, flexWrap: 'wrap', pt: 0.2 }}>
              <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.72rem', fontWeight: 600 }}>
                Color identificador:
              </Typography>
              {ARCHETYPE_PALETTE.map((c) => (
                <Box
                  key={c}
                  onClick={() => setNewArchColor(c)}
                  sx={{
                    width: 20,
                    height: 20,
                    borderRadius: '50%',
                    bgcolor: c,
                    cursor: 'pointer',
                    border: newArchColor === c ? '2px solid white' : '1px solid rgba(0,0,0,0.15)',
                    boxShadow: newArchColor === c ? `0 0 0 2px ${c}` : 'none',
                    transform: newArchColor === c ? 'scale(1.2)' : 'scale(1)',
                    transition: 'all 0.12s ease',
                    '&:hover': { transform: 'scale(1.2)' },
                  }}
                />
              ))}
            </Box>
          </Box>

          <Divider />

          {/* List of Archetypes */}
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            <Typography variant="caption" sx={{ fontWeight: 800, color: 'text.secondary', textTransform: 'uppercase', fontSize: '0.7rem' }}>
              Arquetipos de esta Historia ({CHARACTER_ARCHETYPES.length + customArchetypes.length})
            </Typography>

            <List dense sx={{ maxHeight: 280, overflowY: 'auto', p: 0 }}>
              {/* Custom archetypes */}
              {customArchetypes.map((arch) => {
                const isEditing = editingArchId === arch.id;
                const count = getCharacterCountForArchetype(arch.name);

                return (
                  <ListItem
                    key={arch.id}
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
                            InputProps={{
                              sx: { borderRadius: 1.5, fontSize: '0.82rem', height: 32 },
                            }}
                          />
                          <IconButton size="small" onClick={handleSaveEdit} color="primary" sx={{ p: 0.4 }}>
                            <CheckIcon fontSize="small" />
                          </IconButton>
                          <IconButton size="small" onClick={() => setEditingArchId(null)} sx={{ p: 0.4 }}>
                            <CloseIcon fontSize="small" />
                          </IconButton>
                        </Box>
                        <TextField
                          placeholder="Descripción..."
                          value={editDesc}
                          onChange={(e) => setEditDesc(e.target.value)}
                          size="small"
                          fullWidth
                          InputProps={{
                            sx: { borderRadius: 1.5, fontSize: '0.75rem', height: 28 },
                          }}
                        />
                        <Box sx={{ display: 'flex', gap: 0.6, flexWrap: 'wrap' }}>
                          {ARCHETYPE_PALETTE.map((c) => (
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
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 0 }}>
                          <Box
                            sx={{
                              width: 12,
                              height: 12,
                              borderRadius: '50%',
                              bgcolor: arch.color || 'primary.main',
                              flexShrink: 0,
                            }}
                          />
                          <Box sx={{ minWidth: 0 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8 }}>
                              <Typography variant="body2" sx={{ fontWeight: 700, fontSize: '0.85rem' }} noWrap>
                                {arch.name}
                              </Typography>
                              <Chip
                                label="Personalizado"
                                size="small"
                                color="primary"
                                variant="outlined"
                                sx={{ height: 18, fontSize: '0.6rem', fontWeight: 700 }}
                              />
                            </Box>
                            {arch.description && (
                              <Typography variant="caption" color="text.secondary" noWrap sx={{ display: 'block' }}>
                                {arch.description}
                              </Typography>
                            )}
                          </Box>
                        </Box>

                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8, flexShrink: 0 }}>
                          <Chip
                            label={`${count} personaje${count === 1 ? '' : 's'}`}
                            size="small"
                            sx={{ height: 20, fontSize: '0.65rem', fontWeight: 600, bgcolor: 'background.subtle' }}
                          />
                          <Tooltip title="Editar arquetipo">
                            <IconButton size="small" onClick={() => handleStartEdit(arch)} sx={{ p: 0.4 }}>
                              <EditOutlinedIcon sx={{ fontSize: 16 }} />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Eliminar arquetipo">
                            <IconButton
                              size="small"
                              onClick={() => setConfirmDeleteArch(arch)}
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

              {/* Standard Archetypes */}
              {CHARACTER_ARCHETYPES.map((archName) => {
                const count = getCharacterCountForArchetype(archName);
                return (
                  <ListItem
                    key={archName}
                    sx={{
                      p: 1,
                      mb: 0.8,
                      borderRadius: 2,
                      bgcolor: 'background.subtle',
                      border: '1px solid rgba(0,0,0,0.06)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      opacity: 0.88,
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: 'text.disabled' }} />
                      <Typography variant="body2" sx={{ fontWeight: 600, fontSize: '0.82rem' }}>
                        {archName}
                      </Typography>
                      <Chip
                        label="Estándar"
                        size="small"
                        sx={{ height: 18, fontSize: '0.58rem', fontWeight: 700, bgcolor: 'background.paper' }}
                      />
                    </Box>

                    <Chip
                      label={`${count} personaje${count === 1 ? '' : 's'}`}
                      size="small"
                      sx={{ height: 20, fontSize: '0.65rem', fontWeight: 600, bgcolor: 'background.paper' }}
                    />
                  </ListItem>
                );
              })}
            </List>
          </Box>

          <Divider />

          <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
            <CustomButton onClick={onClose} variant="contained">
              Listo
            </CustomButton>
          </Box>
        </Box>
      </CustomModal>

      {/* Confirmation Dialog for Deleting Archetype */}
      <Dialog
        open={Boolean(confirmDeleteArch)}
        onClose={() => setConfirmDeleteArch(null)}
        maxWidth="xs"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3, p: 1 } }}
      >
        <DialogTitle sx={{ fontWeight: 700, fontSize: '1rem' }}>
          Eliminar Arquetipo
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary">
            ¿Estás seguro de que deseas eliminar el arquetipo <strong>{confirmDeleteArch?.name}</strong>? Los personajes que lo tengan conservarán el texto pero el arquetipo ya no aparecerá en el catálogo rápido.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <CustomButton variant="outlined" color="inherit" onClick={() => setConfirmDeleteArch(null)}>
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
