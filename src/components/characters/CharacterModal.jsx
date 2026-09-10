import React, { useState, useEffect } from 'react';
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
} from '@mui/material';
import PersonIcon from '@mui/icons-material/Person';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import CustomModal from '../common/CustomModal';
import CustomButton from '../common/CustomButton';
import { CHARACTER_ARCHETYPES } from '../../constants/constants';

export default function CharacterModal({
  open,
  onClose,
  character = null,
  onSave,
  onClone,
  loading = false,
  isCloneMode = false,
}) {
  const [name, setName] = useState('');
  const [roleArchetype, setRoleArchetype] = useState('Protagonista');
  const [biography, setBiography] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [isTemplate, setIsTemplate] = useState(false);
  const [cloneSuffix, setCloneSuffix] = useState(' (Versión Alterna)');

  useEffect(() => {
    if (character) {
      setName(character.name || '');
      setRoleArchetype(character.role_archetype || 'Protagonista');
      setBiography(character.biography || '');
      setAvatarUrl(character.avatar_url || '');
      setIsTemplate(Boolean(character.is_template));
    } else {
      setName('');
      setRoleArchetype('Protagonista');
      setBiography('');
      setAvatarUrl('');
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
        {/* Preview Avatar */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2.5, p: 1.5, bgcolor: 'background.subtle', borderRadius: 2 }}>
          <Avatar
            src={avatarUrl}
            alt={name || 'Avatar'}
            sx={{ width: 64, height: 64, bgcolor: 'primary.main', fontSize: '1.5rem', fontWeight: 700 }}
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
              helperText="Enlace a una imagen para la tarjeta y la línea de tiempo (RF-3.2)"
            />
          </Box>
        </Box>

        {isCloneMode ? (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Typography variant="body2" color="text.secondary">
              Se clonará la ficha completa de <strong>{character?.name}</strong> incluyendo biografía y arquetipo.
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
            disabled={loading}
          >
            Cancelar
          </CustomButton>
          <CustomButton
            type="submit"
            loading={loading}
            startIcon={isCloneMode ? <ContentCopyIcon fontSize="small" /> : undefined}
          >
            {isCloneMode ? 'Confirmar Clonación' : character ? 'Guardar Cambios' : 'Crear Personaje'}
          </CustomButton>
        </Box>
      </Box>
    </CustomModal>
  );
}
