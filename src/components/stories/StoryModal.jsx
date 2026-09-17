import React, { useState, useEffect, useRef } from 'react';
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
  ButtonGroup,
  Collapse,
  Divider,
  CircularProgress,
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
import FileUploadOutlinedIcon from '@mui/icons-material/FileUploadOutlined';
import LinkIcon from '@mui/icons-material/Link';
import PhotoCameraIcon from '@mui/icons-material/PhotoCamera';
import CustomModal from '../common/CustomModal';
import CustomButton from '../common/CustomButton';
import ImageCropModal from '../common/ImageCropModal';
import { uploadStoryCover } from '../../services/storageService';

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

  // Cover upload & cropping state
  const [coverMode, setCoverMode] = useState('upload'); // 'upload' | 'url'
  const [cropModalOpen, setCropModalOpen] = useState(false);
  const [rawCoverImageSrc, setRawCoverImageSrc] = useState(null);
  const [uploadingCover, setUploadingCover] = useState(false);
  const coverFileInputRef = useRef(null);

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
    setCoverMode('upload');
    setCropModalOpen(false);
    setRawCoverImageSrc(null);
    setUploadingCover(false);
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
    setCoverMode(story.cover_url && !story.cover_url.includes('supabase.co/storage') && story.cover_url.startsWith('http') ? 'url' : 'upload');
    setIsCreating(true);
  };

  const handleCoverFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      setRawCoverImageSrc(reader.result);
      setCropModalOpen(true);
      e.target.value = '';
    };
    reader.readAsDataURL(file);
  };

  const handleCropComplete = async (optimizedBlob, previewUrl) => {
    setUploadingCover(true);
    try {
      const result = await uploadStoryCover(optimizedBlob, editingStoryId || 'new');
      if (result?.url) {
        setCoverUrl(result.url);
      } else {
        setCoverUrl(previewUrl);
      }
    } catch (err) {
      console.error('Error uploading story cover:', err);
      setCoverUrl(previewUrl);
    } finally {
      setUploadingCover(false);
    }
  };

  const handleRemoveCover = () => {
    setCoverUrl('');
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

        {/* Hidden File Input for Story Cover Selection */}
        <input
          ref={coverFileInputRef}
          type="file"
          accept="image/png,image/jpeg,image/webp,image/gif"
          style={{ display: 'none' }}
          onChange={handleCoverFileChange}
        />

        <ImageCropModal
          open={cropModalOpen}
          imageSrc={rawCoverImageSrc}
          aspectRatio="panoramic"
          shape="rounded"
          title="Recortar y Optimizar Portada"
          onClose={() => setCropModalOpen(false)}
          onCropComplete={handleCropComplete}
        />

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

            {/* 3. PORTADA / IMAGEN DE FONDO (SUBIDA + OPTIMIZACIÓN O URL) */}
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary' }}>
                  Imagen de Portada (Panorámica HD)
                </Typography>
                <ButtonGroup size="small">
                  <Button
                    variant={coverMode === 'upload' ? 'contained' : 'outlined'}
                    onClick={() => setCoverMode('upload')}
                    startIcon={<FileUploadOutlinedIcon fontSize="small" />}
                    sx={{ textTransform: 'none', fontWeight: 600, fontSize: '0.74rem', py: 0.3 }}
                  >
                    Subir Imagen
                  </Button>
                  <Button
                    variant={coverMode === 'url' ? 'contained' : 'outlined'}
                    onClick={() => setCoverMode('url')}
                    startIcon={<LinkIcon fontSize="small" />}
                    sx={{ textTransform: 'none', fontWeight: 600, fontSize: '0.74rem', py: 0.3 }}
                  >
                    Enlace URL
                  </Button>
                </ButtonGroup>
              </Box>

              {coverMode === 'upload' ? (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  <CustomButton
                    variant="outlined"
                    fullWidth
                    startIcon={uploadingCover ? <CircularProgress size={16} /> : <FileUploadOutlinedIcon fontSize="small" />}
                    onClick={() => coverFileInputRef.current?.click()}
                    disabled={uploadingCover}
                    sx={{ py: 1, fontSize: '0.82rem' }}
                  >
                    {uploadingCover ? 'Subiendo y optimizando...' : 'Seleccionar imagen desde tu dispositivo'}
                  </CustomButton>
                </Box>
              ) : (
                <TextField
                  label="URL de Imagen de Portada"
                  placeholder="https://images.unsplash.com/... o enlace a imagen"
                  value={coverUrl}
                  onChange={(e) => setCoverUrl(e.target.value)}
                  fullWidth
                  size="small"
                  InputProps={{ sx: { borderRadius: 2 } }}
                />
              )}

              {coverUrl && (
                <Box sx={{ position: 'relative', width: '100%' }}>
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

                  <Tooltip title="Quitar portada">
                    <IconButton
                      size="small"
                      onClick={handleRemoveCover}
                      sx={{
                        position: 'absolute',
                        top: 6,
                        right: 6,
                        bgcolor: 'rgba(0,0,0,0.6)',
                        color: '#fff',
                        '&:hover': { bgcolor: 'rgba(211, 47, 47, 0.9)' },
                      }}
                    >
                      <DeleteOutlineIcon sx={{ fontSize: 16 }} />
                    </IconButton>
                  </Tooltip>
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
                {showAdvanced ? 'Ocultar opciones avanzadas' : 'Más opciones (Sagas y Universos compartidos)'}
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
                        Esta historia es una Saga / Universo Principal
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
                        {univ.title} {univ.is_universe_root ? '(Saga / Universo)' : ''}
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
              display: 'grid',
              gridTemplateColumns: {
                xs: 'repeat(auto-fill, minmax(160px, 1fr))',
                sm: 'repeat(auto-fill, minmax(200px, 1fr))',
              },
              gap: 2,
              maxHeight: { xs: '60vh', sm: '55vh' },
              overflowY: 'auto',
              pr: 0.5,
              '&::-webkit-scrollbar': { width: 5 },
              '&::-webkit-scrollbar-track': { bgcolor: 'transparent' },
              '&::-webkit-scrollbar-thumb': { bgcolor: 'divider', borderRadius: 3 },
            }}
          >
            {stories.length === 0 ? (
              <Box
                sx={{
                  gridColumn: '1 / -1',
                  p: 6,
                  textAlign: 'center',
                  bgcolor: 'background.subtle',
                  borderRadius: 4,
                  border: '2px dashed',
                  borderColor: 'divider',
                }}
              >
                <LayersIcon sx={{ fontSize: 54, color: 'text.disabled', mb: 2, opacity: 0.5 }} />
                <Typography variant="h6" sx={{ fontWeight: 700, mb: 0.5 }}>
                  Aún no tienes historias
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 3, maxWidth: 320, mx: 'auto' }}>
                  Crea tu primer proyecto para empezar a organizar personajes, escenas y líneas de tiempo.
                </Typography>
                <CustomButton startIcon={<AddIcon fontSize="small" />} onClick={() => setIsCreating(true)}>
                  Crear mi primera historia
                </CustomButton>
              </Box>
            ) : (
              stories.map((story) => {
                const isSelected = story.id === activeStoryId;
                const hasCover = Boolean(story.cover_url);

                return (
                  <Box
                    key={story.id}
                    onClick={() => { onSelectStory(story.id); onClose(); }}
                    sx={{
                      position: 'relative',
                      aspectRatio: '2/3',
                      borderRadius: 3.5,
                      overflow: 'hidden',
                      cursor: 'pointer',
                      border: isSelected ? '2.5px solid' : '1.5px solid',
                      borderColor: isSelected ? 'primary.main' : 'divider',
                      boxShadow: isSelected
                        ? (t) => `0 0 0 3px ${t.palette.primary.main}44, 0 8px 24px rgba(0,0,0,0.28)`
                        : '0 4px 16px rgba(0,0,0,0.14)',
                      transition: 'all 0.22s cubic-bezier(0.4, 0, 0.2, 1)',
                      bgcolor: hasCover ? 'transparent' : 'background.subtle',
                      '&:hover': {
                        transform: 'translateY(-5px) scale(1.015)',
                        boxShadow: isSelected
                          ? (t) => `0 0 0 3px ${t.palette.primary.main}55, 0 16px 36px rgba(0,0,0,0.36)`
                          : '0 12px 32px rgba(0,0,0,0.28)',
                        borderColor: 'primary.light',
                        '& .story-edit-btn': { opacity: 1 },
                        '& .story-hover-overlay': { opacity: 1 },
                      },
                    }}
                  >
                    {/* Cover image or placeholder */}
                    {hasCover ? (
                      <Box
                        sx={{
                          position: 'absolute',
                          inset: 0,
                          backgroundImage: `url(${story.cover_url})`,
                          backgroundSize: 'cover',
                          backgroundPosition: 'center',
                        }}
                      />
                    ) : (
                      <Box
                        sx={{
                          position: 'absolute',
                          inset: 0,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          bgcolor: (t) => t.palette.mode === 'dark' ? 'grey.900' : 'grey.100',
                        }}
                      >
                        <MenuBookIcon sx={{ fontSize: 52, color: 'text.disabled', opacity: 0.35 }} />
                      </Box>
                    )}

                    {/* Gradient overlay always present */}
                    <Box
                      sx={{
                        position: 'absolute',
                        inset: 0,
                        background: hasCover
                          ? 'linear-gradient(to bottom, rgba(0,0,0,0.05) 0%, rgba(0,0,0,0.15) 35%, rgba(0,0,0,0.82) 100%)'
                          : 'linear-gradient(to bottom, transparent 40%, rgba(0,0,0,0.55) 100%)',
                      }}
                    />

                    {/* Hover overlay */}
                    <Box
                      className="story-hover-overlay"
                      sx={{
                        position: 'absolute',
                        inset: 0,
                        bgcolor: 'primary.main',
                        opacity: 0,
                        transition: 'opacity 0.2s ease',
                        mixBlendMode: 'multiply',
                      }}
                    />

                    {/* Top badges */}
                    <Box sx={{ position: 'absolute', top: 8, left: 8, right: 8, display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                      {isSelected && (
                        <Chip
                          label="Activa"
                          size="small"
                          color="primary"
                          icon={<CheckCircleIcon sx={{ fontSize: '12px !important' }} />}
                          sx={{ height: 22, fontSize: '0.65rem', fontWeight: 800, backdropFilter: 'blur(6px)', bgcolor: 'primary.main' }}
                        />
                      )}
                      {story.is_universe_root && (
                        <Chip
                          label="Saga"
                          size="small"
                          icon={<LayersIcon sx={{ fontSize: '12px !important' }} />}
                          sx={{ height: 22, fontSize: '0.65rem', fontWeight: 700, bgcolor: 'rgba(0,0,0,0.55)', color: '#fff', backdropFilter: 'blur(6px)', border: '1px solid rgba(255,255,255,0.2)' }}
                        />
                      )}
                    </Box>

                    {/* Edit button top-right */}
                    <Tooltip title="Editar historia">
                      <IconButton
                        className="story-edit-btn"
                        size="small"
                        onClick={(e) => { e.stopPropagation(); handleStartEdit(story); }}
                        sx={{
                          position: 'absolute',
                          top: 6,
                          right: 6,
                          opacity: 0,
                          transition: 'opacity 0.18s ease',
                          bgcolor: 'rgba(0,0,0,0.6)',
                          color: '#fff',
                          backdropFilter: 'blur(4px)',
                          p: 0.6,
                          '&:hover': { bgcolor: 'primary.main' },
                        }}
                      >
                        <EditOutlinedIcon sx={{ fontSize: 15 }} />
                      </IconButton>
                    </Tooltip>

                    {/* Bottom info overlay */}
                    <Box
                      sx={{
                        position: 'absolute',
                        bottom: 0,
                        left: 0,
                        right: 0,
                        p: 1.5,
                        pt: 2.5,
                      }}
                    >
                      <Typography
                        variant="subtitle2"
                        sx={{
                          fontWeight: 800,
                          fontSize: '0.88rem',
                          color: hasCover ? '#fff' : 'text.primary',
                          lineHeight: 1.25,
                          textShadow: hasCover ? '0 1px 6px rgba(0,0,0,0.7)' : 'none',
                          mb: 0.4,
                        }}
                        noWrap
                      >
                        {story.title}
                      </Typography>

                      {story.synopsis && (
                        <Typography
                          variant="caption"
                          sx={{
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden',
                            color: hasCover ? 'rgba(255,255,255,0.78)' : 'text.secondary',
                            fontSize: '0.68rem',
                            lineHeight: 1.4,
                            textShadow: hasCover ? '0 1px 4px rgba(0,0,0,0.6)' : 'none',
                          }}
                        >
                          {story.synopsis}
                        </Typography>
                      )}

                      {story.genre && (
                        <Chip
                          label={story.genre}
                          size="small"
                          sx={{
                            mt: 0.8,
                            height: 18,
                            fontSize: '0.62rem',
                            fontWeight: 600,
                            bgcolor: 'rgba(255,255,255,0.15)',
                            color: hasCover ? '#fff' : 'text.secondary',
                            border: '1px solid rgba(255,255,255,0.25)',
                            backdropFilter: 'blur(4px)',
                          }}
                        />
                      )}
                    </Box>
                  </Box>
                );
              })
            )}
          </Box>
        )}
      </Box>
    </CustomModal>
  );
}

