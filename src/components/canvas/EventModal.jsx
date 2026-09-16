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
  Button,
  Collapse,
  Divider,
} from '@mui/material';
import EventIcon from '@mui/icons-material/Event';
import BookmarkBorderIcon from '@mui/icons-material/BookmarkBorder';
import TuneIcon from '@mui/icons-material/Tune';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import PeopleOutlineIcon from '@mui/icons-material/PeopleOutline';
import DescriptionOutlinedIcon from '@mui/icons-material/DescriptionOutlined';
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

  // Progressive disclosure toggle
  const [showAdvanced, setShowAdvanced] = useState(false);

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

      // If event already has deep details or assigned characters, open advanced by default
      if (charIds.length > 0 || event.details) {
        setShowAdvanced(true);
      } else {
        setShowAdvanced(false);
      }
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
      setShowAdvanced(false);
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
        order_index: event?.order_index || 1.0,
        importance_level: importanceLevel,
        color_tag: colorTag,
      },
      characterIds: selectedCharacterIds,
      createBackup: Boolean(event && createBackup),
      backupNote: backupNote.trim() || 'Copia previa a modificación',
    });
  };

  const handleCharacterChange = (e) => {
    const {
      target: { value },
    } = e;
    setSelectedCharacterIds(typeof value === 'string' ? value.split(',') : value);
  };

  const isEditing = Boolean(event);

  return (
    <CustomModal
      open={open}
      onClose={onClose}
      title={isEditing ? 'Editar Evento de la Trama' : 'Nuevo Evento en la Línea de Tiempo'}
      subtitle="Estructura la secuencia narrativa y el impacto del suceso"
      icon={EventIcon}
      maxWidth="sm"
    >
      <Box component="form" onSubmit={handleSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {/* ─── 1. TÍTULO DEL EVENTO (Input Principal Destacado) ─── */}
        <Box>
          <TextField
            label="Título del Evento *"
            placeholder="Ej: La emboscada en el muelle, La revelación del pacto..."
            value={title}
            onChange={(e) => setTitle(e.target.value.substring(0, APP_CONFIG.EVENT_TITLE_MAX_LENGTH))}
            required
            fullWidth
            autoFocus
            InputProps={{
              sx: { fontSize: '1.05rem', fontWeight: 700, borderRadius: 2.5 },
            }}
            helperText={`${title.length}/${APP_CONFIG.EVENT_TITLE_MAX_LENGTH} caracteres`}
          />
        </Box>

        {/* ─── 2. RELEVANCIA Y COLOR DISTINTIVO ─── */}
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={6}>
            <TextField
              select
              label="Nivel de Relevancia"
              value={importanceLevel}
              onChange={(e) => setImportanceLevel(e.target.value)}
              fullWidth
              size="small"
              InputProps={{ sx: { borderRadius: 2 } }}
            >
              {EVENT_IMPORTANCE.map((imp) => (
                <MenuItem key={imp.value} value={imp.value}>
                  {imp.label}
                </MenuItem>
              ))}
            </TextField>
          </Grid>

          <Grid item xs={12} sm={6}>
            <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', flexWrap: 'wrap' }}>
              <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, fontSize: '0.72rem' }}>
                Color:
              </Typography>
              {tagColorPalette.map((color) => {
                const isSelected = colorTag === color;
                return (
                  <Box
                    key={color}
                    onClick={() => setColorTag(color)}
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

        {/* ─── 3. RESUMEN BREVE DEL SUCESO (Básico) ─── */}
        <TextField
          label="Resumen Breve del Suceso"
          placeholder="Síntesis de lo que ocurre en este hito de la historia…"
          value={summary}
          onChange={(e) => setSummary(e.target.value)}
          multiline
          rows={2}
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
            {showAdvanced ? 'Ocultar opciones avanzadas' : '⚙️ Más opciones (Personajes, Lore profundo, Respaldo…)'}
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
            {/* Multi-select characters */}
            <FormControl fullWidth size="small">
              <InputLabel id="event-characters-label">Personajes Involucrados</InputLabel>
              <Select
                labelId="event-characters-label"
                multiple
                value={selectedCharacterIds}
                onChange={handleCharacterChange}
                input={<OutlinedInput label="Personajes Involucrados" sx={{ borderRadius: 2 }} />}
                renderValue={(selected) => (
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {selected.map((charId) => {
                      const char = characters.find((c) => c.id === charId);
                      return (
                        <Chip
                          key={charId}
                          size="small"
                          avatar={<Avatar src={char?.avatar_url} sx={{ bgcolor: char?.color_tag }}>{char?.name?.charAt(0)}</Avatar>}
                          label={char ? char.name : charId}
                          sx={{ height: 22, fontSize: '0.72rem', fontWeight: 600 }}
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
                      sx={{ width: 24, height: 24, mr: 1, fontSize: '0.7rem', bgcolor: char.color_tag }}
                    >
                      {char.name?.charAt(0)}
                    </Avatar>
                    <ListItemText primary={char.name} secondary={char.role_archetype} />
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            {/* Lore profundo / Detalles extendidos */}
            <TextField
              label="Detalles Extendidos / Lore Profundo"
              placeholder="Consecuencias, diálogos clave, secretos revelados, notas privadas…"
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              multiline
              rows={3}
              fullWidth
              size="small"
              InputProps={{ sx: { borderRadius: 2, fontSize: '0.88rem' } }}
            />

            {/* Versioning / Backup options when editing */}
            {isEditing && (
              <Box sx={{ p: 1.5, bgcolor: 'background.paper', borderRadius: 2, border: 1, borderColor: 'divider' }}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={createBackup}
                      onChange={(e) => setCreateBackup(e.target.checked)}
                      color="primary"
                      size="small"
                    />
                  }
                  label={
                    <Typography variant="body2" sx={{ fontWeight: 700, fontSize: '0.84rem', display: 'flex', alignItems: 'center', gap: 0.6 }}>
                      <BookmarkBorderIcon sx={{ fontSize: 16 }} color="primary" /> Crear punto de respaldo previo
                    </Typography>
                  }
                />
                
                {createBackup && (
                  <TextField
                    label="Nota del respaldo (opcional)"
                    placeholder="Ej: Ajustando la motivación de la escena"
                    value={backupNote}
                    onChange={(e) => setBackupNote(e.target.value)}
                    size="small"
                    fullWidth
                    sx={{ mt: 1.2 }}
                  />
                )}
              </Box>
            )}
          </Box>
        </Collapse>

        <Divider sx={{ my: 0.5 }} />

        {/* Modal Actions */}
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
