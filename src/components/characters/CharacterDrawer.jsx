import React, { useState, useEffect, useRef } from 'react';
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
  Tooltip,
  Button,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import AddIcon from '@mui/icons-material/Add';
import PersonIcon from '@mui/icons-material/Person';
import HubIcon from '@mui/icons-material/Hub';
import AccountTreeOutlinedIcon from '@mui/icons-material/AccountTreeOutlined';
import CompareArrowsIcon from '@mui/icons-material/CompareArrows';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import PublicOutlinedIcon from '@mui/icons-material/PublicOutlined';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import PushPinIcon from '@mui/icons-material/PushPin';
import PushPinOutlinedIcon from '@mui/icons-material/PushPinOutlined';
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
  focusedCharacterId = null,
  onOpenCreateCharacter,
  onOpenEditCharacter,
  onOpenCloneCharacter,
  onDeleteCharacter,
  onSetCharactersGlobal,
  onCreateRelationship,
  onDeleteRelationship,
}) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [tabIndex, setTabIndex] = useState(0);

  // Pin/Dock state on Desktop
  const [isPinned, setIsPinnedState] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('lorebook_char_drawer_pinned') === 'true';
    }
    return false;
  });
  const drawerRef = useRef(null);

  useEffect(() => {
    if (!open || isPinned || isMobile) return;

    // Use a small delay to ensure the event that opened the drawer 
    // doesn't trigger the click-outside closure immediately.
    const timer = setTimeout(() => {
      function handleClickOutside(event) {
        if (drawerRef.current && !drawerRef.current.contains(event.target)) {
          onClose();
        }
      }

      document.addEventListener("click", handleClickOutside, true); // Use capture phase
      
      // Cleanup: remove listener when the effect re-runs or component unmounts
      // and also clean up the timer.
      return () => {
        document.removeEventListener("click", handleClickOutside, true);
      };
    }, 100);

    return () => clearTimeout(timer);
  }, [open, isPinned, isMobile, onClose]);
  const lastHandledFocusIdRef = useRef(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('lorebook_char_drawer_pinned');
      if (saved === 'true') {
        setIsPinnedState(true);
      }
    }
  }, []);

  const togglePinned = () => {
    setIsPinnedState((prev) => {
      const next = !prev;
      if (typeof window !== 'undefined') {
        localStorage.setItem('lorebook_char_drawer_pinned', next ? 'true' : 'false');
      }
      return next;
    });
  };

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

  // Allow toggling selection off on click
  const toggleCharacterSelection = (characterId, event) => {
    if (!event?.ctrlKey && !event?.metaKey) {
      setSelectedCharacterIds((current) => current.includes(characterId) ? [] : [characterId]);
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

  // Auto-focus and scroll to character ONCE per focusedCharacterId change
  useEffect(() => {
    if (open && focusedCharacterId) {
      if (lastHandledFocusIdRef.current !== focusedCharacterId) {
        lastHandledFocusIdRef.current = focusedCharacterId;
        const isOnlyGlobal = !characters.some((c) => (!c.is_global || c.story_id === storyId) && c.id === focusedCharacterId) && characters.some((c) => c.is_global && c.id === focusedCharacterId);
        if (isOnlyGlobal) {
          setTabIndex(2);
        } else {
          setTabIndex(0);
        }
        setSelectedCharacterIds([focusedCharacterId]);
        
        const timer = setTimeout(() => {
          const el = document.getElementById(`character-card-${focusedCharacterId}`);
          if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
        }, 200);

        return () => clearTimeout(timer);
      }
    } else if (!open) {
      lastHandledFocusIdRef.current = null;
    }
  }, [open, focusedCharacterId, storyId, characters]);

  if (!open) return null;

  const drawerContent = (
    <Box
      ref={drawerRef}
      sx={{
        width: { xs: '100vw', sm: 400, md: 420 },
        height: '100%',
        bgcolor: 'background.paper',
        display: 'flex',
        flexDirection: 'column',
        borderLeft: { xs: 0, sm: 1 },
        borderColor: 'divider',
        position: 'relative',
        boxShadow: { xs: 'none', sm: isPinned ? 'none' : '0 8px 32px rgba(0,0,0,0.18)' },
      }}
    >
      {/* Mobile Drag Indicator */}
      {isMobile && (
        <Box sx={{ display: 'flex', justifyContent: 'center', pt: 1.2, pb: 0.5 }}>
          <Box sx={{ width: 44, height: 4, borderRadius: 2, bgcolor: 'divider' }} />
        </Box>
      )}

      {/* Header */}
      <Box
        sx={{
          p: { xs: 1.5, sm: 1.8 },
          px: { xs: 1.8, sm: 2.2 },
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: 1,
          borderColor: 'divider',
          bgcolor: 'background.paper',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <PersonIcon color="primary" />
          <Typography variant="subtitle1" sx={{ fontWeight: 800, fontSize: { xs: '0.92rem', sm: '0.98rem' } }}>
            Personajes {isMobile ? '' : 'y Relaciones'}
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8 }}>
          {/* Pin/Dock Button on Desktop */}
          {!isMobile && (
            <Tooltip title={isPinned ? 'Desacoplar panel (flotante)' : 'Fijar panel a la derecha (modo acoplado)'}>
              <IconButton
                size="small"
                onClick={togglePinned}
                color={isPinned ? 'primary' : 'default'}
                sx={{
                  border: 1,
                  borderColor: isPinned ? 'primary.main' : 'divider',
                  bgcolor: isPinned ? 'primary.lighter' : 'transparent',
                  p: 0.6,
                }}
              >
                {isPinned ? <PushPinIcon fontSize="small" /> : <PushPinOutlinedIcon fontSize="small" />}
              </IconButton>
            </Tooltip>
          )}

          {/* Obvious, Prominent Close Button */}
          <Button
            size="small"
            variant="outlined"
            color="inherit"
            startIcon={<CloseIcon fontSize="small" />}
            onClick={onClose}
            sx={{
              fontWeight: 700,
              fontSize: '0.78rem',
              textTransform: 'none',
              borderRadius: 2,
              px: { xs: 1.2, sm: 1.5 },
              py: 0.35,
              borderColor: 'divider',
              bgcolor: 'action.hover',
              '&:hover': {
                bgcolor: 'error.main',
                color: '#fff',
                borderColor: 'error.main',
              },
              transition: 'all 0.15s ease',
            }}
          >
            Cerrar
          </Button>
        </Box>
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
          sx={{ minHeight: 44, fontSize: '0.82rem', fontWeight: 700, textTransform: 'none' }}
        />
        <Tab
          icon={<HubIcon fontSize="small" />}
          iconPosition="start"
          label={`Vínculos (${relationships.length})`}
          sx={{ minHeight: 44, fontSize: '0.82rem', fontWeight: 700, textTransform: 'none' }}
        />
        <Tab
          icon={<PublicOutlinedIcon fontSize="small" />}
          iconPosition="start"
          label={`Globales (${globalCharacters.length})`}
          sx={{ minHeight: 44, fontSize: '0.82rem', fontWeight: 700, textTransform: 'none' }}
        />
      </Tabs>

      {/* Tab 0: Characters List */}
      {tabIndex === 0 && (
        <Box sx={{ p: 2, display: 'flex', flexDirection: 'column', gap: 2, overflowY: 'auto', flex: 1 }}>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <CustomButton
              variant="outlined"
              size="small"
              startIcon={<AccountTreeOutlinedIcon fontSize="small" />}
              component="a"
              href={`/characters/${storyId}`}
              sx={{ borderRadius: 2 }}
            >
              Gestión Avanzada
            </CustomButton>
            <CustomButton
              size="small"
              startIcon={<AddIcon fontSize="small" />}
              onClick={onOpenCreateCharacter}
              sx={{ borderRadius: 2 }}
            >
              Nuevo Personaje
            </CustomButton>
          </Box>

          {localCharacters.length === 0 ? (
            <Box sx={{ p: 4, textAlign: 'center', bgcolor: 'background.subtle', borderRadius: 3 }}>
              <PersonIcon sx={{ fontSize: 40, color: 'text.disabled', mb: 1 }} />
              <Typography variant="body2" color="text.secondary">
                No hay personajes en esta historia aún.
              </Typography>
            </Box>
          ) : (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.2 }}>
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

      {/* Tab 1: Relationships Map */}
      {tabIndex === 1 && (
        <Box sx={{ p: 2, display: 'flex', flexDirection: 'column', gap: 2, overflowY: 'auto', flex: 1 }}>
          {/* New Relationship Form */}
          <Paper
            component="form"
            onSubmit={handleAddRelationship}
            elevation={0}
            sx={{
              p: 2,
              border: 1,
              borderColor: 'divider',
              borderRadius: 3,
              bgcolor: 'background.subtle',
              display: 'flex',
              flexDirection: 'column',
              gap: 1.5,
            }}
          >
            <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
              Vincular Personajes
            </Typography>

            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1.5 }}>
              <TextField
                select
                label="Personaje Origen"
                value={sourceId}
                onChange={(e) => setSourceId(e.target.value)}
                required
                fullWidth
                size="small"
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
                size="small"
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
              label="Tipo de Vínculo"
              value={relType}
              onChange={(e) => setRelType(e.target.value)}
              fullWidth
              size="small"
            >
              {RELATIONSHIP_TYPES.map((t) => (
                <MenuItem key={t} value={t}>
                  {t}
                </MenuItem>
              ))}
            </TextField>

            <TextField
              label="Descripción de la relación"
              placeholder="Ej: Hermanos, rivales ideológicos, maestro y aprendiz…"
              value={relDesc}
              onChange={(e) => setRelDesc(e.target.value)}
              fullWidth
              size="small"
            />

            <CustomButton
              type="submit"
              size="small"
              disabled={!sourceId || !targetId || sourceId === targetId}
              startIcon={<CompareArrowsIcon fontSize="small" />}
              sx={{ borderRadius: 2 }}
            >
              Añadir Vínculo
            </CustomButton>
          </Paper>

          {/* List of Relationships */}
          <List sx={{ p: 0, display: 'flex', flexDirection: 'column', gap: 1 }}>
            {relationships.length === 0 ? (
              <Box sx={{ p: 3, textAlign: 'center', bgcolor: 'background.subtle', borderRadius: 3 }}>
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
                    borderRadius: 2.5,
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
                    <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 0.5 }}>
                      {rel.description}
                    </Typography>
                  )}
                </Paper>
              ))
            )}
          </List>
        </Box>
      )}

      {/* Tab 2: Global Characters */}
      {tabIndex === 2 && (
        <Box sx={{ p: 2, display: 'flex', flexDirection: 'column', gap: 1.5, overflowY: 'auto', flex: 1 }}>
          {globalCharacters.length === 0 ? (
            <Box sx={{ p: 3, textAlign: 'center', bgcolor: 'background.subtle', borderRadius: 3 }}>
              <PublicOutlinedIcon sx={{ fontSize: 36, color: 'text.disabled', mb: 1 }} />
              <Typography variant="body2" color="text.secondary">
                Aún no hay personajes globales en el workspace.
              </Typography>
            </Box>
          ) : (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.2 }}>
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

      {/* Selection Action Bar inside Drawer */}
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
    </Box>
  );

  // On desktop, render as a persistent side panel in the layout so clicks in the canvas and rest of the app are NEVER blocked!
  if (!isMobile) {
    return drawerContent;
  }

  // On mobile, render as bottom sheet modal
  return (
    <Drawer
      anchor="bottom"
      open={open}
      onClose={onClose}
      variant="temporary"
      PaperProps={{
        sx: {
          width: '100vw',
          maxHeight: '90vh',
          height: '90vh',
          borderTopLeftRadius: 20,
          borderTopRightRadius: 20,
          bgcolor: 'background.paper',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 -6px 30px rgba(0,0,0,0.25)',
        },
      }}
    >
      {drawerContent}
    </Drawer>
  );
}
