import React, { useState, useMemo } from 'react';
import {
  Box,
  Typography,
  Tabs,
  Tab,
  FormControlLabel,
  Checkbox,
  FormGroup,
  RadioGroup,
  Radio,
  FormControl,
  FormLabel,
  Paper,
  Button,
  IconButton,
  Tooltip,
  Snackbar,
  Alert,
  Chip,
  Divider,
} from '@mui/material';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import DownloadIcon from '@mui/icons-material/Download';
import CheckIcon from '@mui/icons-material/Check';
import DescriptionOutlinedIcon from '@mui/icons-material/DescriptionOutlined';
import FormatListBulletedIcon from '@mui/icons-material/FormatListBulleted';
import DataObjectIcon from '@mui/icons-material/DataObject';
import HubOutlinedIcon from '@mui/icons-material/HubOutlined';
import CustomModal from '../common/CustomModal';
import CustomButton from '../common/CustomButton';

export default function CharacterExportModal({
  open,
  onClose,
  characters = [],
  filteredCharacters = [],
  selectedCharacterIds = [],
  relationships = [],
  storyTitle = 'Historia',
}) {
  const [format, setFormat] = useState('markdown'); // 'markdown' | 'roster' | 'json'
  const [scope, setScope] = useState(selectedCharacterIds.length > 0 ? 'selected' : 'all'); // 'all' | 'filtered' | 'selected'
  
  // Field toggles
  const [includeBio, setIncludeBio] = useState(true);
  const [includePsychology, setIncludePsychology] = useState(true);
  const [includeRelationships, setIncludeRelationships] = useState(true);
  const [includeNotes, setIncludeNotes] = useState(true);
  const [copied, setCopied] = useState(false);

  // Target characters list based on selected scope
  const targetCharacters = useMemo(() => {
    if (scope === 'selected' && selectedCharacterIds.length > 0) {
      return characters.filter((c) => selectedCharacterIds.includes(c.id));
    }
    if (scope === 'filtered') {
      return filteredCharacters;
    }
    return characters;
  }, [characters, filteredCharacters, selectedCharacterIds, scope]);

  // Build relationships map (charId -> array of relationships with readable target name)
  const relationshipsByChar = useMemo(() => {
    const charMap = new Map(characters.map((c) => [c.id, c.name]));
    const map = {};

    relationships.forEach((rel) => {
      const sourceName = charMap.get(rel.source_character_id) || 'Personaje';
      const targetName = charMap.get(rel.target_character_id) || 'Personaje';

      // Source side
      if (!map[rel.source_character_id]) map[rel.source_character_id] = [];
      map[rel.source_character_id].push({
        withName: targetName,
        type: rel.relationship_type,
        description: rel.description,
      });

      // Target side (bidirectional context)
      if (!map[rel.target_character_id]) map[rel.target_character_id] = [];
      map[rel.target_character_id].push({
        withName: sourceName,
        type: rel.relationship_type,
        description: rel.description,
      });
    });

    return map;
  }, [characters, relationships]);

  // Generated Text Output
  const generatedOutput = useMemo(() => {
    if (!targetCharacters.length) return 'No hay personajes seleccionados para exportar.';

    // 1. MARKDOWN / FICHA LITERARIA
    if (format === 'markdown') {
      let doc = `# BIBLIA DE PERSONAJES: ${storyTitle.toUpperCase()}\n`;
      doc += `*Generado con Lorebook Studio · Total: ${targetCharacters.length} personajes*\n\n`;
      doc += `---\n\n`;

      targetCharacters.forEach((char, index) => {
        const attr = char.attributes || {};
        const charRels = relationshipsByChar[char.id] || [];

        doc += `## ${index + 1}. ${char.name}\n`;
        doc += `- **Rol / Arquetipo:** ${char.role_archetype || 'Sin rol definido'}\n`;
        doc += `- **Ámbito:** ${char.is_global ? 'Global (Compartido en todo el universo)' : 'Local'}\n`;

        if (includeBio && char.biography) {
          doc += `\n### Biografía & Trasfondo\n${char.biography}\n`;
        }

        if (includePsychology) {
          const hasPsych = attr.goal || attr.conflict || attr.strengths || attr.flaws;
          if (hasPsych) {
            doc += `\n### Perfil Psicológico & Motivaciones\n`;
            if (attr.goal) doc += `- **Objetivo Principal:** ${attr.goal}\n`;
            if (attr.conflict) doc += `- **Conflicto / Obstáculo:** ${attr.conflict}\n`;
            if (attr.strengths) doc += `- **Fortalezas & Talentos:** ${attr.strengths}\n`;
            if (attr.flaws) doc += `- **Debilidades & Defectos:** ${attr.flaws}\n`;
          }
        }

        if (includeRelationships && charRels.length > 0) {
          doc += `\n### Vínculos & Relaciones\n`;
          charRels.forEach((rel) => {
            doc += `- **${rel.type}** con *${rel.withName}*${rel.description ? `: ${rel.description}` : ''}\n`;
          });
        }

        if (includeNotes && attr.notes) {
          doc += `\n### Notas del Autor / Secretos\n> ${attr.notes}\n`;
        }

        doc += `\n---\n\n`;
      });

      return doc;
    }

    // 2. RESUMEN EJECUTIVO / CAST ROSTER
    if (format === 'roster') {
      let roster = `# CAST ROSTER: ${storyTitle.toUpperCase()}\n\n`;
      targetCharacters.forEach((char, idx) => {
        const attr = char.attributes || {};
        roster += `${idx + 1}. **${char.name}** [${char.role_archetype || 'Sin rol'}]`;
        if (char.biography) {
          roster += ` - ${char.biography.split('\n')[0]}`;
        } else if (attr.goal) {
          roster += ` - Objetivo: ${attr.goal}`;
        }
        roster += `\n`;
      });
      return roster;
    }

    // 3. JSON ESTRUCTURADO
    if (format === 'json') {
      const exportList = targetCharacters.map((char) => {
        const attr = char.attributes || {};
        const charRels = relationshipsByChar[char.id] || [];
        return {
          id: char.id,
          name: char.name,
          role_archetype: char.role_archetype,
          is_global: char.is_global,
          biography: includeBio ? char.biography : undefined,
          goal: includePsychology ? attr.goal : undefined,
          conflict: includePsychology ? attr.conflict : undefined,
          strengths: includePsychology ? attr.strengths : undefined,
          flaws: includePsychology ? attr.flaws : undefined,
          relationships: includeRelationships ? charRels : undefined,
          notes: includeNotes ? attr.notes : undefined,
        };
      });

      return JSON.stringify({ story: storyTitle, total: exportList.length, characters: exportList }, null, 2);
    }

    return '';
  }, [format, scope, targetCharacters, storyTitle, includeBio, includePsychology, includeRelationships, includeNotes, relationshipsByChar]);

  // Handle Copy to Clipboard
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(generatedOutput);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch (err) {
      console.error('Error al copiar al portapapeles:', err);
    }
  };

  // Handle File Download
  const handleDownload = () => {
    const extension = format === 'json' ? 'json' : format === 'markdown' ? 'md' : 'txt';
    const mimeType = format === 'json' ? 'application/json' : 'text/markdown;charset=utf-8';
    
    const safeTitle = (storyTitle || 'historia')
      .toLowerCase()
      .replace(/[^a-z0-9]/gi, '_')
      .replace(/_+/g, '_');

    const fileName = `personajes_${safeTitle}.${extension}`;

    const blob = new Blob([generatedOutput], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <CustomModal
      open={open}
      onClose={onClose}
      title="Exportar Personajes"
      subtitle="Fichas literarias, resúmenes y respaldos"
      icon={DescriptionOutlinedIcon}
      maxWidth="md"
      actions={
        <Box
          sx={{
            width: '100%',
            display: 'flex',
            flexDirection: { xs: 'column-reverse', sm: 'row' },
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: 1,
          }}
        >
          <Button
            variant="outlined"
            color="inherit"
            onClick={onClose}
            size="small"
            sx={{ width: { xs: '100%', sm: 'auto' }, borderRadius: 2, py: { xs: 0.6, sm: 0.8 } }}
          >
            Cerrar
          </Button>

          <Box
            sx={{
              display: 'flex',
              gap: 1,
              width: { xs: '100%', sm: 'auto' },
            }}
          >
            <CustomButton
              variant="outlined"
              color="primary"
              size="small"
              startIcon={copied ? <CheckIcon fontSize="small" /> : <ContentCopyIcon fontSize="small" />}
              onClick={handleCopy}
              sx={{ flex: 1, borderRadius: 2, py: { xs: 0.6, sm: 0.8 } }}
            >
              {copied ? '¡Copiado!' : 'Copiar'}
            </CustomButton>

            <CustomButton
              variant="contained"
              color="primary"
              size="small"
              startIcon={<DownloadIcon fontSize="small" />}
              onClick={handleDownload}
              sx={{ flex: 1, borderRadius: 2, py: { xs: 0.6, sm: 0.8 } }}
            >
              Descargar
            </CustomButton>
          </Box>
        </Box>
      }
    >
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
        
        {/* Format Selector Tabs (Equal width, 3 formats) */}
        <Tabs
          value={format}
          onChange={(e, val) => setFormat(val)}
          variant="fullWidth"
          sx={{
            minHeight: 36,
            bgcolor: 'background.subtle',
            borderRadius: 2.5,
            p: 0.4,
            border: 1,
            borderColor: 'divider',
            '& .MuiTab-root': {
              minHeight: 32,
              py: 0.4,
              px: { xs: 0.5, sm: 1.5 },
              fontSize: { xs: '0.74rem', sm: '0.82rem' },
              fontWeight: 700,
              textTransform: 'none',
              borderRadius: 2,
              gap: 0.5,
            },
          }}
        >
          <Tab value="markdown" icon={<DescriptionOutlinedIcon sx={{ fontSize: { xs: 16, sm: 18 } }} />} iconPosition="start" label="Markdown" />
          <Tab value="roster" icon={<FormatListBulletedIcon sx={{ fontSize: { xs: 16, sm: 18 } }} />} iconPosition="start" label="Roster" />
          <Tab value="json" icon={<DataObjectIcon sx={{ fontSize: { xs: 16, sm: 18 } }} />} iconPosition="start" label="JSON" />
        </Tabs>

        {/* Configuration Filters & Checkboxes */}
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', sm: '1fr 1.2fr' },
            gap: { xs: 1, sm: 1.5 },
            p: { xs: 1, sm: 1.4 },
            bgcolor: 'background.paper',
            borderRadius: 2.5,
            border: 1,
            borderColor: 'divider',
          }}
        >
          {/* Scope selection */}
          <FormControl component="fieldset">
            <FormLabel component="legend" sx={{ fontSize: '0.72rem', fontWeight: 800, textTransform: 'uppercase', mb: 0.3, color: 'text.secondary' }}>
              Personajes a incluir:
            </FormLabel>
            <RadioGroup value={scope} onChange={(e) => setScope(e.target.value)}>
              <FormControlLabel
                value="all"
                control={<Radio size="small" sx={{ p: 0.4 }} />}
                label={<Typography variant="body2" sx={{ fontSize: { xs: '0.78rem', sm: '0.82rem' } }}>Todos ({characters.length})</Typography>}
                sx={{ my: -0.2 }}
              />
              <FormControlLabel
                value="filtered"
                control={<Radio size="small" sx={{ p: 0.4 }} />}
                label={<Typography variant="body2" sx={{ fontSize: { xs: '0.78rem', sm: '0.82rem' } }}>Filtrados ({filteredCharacters.length})</Typography>}
                sx={{ my: -0.2 }}
              />
              {selectedCharacterIds.length > 0 && (
                <FormControlLabel
                  value="selected"
                  control={<Radio size="small" sx={{ p: 0.4 }} />}
                  label={<Typography variant="body2" sx={{ fontSize: { xs: '0.78rem', sm: '0.82rem' }, fontWeight: 700, color: 'primary.main' }}>Seleccionados ({selectedCharacterIds.length})</Typography>}
                  sx={{ my: -0.2 }}
                />
              )}
            </RadioGroup>
          </FormControl>

          {/* Fields to include */}
          <Box>
            <Typography variant="caption" sx={{ fontSize: '0.72rem', fontWeight: 800, textTransform: 'uppercase', display: 'block', mb: 0.3, color: 'text.secondary' }}>
              Secciones & Campos:
            </Typography>
            <FormGroup sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 0.2 }}>
              <FormControlLabel
                control={<Checkbox size="small" checked={includeBio} onChange={(e) => setIncludeBio(e.target.checked)} sx={{ p: 0.4 }} />}
                label={<Typography variant="body2" sx={{ fontSize: { xs: '0.76rem', sm: '0.8rem' } }}>Biografía</Typography>}
                sx={{ mr: 0, my: -0.2 }}
              />
              <FormControlLabel
                control={<Checkbox size="small" checked={includePsychology} onChange={(e) => setIncludePsychology(e.target.checked)} sx={{ p: 0.4 }} />}
                label={<Typography variant="body2" sx={{ fontSize: { xs: '0.76rem', sm: '0.8rem' } }}>Psicología</Typography>}
                sx={{ mr: 0, my: -0.2 }}
              />
              <FormControlLabel
                control={<Checkbox size="small" checked={includeRelationships} onChange={(e) => setIncludeRelationships(e.target.checked)} sx={{ p: 0.4 }} />}
                label={<Typography variant="body2" sx={{ fontSize: { xs: '0.76rem', sm: '0.8rem' } }}>Vínculos</Typography>}
                sx={{ mr: 0, my: -0.2 }}
              />
              <FormControlLabel
                control={<Checkbox size="small" checked={includeNotes} onChange={(e) => setIncludeNotes(e.target.checked)} sx={{ p: 0.4 }} />}
                label={<Typography variant="body2" sx={{ fontSize: { xs: '0.76rem', sm: '0.8rem' } }}>Notas/Secretos</Typography>}
                sx={{ mr: 0, my: -0.2 }}
              />
            </FormGroup>
          </Box>
        </Box>

        {/* Live Preview Box */}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.6 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary', fontSize: { xs: '0.7rem', sm: '0.75rem' } }}>
              VISTA PREVIA ({targetCharacters.length} personajes):
            </Typography>
            <Chip
              label={`${generatedOutput.length} caracteres`}
              size="small"
              sx={{ height: 18, fontSize: '0.65rem', fontWeight: 600 }}
            />
          </Box>

          <Paper
            elevation={0}
            sx={{
              p: { xs: 1.2, sm: 1.5 },
              maxHeight: { xs: 230, sm: 400 },
              overflowY: 'auto',
              bgcolor: 'background.subtle',
              border: 1,
              borderColor: 'divider',
              borderRadius: 2,
              fontFamily: 'Consolas, Monaco, "Courier New", monospace',
              fontSize: { xs: '0.74rem', sm: '0.8rem' },
              lineHeight: 1.45,
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
              color: 'text.primary',
              userSelect: 'text',
            }}
          >
            {generatedOutput}
          </Paper>
        </Box>
      </Box>
    </CustomModal>
  );
}
