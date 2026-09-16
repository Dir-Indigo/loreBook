import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Typography,
  TextField,
  MenuItem,
  Avatar,
  FormControlLabel,
  Switch,
  Divider,
  Grid,
  Tooltip,
  Collapse,
  Button,
} from '@mui/material';
import PersonIcon from '@mui/icons-material/Person';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import ColorLensIcon from '@mui/icons-material/ColorLens';
import TuneIcon from '@mui/icons-material/Tune';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import PublicIcon from '@mui/icons-material/Public';
import BookmarkBorderIcon from '@mui/icons-material/BookmarkBorder';
import CustomModal from '../common/CustomModal';
import CustomButton from '../common/CustomButton';
import { CHARACTER_ARCHETYPES, CHARACTER_COLOR_PALETTE } from '../../constants/constants';

export default function CharacterModal({
  open,
  onClose,
  character = null,
  onSave,
  onClone,
  isCloneMode = false,
}) {
  const [name, setName] = useState('');
  const [roleArchetype, setRoleArchetype] = useState('Protagonista');
  const [biography, setBiography] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [colorTag, setColorTag] = useState('');
  const [isTemplate, setIsTemplate] = useState(false);
  const [isGlobal, setIsGlobal] = useState(false);
  const [cloneSuffix, setCloneSuffix] = useState(' (Versión Alterna)');
  
  // Collapsible progressive disclosure state
  const [showAdvanced, setShowAdvanced] = useState(false);

  const colorInputRef = useRef(null);

  useEffect(() => {
    if (character) {
      setName(character.name || '');
      setRoleArchetype(character.role_archetype || 'Protagonista');
      setBiography(character.biography || '');
      setAvatarUrl(character.avatar_url || '');
      setColorTag(character.color_tag || '');
      setIsTemplate(Boolean(character.is_template));
      setIsGlobal(Boolean(character.is_global));
      // If character already has advanced attributes set (like avatar or global), open advanced by default
      if (character.avatar_url || character.is_global || character.is_template) {
        setShowAdvanced(true);
      } else {
        setShowAdvanced(false);
      }
    } else {
      setName('');
      setRoleArchetype('Protagonista');
      setBiography('');
      setAvatarUrl('');
      setColorTag('');
      setIsTemplate(false);
      setIsGlobal(false);
      setShowAdvanced(false);
    }
    setCloneSuffix(' (Versión Alterna)');
  }, [character, open, isCloneMode]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;

    if (isCloneMode && character) {
      await onClone(character.id, {
        nameSuffix: cloneSuffix,
        isTemplate: isTemplate,
      });
    } else {
      await onSave({
        name: name.trim(),
        role_archetype: roleArchetype,
        biography: biography.trim(),
        avatar_url: avatarUrl.trim(),
        color_tag: colorTag,
        is_template: isTemplate,
        is_global: isGlobal,
      });
    }
  };

  return (
    <CustomModal
      open={open}
      onClose={onClose}
      title={
        isCloneMode
          ? 'Clonar Personaje / Versión Alterna'
          : character
          ? 'Editar Ficha de Personaje'
          : 'Crear Nuevo Personaje'
      }
      subtitle={
        isCloneMode
          ? 'Genera una copia exacta para reutilizar como plantilla o variante'
          : 'Define los datos esenciales de tu personaje'
      }
      icon={isCloneMode ? ContentCopyIcon : PersonIcon}
      maxWidth="sm"
    >
      <Box component="form" onSubmit={handleSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {/* ─── CLONE MODE SPECIFIC VIEW ─── */}
        {isCloneMode ? (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Typography variant="body2" color="text.secondary">
              Se clonará la ficha completa de <strong>{character?.name}</strong> incluyendo biografía, arquetipo y color distintivo.
            </Typography>
            <TextField
              label="Sufijo o nuevo identificador"
              value={cloneSuffix}
              onChange={(e) => setCloneSuffix(e.target.value)}
              fullWidth
              autoFocus
              helperText="Ejemplo: (Versión Futura), (Multiverso B), (Clon)"
            />
          </Box>
        ) : (
          <>
            {/* ─── 1. NOMBRE DEL PERSONAJE (Input Principal Destacado) ─── */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Avatar
                src={avatarUrl}
                alt={name || 'Avatar'}
                sx={{
                  width: 52,
                  height: 52,
                  bgcolor: colorTag || 'primary.main',
                  color: '#ffffff',
                  fontSize: '1.3rem',
                  fontWeight: 800,
                  boxShadow: colorTag ? `0 0 12px ${colorTag}66` : 'none',
                  flexShrink: 0,
                  transition: 'all 0.2s ease',
                }}
              >
                {name ? name.charAt(0).toUpperCase() : <PersonIcon />}
              </Avatar>

              <TextField
                label="Nombre del Personaje *"
                placeholder="Ej: Elena Voss, Lord Brandon, Kira..."
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                fullWidth
                autoFocus
                InputProps={{
                  sx: { fontSize: '1.05rem', fontWeight: 700, borderRadius: 2.5 },
                }}
              />
            </Box>

            {/* ─── 2. ROL / ARQUETIPO Y PALETA RÁPIDA ─── */}
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  select
                  label="Arquetipo / Rol"
                  value={roleArchetype}
                  onChange={(e) => setRoleArchetype(e.target.value)}
                  fullWidth
                  size="small"
                  InputProps={{ sx: { borderRadius: 2 } }}
                >
                  {CHARACTER_ARCHETYPES.map((arch) => (
                    <MenuItem key={arch} value={arch}>
                      {arch}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>

              {/* Quick Color Palette */}
              <Grid item xs={12} sm={6} sx={{ display: 'flex', alignItems: 'center', gap: 0.8 }}>
                <Box sx={{ display: 'flex', gap: 0.7, alignItems: 'center', flexWrap: 'wrap' }}>
                  {CHARACTER_COLOR_PALETTE.slice(0, 6).map((color) => {
                    const isSelected = colorTag?.toLowerCase() === color.toLowerCase();
                    return (
                      <Box
                        key={color}
                        onClick={() => setColorTag(isSelected ? '' : color)}
                        sx={{
                          width: 24,
                          height: 24,
                          borderRadius: '50%',
                          bgcolor: color,
                          cursor: 'pointer',
                          border: isSelected ? '2.5px solid #222' : '1px solid rgba(0,0,0,0.15)',
                          transform: isSelected ? 'scale(1.2)' : 'scale(1)',
                          transition: 'transform 0.12s ease',
                          '&:hover': { transform: 'scale(1.2)' },
                        }}
                      />
                    );
                  })}
                </Box>
              </Grid>
            </Grid>

            {/* ─── 3. BIOGRAFÍA / TRASFONDO (Básico) ─── */}
            <TextField
              label="Biografía / Trasfondo Breve"
              value={biography}
              onChange={(e) => setBiography(e.target.value)}
              multiline
              rows={3}
              placeholder="Motivaciones, origen, secretos y papel en la historia…"
              fullWidth
              InputProps={{ sx: { borderRadius: 2, fontSize: '0.9rem' } }}
            />

            {/* ─── 4. TOGGLE MÁS OPCIONES (Colapsable) ─── */}
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
                {showAdvanced ? 'Ocultar opciones avanzadas' : '⚙️ Más opciones (Foto, Global, Plantilla, Color Hex…)'}
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
                  gap: 2,
                }}
              >
                {/* Custom Avatar URL */}
                <TextField
                  label="URL de Foto de Perfil (Avatar)"
                  placeholder="https://ejemplo.com/avatar.jpg"
                  value={avatarUrl}
                  onChange={(e) => setAvatarUrl(e.target.value)}
                  fullWidth
                  size="small"
                  helperText="Enlace a imagen externa para mostrar en fichas y nodos"
                />

                {/* Advanced Color Picker */}
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', bgcolor: 'background.paper', p: 1.2, borderRadius: 2, border: 1, borderColor: 'divider' }}>
                  <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary' }}>
                    Color Hex Personalizado:
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Box
                      onClick={() => colorInputRef.current?.click()}
                      sx={{
                        width: 26,
                        height: 26,
                        borderRadius: '50%',
                        bgcolor: colorTag || '#8c6d53',
                        border: '2px solid rgba(0,0,0,0.2)',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        position: 'relative',
                        overflow: 'hidden',
                      }}
                    >
                      <ColorLensIcon sx={{ fontSize: 14, color: '#fff' }} />
                      <input
                        ref={colorInputRef}
                        type="color"
                        value={colorTag || '#8c6d53'}
                        onChange={(e) => setColorTag(e.target.value)}
                        style={{
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          width: '100%',
                          height: '100%',
                          opacity: 0,
                          cursor: 'pointer',
                        }}
                      />
                    </Box>
                    {colorTag && (
                      <Typography variant="caption" sx={{ fontFamily: 'monospace', fontWeight: 700, color: colorTag }}>
                        {colorTag.toUpperCase()}
                      </Typography>
                    )}
                  </Box>
                </Box>

                <Divider />

                {/* Global Character Switch */}
                <FormControlLabel
                  control={
                    <Switch
                      checked={isGlobal}
                      onChange={(e) => setIsGlobal(e.target.checked)}
                      color="secondary"
                      size="small"
                    />
                  }
                  label={
                    <Box>
                      <Typography variant="body2" sx={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: 0.6 }}>
                        <PublicIcon sx={{ fontSize: 16 }} color="secondary" /> Personaje Global
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Disponible automáticamente en todas las historias del workspace.
                      </Typography>
                    </Box>
                  }
                />

                {/* Reusable Template Switch */}
                <FormControlLabel
                  control={
                    <Switch
                      checked={isTemplate}
                      onChange={(e) => setIsTemplate(e.target.checked)}
                      color="primary"
                      size="small"
                    />
                  }
                  label={
                    <Box>
                      <Typography variant="body2" sx={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: 0.6 }}>
                        <BookmarkBorderIcon sx={{ fontSize: 16 }} color="primary" /> Guardar como Plantilla Reutilizable
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Permite clonar rápidamente este arquetipo como base para nuevos personajes.
                      </Typography>
                    </Box>
                  }
                />
              </Box>
            </Collapse>
          </>
        )}

        <Divider sx={{ my: 0.5 }} />

        {/* Modal Actions */}
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1.5, mt: 1 }}>
          <CustomButton
            variant="outlined"
            color="inherit"
            onClick={onClose}
          >
            Cancelar
          </CustomButton>
          <CustomButton
            type="submit"
            startIcon={isCloneMode ? <ContentCopyIcon fontSize="small" /> : undefined}
          >
            {isCloneMode ? 'Confirmar Clonación' : character ? 'Guardar Cambios' : 'Crear Personaje'}
          </CustomButton>
        </Box>
      </Box>
    </CustomModal>
  );
}
