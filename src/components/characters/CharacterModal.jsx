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
  ButtonGroup,
  IconButton,
  CircularProgress,
  Tabs, Tab,
  Chip,
  Menu,
  ListItemIcon,
  ListItemText,
} from '@mui/material';
import PersonIcon from '@mui/icons-material/Person';
import CheckIcon from '@mui/icons-material/Check';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import ColorLensIcon from '@mui/icons-material/ColorLens';
import TuneIcon from '@mui/icons-material/Tune';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import PublicIcon from '@mui/icons-material/Public';
import BookmarkBorderIcon from '@mui/icons-material/BookmarkBorder';
import PhotoCameraIcon from '@mui/icons-material/PhotoCamera';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import LinkIcon from '@mui/icons-material/Link';
import FileUploadOutlinedIcon from '@mui/icons-material/FileUploadOutlined';
import StarIcon from '@mui/icons-material/Star';
import WcIcon from '@mui/icons-material/Wc';
import PsychologyOutlinedIcon from '@mui/icons-material/PsychologyOutlined';
import LocalOfferOutlinedIcon from '@mui/icons-material/LocalOfferOutlined';
import AddIcon from '@mui/icons-material/Add';
import CustomModal from '../common/CustomModal';
import CustomButton from '../common/CustomButton';
import ImageCropModal from '../common/ImageCropModal';
import { uploadCharacterAvatar } from '../../services/storageService';
import { extractDominantColor } from '../../utils/imageOptimizer';
import {
  CHARACTER_ARCHETYPES,
  CHARACTER_COLOR_PALETTE,
  CHARACTER_GENDERS,
  CHARACTER_ALIGNMENTS,
  CHARACTER_LIFE_STAGES,
  CHARACTER_VITAL_STATUSES,
} from '../../constants/constants';

const EMPTY_ARRAY = [];

