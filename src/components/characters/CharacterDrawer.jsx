import React, { useState } from 'react';
import {
  Drawer,
  Box,
  Typography,
  IconButton,
  Tabs,
  Tab,
  Paper,
  Divider,
  TextField,
  MenuItem,
  Chip,
  List,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import AddIcon from '@mui/icons-material/Add';
import PersonIcon from '@mui/icons-material/Person';
import HubIcon from '@mui/icons-material/Hub';
import AccountTreeOutlinedIcon from '@mui/icons-material/AccountTreeOutlined';
import CompareArrowsIcon from '@mui/icons-material/CompareArrows';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import PublicOutlinedIcon from '@mui/icons-material/PublicOutlined';
import CustomButton from '../common/CustomButton';
import SelectionActionBar from '../common/SelectionActionBar';
import { RELATIONSHIP_TYPES } from '../../constants/constants';
import CharacterCard from './CharacterCard';

export default function CharacterDrawer({
  open,
  onClose,
  storyId,
  characters = [],
  relationships = [],
  onOpenCreateCharacter,
  onOpenEditCharacter,
  onOpenCloneCharacter,
  onDeleteCharacter,
  onSetCharactersGlobal,
  onCreateRelationship,
  onDeleteRelationship,
}) {
  const [tabIndex, setTabIndex] = useState(0);

  // New relationship form state
  const [sourceId, setSourceId] = useState('');
  const [targetId, setTargetId] = useState('');
  const [relType, setRelType] = useState('Aliado');
  const [relDesc, setRelDesc] = useState('');
  const [selectedCharacterIds, setSelectedCharacterIds] = useState([]);

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

  const toggleCharacterSelection = (characterId, event) => {
    if (!event?.ctrlKey && !event?.metaKey) {
      setSelectedCharacterIds([characterId]);
      return;
    }

    setSelectedCharacterIds((current) => current.includes(characterId)
      ? current.filter((id) => id !== characterId)
      : [...current, characterId]);
  };

  const handleSetSelectedGlobal = async (isGlobal) => {
    if (!selectedCharacterIds.length) return;
    await onSetCharactersGlobal(selectedCharacterIds, isGlobal);
    setSelectedCharacterIds([]);
  };

  const globalCharacters = characters.filter((character) => character.is_global);
  const localCharacters = characters.filter(
    (character) => !character.is_global || character.story_id === storyId
  );

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
          label={`Fichas (${localCharacters.length})`}
          sx={{ minHeight: 44, fontSize: '0.85rem' }}
        />
        <Tab
          icon={<HubIcon fontSize="small" />}
          iconPosition="start"
          label={`Relaciones (${relationships.length})`}
          sx={{ minHeight: 44, fontSize: '0.85rem' }}
        />
        <Tab
          icon={<PublicOutlinedIcon fontSize="small" />}
          iconPosition="start"
          label={`Globales (${globalCharacters.length})`}
          sx={{ minHeight: 44, fontSize: '0.78rem' }}
        />
      </Tabs>

      {/* Tab 0: Characters List */}
      {tabIndex === 0 && (
        <Box sx={{ p: 2, display: 'flex', flexDirection: 'column', gap: 2, overflowY: 'auto', flex: '1 0 auto' }}>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <CustomButton
                variant="outlined"
                size="small"
                startIcon={<AccountTreeOutlinedIcon fontSize="small" />}
                component="a"
                href={`/characters/${storyId}`}
            >
                Gestión
            </CustomButton>
            <CustomButton
              size="small"
              startIcon={<AddIcon fontSize="small" />}
              onClick={onOpenCreateCharacter}
            >
              Nuevo Personaje
            </CustomButton>
          </Box>

          {localCharacters.length === 0 ? (
            <Box sx={{ p: 4, textAlign: 'center', bgcolor: 'background.subtle', borderRadius: 2 }}>
              <PersonIcon sx={{ fontSize: 40, color: 'text.disabled', mb: 1 }} />
              <Typography variant="body2" color="text.secondary">
                No hay personajes en esta historia aún.
              </Typography>
            </Box>
          ) : (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, flex: '1 0 auto' }}>
                {localCharacters.map((char) => (
                <CharacterCard
                    key={char.id}
                    character={char}
                    selectable
                    selected={selectedCharacterIds.includes(char.id)}
                    onSelect={toggleCharacterSelection}
                    onEdit={onOpenEditCharacter}
                    onDelete={onDeleteCharacter}
                    onClone={onOpenCloneCharacter}
                />
                ))}
            </Box>
          )}
        </Box>
      )}

      {tabIndex === 2 && (
        <Box sx={{ p: 2, display: 'flex', flexDirection: 'column', gap: 1.5, overflowY: 'auto', flexGrow: 1 }}>
          {globalCharacters.length === 0 ? (
            <Box sx={{ p: 3, textAlign: 'center', bgcolor: 'background.subtle', borderRadius: 2 }}>
              <PublicOutlinedIcon sx={{ fontSize: 36, color: 'text.disabled', mb: 1 }} />
              <Typography variant="body2" color="text.secondary">
                Aún no hay personajes globales.
              </Typography>
            </Box>
          ) : (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              {globalCharacters.map((character) => (
                <CharacterCard
                  key={character.id}
                  character={character}
                  selectable
                  selected={selectedCharacterIds.includes(character.id)}
                  onSelect={toggleCharacterSelection}
                  onEdit={onOpenEditCharacter}
                  onDelete={onDeleteCharacter}
                  onClone={onOpenCloneCharacter}
                />
              ))}
            </Box>
          )}
        </Box>
      )}

      <SelectionActionBar
        count={selectedCharacterIds.length}
        onClear={() => setSelectedCharacterIds([])}
        actions={[
          {
            key: 'make-global',
            label: 'Hacer globales',
            tooltip: 'Hacer globales',
            icon: <PublicOutlinedIcon fontSize="small" />,
            onClick: () => handleSetSelectedGlobal(true),
            color: 'secondary',
          },
          {
            key: 'remove-global',
            label: 'Quitar global',
            tooltip: 'Quitar estado global',
            icon: <PersonIcon fontSize="small" />,
            onClick: () => handleSetSelectedGlobal(false),
          },
        ]}
      />

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
