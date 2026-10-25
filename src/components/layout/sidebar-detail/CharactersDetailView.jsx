import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Typography,
  Tabs,
  Tab,
  Paper,
  Divider,
  TextField,
  MenuItem,
  Chip,
  List,
  Tooltip,
  Button,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import PersonIcon from '@mui/icons-material/Person';
import HubIcon from '@mui/icons-material/Hub';
import AccountTreeOutlinedIcon from '@mui/icons-material/AccountTreeOutlined';
import CompareArrowsIcon from '@mui/icons-material/CompareArrows';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import PublicOutlinedIcon from '@mui/icons-material/PublicOutlined';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import BookmarkAddOutlinedIcon from '@mui/icons-material/BookmarkAddOutlined';
import CustomButton from '../../common/CustomButton';
import SelectionActionBar from '../../common/SelectionActionBar';
import { RELATIONSHIP_TYPES } from '../../../constants/constants';
import CharacterCard from '../../characters/CharacterCard';
import CopyGlobalConfirmModal from '../../characters/CopyGlobalConfirmModal';
import { useWorkspaceView, WORKSPACE_VIEW_KEYS } from '../../../context/WorkspaceViewContext';
import { useConfirm } from '../../../context/FeedbackContext';

export default function CharactersDetailView({
  storyId,
  characters = [],
  relationships = [],
  focusedCharacterId = null,
  isExpanded = false,
  onOpenCreateCharacter,
  onOpenEditCharacter,
  onOpenCloneCharacter,
  onDeleteCharacter,
  onSetCharactersGlobal,
  onCopyCharactersAsLocal,
  onRoleChange,
  onCreateRelationship,
  onDeleteRelationship,
}) {
  const confirm = useConfirm();
  const { setActiveView } = useWorkspaceView();
  const [tabIndex, setTabIndex] = useState(0);
  const containerRef = useRef(null);

  // Confirmation modal state for copying global characters
  const [confirmCopyOpen, setConfirmCopyOpen] = useState(false);
  const [pendingCopyList, setPendingCopyList] = useState([]);

  const lastHandledFocusIdRef = useRef(null);

  // New relationship form state
  const [sourceId, setSourceId] = useState('');
  const [targetId, setTargetId] = useState('');
  const [relType, setRelType] = useState('Aliado');
  const [relDesc, setRelDesc] = useState('');
  const [selectedCharacterIds, setSelectedCharacterIds] = useState([]);

  const handleAddRelationship = async (e) => {
    e.preventDefault();
    if (!sourceId || !targetId || sourceId === targetId) return;

    if (onCreateRelationship) {
      await onCreateRelationship({
        source_character_id: sourceId,
        target_character_id: targetId,
        relationship_type: relType,
        description: relDesc.trim(),
      });
    }

    setSourceId('');
    setTargetId('');
    setRelType('Aliado');
    setRelDesc('');
  };

  const toggleCharacterSelection = (characterId, event) => {
    if (!event?.ctrlKey && !event?.metaKey) {
      setSelectedCharacterIds((current) => (current.includes(characterId) ? [] : [characterId]));
      return;
    }

    setSelectedCharacterIds((current) =>
      current.includes(characterId)
        ? current.filter((id) => id !== characterId)
        : [...current, characterId]
    );
  };

  const handleSetSelectedGlobal = async (isGlobal) => {
    if (!selectedCharacterIds.length || !onSetCharactersGlobal) return;
    await onSetCharactersGlobal(selectedCharacterIds, isGlobal);
    setSelectedCharacterIds([]);
  };

  const handleCopyAsLocal = async (idsToCopy) => {
    if (!onCopyCharactersAsLocal || !idsToCopy?.length) return;
    const result = await onCopyCharactersAsLocal(idsToCopy);
    if (!result?.error && result?.data?.length) {
      setSelectedCharacterIds([]);
      setTabIndex(0);
      const firstNewId = result.data[0].id;
      setTimeout(() => {
        const el = document.getElementById(`character-card-${firstNewId}`);
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 250);
    }
  };

  const handleRequestCopyAsLocal = (charsOrIds) => {
    if (!charsOrIds || (Array.isArray(charsOrIds) && !charsOrIds.length)) return;
    const targetChars = Array.isArray(charsOrIds)
      ? typeof charsOrIds[0] === 'object'
        ? charsOrIds
        : characters.filter((c) => charsOrIds.includes(c.id))
      : typeof charsOrIds === 'object'
      ? [charsOrIds]
      : characters.filter((c) => c.id === charsOrIds);

    if (!targetChars.length) return;
    setPendingCopyList(targetChars);
    setConfirmCopyOpen(true);
  };

  // Filter local vs global
  const localCharacters = characters.filter((c) => !c.is_global);
  const globalCharacters = characters.filter((c) => c.is_global);

  // Auto-scroll to focused character
  useEffect(() => {
    if (focusedCharacterId && focusedCharacterId !== lastHandledFocusIdRef.current) {
      lastHandledFocusIdRef.current = focusedCharacterId;
      const targetChar = characters.find((c) => c.id === focusedCharacterId);
      if (targetChar) {
        setTabIndex(targetChar.is_global ? 1 : 0);
        setSelectedCharacterIds([focusedCharacterId]);
        setTimeout(() => {
          const el = document.getElementById(`character-card-${focusedCharacterId}`);
          if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'center' });
            el.classList.add('flash-highlight');
            setTimeout(() => el.classList.remove('flash-highlight'), 1600);
          }
        }, 200);
      }
    }
  }, [focusedCharacterId, characters]);

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', flexGrow: 1, overflow: 'hidden' }}>
      {/* Subtabs for Characters */}
      <Tabs
        value={tabIndex}
        onChange={(e, val) => setTabIndex(val)}
        variant="fullWidth"
        sx={{ borderBottom: 1, borderColor: 'divider', minHeight: 40 }}
      >
        <Tab
          icon={<PersonIcon sx={{ fontSize: 16 }} />}
          iconPosition="start"
          label={`Fichas (${localCharacters.length})`}
          sx={{ minHeight: 40, py: 0.5, fontSize: '0.78rem', fontWeight: 700, textTransform: 'none' }}
        />
        <Tab
          icon={<PublicOutlinedIcon sx={{ fontSize: 16 }} />}
          iconPosition="start"
          label={`Globales (${globalCharacters.length})`}
          sx={{ minHeight: 40, py: 0.5, fontSize: '0.78rem', fontWeight: 700, textTransform: 'none' }}
        />
        <Tab
          icon={<HubIcon sx={{ fontSize: 16 }} />}
          iconPosition="start"
          label={`Vínculos (${relationships.length})`}
          sx={{ minHeight: 40, py: 0.5, fontSize: '0.78rem', fontWeight: 700, textTransform: 'none' }}
        />
      </Tabs>

      {/* Main Content Area */}
      <Box ref={containerRef} sx={{ p: { xs: 1.5, sm: 2 }, overflowY: 'auto', flexGrow: 1, pb: selectedCharacterIds.length ? 10 : 2 }}>
        {/* TAB 0: FICHAS LOCALES */}
        {tabIndex === 0 && (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <CustomButton
                variant="outlined"
                color="secondary"
                size="small"
                startIcon={<AccountTreeOutlinedIcon fontSize="small" />}
                onClick={() => setActiveView(WORKSPACE_VIEW_KEYS.CHARACTERS)}
                sx={{ flex: 1, py: 0.6, fontSize: '0.75rem', fontWeight: 700 }}
              >
                Gestión Avanzada
              </CustomButton>

              <CustomButton
                variant="contained"
                size="small"
                startIcon={<AddIcon fontSize="small" />}
                onClick={onOpenCreateCharacter}
                sx={{ flex: 1, py: 0.6, fontSize: '0.75rem', fontWeight: 700 }}
              >
                Nuevo Personaje
              </CustomButton>
            </Box>

            {localCharacters.length === 0 ? (
              <Box sx={{ textAlign: 'center', py: 5, color: 'text.secondary' }}>
                <PersonIcon sx={{ fontSize: 44, opacity: 0.3, mb: 1 }} />
                <Typography variant="body2" sx={{ fontSize: '0.84rem' }}>
                  No hay personajes registrados en esta historia.
                </Typography>
              </Box>
            ) : (
              <Box
                sx={{
                  display: isExpanded ? 'grid' : 'flex',
                  gridTemplateColumns: isExpanded ? 'repeat(auto-fill, minmax(240px, 1fr))' : 'none',
                  flexDirection: isExpanded ? 'none' : 'column',
                  gap: 1,
                }}
              >
                {localCharacters.map((char) => (
                  <CharacterCard
                    key={char.id}
                    character={char}
                    isSelected={selectedCharacterIds.includes(char.id)}
                    onClick={(e) => toggleCharacterSelection(char.id, e)}
                    onEdit={onOpenEditCharacter}
                    onClone={onOpenCloneCharacter}
                    onDelete={onDeleteCharacter}
                    onMakeGlobal={() => onSetCharactersGlobal && onSetCharactersGlobal([char.id], true)}
                    onRoleChange={onRoleChange}
                  />
                ))}
              </Box>
            )}
          </Box>
        )}

        {/* TAB 1: PERSONAJES GLOBALES */}
        {tabIndex === 1 && (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
            <Box sx={{ p: 1.5, bgcolor: 'action.hover', borderRadius: 2 }}>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', lineHeight: 1.4 }}>
                Personajes compartidos entre proyectos. Puedes vincularlos o crear una copia local independiente.
              </Typography>
            </Box>

            {globalCharacters.length === 0 ? (
              <Box sx={{ textAlign: 'center', py: 5, color: 'text.secondary' }}>
                <PublicOutlinedIcon sx={{ fontSize: 44, opacity: 0.3, mb: 1 }} />
                <Typography variant="body2" sx={{ fontSize: '0.84rem' }}>
                  No hay personajes globales disponibles.
                </Typography>
              </Box>
            ) : (
              <Box
                sx={{
                  display: isExpanded ? 'grid' : 'flex',
                  gridTemplateColumns: isExpanded ? 'repeat(auto-fill, minmax(240px, 1fr))' : 'none',
                  flexDirection: isExpanded ? 'none' : 'column',
                  gap: 1,
                }}
              >
                {globalCharacters.map((char) => (
                  <CharacterCard
                    key={char.id}
                    character={char}
                    isSelected={selectedCharacterIds.includes(char.id)}
                    onClick={(e) => toggleCharacterSelection(char.id, e)}
                    onEdit={onOpenEditCharacter}
                    onClone={onOpenCloneCharacter}
                    onDelete={onDeleteCharacter}
                    onMakeLocal={() => onSetCharactersGlobal && onSetCharactersGlobal([char.id], false)}
                    onRoleChange={onRoleChange}
                    onCopyAsLocal={handleRequestCopyAsLocal}
                  />
                ))}
              </Box>
            )}
          </Box>
        )}

        {/* TAB 2: VÍNCULOS Y RELACIONES */}
        {tabIndex === 2 && (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Paper variant="outlined" sx={{ p: 1.8, borderRadius: 2 }}>
              <Typography variant="caption" sx={{ fontWeight: 800, textTransform: 'uppercase', mb: 1.5, display: 'block', color: 'primary.main' }}>
                Crear Nuevo Vínculo
              </Typography>

              <Box component="form" onSubmit={handleAddRelationship} sx={{ display: 'flex', flexDirection: 'column', gap: 1.2 }}>
                <TextField
                  select
                  size="small"
                  label="Personaje Origen"
                  value={sourceId}
                  onChange={(e) => setSourceId(e.target.value)}
                  fullWidth
                  required
                >
                  {characters.map((c) => (
                    <MenuItem key={c.id} value={c.id}>
                      {c.name}
                    </MenuItem>
                  ))}
                </TextField>

                <TextField
                  select
                  size="small"
                  label="Tipo de Vínculo"
                  value={relType}
                  onChange={(e) => setRelType(e.target.value)}
                  fullWidth
                >
                  {RELATIONSHIP_TYPES.map((t) => (
                    <MenuItem key={t.value} value={t.value}>
                      {t.label}
                    </MenuItem>
                  ))}
                </TextField>

                <TextField
                  select
                  size="small"
                  label="Personaje Destino"
                  value={targetId}
                  onChange={(e) => setTargetId(e.target.value)}
                  fullWidth
                  required
                >
                  {characters
                    .filter((c) => c.id !== sourceId)
                    .map((c) => (
                      <MenuItem key={c.id} value={c.id}>
                        {c.name}
                      </MenuItem>
                    ))}
                </TextField>

                <TextField
                  size="small"
                  label="Detalle / Contexto (opcional)"
                  placeholder="Ej: Amigos desde la infancia en Ppinedale..."
                  value={relDesc}
                  onChange={(e) => setRelDesc(e.target.value)}
                  fullWidth
                />

                <CustomButton type="submit" variant="contained" size="small" disabled={!sourceId || !targetId || sourceId === targetId} sx={{ mt: 0.5 }}>
                  Guardar Vínculo
                </CustomButton>
              </Box>
            </Paper>

            <Box>
              <Typography variant="caption" sx={{ fontWeight: 800, textTransform: 'uppercase', color: 'text.secondary', display: 'block', mb: 1 }}>
                Vínculos Existentes ({relationships.length})
              </Typography>

              {relationships.length === 0 ? (
                <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.8rem', textAlign: 'center', py: 3 }}>
                  No hay relaciones registradas entre los personajes de esta historia.
                </Typography>
              ) : (
                <List disablePadding sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  {relationships.map((rel) => {
                    const source = characters.find((c) => c.id === rel.source_character_id);
                    const target = characters.find((c) => c.id === rel.target_character_id);

                    return (
                      <Paper
                        key={rel.id}
                        variant="outlined"
                        sx={{
                          p: 1.2,
                          borderRadius: 2,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          gap: 1,
                        }}
                      >
                        <Box sx={{ minWidth: 0, flex: 1 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8, flexWrap: 'wrap' }}>
                            <Typography variant="subtitle2" sx={{ fontWeight: 800, fontSize: '0.82rem' }}>
                              {source?.name || 'Desconocido'}
                            </Typography>
                            <Chip label={rel.relationship_type} size="small" color="primary" sx={{ height: 18, fontSize: '0.65rem' }} />
                            <Typography variant="subtitle2" sx={{ fontWeight: 800, fontSize: '0.82rem' }}>
                              {target?.name || 'Desconocido'}
                            </Typography>
                          </Box>
                          {rel.description && (
                            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.3, fontSize: '0.74rem' }}>
                              {rel.description}
                            </Typography>
                          )}
                        </Box>

                        <Tooltip title="Eliminar vínculo">
                          <Button
                            size="small"
                            color="error"
                            onClick={() => onDeleteRelationship && onDeleteRelationship(rel.id)}
                            sx={{ minWidth: 28, p: 0.4 }}
                          >
                            <DeleteOutlineIcon fontSize="small" />
                          </Button>
                        </Tooltip>
                      </Paper>
                    );
                  })}
                </List>
              )}
            </Box>
          </Box>
        )}
      </Box>

      {/* Floating Selection Bar for Batch Actions */}
      {selectedCharacterIds.length > 0 && (
        <SelectionActionBar
          selectedCount={selectedCharacterIds.length}
          totalCount={characters.length}
          onSelectAll={() => setSelectedCharacterIds(characters.map((c) => c.id))}
          onDeselectAll={() => setSelectedCharacterIds([])}
          onMakeGlobal={() => handleSetSelectedGlobal(true)}
          onMakeLocal={() => handleSetSelectedGlobal(false)}
          onCopyAsLocal={() => handleRequestCopyAsLocal(selectedCharacterIds)}
          onDeleteSelected={async () => {
            const total = selectedCharacterIds.length;
            const accepted = await confirm({
              title: total === 1 ? 'Eliminar personaje' : `Eliminar ${total} personajes`,
              description: 'Se eliminarán de forma permanente junto con sus relaciones. Esta acción no se puede deshacer.',
              confirmText: 'Eliminar',
              tone: 'danger',
            });
            if (accepted) {
              selectedCharacterIds.forEach((id) => onDeleteCharacter && onDeleteCharacter(id));
              setSelectedCharacterIds([]);
            }
          }}
        />
      )}

      {/* Modal confirmation for copy */}
      <CopyGlobalConfirmModal
        open={confirmCopyOpen}
        onClose={() => setConfirmCopyOpen(false)}
        characters={pendingCopyList}
        onConfirm={handleCopyAsLocal}
      />
    </Box>
  );
}
