import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  TextField,
  MenuItem,
  FormControlLabel,
  Switch,
  IconButton,
  Paper,
  Chip,
  Tooltip,
  Button,
  Collapse,
  Divider,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import LayersIcon from '@mui/icons-material/Layers';
import AutoStoriesIcon from '@mui/icons-material/AutoStories';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import TuneIcon from '@mui/icons-material/Tune';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import PublicIcon from '@mui/icons-material/Public';
import BookmarkBorderIcon from '@mui/icons-material/BookmarkBorder';
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

  // Progressive disclosure
  const [showAdvanced, setShowAdvanced] = useState(false);

  const resetForm = () => {
    setTitle('');
    setSynopsis('');
    setGenre('');
    setCoverUrl('');
    setBelongsToUniverseId('');
    setIsUniverseRoot(false);
    setShowAdvanced(false);
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
    setShowAdvanced(Boolean(story.is_universe_root || story.belongs_to_universe_id));
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
      title="Gestión de Historias y Proyectos"
      subtitle="Administra tus proyectos literarios, portadas y sagas"
      icon={AutoStoriesIcon}
      maxWidth="md"
    >
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
        {/* Header action */}
        {!isCreating && (
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="subtitle2" color="text.secondary" sx={{ fontWeight: 700 }}>
              Tus Historias ({stories.length})
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

        {/* ─── CREATE / EDIT FORM (SIMPLIFIED & PROGRESSIVE) ─────────────── */}
        {isCreating ? (
          <Paper
            elevation={0}
            component="form"
            onSubmit={handleSubmit}
            sx={{
              p: { xs: 2, sm: 2.5 },
              border: 1,
              borderColor: 'divider',
              borderRadius: 3,
              bgcolor: 'background.paper',
              display: 'flex',
              flexDirection: 'column',
              gap: 2,
            }}
          >
            <Typography variant="subtitle1" sx={{ fontWeight: 800, color: 'primary.main' }}>
              {editingStoryId ? 'Editar Historia' : 'Crear Nueva Historia'}
            </Typography>

            {/* 1. TÍTULO DE LA HISTORIA (Input Principal) */}
            <TextField
              label="Título de la Historia *"
              placeholder="Ej: Crónicas del Alba, El Secreto de Dunwich, Cenizas del Imperio..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              fullWidth
              autoFocus
              InputProps={{
                sx: { fontSize: '1.05rem', fontWeight: 700, borderRadius: 2.5 },
              }}
            />

            {/* 2. GÉNERO Y SINOPSIS */}
            <TextField
              label="Género Literario"
              placeholder="Ej: Fantasía Épica, Ciencia Ficción, Thriller, Terror, Romance…"
              value={genre}
              onChange={(e) => setGenre(e.target.value)}
              fullWidth
              size="small"
              InputProps={{ sx: { borderRadius: 2 } }}
            />

            <TextField
              label="Sinopsis / Resumen General"
              placeholder="¿De qué trata este libro o historia? Premisa, conflicto central y protagonistas…"
              value={synopsis}
              onChange={(e) => setSynopsis(e.target.value)}
              multiline
              rows={3}
              fullWidth
              InputProps={{ sx: { borderRadius: 2, fontSize: '0.9rem' } }}
            />

            {/* 3. PORTADA / IMAGEN DE FONDO */}
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              <TextField
                label="URL de Imagen de Portada (Opcional)"
                placeholder="https://images.unsplash.com/... o enlace a imagen"
                value={coverUrl}
                onChange={(e) => setCoverUrl(e.target.value)}
                fullWidth
                size="small"
                InputProps={{ sx: { borderRadius: 2 } }}
                helperText="Se usará como portada visual y cabecera panorámica en tu espacio de trabajo"
              />
              {coverUrl && (
                <Box
                  sx={{
                    width: '100%',
                    height: 100,
                    borderRadius: 2.5,
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
                  <Typography variant="caption" sx={{ fontWeight: 800, textShadow: '0 1px 4px rgba(0,0,0,0.8)' }}>
                    Vista previa de portada: {title || 'Tu Historia'}
                  </Typography>
                </Box>
              )}
            </Box>

            {/* 4. TOGGLE MÁS OPCIONES (Universos y Sagas) */}
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
                {showAdvanced ? 'Ocultar opciones avanzadas' : '⚙️ Más opciones (Sagas y Universos compartidos)'}
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
                  gap: 1.8,
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <LayersIcon color="primary" sx={{ fontSize: 18 }} />
                  <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                    Universos Compartidos y Sagas
                  </Typography>
                </Box>

                <Typography variant="caption" color="text.secondary" sx={{ lineHeight: 1.5 }}>
                  Si estás escribiendo una trilogía, serie de libros o varias historias que ocurren en el mismo mundo o multiverso, puedes organizarlas aquí.
                </Typography>

                {/* Es Saga / Universo Matriz Switch */}
                <FormControlLabel
                  control={
                    <Switch
                      checked={isUniverseRoot}
                      onChange={(e) => {
                        setIsUniverseRoot(e.target.checked);
                        if (e.target.checked) setBelongsToUniverseId('');
                      }}
                      color="primary"
                      size="small"
                    />
                  }
                  label={
                    <Box>
                      <Typography variant="body2" sx={{ fontWeight: 700 }}>
                        🌟 Esta historia es una "Saga / Universo Principal"
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Actívalo si este proyecto es el contenedor central de varios libros o spin-offs.
                      </Typography>
                    </Box>
                  }
                />

                {/* Vincular a Universo existente */}
                {!isUniverseRoot && potentialUniverses.length > 0 && (
                  <TextField
                    select
                    size="small"
                    label="Vincular como parte de una Saga existente"
                    value={belongsToUniverseId}
                    onChange={(e) => setBelongsToUniverseId(e.target.value)}
                    fullWidth
                    InputProps={{ sx: { borderRadius: 2 } }}
                    helperText="Selecciona a qué universo pertenece esta historia (por defecto: Historia independiente)"
                  >
                    <MenuItem value="">
                      <em>Ninguna (Historia Independiente)</em>
                    </MenuItem>
                    {potentialUniverses.map((univ) => (
                      <MenuItem key={univ.id} value={univ.id}>
                        📚 {univ.title} {univ.is_universe_root ? '(Saga / Universo)' : ''}
                      </MenuItem>
                    ))}
                  </TextField>
                )}
              </Box>
            </Collapse>

            <Divider sx={{ my: 0.5 }} />

            {/* Modal Actions */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 1 }}>
              {editingStoryId && onDeleteStory ? (
                <CustomButton
                  variant="outlined"
                  color="error"
                  size="small"
                  startIcon={<DeleteOutlineIcon fontSize="small" />}
                  onClick={() => {
                    if (window.confirm('¿Seguro que deseas eliminar esta historia y todos sus eventos?')) {
                      onDeleteStory(editingStoryId);
                      resetForm();
                    }
                  }}
                >
                  Eliminar Historia
                </CustomButton>
              ) : <Box />}

              <Box sx={{ display: 'flex', gap: 1.5 }}>
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
            </Box>
          </Paper>
        ) : (
          /* ─── STORIES LIST / CAROUSEL ─────────────────────────────────── */
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'row',
              gap: 2,
              overflowX: 'auto',
              pb: 3,
              px: 1,
              '&::-webkit-scrollbar': { height: 6 },
              '&::-webkit-scrollbar-track': { bgcolor: 'background.subtle', borderRadius: 2 },
              '&::-webkit-scrollbar-thumb': { bgcolor: 'divider', borderRadius: 2, '&:hover': { bgcolor: 'primary.main' } },
            }}
          >
            {stories.length === 0 ? (
              <Box
                sx={{
                  p: 6,
                  width: '100%',
                  textAlign: 'center',
                  bgcolor: 'background.subtle',
                  borderRadius: 3,
                  border: '1px dashed',
                  borderColor: 'divider',
                }}
              >
                <LayersIcon sx={{ fontSize: 50, color: 'text.disabled', mb: 2 }} />
                <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>
                  Aún no tienes historias creadas
                </Typography>
                <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                  Comienza creando tu primera historia para estructurar personajes y líneas de tiempo.
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
                
                const itemCount = stories.length;
                let dynamicWidth = '200px';
                if (itemCount === 1) {
                  dynamicWidth = '40%';
                } else if (itemCount === 2) {
                  dynamicWidth = '30%';
                } else if (itemCount >= 3) {
                  dynamicWidth = '25%';
                }

                return (
                  <Paper
                    key={story.id}
                    elevation={isSelected ? 4 : 1}
                    sx={{
                      minWidth: '200px',
                      width: dynamicWidth,
                      maxWidth: '280px',
                      display: 'flex',
                      flexDirection: 'column',
                      borderRadius: 3,
                      overflow: 'hidden',
                      bgcolor: 'background.paper',
                      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                      border: isSelected ? '2px solid' : '1px solid',
                      borderColor: isSelected ? 'primary.main' : 'divider',
                      '&:hover': {
                        transform: 'translateY(-4px)',
                        boxShadow: 6,
                        borderColor: 'primary.light',
                      },
                    }}
                  >
                    {/* Cover image area */}
                    <Box
                      sx={{
                        height: 140,
                        width: '100%',
                        bgcolor: 'background.subtle',
                        position: 'relative',
                        backgroundImage: story.cover_url ? `url(${story.cover_url})` : 'none',
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      {!story.cover_url && <MenuBookIcon sx={{ fontSize: 44, color: 'text.disabled', opacity: 0.5 }} />}
                      <Box sx={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '40%', background: 'linear-gradient(to top, rgba(0,0,0,0.6), transparent)' }} />
                    </Box>

                    {/* Content area */}
                    <Box sx={{ p: 1.5, flexGrow: 1, display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                      <Typography variant="subtitle1" sx={{ fontWeight: 800, lineHeight: 1.2 }} noWrap>
                        {story.title}
                      </Typography>
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        sx={{
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden',
                          height: 32,
                        }}
                      >
                        {story.synopsis || 'Sin descripción disponible.'}
                      </Typography>
                      
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 'auto', pt: 1 }}>
                        {story.is_universe_root && <Chip label="Saga / Universo" size="small" color="secondary" sx={{ height: 18, fontSize: '0.62rem', fontWeight: 700 }} />}
                        {story.genre && <Chip label={story.genre} size="small" variant="outlined" sx={{ height: 18, fontSize: '0.62rem' }} />}
                      </Box>
                    </Box>

                    {/* Actions */}
                    <Box sx={{ p: 1, pt: 0, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Tooltip title="Editar detalles de la historia">
                        <IconButton size="small" onClick={() => handleStartEdit(story)}>
                          <EditOutlinedIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <CustomButton
                        size="small"
                        variant={isSelected ? 'contained' : 'outlined'}
                        onClick={() => {
                          onSelectStory(story.id);
                          onClose();
                        }}
                      >
                        {isSelected ? 'Activa' : 'Cargar'}
                      </CustomButton>
                    </Box>
                  </Paper>
                );
              })
            )}
          </Box>
        )}
      </Box>
    </CustomModal>
  );
}
