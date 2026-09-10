import React, { useState } from 'react';
import {
  Box,
  Typography,
  TextField,
  MenuItem,
  FormControlLabel,
  Switch,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Divider,
  Paper,
  Chip,
  Tooltip,
  Avatar,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import LayersIcon from '@mui/icons-material/Layers';
import AutoStoriesIcon from '@mui/icons-material/AutoStories';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ImageIcon from '@mui/icons-material/Image';
import CustomModal from '../common/CustomModal';
import CustomButton from '../common/CustomButton';

export default function StoryModal({
  open,
  onClose,
  stories = [],
  activeStoryId,
  onSelectStory,
  onCreateStory,
  onUpdateStory,
  onDeleteStory,
  loading = false,
}) {
  const [isCreating, setIsCreating] = useState(false);
  const [editingStoryId, setEditingStoryId] = useState(null);

  // Form State
  const [title, setTitle] = useState('');
  const [synopsis, setSynopsis] = useState('');
  const [genre, setGenre] = useState('');
  const [coverUrl, setCoverUrl] = useState('');
  const [belongsToUniverseId, setBelongsToUniverseId] = useState('');
  const [isUniverseRoot, setIsUniverseRoot] = useState(false);

  const resetForm = () => {
    setTitle('');
    setSynopsis('');
    setGenre('');
    setCoverUrl('');
    setBelongsToUniverseId('');
    setIsUniverseRoot(false);
    setIsCreating(false);
    setEditingStoryId(null);
  };

  const handleStartEdit = (story) => {
    setEditingStoryId(story.id);
    setTitle(story.title || '');
    setSynopsis(story.synopsis || '');
    setGenre(story.genre || '');
    setCoverUrl(story.cover_url || '');
    setBelongsToUniverseId(story.belongs_to_universe_id || '');
    setIsUniverseRoot(Boolean(story.is_universe_root));
    setIsCreating(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim()) return;

    const payload = {
      title: title.trim(),
      synopsis: synopsis.trim(),
      genre: genre.trim(),
      cover_url: coverUrl.trim() || null,
      belongs_to_universe_id: isUniverseRoot ? null : (belongsToUniverseId || null),
      is_universe_root: isUniverseRoot,
    };

    if (editingStoryId) {
      await onUpdateStory(editingStoryId, payload);
    } else {
      await onCreateStory(payload);
    }
    resetForm();
  };

  // Potential parent universe stories (exclude current story being edited)
  const potentialUniverses = stories.filter(
    (s) => s.id !== editingStoryId && (s.is_universe_root || !s.belongs_to_universe_id)
  );

  return (
    <CustomModal
      open={open}
      onClose={() => {
        resetForm();
        onClose();
      }}
      title="Gestión de Historias y Universos"
      subtitle="Administra tus proyectos literarios, portadas y mundos interconectados"
      icon={AutoStoriesIcon}
      maxWidth="md"
    >
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
        {/* Header action */}
        {!isCreating && (
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="subtitle2" color="text.secondary">
              Historias registradas ({stories.length})
            </Typography>
            <CustomButton
              size="small"
              startIcon={<AddIcon fontSize="small" />}
              onClick={() => {
                resetForm();
                setIsCreating(true);
              }}
            >
              Nueva Historia
            </CustomButton>
          </Box>
        )}

        {/* Create / Edit Form */}
        {isCreating ? (
          <Paper
            elevation={0}
            component="form"
            onSubmit={handleSubmit}
            sx={{
              p: 2.5,
              border: 1,
              borderColor: 'divider',
              borderRadius: 2,
              bgcolor: 'background.subtle',
              display: 'flex',
              flexDirection: 'column',
              gap: 2,
            }}
          >
            <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
              {editingStoryId ? 'Editar Historia' : 'Crear Nueva Historia o Universo'}
            </Typography>

            <TextField
              label="Título del Proyecto"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              fullWidth
              autoFocus
            />

            {/* Cover Image Input and Preview */}
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              <TextField
                label="URL de Imagen de Fondo / Portada"
                placeholder="https://images.unsplash.com/... o enlace directo a imagen"
                value={coverUrl}
                onChange={(e) => setCoverUrl(e.target.value)}
                fullWidth
                helperText="Se mostrará como portada y fondo panorámico en el panel lateral de Proyecto Activo"
              />
              {coverUrl && (
                <Box
                  sx={{
                    width: '100%',
                    height: 100,
                    borderRadius: 2,
                    backgroundImage: `linear-gradient(to bottom, rgba(0,0,0,0.2), rgba(0,0,0,0.7)), url(${coverUrl})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    border: 1,
                    borderColor: 'divider',
                    display: 'flex',
                    alignItems: 'flex-end',
                    p: 1.5,
                    color: '#fff',
                  }}
                >
                  <Typography variant="caption" sx={{ fontWeight: 700, textShadow: '0 1px 4px rgba(0,0,0,0.8)' }}>
                    Vista previa de la portada: {title || 'Tu Historia'}
                  </Typography>
                </Box>
              )}
            </Box>

            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
              <TextField
                label="Género literario"
                placeholder="Ej: Fantasía Épica, Cyberpunk, Drama"
                value={genre}
                onChange={(e) => setGenre(e.target.value)}
                fullWidth
              />

              <FormControlLabel
                control={
                  <Switch
                    checked={isUniverseRoot}
                    onChange={(e) => {
                      setIsUniverseRoot(e.target.checked);
                      if (e.target.checked) setBelongsToUniverseId('');
                    }}
                    color="primary"
                  />
                }
                label={
                  <Box>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      Es Universo Matriz
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Servirá como contenedor para otras historias
                    </Typography>
                  </Box>
                }
              />
            </Box>

            {!isUniverseRoot && potentialUniverses.length > 0 && (
              <TextField
                select
                label="Vincular como parte de un Universo compartido"
                value={belongsToUniverseId}
                onChange={(e) => setBelongsToUniverseId(e.target.value)}
                fullWidth
                helperText="Permite relacionar esta trama con otro proyecto del mismo universo (RF-2.2)"
              >
                <MenuItem value="">
                  <em>Ninguno (Historia Independiente)</em>
                </MenuItem>
                {potentialUniverses.map((univ) => (
                  <MenuItem key={univ.id} value={univ.id}>
                    {univ.title} {univ.is_universe_root ? '(Universo)' : ''}
                  </MenuItem>
                ))}
              </TextField>
            )}

            <TextField
              label="Sinopsis / Descripción General"
              value={synopsis}
              onChange={(e) => setSynopsis(e.target.value)}
              multiline
              rows={3}
              fullWidth
            />

            <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1.5, mt: 1 }}>
              <CustomButton
                variant="outlined"
                color="inherit"
                onClick={resetForm}
                disabled={loading}
              >
                Cancelar
              </CustomButton>
              <CustomButton
                type="submit"
                loading={loading}
              >
                {editingStoryId ? 'Guardar Cambios' : 'Crear Historia'}
              </CustomButton>
            </Box>
          </Paper>
        ) : (
          /* Stories List */
          <List sx={{ p: 0, display: 'flex', flexDirection: 'column', gap: 1.5 }}>
            {stories.length === 0 ? (
              <Box
                sx={{
                  p: 4,
                  textAlign: 'center',
                  bgcolor: 'background.subtle',
                  borderRadius: 2,
                  border: 1,
                  borderColor: 'divider',
                }}
              >
                <LayersIcon sx={{ fontSize: 40, color: 'text.disabled', mb: 1 }} />
                <Typography variant="body1" sx={{ fontWeight: 600 }}>
                  Aún no tienes historias creadas
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Comienza creando tu primera historia o universo literario.
                </Typography>
                <CustomButton
                  startIcon={<AddIcon fontSize="small" />}
                  onClick={() => setIsCreating(true)}
                >
                  Crear mi primera historia
                </CustomButton>
              </Box>
            ) : (
              stories.map((story) => {
                const isSelected = story.id === activeStoryId;
                return (
                  <Paper
                    key={story.id}
                    elevation={0}
                    sx={{
                      p: 2,
                      border: 1.5,
                      borderColor: isSelected ? 'primary.main' : 'divider',
                      borderRadius: 2,
                      bgcolor: 'background.paper',
                      transition: 'all 0.15s ease',
                      '&:hover': {
                        borderColor: 'primary.light',
                      },
                    }}
                  >
                    <ListItem disablePadding>
                      {story.cover_url && (
                        <Box
                          sx={{
                            width: 54,
                            height: 54,
                            borderRadius: 1.5,
                            mr: 2,
                            flexShrink: 0,
                            backgroundImage: `url(${story.cover_url})`,
                            backgroundSize: 'cover',
                            backgroundPosition: 'center',
                            border: 1,
                            borderColor: 'divider',
                          }}
                        />
                      )}
                      <ListItemText
                        primary={
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2, mb: 0.5, flexWrap: 'wrap' }}>
                            <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                              {story.title}
                            </Typography>
                            {isSelected && (
                              <Chip
                                icon={<CheckCircleIcon fontSize="small" />}
                                label="Activa"
                                size="small"
                                color="primary"
                                sx={{ height: 22, fontSize: '0.7rem' }}
                              />
                            )}
                            {story.is_universe_root && (
                              <Chip
                                icon={<LayersIcon fontSize="small" />}
                                label="Universo Matriz"
                                size="small"
                                color="secondary"
                                variant="outlined"
                                sx={{ height: 22, fontSize: '0.7rem' }}
                              />
                            )}
                            {story.universe && (
                              <Chip
                                label={`Universo: ${story.universe.title}`}
                                size="small"
                                variant="outlined"
                                sx={{ height: 22, fontSize: '0.7rem' }}
                              />
                            )}
                            {story.genre && (
                              <Chip
                                label={story.genre}
                                size="small"
                                sx={{ height: 22, fontSize: '0.7rem', bgcolor: 'background.subtle' }}
                              />
                            )}
                          </Box>
                        }
                        secondary={
                          <Typography
                            variant="body2"
                            color="text.secondary"
                            sx={{
                              display: '-webkit-box',
                              WebkitLineClamp: 2,
                              WebkitBoxOrient: 'vertical',
                              overflow: 'hidden',
                            }}
                          >
                            {story.synopsis || 'Sin descripción disponible.'}
                          </Typography>
                        }
                      />
                      <ListItemSecondaryAction sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                        {!isSelected && (
                          <CustomButton
                            size="small"
                            variant="outlined"
                            onClick={() => {
                              onSelectStory(story.id);
                              onClose();
                            }}
                          >
                            Cargar en Lienzo
                          </CustomButton>
                        )}
                        <Tooltip title="Editar detalles y portada">
                          <IconButton
                            size="small"
                            onClick={() => handleStartEdit(story)}
                            sx={{ color: 'text.secondary' }}
                          >
                            <EditOutlinedIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Eliminar historia">
                          <IconButton
                            size="small"
                            onClick={() => onDeleteStory(story.id)}
                            sx={{ color: 'error.main' }}
                          >
                            <DeleteOutlineIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </ListItemSecondaryAction>
                    </ListItem>
                  </Paper>
                );
              })
            )}
          </List>
        )}
      </Box>
    </CustomModal>
  );
}
