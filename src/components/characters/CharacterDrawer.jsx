import React, { useState } from 'react';
import {
  Drawer,
  Box,
  Typography,
  IconButton,
  Tabs,
  Tab,
  Avatar,
  Paper,
  Divider,
  Chip,
  Tooltip,
  TextField,
  MenuItem,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  ListItemSecondaryAction,
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import CloseIcon from '@mui/icons-material/Close';
import AddIcon from '@mui/icons-material/Add';
import PersonIcon from '@mui/icons-material/Person';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import HubIcon from '@mui/icons-material/Hub';
import CompareArrowsIcon from '@mui/icons-material/CompareArrows';
import CustomButton from '../common/CustomButton';
import { RELATIONSHIP_TYPES } from '../../constants/constants';

export default function CharacterDrawer({
  open,
  onClose,
  characters = [],
  relationships = [],
  onOpenCreateCharacter,
  onOpenEditCharacter,
  onOpenCloneCharacter,
  onDeleteCharacter,
  onCreateRelationship,
  onDeleteRelationship,
}) {
  const [tabIndex, setTabIndex] = useState(0);

  // New relationship form state
  const [sourceId, setSourceId] = useState('');
  const [targetId, setTargetId] = useState('');
  const [relType, setRelType] = useState('Aliado');
  const [relDesc, setRelDesc] = useState('');

  const handleAddRelationship = async (e) => {
    e.preventDefault();
    if (!sourceId || !targetId || sourceId === targetId) return;

    await onCreateRelationship({
      source_character_id: sourceId,
      target_character_id: targetId,
      relationship_type: relType,
      description: relDesc.trim(),
    });

    setSourceId('');
    setTargetId('');
    setRelType('Aliado');
    setRelDesc('');
  };

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      PaperProps={{
        sx: {
          width: { xs: '100%', sm: 420 },
          bgcolor: 'background.paper',
          borderLeft: 1,
          borderColor: 'divider',
        },
      }}
    >
      {/* Header */}
      <Box
        sx={{
          p: 2,
          px: 2.5,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: 1,
          borderColor: 'divider',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2 }}>
          <PersonIcon color="primary" />
          <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
            Personajes y Relaciones
          </Typography>
        </Box>
        <IconButton size="small" onClick={onClose}>
          <CloseIcon fontSize="small" />
        </IconButton>
      </Box>

      {/* Tabs */}
      <Tabs
        value={tabIndex}
        onChange={(e, val) => setTabIndex(val)}
        variant="fullWidth"
        sx={{ borderBottom: 1, borderColor: 'divider', minHeight: 44 }}
      >
        <Tab
          icon={<PersonIcon fontSize="small" />}
          iconPosition="start"
          label={`Fichas (${characters.length})`}
          sx={{ minHeight: 44, fontSize: '0.85rem' }}
        />
        <Tab
          icon={<HubIcon fontSize="small" />}
          iconPosition="start"
          label={`Relaciones (${relationships.length})`}
          sx={{ minHeight: 44, fontSize: '0.85rem' }}
        />
      </Tabs>

      {/* Tab 0: Characters List */}
      {tabIndex === 0 && (
        <Box sx={{ p: 2, display: 'flex', flexDirection: 'column', gap: 2, overflowY: 'auto', flexGrow: 1 }}>
          <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
            <CustomButton
              size="small"
              startIcon={<AddIcon fontSize="small" />}
              onClick={onOpenCreateCharacter}
            >
              Nuevo Personaje
            </CustomButton>
          </Box>

          {characters.length === 0 ? (
            <Box sx={{ p: 4, textAlign: 'center', bgcolor: 'background.subtle', borderRadius: 2 }}>
              <PersonIcon sx={{ fontSize: 40, color: 'text.disabled', mb: 1 }} />
              <Typography variant="body2" color="text.secondary">
                No hay personajes en esta historia aún.
              </Typography>
            </Box>
          ) : (
            characters.map((char) => (
              <Paper
                key={char.id}
                elevation={0}
                sx={{
                  p: 1.8,
                  border: '1.5px solid',
                  borderColor: char.color_tag ? alpha(char.color_tag, 0.4) : 'divider',
                  borderRadius: 2.5,
                  bgcolor: char.color_tag ? alpha(char.color_tag, 0.12) : 'background.paper',
                  background: char.color_tag
                    ? `linear-gradient(135deg, ${alpha(char.color_tag, 0.16)} 0%, ${alpha(char.color_tag, 0.04)} 100%)`
                    : 'background.paper',
                  boxShadow: char.color_tag ? `0 2px 10px ${alpha(char.color_tag, 0.15)}` : 'none',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 1,
                  transition: 'all 0.2s ease',
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                  <Avatar
                    src={char.avatar_url}
                    alt={char.name}
                    sx={{
                      width: 44,
                      height: 44,
                      bgcolor: char.color_tag || 'primary.main',
                      color: '#ffffff',
                      fontWeight: 600,
                    }}
                  >
                    {char.name?.charAt(0)}
                  </Avatar>
                  <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8, flexWrap: 'wrap' }}>
                      <Typography variant="subtitle2" sx={{ fontWeight: 700 }} noWrap>
                        {char.name}
                      </Typography>
                      {char.is_template && (
                        <Chip
                          label="Plantilla"
                          size="small"
                          color="secondary"
                          sx={{ height: 18, fontSize: '0.65rem' }}
                        />
                      )}
                    </Box>
                    <Typography variant="caption" color="text.secondary" display="block">
                      {char.role_archetype || 'Sin arquetipo'}
                    </Typography>
                  </Box>
                </Box>

                {char.biography && (
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{
                      fontSize: '0.8rem',
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                      mt: 0.5,
                    }}
                  >
                    {char.biography}
                  </Typography>
                )}

                <Divider sx={{ my: 0.5 }} />

                <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 0.5 }}>
                  <Tooltip title="Clonar / Versión alterna (RF-3.4)">
                    <IconButton
                      size="small"
                      onClick={() => onOpenCloneCharacter(char)}
                      sx={{ color: 'text.secondary' }}
                    >
                      <ContentCopyIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Editar ficha">
                    <IconButton
                      size="small"
                      onClick={() => onOpenEditCharacter(char)}
                      sx={{ color: 'text.secondary' }}
                    >
                      <EditOutlinedIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Eliminar personaje">
                    <IconButton
                      size="small"
                      onClick={() => onDeleteCharacter(char.id)}
                      sx={{ color: 'error.main' }}
                    >
                      <DeleteOutlineIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </Box>
              </Paper>
            ))
          )}
        </Box>
      )}

      {/* Tab 1: Relationships Map */}
      {tabIndex === 1 && (
        <Box sx={{ p: 2, display: 'flex', flexDirection: 'column', gap: 2, overflowY: 'auto', flexGrow: 1 }}>
          {/* New Relationship Form */}
          <Paper
            component="form"
            onSubmit={handleAddRelationship}
            elevation={0}
            sx={{
              p: 2,
              border: 1,
              borderColor: 'divider',
              borderRadius: 2,
              bgcolor: 'background.subtle',
              display: 'flex',
              flexDirection: 'column',
              gap: 1.5,
            }}
          >
            <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
              Vincular Personajes (RF-3.3)
            </Typography>

            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1.5 }}>
              <TextField
                select
                label="Personaje Origen"
                value={sourceId}
                onChange={(e) => setSourceId(e.target.value)}
                required
                fullWidth
              >
                {characters.map((c) => (
                  <MenuItem key={c.id} value={c.id}>
                    {c.name}
                  </MenuItem>
                ))}
              </TextField>

              <TextField
                select
                label="Personaje Destino"
                value={targetId}
                onChange={(e) => setTargetId(e.target.value)}
                required
                fullWidth
              >
                {characters.filter((c) => c.id !== sourceId).map((c) => (
                  <MenuItem key={c.id} value={c.id}>
                    {c.name}
                  </MenuItem>
                ))}
              </TextField>
            </Box>

            <TextField
              select
              label="Tipo de Vínculo / Relación"
              value={relType}
              onChange={(e) => setRelType(e.target.value)}
              fullWidth
            >
              {RELATIONSHIP_TYPES.map((t) => (
                <MenuItem key={t} value={t}>
                  {t}
                </MenuItem>
              ))}
            </TextField>

            <TextField
              label="Descripción de la relación"
              placeholder="Ej: Hermanos separados al nacer, rivales ideológicos..."
              value={relDesc}
              onChange={(e) => setRelDesc(e.target.value)}
              fullWidth
            />

            <CustomButton
              type="submit"
              size="small"
              disabled={!sourceId || !targetId || sourceId === targetId}
              startIcon={<CompareArrowsIcon fontSize="small" />}
            >
              Añadir Vínculo
            </CustomButton>
          </Paper>

          {/* List of Relationships */}
          <List sx={{ p: 0, display: 'flex', flexDirection: 'column', gap: 1 }}>
            {relationships.length === 0 ? (
              <Box sx={{ p: 3, textAlign: 'center', bgcolor: 'background.subtle', borderRadius: 2 }}>
                <HubIcon sx={{ fontSize: 36, color: 'text.disabled', mb: 1 }} />
                <Typography variant="body2" color="text.secondary">
                  No se han trazado relaciones entre personajes.
                </Typography>
              </Box>
            ) : (
              relationships.map((rel) => (
                <Paper
                  key={rel.id}
                  elevation={0}
                  sx={{
                    p: 1.5,
                    border: 1,
                    borderColor: 'divider',
                    borderRadius: 2,
                    bgcolor: 'background.paper',
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography variant="body2" sx={{ fontWeight: 700 }}>
                        {rel.source?.name || 'Personaje A'}
                      </Typography>
                      <CompareArrowsIcon fontSize="small" sx={{ color: 'primary.main' }} />
                      <Typography variant="body2" sx={{ fontWeight: 700 }}>
                        {rel.target?.name || 'Personaje B'}
                      </Typography>
                    </Box>
                    <IconButton
                      size="small"
                      onClick={() => onDeleteRelationship(rel.id)}
                      sx={{ color: 'error.main' }}
                    >
                      <DeleteOutlineIcon fontSize="small" />
                    </IconButton>
                  </Box>

                  <Chip
                    label={rel.relationship_type}
                    size="small"
                    color="primary"
                    variant="outlined"
                    sx={{ height: 22, fontSize: '0.7rem', mb: rel.description ? 0.8 : 0 }}
                  />

                  {rel.description && (
                    <Typography variant="caption" color="text.secondary" display="block">
                      {rel.description}
                    </Typography>
                  )}
                </Paper>
              ))
            )}
          </List>
        </Box>
      )}
    </Drawer>
  );
}