export default function CharacterModal({
  open,
  onClose,
  character = null,
  availableTags = EMPTY_ARRAY,
  availableFolders = EMPTY_ARRAY,
  customArchetypes = EMPTY_ARRAY,
  defaultFolderId = null,
  onOpenTagManager,
  onOpenArchetypeManager,
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
  
  // Folder & Custom Tags
  const [folderId, setFolderId] = useState('');
  const [selectedTagIds, setSelectedTagIds] = useState([]);
  const [roleTab, setRoleTab] = useState(0); // 0=Estándar, 1=Propios
  const [roleAnchorEl, setRoleAnchorEl] = useState(null);
  const isRoleMenuOpen = Boolean(roleAnchorEl);

  // Extended narrative & psychological fields (stored in attributes jsonb)
  const [goal, setGoal] = useState('');
  const [conflict, setConflict] = useState('');
  const [strengths, setStrengths] = useState('');
  const [flaws, setFlaws] = useState('');
  const [notes, setNotes] = useState('');

  // Trait & Character Data fields (stored in attributes jsonb)
  const [gender, setGender] = useState('');
  const [alignment, setAlignment] = useState('');
  const [lifeStage, setLifeStage] = useState('');
  const [vitalStatus, setVitalStatus] = useState('Vivo');
  const [isSpecial, setIsSpecial] = useState(false);

  // Collapsible progressive disclosure state & sub-tab
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [advancedTab, setAdvancedTab] = useState(0); // 0=Psicología, 1=Datos del Personaje, 2=Foto y Configuración

  // Avatar upload & cropping state
  const [avatarMode, setAvatarMode] = useState('upload');
  const [cropModalOpen, setCropModalOpen] = useState(false);
  const [rawImageSrc, setRawImageSrc] = useState(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  const fileInputRef = useRef(null);
  const colorInputRef = useRef(null);

  useEffect(() => {
    if (!open) return;

    if (character) {
      setName(character.name || '');
      const arch = character.role_archetype || 'Protagonista';
      setRoleArchetype(arch);
      const isCustomArch = customArchetypes.some((a) => a.name === arch);
      setRoleTab(isCustomArch ? 1 : 0);
      setBiography(character.biography || '');
      setAvatarUrl(character.avatar_url || '');
      setColorTag(character.color_tag || '');
      setIsTemplate(Boolean(character.is_template));
      setIsGlobal(Boolean(character.is_global));
      setFolderId(character.folder_id || '');
      setSelectedTagIds(Array.isArray(character.custom_tag_ids) ? character.custom_tag_ids : []);
      
      const attr = character.attributes || {};
      setGoal(attr.goal || '');
      setConflict(attr.conflict || '');
      setStrengths(attr.strengths || '');
      setFlaws(attr.flaws || '');
      setNotes(attr.notes || '');

      setGender(attr.gender || '');
      setAlignment(attr.alignment || '');
      setLifeStage(attr.life_stage || '');
      setVitalStatus(attr.vital_status || 'Vivo');
      setIsSpecial(Boolean(attr.is_special));

      if (
        character.avatar_url || character.is_global || character.is_template ||
        attr.goal || attr.conflict || attr.strengths || attr.flaws || attr.notes ||
        attr.gender || attr.alignment || attr.life_stage || (attr.vital_status && attr.vital_status !== 'Vivo') || attr.is_special
      ) {
        setShowAdvanced(true);
      } else {
        setShowAdvanced(false);
      }
      if (character.avatar_url?.startsWith('http') && !character.avatar_url.includes('supabase.co/storage')) {
        setAvatarMode('url');
      } else {
        setAvatarMode('upload');
      }
    } else {
      setName('');
      setRoleArchetype('Protagonista');
      setBiography('');
      setAvatarUrl('');
      setColorTag('');
      setIsTemplate(false);
      setIsGlobal(false);
      const initialFolder = defaultFolderId || (availableFolders && availableFolders[0]?.id) || '';
      setFolderId(initialFolder);
      setSelectedTagIds([]);
      setGoal('');
      setConflict('');
      setStrengths('');
      setFlaws('');
      setNotes('');
      setGender('');
      setAlignment('');
      setLifeStage('');
      setVitalStatus('Vivo');
      setIsSpecial(false);
      setShowAdvanced(false);
      setAvatarMode('upload');
    }
    setCloneSuffix(' (Versión Alterna)');
  }, [character, open, isCloneMode, defaultFolderId]);

  // Automatically extract dominant color when a URL is provided
  useEffect(() => {
    if (avatarMode === 'url' && avatarUrl && avatarUrl.trim().startsWith('http')) {
      const timer = setTimeout(async () => {
        const dominantColor = await extractDominantColor(avatarUrl.trim());
        if (dominantColor) {
          setColorTag(dominantColor);
        }
      }, 400);
      return () => clearTimeout(timer);
    }
  }, [avatarUrl, avatarMode]);

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      setRawImageSrc(reader.result);
      setCropModalOpen(true);
      e.target.value = '';
    };
    reader.readAsDataURL(file);
  };

  const handleCropComplete = async (optimizedBlob, previewUrl) => {
    setUploadingAvatar(true);
    try {
      const dominantColor = await extractDominantColor(optimizedBlob);
      if (dominantColor) {
        setColorTag(dominantColor);
      }

      const result = await uploadCharacterAvatar(optimizedBlob, character?.id || 'new');
      if (result?.url) {
        setAvatarUrl(result.url);
      } else {
        setAvatarUrl(previewUrl);
      }
    } catch (err) {
      console.error('Error uploading avatar:', err);
      setAvatarUrl(previewUrl);
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleRemoveAvatar = () => {
    setAvatarUrl('');
  };

  const handleToggleTag = (tagId) => {
    setSelectedTagIds((prev) =>
      prev.includes(tagId) ? prev.filter((id) => id !== tagId) : [...prev, tagId]
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;

    if (isCloneMode && character) {
      await onClone(character.id, {
        nameSuffix: cloneSuffix,
        isTemplate: isTemplate,
      });
    } else {
      const attributes = {
        ...(character?.attributes || {}),
        goal: goal.trim(),
        conflict: conflict.trim(),
        strengths: strengths.trim(),
        flaws: flaws.trim(),
        notes: notes.trim(),
        gender: gender || '',
        alignment: alignment || '',
        life_stage: lifeStage || '',
        vital_status: vitalStatus || 'Vivo',
        is_special: Boolean(isSpecial),
      };

      await onSave({
        name: name.trim(),
        role_archetype: roleArchetype,
        biography: biography.trim(),
        avatar_url: avatarUrl.trim(),
        color_tag: colorTag,
        is_template: isTemplate,
        is_global: isGlobal,
        folder_id: folderId || null,
        custom_tag_ids: selectedTagIds,
        attributes,
      });
    }
  };

  return (
    <>
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
        <input
          ref={fileInputRef}
          type="file"
          accept="image/png,image/jpeg,image/webp,image/gif"
          style={{ display: 'none' }}
          onChange={handleFileChange}
        />

        <Box component="form" onSubmit={handleSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {isCloneMode ? (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Typography variant="body2" color="text.secondary">
                Se clonará la ficha completa de <strong>{character?.name}</strong> incluyendo biografía, arquetipo, etiquetas y color distintivo.
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
              {/* ─── 1. AVATAR INTERACTIVO + NOMBRE DEL PERSONAJE ─── */}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.8 }}>
                <Tooltip title="Haz clic para subir o cambiar foto de avatar">
                  <Box
                    onClick={() => fileInputRef.current?.click()}
                    sx={{
                      position: 'relative',
                      cursor: 'pointer',
                      flexShrink: 0,
                      borderRadius: '50%',
                      '&:hover .avatar-overlay': { opacity: 1 },
                    }}
                  >
                    <Avatar
                      src={avatarUrl}
                      alt={name || 'Avatar'}
                      sx={{
                        width: 56,
                        height: 56,
                        bgcolor: colorTag || 'primary.main',
                        color: '#ffffff',
                        fontSize: '1.4rem',
                        fontWeight: 800,
                        boxShadow: colorTag ? `0 0 12px ${colorTag}66` : '0 2px 8px rgba(0,0,0,0.15)',
                        border: 2,
                        borderColor: 'divider',
                        transition: 'all 0.2s ease',
                      }}
                    >
                      {uploadingAvatar ? (
                        <CircularProgress size={24} color="inherit" />
                      ) : name ? (
                        name.charAt(0).toUpperCase()
                      ) : (
                        <PersonIcon />
                      )}
                    </Avatar>

                    <Box
                      className="avatar-overlay"
                      sx={{
                        position: 'absolute',
                        inset: 0,
                        borderRadius: '50%',
                        bgcolor: 'rgba(0,0,0,0.5)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        opacity: uploadingAvatar ? 1 : 0,
                        transition: 'opacity 0.15s ease',
                      }}
                    >
                      {uploadingAvatar ? (
                        <CircularProgress size={20} sx={{ color: '#fff' }} />
                      ) : (
                        <PhotoCameraIcon sx={{ color: '#fff', fontSize: 20 }} />
                      )}
                    </Box>
                  </Box>
                </Tooltip>

                <TextField
                  label="Nombre del Personaje *"
                  placeholder="Ej: Elena Voss, Lord Brandon, Kira..."
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  fullWidth
                  autoFocus={!character && !isCloneMode}
                  InputProps={{
                    sx: { fontSize: '1.05rem', fontWeight: 700, borderRadius: 2.5 },
                  }}
                />
              </Box>

              {/* ─── 2. ROL / ARQUETIPO, CARPETA Y PALETA RÁPIDA ─── */}
              <Grid container spacing={1.5}>
                <Grid item xs={12} sm={6}>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.4 }}>
                    {/* Clickable archetype field — opens popup Menu with tabs */}
                    <Box
                      onClick={(e) => {
                        const isCustom = customArchetypes.some((a) => a.name === roleArchetype);
                        setRoleTab(isCustom ? 1 : 0);
                        setRoleAnchorEl(e.currentTarget);
                      }}
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        border: '1px solid',
                        borderColor: isRoleMenuOpen ? 'primary.main' : 'divider',
                        borderRadius: 2,
                        px: 1.5,
                        py: 0.85,
                        cursor: 'pointer',
                        bgcolor: 'background.paper',
                        transition: 'border-color 0.15s',
                        '&:hover': { borderColor: 'text.primary' },
                        position: 'relative',
                      }}
                    >
                      {/* Label */}
                      <Typography
                        variant="caption"
                        sx={{
                          position: 'absolute',
                          top: -9,
                          left: 10,
                          bgcolor: 'background.paper',
                          px: 0.5,
                          fontSize: '0.72rem',
                          color: isRoleMenuOpen ? 'primary.main' : 'text.secondary',
                          fontWeight: 600,
                          lineHeight: 1,
                          transition: 'color 0.15s',
                        }}
                      >
                        Arquetipo / Rol
                      </Typography>
                      {/* Dot color if custom */}
                      {(() => {
                        const customArch = customArchetypes.find((a) => a.name === roleArchetype);
                        return customArch ? (
                          <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: customArch.color || 'primary.main', flexShrink: 0, mr: 0.8 }} />
                        ) : null;
                      })()}
                      <Typography
                        sx={{ flexGrow: 1, fontSize: '0.875rem', fontWeight: 500, color: roleArchetype ? 'text.primary' : 'text.disabled' }}
                      >
                        {roleArchetype || 'Sin rol'}
                      </Typography>
                      <ExpandMoreIcon
                        sx={{
                          fontSize: 18,
                          color: 'text.secondary',
                          transform: isRoleMenuOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                          transition: 'transform 0.2s',
                          ml: 0.5,
                        }}
                      />
                    </Box>

                    {/* Archetype Popup Menu */}
                    <Menu
                      anchorEl={roleAnchorEl}
                      open={isRoleMenuOpen}
                      onClose={() => setRoleAnchorEl(null)}
                      PaperProps={{
                        elevation: 6,
                        sx: {
                          borderRadius: 2.5,
                          minWidth: 240,
                          maxWidth: 280,
                          maxHeight: 360,
                          p: 0,
                          overflow: 'hidden',
                          border: '1px solid',
                          borderColor: 'divider',
                          display: 'flex',
                          flexDirection: 'column',
                        },
                      }}
                    >
                      {/* Tab switcher */}
                      <Box sx={{ p: 0.8, pb: 0.5, bgcolor: 'background.subtle', borderBottom: '1px solid', borderColor: 'divider' }}>
                        <Tabs
                          value={roleTab}
                          onChange={(_, v) => setRoleTab(v)}
                          variant="fullWidth"
                          sx={{
                            minHeight: 28,
                            bgcolor: 'action.hover',
                            borderRadius: 1.5,
                            p: 0.3,
                            '& .MuiTabs-indicator': { display: 'none' },
                            '& .MuiTab-root': {
                              minHeight: 24,
                              py: 0.3,
                              px: 0.8,
                              fontSize: '0.72rem',
                              fontWeight: 700,
                              textTransform: 'none',
                              borderRadius: 1,
                              color: 'text.secondary',
                              '&.Mui-selected': {
                                bgcolor: 'background.paper',
                                color: 'primary.main',
                                boxShadow: '0 1px 3px rgba(0,0,0,0.12)',
                              },
                            },
                          }}
                        >
                          <Tab label="Estándar" />
                          <Tab label={`Propios (${customArchetypes.length})`} />
                        </Tabs>
                      </Box>

                      {/* Items */}
                      <Box sx={{ overflowY: 'auto', py: 0.5 }}>
                        {roleTab === 0 && CHARACTER_ARCHETYPES.map((arch) => {
                          const isSel = roleArchetype === arch;
                          return (
                            <MenuItem
                              key={arch}
                              selected={isSel}
                              onClick={() => { setRoleArchetype(arch); setRoleAnchorEl(null); }}
                              sx={{ py: 0.5, px: 1.5, borderRadius: 1, mx: 0.5, justifyContent: 'space-between' }}
                            >
                              <ListItemText
                                primary={arch}
                                primaryTypographyProps={{ fontSize: '0.82rem', fontWeight: isSel ? 700 : 400, color: isSel ? 'primary.main' : 'text.primary' }}
                              />
                              {isSel && <ListItemIcon sx={{ minWidth: 'auto', color: 'primary.main', ml: 1 }}><CheckIcon sx={{ fontSize: 16 }} /></ListItemIcon>}
                            </MenuItem>
                          );
                        })}

                        {roleTab === 1 && (
                          customArchetypes.length > 0 ? customArchetypes.map((arch) => {
                            const isSel = roleArchetype === arch.name;
                            return (
                              <MenuItem
                                key={arch.id || arch.name}
                                selected={isSel}
                                onClick={() => { setRoleArchetype(arch.name); setRoleAnchorEl(null); }}
                                sx={{ py: 0.5, px: 1.5, borderRadius: 1, mx: 0.5, justifyContent: 'space-between' }}
                              >
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8, minWidth: 0 }}>
                                  <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: arch.color || 'primary.main', flexShrink: 0 }} />
                                  <ListItemText
                                    primary={arch.name}
                                    primaryTypographyProps={{ fontSize: '0.82rem', fontWeight: isSel ? 700 : 400, color: isSel ? 'primary.main' : 'text.primary', noWrap: true }}
                                  />
                                </Box>
                                {isSel && <ListItemIcon sx={{ minWidth: 'auto', color: 'primary.main', ml: 1 }}><CheckIcon sx={{ fontSize: 16 }} /></ListItemIcon>}
                              </MenuItem>
                            );
                          }) : (
                            <Box sx={{ p: 2, textAlign: 'center' }}>
                              <Typography variant="caption" color="text.secondary">
                                No hay arquetipos propios aún.
                              </Typography>
                            </Box>
                          )
                        )}
                      </Box>
                    </Menu>
                  </Box>
                </Grid>

                <Grid item xs={12} sm={6} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600, flexShrink: 0 }}>
                    Color:
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 0.5, alignItems: 'center', flexWrap: 'nowrap' }}>
                    {CHARACTER_COLOR_PALETTE.slice(0, 8).map((color) => {
                      const isSelected = colorTag?.toLowerCase() === color.toLowerCase();
                      return (
                        <Box
                          key={color}
                          onClick={() => setColorTag(isSelected ? '' : color)}
                          sx={{
                            width: 20,
                            height: 20,
                            borderRadius: '50%',
                            bgcolor: color,
                            cursor: 'pointer',
                            border: isSelected ? '2px solid #222' : '1px solid rgba(0,0,0,0.15)',
                            transform: isSelected ? 'scale(1.1)' : 'scale(1)',
                            transition: 'all 0.1s ease',
                            '&:hover': { transform: 'scale(1.1)' },
                          }}
                        />
                      );
                    })}
                  </Box>
                </Grid>
              </Grid>

              {/* ─── 3. ETIQUETAS PERSONALIZADAS DE LA HISTORIA ─── */}
              <Box
                sx={{
                  p: 1.2,
                  borderRadius: 2,
                  bgcolor: 'background.subtle',
                  border: 1,
                  borderColor: 'divider',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 0.8,
                }}
              >
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <LocalOfferOutlinedIcon sx={{ fontSize: 15, color: 'text.secondary' }} />
                    <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary' }}>
                      Etiquetas Propias de la Historia:
                    </Typography>
                  </Box>
                  {onOpenTagManager && (
                    <Button
                      size="small"
                      variant="text"
                      onClick={onOpenTagManager}
                      startIcon={<AddIcon sx={{ fontSize: '14px !important' }} />}
                      sx={{ fontSize: '0.72rem', py: 0, textTransform: 'none', fontWeight: 700 }}
                    >
                      Gestionar Etiquetas
                    </Button>
                  )}
                </Box>

                {availableTags.length === 0 ? (
                  <Typography variant="caption" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                    No hay etiquetas creadas en esta historia. Haz clic en "Gestionar Etiquetas" para crear tus propias etiquetas.
                  </Typography>
                ) : (
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.6 }}>
                    {availableTags.map((tag) => {
                      const isSelected = selectedTagIds.includes(tag.id);
                      return (
                        <Chip
                          key={tag.id}
                          label={tag.name}
                          size="small"
                          onClick={() => handleToggleTag(tag.id)}
                          sx={{
                            height: 22,
                            fontSize: '0.72rem',
                            fontWeight: 700,
                            cursor: 'pointer',
                            bgcolor: isSelected ? tag.color || 'primary.main' : 'background.paper',
                            color: isSelected ? '#fff' : 'text.primary',
                            border: '1px solid',
                            borderColor: tag.color || 'primary.main',
                            transition: 'all 0.12s ease',
                            '&:hover': {
                              opacity: 0.85,
                            },
                          }}
                        />
                      );
                    })}
                  </Box>
                )}
              </Box>

              {/* ─── 4. BIOGRAFÍA / TRASFONDO (Básico) ─── */}
              <TextField
                label="Biografía Breve"
                value={biography}
                onChange={(e) => setBiography(e.target.value)}
                multiline
                rows={3}
                placeholder="Motivaciones, origen, secretos y papel en la historia…"
                fullWidth
                InputProps={{ sx: { borderRadius: 2, fontSize: '0.9rem' } }}
              />

              {/* ─── 5. TOGGLE MÁS OPCIONES (Colapsable con Pestañas) ─── */}
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
                  {showAdvanced ? 'Ocultar opciones avanzadas' : 'Más opciones (Psicología, Conflictos, Foto, Global…)'}
                </Button>
              </Box>

              <Collapse in={showAdvanced} timeout="auto" unmountOnExit>
                <Box
                  sx={{
                    p: { xs: 1.5, sm: 2 },
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
                  <Tabs
                    value={advancedTab}
                    onChange={(e, val) => setAdvancedTab(val)}
                    variant="fullWidth"
                    sx={{
                      minHeight: 36,
                      bgcolor: 'background.paper',
                      borderRadius: 2,
                      p: 0.3,
                      border: 1,
                      borderColor: 'divider',
                      '& .MuiTab-root': {
                        minHeight: 32,
                        py: 0.5,
                        fontSize: '0.78rem',
                        fontWeight: 700,
                        textTransform: 'none',
                        borderRadius: 1.5,
                      },
                    }}
                  >
                    <Tab label="Psicología & Narrativa" />
                    <Tab label="Datos" icon={<WcIcon sx={{ fontSize: '1rem !important' }} />} iconPosition="start" />
                    <Tab label="Foto & Ajustes" />
                  </Tabs>

                  {/* ─── TAB 0: PSICOLOGÍA Y TRASFONDO PROFUNDO ─── */}
                  {advancedTab === 0 && (
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                      <TextField
                        label="Objetivo / Motivación Principal"
                        placeholder="¿Qué desea alcanzar o proteger por encima de todo?"
                        value={goal}
                        onChange={(e) => setGoal(e.target.value)}
                        fullWidth
                        size="small"
                        InputProps={{ sx: { borderRadius: 2, fontSize: '0.88rem' } }}
                      />

                      <TextField
                        label="Conflicto / Obstáculo Principal"
                        placeholder="¿Qué dilema interno o enemigo externo se opone a su meta?"
                        value={conflict}
                        onChange={(e) => setConflict(e.target.value)}
                        fullWidth
                        size="small"
                        InputProps={{ sx: { borderRadius: 2, fontSize: '0.88rem' } }}
                      />

                      <Grid container spacing={1.5}>
                        <Grid item xs={12} sm={6}>
                          <TextField
                            label="Fortalezas / Habilidades"
                            placeholder="Talentos, virtudes o poderes…"
                            value={strengths}
                            onChange={(e) => setStrengths(e.target.value)}
                            fullWidth
                            size="small"
                            InputProps={{ sx: { borderRadius: 2, fontSize: '0.88rem' } }}
                          />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <TextField
                            label="Debilidades / Defectos"
                            placeholder="Miedos, heridas del pasado, tentaciones…"
                            value={flaws}
                            onChange={(e) => setFlaws(e.target.value)}
                            fullWidth
                            size="small"
                            InputProps={{ sx: { borderRadius: 2, fontSize: '0.88rem' } }}
                          />
                        </Grid>
                      </Grid>

                      <TextField
                        label="Notas Privadas del Autor / Secretos"
                        placeholder="Detalles que el lector aún no sabe, giros de guion o notas de lore…"
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        multiline
                        rows={2}
                        fullWidth
                        size="small"
                        InputProps={{ sx: { borderRadius: 2, fontSize: '0.88rem' } }}
                      />
                    </Box>
                  )}

                  {/* ─── TAB 1: DATOS DEL PERSONAJE ─── */}
                  {advancedTab === 1 && (
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                      <Grid container spacing={1.5}>
                        <Grid item xs={12} sm={6}>
                          <TextField
                            select
                            label="Género"
                            value={gender}
                            onChange={(e) => setGender(e.target.value)}
                            fullWidth
                            size="small"
                            InputProps={{ sx: { borderRadius: 2, fontSize: '0.88rem' } }}
                          >
                            <MenuItem value=""><em>Sin definir</em></MenuItem>
                            {CHARACTER_GENDERS.map((g) => (
                              <MenuItem key={g} value={g}>{g}</MenuItem>
                            ))}
                          </TextField>
                        </Grid>

                        <Grid item xs={12} sm={6}>
                          <TextField
                            select
                            label="Etapa de Vida"
                            value={lifeStage}
                            onChange={(e) => setLifeStage(e.target.value)}
                            fullWidth
                            size="small"
                            InputProps={{ sx: { borderRadius: 2, fontSize: '0.88rem' } }}
                          >
                            <MenuItem value=""><em>Sin definir</em></MenuItem>
                            {CHARACTER_LIFE_STAGES.map((s) => (
                              <MenuItem key={s} value={s}>{s}</MenuItem>
                            ))}
                          </TextField>
                        </Grid>

                        <Grid item xs={12} sm={6}>
                          <TextField
                            select
                            label="Alineamiento"
                            value={alignment}
                            onChange={(e) => setAlignment(e.target.value)}
                            fullWidth
                            size="small"
                            InputProps={{ sx: { borderRadius: 2, fontSize: '0.88rem' } }}
                          >
                            <MenuItem value=""><em>Sin definir</em></MenuItem>
                            {CHARACTER_ALIGNMENTS.map((a) => (
                              <MenuItem key={a} value={a}>{a}</MenuItem>
                            ))}
                          </TextField>
                        </Grid>

                        <Grid item xs={12} sm={6}>
                          <TextField
                            select
                            label="Estado Vital"
                            value={vitalStatus}
                            onChange={(e) => setVitalStatus(e.target.value)}
                            fullWidth
                            size="small"
                            InputProps={{ sx: { borderRadius: 2, fontSize: '0.88rem' } }}
                          >
                            {CHARACTER_VITAL_STATUSES.map((v) => (
                              <MenuItem key={v} value={v}>{v}</MenuItem>
                            ))}
                          </TextField>
                        </Grid>
                      </Grid>

                      <Box
                        onClick={() => setIsSpecial(!isSpecial)}
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          p: 1.2,
                          borderRadius: 2,
                          border: '1.5px solid',
                          borderColor: isSpecial ? 'warning.main' : 'divider',
                          bgcolor: isSpecial ? 'warning.main' + '18' : 'background.paper',
                          cursor: 'pointer',
                          transition: 'all 0.15s ease',
                          '&:hover': { borderColor: 'warning.main', bgcolor: 'warning.main' + '10' },
                        }}
                      >
                        <Box>
                          <Typography variant="body2" sx={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: 0.6, color: isSpecial ? 'warning.dark' : 'text.primary' }}>
                            <StarIcon sx={{ fontSize: 16, color: isSpecial ? 'warning.main' : 'text.disabled' }} />
                            Personaje Especial
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            Marca este personaje como clave o único dentro de la narrativa.
                          </Typography>
                        </Box>
                        <Switch
                          checked={isSpecial}
                          onChange={(e) => { e.stopPropagation(); setIsSpecial(e.target.checked); }}
                          color="warning"
                          size="small"
                        />
                      </Box>
                    </Box>
                  )}

                  {/* ─── TAB 2: FOTO Y AJUSTES DE SISTEMA ─── */}
                  {advancedTab === 2 && (
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary' }}>
                            FOTO DE PERFIL / AVATAR:
                          </Typography>
                          <ButtonGroup size="small" variant="outlined" sx={{ borderRadius: 2 }}>
                            <Button
                              variant={avatarMode === 'upload' ? 'contained' : 'outlined'}
                              onClick={() => setAvatarMode('upload')}
                              startIcon={<FileUploadOutlinedIcon fontSize="small" />}
                              sx={{ fontSize: '0.7rem', py: 0, textTransform: 'none', fontWeight: 700 }}
                            >
                              Subir
                            </Button>
                            <Button
                              variant={avatarMode === 'url' ? 'contained' : 'outlined'}
                              onClick={() => setAvatarMode('url')}
                              startIcon={<LinkIcon fontSize="small" />}
                              sx={{ fontSize: '0.7rem', py: 0, textTransform: 'none', fontWeight: 700 }}
                            >
                              URL
                            </Button>
                          </ButtonGroup>
                        </Box>

                        {avatarMode === 'upload' ? (
                          <Box
                            sx={{
                              p: 1,
                              border: '1px dashed',
                              borderColor: avatarUrl ? 'primary.main' : 'divider',
                              borderRadius: 2,
                              bgcolor: 'background.paper',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              gap: 1,
                            }}
                          >
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Avatar src={avatarUrl} sx={{ width: 36, height: 36, bgcolor: colorTag || 'primary.main' }}>
                                {name ? name.charAt(0).toUpperCase() : <PersonIcon />}
                              </Avatar>
                              <Box>
                                <Typography variant="body2" sx={{ fontWeight: 700, fontSize: '0.8rem' }}>
                                  {avatarUrl ? 'Foto lista' : 'Subir imagen'}
                                </Typography>
                              </Box>
                            </Box>

                            <Box sx={{ display: 'flex', gap: 0.5 }}>
                              <Button
                                size="small"
                                variant="outlined"
                                onClick={() => fileInputRef.current?.click()}
                                sx={{ textTransform: 'none', fontWeight: 700, fontSize: '0.7rem', borderRadius: 2, minWidth: 'auto', px: 1 }}
                              >
                                {avatarUrl ? 'Cambiar' : 'Elegir'}
                              </Button>
                              {avatarUrl && (
                                <IconButton size="small" onClick={handleRemoveAvatar} sx={{ color: 'error.main' }}>
                                  <DeleteOutlineIcon fontSize="small" />
                                </IconButton>
                              )}
                            </Box>
                          </Box>
                        ) : (
                          <TextField
                            label="URL de Foto"
                            placeholder="https://ejemplo.com/avatar.jpg"
                            value={avatarUrl}
                            onChange={(e) => setAvatarUrl(e.target.value)}
                            fullWidth
                            size="small"
                            InputProps={{
                              endAdornment: avatarUrl ? (
                                <IconButton size="small" onClick={handleRemoveAvatar}>
                                  <DeleteOutlineIcon fontSize="small" />
                                </IconButton>
                              ) : null,
                            }}
                          />
                        )}
                      </Box>
                      <Grid container spacing={1}>
                        <Grid item xs={8}>
                          <TextField
                            select
                            label="Carpeta"
                            value={folderId}
                            onChange={(e) => setFolderId(e.target.value)}
                            fullWidth
                            size="small"
                            InputProps={{ sx: { borderRadius: 2 } }}
                          >
                            {availableFolders.map((f) => (
                              <MenuItem key={f.id} value={f.id}>
                                {f.name} {f.is_default ? '(Base)' : ''}
                              </MenuItem>
                            ))}
                          </TextField>
                        </Grid>
                        <Grid item xs={4}>
                          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', border: '1px solid', borderColor: 'divider', borderRadius: 2, bgcolor: 'background.paper' }}>
                            <Box
                              onClick={() => colorInputRef.current?.click()}
                              sx={{
                                width: 28,
                                height: 28,
                                borderRadius: '50%',
                                bgcolor: colorTag || '#8c6d53',
                                border: '2px solid rgba(0,0,0,0.15)',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                              }}
                            >
                              <ColorLensIcon sx={{ fontSize: 16, color: '#fff' }} />
                              <input
                                ref={colorInputRef}
                                type="color"
                                value={colorTag || '#8c6d53'}
                                onChange={(e) => setColorTag(e.target.value)}
                                style={{ display: 'none' }}
                              />
                            </Box>
                          </Box>
                        </Grid>
                      </Grid>

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
                  )}
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

      <ImageCropModal
        open={cropModalOpen}
        imageSrc={rawImageSrc}
        onClose={() => setCropModalOpen(false)}
        onCropComplete={handleCropComplete}
      />
    </>
  );
}
