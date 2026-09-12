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
} from '@mui/material';
import PersonIcon from '@mui/icons-material/Person';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import ColorLensIcon from '@mui/icons-material/ColorLens';
import CustomModal from '../common/CustomModal';
import CustomButton from '../common/CustomButton';
import { CHARACTER_ARCHETYPES, CHARACTER_COLOR_PALETTE } from '../../constants/constants';
import CustomSpinner from '../common/CustomSpinner';

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
  const [cloneSuffix, setCloneSuffix] = useState(' (Versión Alterna)');

  const colorInputRef = useRef(null);

  useEffect(() => {
    if (character) {
      setName(character.name || '');
      setRoleArchetype(character.role_archetype || 'Protagonista');
      setBiography(character.biography || '');
      setAvatarUrl(character.avatar_url || '');
      setColorTag(character.color_tag || '');
      setIsTemplate(Boolean(character.is_template));
    } else {
      setName('');
      setRoleArchetype('Protagonista');
      setBiography('');
      setAvatarUrl('');
      setColorTag('');
      setIsTemplate(false);
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
          : 'Define los atributos esenciales del personaje para la historia'
      }
      icon={isCloneMode ? ContentCopyIcon : PersonIcon}
      maxWidth="sm"
    >
      <Box component="form" onSubmit={handleSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
        {/* ... (keep existing form fields) ... */}
        {/* Preview Avatar & Image URL */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2.5, p: 1.5, bgcolor: 'background.subtle', borderRadius: 2 }}>
          <Avatar
            src={avatarUrl}
            alt={name || 'Avatar'}
            sx={{
              width: 64,
              height: 64,
              bgcolor: colorTag || 'primary.main',
              color: '#ffffff',
              fontSize: '1.5rem',
              fontWeight: 700,
              boxShadow: colorTag ? `0 0 12px ${colorTag}66` : 'none',
              transition: 'all 0.2s ease',
            }}
          >
            {name ? name.charAt(0).toUpperCase() : <PersonIcon />}
          </Avatar>
          <Box sx={{ flexGrow: 1 }}>
            <TextField
              label="URL de Foto de Perfil (Avatar)"
              placeholder="https://ejemplo.com/avatar.jpg"
              value={avatarUrl}
              onChange={(e) => setAvatarUrl(e.target.value)}
              fullWidth
              helperText="Si no tienes foto, se usará el color distintivo en el avatar"
            />
          </Box>
        </Box>

        {/* Color Tag Picker (Optional Character Color) */}
        <Box sx={{ p: 1.5, border: 1, borderColor: 'divider', borderRadius: 2, bgcolor: 'background.paper' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
              Color Distintivo del Personaje (Opcional - Pinta su tarjeta y avatar)
            </Typography>
            {colorTag && (
              <Typography variant="caption" sx={{ fontFamily: 'monospace', fontSize: '0.75rem', color: colorTag, fontWeight: 700 }}>
                {colorTag.toUpperCase()}
              </Typography>
            )}
          </Box>
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', alignItems: 'center' }}>
            <Tooltip title="Sin color personalizado (por defecto)">
              <Box
                onClick={() => setColorTag('')}
                sx={{
                  width: 28,
                  height: 28,
                  borderRadius: '50%',
                  bgcolor: 'background.subtle',
                  border: '2px solid',
                  borderColor: !colorTag ? 'primary.main' : 'divider',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  fontSize: '0.65rem',
                  fontWeight: 700,
                  color: 'text.secondary',
                }}
              >
                ✕
              </Box>
            </Tooltip>

            {CHARACTER_COLOR_PALETTE.map((color) => {
              const isSelected = colorTag?.toLowerCase() === color.toLowerCase();
              return (
                <Box
                  key={color}
                  onClick={() => setColorTag(color)}
                  sx={{
                    width: 28,
                    height: 28,
                    borderRadius: '50%',
                    bgcolor: color,
                    cursor: 'pointer',
                    border: '3px solid',
                    borderColor: isSelected ? 'primary.main' : 'transparent',
                    boxShadow: isSelected ? `0 0 0 2px ${color}` : 'none',
                    transition: 'transform 0.1s ease',
                    '&:hover': {
                      transform: 'scale(1.15)',
                    },
                  }}
                />
              );
            })}

            {/* Custom Color Picker Button & Input */}
            <Tooltip title="Seleccionar color personalizado (Hex / Rueda de color)">
              <Box
                onClick={() => colorInputRef.current?.click()}
                sx={{
                  width: 28,
                  height: 28,
                  borderRadius: '50%',
                  background: colorTag && !CHARACTER_COLOR_PALETTE.includes(colorTag)
                    ? colorTag
                    : 'conic-gradient(from 180deg, red, yellow, lime, cyan, blue, magenta, red)',
                  cursor: 'pointer',
                  border: '2px solid',
                  borderColor: colorTag && !CHARACTER_COLOR_PALETTE.includes(colorTag) ? 'primary.main' : 'divider',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 2px 5px rgba(0,0,0,0.15)',
                  position: 'relative',
                  overflow: 'hidden',
                  '&:hover': { transform: 'scale(1.15)' },
                }}
              >
                <ColorLensIcon sx={{ fontSize: 16, color: '#ffffff', filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.6))' }} />
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
            </Tooltip>
          </Box>
        </Box>

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
              helperText="Ejemplo: (Versión Futura), (Multiverso B), (Clon)"
            />
          </Box>
        ) : (
          <>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={7}>
                <TextField
                  label="Nombre del Personaje"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  fullWidth
                  autoFocus
                />
              </Grid>
              <Grid item xs={12} sm={5}>
                <TextField
                  select
                  label="Arquetipo / Rol"
                  value={roleArchetype}
                  onChange={(e) => setRoleArchetype(e.target.value)}
                  fullWidth
                >
                  {CHARACTER_ARCHETYPES.map((arch) => (
                    <MenuItem key={arch} value={arch}>
                      {arch}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
            </Grid>

            <TextField
              label="Biografía / Trasfondo"
              value={biography}
              onChange={(e) => setBiography(e.target.value)}
              multiline
              rows={4}
              placeholder="Motivaciones, origen, secretos, habilidades y papel en la trama..."
              fullWidth
            />
          </>
        )}

        <Divider sx={{ my: 0.5 }} />

        <FormControlLabel
          control={
            <Switch
              checked={isTemplate}
              onChange={(e) => setIsTemplate(e.target.checked)}
              color="primary"
            />
          }
          label={
            <Box>
              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                Guardar como Plantilla Reutilizable
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Permite clonar rápidamente este arquetipo en cualquier historia (RF-3.4)
              </Typography>
            </Box>
          }
        />
        
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
