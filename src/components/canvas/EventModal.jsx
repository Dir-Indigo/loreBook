import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  TextField,
  MenuItem,
  Checkbox,
  ListItemText,
  OutlinedInput,
  Select,
  InputLabel,
  FormControl,
  Chip,
  Avatar,
  FormControlLabel,
  Switch,
  Grid,
} from '@mui/material';
import EventIcon from '@mui/icons-material/Event';
import BookmarkBorderIcon from '@mui/icons-material/BookmarkBorder';
import CustomModal from '../common/CustomModal';
import CustomButton from '../common/CustomButton';
import { APP_CONFIG, EVENT_IMPORTANCE } from '../../constants/constants';
import { useLoreTheme } from '../../context/ThemeContext';

export default function EventModal({
  open,
  onClose,
  event = null,
  characters = [],
  nextOrderIndex = 1,
  onSave,
  loading = false,
}) {
  const { currentThemeConfig } = useLoreTheme();
  const tagColorPalette = currentThemeConfig.palette.tagColors || [
    '#8c6d53',
    '#607d8b',
    '#558b2f',
    '#ad1457',
    '#e65100',
    '#4e342e',
  ];

  const [title, setTitle] = useState('');
  const [summary, setSummary] = useState('');
  const [details, setDetails] = useState('');
  const [orderIndex, setOrderIndex] = useState(nextOrderIndex);
  const [importanceLevel, setImportanceLevel] = useState('medium');
  const [colorTag, setColorTag] = useState(tagColorPalette[0]);
  const [selectedCharacterIds, setSelectedCharacterIds] = useState([]);
  const [createBackup, setCreateBackup] = useState(true);
  const [backupNote, setBackupNote] = useState('');

  useEffect(() => {
    if (event) {
      setTitle(event.title || '');
      setSummary(event.summary || '');
      setDetails(event.details || '');
      setOrderIndex(event.order_index ?? nextOrderIndex);
      setImportanceLevel(event.importance_level || 'medium');
      setColorTag(event.color_tag || tagColorPalette[0]);
      
      const charIds = event.event_characters?.map(
        (ec) => ec.character?.id || ec.character_id
      ) || [];
      setSelectedCharacterIds(charIds.filter(Boolean));
      setCreateBackup(true);
      setBackupNote('');
    } else {
      setTitle('');
      setSummary('');
      setDetails('');
      setOrderIndex(nextOrderIndex);
      setImportanceLevel('medium');
      setColorTag(tagColorPalette[0]);
      setSelectedCharacterIds([]);
      setCreateBackup(false);
      setBackupNote('');
    }
  }, [event, open, nextOrderIndex]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim()) return;

    await onSave({
      eventData: {
        title: title.trim().substring(0, APP_CONFIG.EVENT_TITLE_MAX_LENGTH),
        summary: summary.trim(),
        details: details.trim(),
        order_index: parseFloat(orderIndex) || 1.0,
        importance_level: importanceLevel,
        color_tag: colorTag,
      },
      characterIds: selectedCharacterIds,
      createBackup: Boolean(event && createBackup),
      backupNote: backupNote.trim() || 'Copia previa a modificación',
    });
  };

  const handleCharacterChange = (event) => {
    const {
      target: { value },
    } = event;
    setSelectedCharacterIds(typeof value === 'string' ? value.split(',') : value);
  };

  const isEditing = Boolean(event);

  return (
    <CustomModal
      open={open}
      onClose={onClose}
      title={isEditing ? 'Editar Evento de la Trama' : 'Nuevo Evento en la Línea de Tiempo'}
      subtitle="Estructura la secuencia narrativa y asocia los personajes participantes"
      icon={EventIcon}
      maxWidth="md"
    >
      <Box component="form" onSubmit={handleSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
        {/* Title with character counter (RF-4.5) */}
        <Box>
          <TextField
            label="Título del Evento"
            value={title}
            onChange={(e) => setTitle(e.target.value.substring(0, APP_CONFIG.EVENT_TITLE_MAX_LENGTH))}
            required
            fullWidth
            autoFocus
            helperText={`${title.length}/${APP_CONFIG.EVENT_TITLE_MAX_LENGTH} caracteres (Límite estricto para evitar desbordamientos)`}
          />
        </Box>

        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <TextField
              label="Orden Secuencial (Posición Narrativa)"
              type="number"
              inputProps={{ step: '0.1', min: '0' }}
              value={orderIndex}
              onChange={(e) => setOrderIndex(e.target.value)}
              fullWidth
              helperText="Estructura episódica basada en orden, no en fechas reales (RF-4.1)"
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              select
              label="Nivel de Relevancia"
              value={importanceLevel}
              onChange={(e) => setImportanceLevel(e.target.value)}
              fullWidth
            >
              {EVENT_IMPORTANCE.map((imp) => (
                <MenuItem key={imp.value} value={imp.value}>
                  {imp.label}
                </MenuItem>
              ))}
            </TextField>
          </Grid>
        </Grid>

        {/* Color tag picker */}
        <Box>
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1, fontWeight: 600 }}>
            Etiqueta de Color Mate
          </Typography>
          <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
            {tagColorPalette.map((color) => {
              const isSelected = colorTag === color;
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
                    boxShadow: isSelected ? '0 0 0 2px rgba(0,0,0,0.15)' : 'none',
                    transition: 'transform 0.1s ease',
                    '&:hover': {
                      transform: 'scale(1.15)',
                    },
                  }}
                />
              );
            })}
          </Box>
        </Box>

        {/* Multi-select characters (RF-4.2) */}
        <FormControl fullWidth size="small">
          <InputLabel id="event-characters-label">Personajes Involucrados</InputLabel>
          <Select
            labelId="event-characters-label"
            multiple
            value={selectedCharacterIds}
            onChange={handleCharacterChange}
            input={<OutlinedInput label="Personajes Involucrados" />}
            renderValue={(selected) => (
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                {selected.map((charId) => {
                  const char = characters.find((c) => c.id === charId);
                  return (
                    <Chip
                      key={charId}
                      size="small"
                      avatar={<Avatar src={char?.avatar_url}>{char?.name?.charAt(0)}</Avatar>}
                      label={char ? char.name : charId}
                    />
                  );
                })}
              </Box>
            )}
          >
            {characters.map((char) => (
              <MenuItem key={char.id} value={char.id}>
                <Checkbox checked={selectedCharacterIds.indexOf(char.id) > -1} size="small" />
                <Avatar
                  src={char.avatar_url}
                  sx={{ width: 24, height: 24, mr: 1, fontSize: '0.7rem' }}
                >
                  {char.name?.charAt(0)}
                </Avatar>
                <ListItemText primary={char.name} secondary={char.role_archetype} />
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <TextField
          label="Resumen Breve del Suceso"
          placeholder="Síntesis de lo que ocurre en este hito de la trama..."
          value={summary}
          onChange={(e) => setSummary(e.target.value)}
          multiline
          rows={2}
          fullWidth
        />

        <TextField
          label="Detalles Extendidos / Lore profundo"
          placeholder="Consecuencias, diálogos clave, secretos revelados, notas para el autor..."
          value={details}
          onChange={(e) => setDetails(e.target.value)}
          multiline
          rows={4}
          fullWidth
        />

        {/* Versioning options if editing (RF-4.6) */}
        {isEditing && (
          <Box sx={{ p: 1.5, bgcolor: 'background.subtle', borderRadius: 2, border: 1, borderColor: 'divider' }}>
            <FormControlLabel
              control={
                <Switch
                  checked={createBackup}
                  onChange={(e) => setCreateBackup(e.target.checked)}
                  color="primary"
                />
              }
              label={
                <Box>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    Crear copia de seguridad histórica antes de guardar
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Te permitirá restaurar el estado anterior en cualquier momento (RF-4.6)
                  </Typography>
                </Box>
              }
            />
            {createBackup && (
              <TextField
                label="Nota del respaldo (opcional)"
                placeholder="Ej: Estado antes de cambiar el giro dramático"
                value={backupNote}
                onChange={(e) => setBackupNote(e.target.value)}
                size="small"
                fullWidth
                sx={{ mt: 1.5 }}
              />
            )}
          </Box>
        )}

        <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1.5, mt: 1 }}>
          <CustomButton variant="outlined" color="inherit" onClick={onClose} disabled={loading}>
            Cancelar
          </CustomButton>
          <CustomButton type="submit" loading={loading}>
            {isEditing ? 'Guardar Cambios' : 'Crear Evento'}
          </CustomButton>
        </Box>
      </Box>
    </CustomModal>
  );
}
