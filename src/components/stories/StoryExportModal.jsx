import React, { useEffect, useMemo, useState } from 'react';
import {
  Box,
  Typography,
  FormControlLabel,
  Checkbox,
  Paper,
  Button,
  Chip,
  LinearProgress,
  Alert,
} from '@mui/material';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import DownloadIcon from '@mui/icons-material/Download';
import CheckIcon from '@mui/icons-material/Check';
import MenuBookOutlinedIcon from '@mui/icons-material/MenuBookOutlined';
import CustomModal from '../common/CustomModal';
import CustomButton from '../common/CustomButton';
import { useAuth } from '../../context/AuthContext';
import { useWorkspaceData } from '../../context/WorkspaceContext';
import { useManuscriptCore } from '../../context/ManuscriptContext';
import { ApiService } from '../../utils/ApiService';
import { buildStoryMarkdown } from '../../utils/storyExport';

const SECTIONS = [
  { key: 'sheet', label: 'Ficha y sinopsis' },
  { key: 'characters', label: 'Personajes' },
  { key: 'structure', label: 'Estructura narrativa (eventos)' },
  { key: 'ideas', label: 'Ideas' },
  { key: 'manuscript', label: 'Manuscrito (capítulos)' },
];

/**
 * Exporta toda la información de la historia a Markdown.
 * Los eventos (con resumen y detalles de todos los tableros) y las ideas se piden al abrir,
 * porque en memoria solo hay una versión resumida / paginada.
 */
export default function StoryExportModal({ open, onClose, story }) {
  const { user } = useAuth();
  const { characters, relationships, characterFolders, characterTags, boards, eventConnections } = useWorkspaceData();
  const { chapters } = useManuscriptCore();

  const [include, setInclude] = useState({
    sheet: true,
    characters: true,
    structure: true,
    ideas: true,
    manuscript: true,
  });
  const [events, setEvents] = useState([]);
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!open || !story?.id) return undefined;
    let cancelled = false;
    setLoading(true);
    setLoadError(false);

    Promise.all([
      ApiService.events.getAll(story.id, null, null),
      user?.id ? ApiService.quickNotes.getAll(user.id, story.id, { scope: 'story' }) : Promise.resolve({ data: [] }),
    ])
      .then(([eventsRes, notesRes]) => {
        if (cancelled) return;
        if (eventsRes?.error || notesRes?.error) setLoadError(true);
        setEvents(eventsRes?.data || []);
        setNotes(notesRes?.data || []);
      })
      .catch(() => { if (!cancelled) setLoadError(true); })
      .finally(() => { if (!cancelled) setLoading(false); });

    return () => { cancelled = true; };
  }, [open, story?.id, user?.id]);

  const markdown = useMemo(() => buildStoryMarkdown({
    story,
    characters,
    relationships,
    folders: characterFolders,
    tags: characterTags,
    boards,
    events,
    connections: eventConnections,
    notes,
    chapters,
    include,
  }), [story, characters, relationships, characterFolders, characterTags, boards, events, eventConnections, notes, chapters, include]);

  const toggle = (key) => setInclude((current) => ({ ...current, [key]: !current[key] }));
  const nothingSelected = !Object.values(include).some(Boolean);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(markdown);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch (err) {
      console.error('Error al copiar al portapapeles:', err);
    }
  };

  const handleDownload = () => {
    const safeTitle = (story?.title || 'historia').toLowerCase().replace(/[^a-z0-9]/gi, '_').replace(/_+/g, '_');
    const blob = new Blob([markdown], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `historia_${safeTitle}.md`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <CustomModal
      open={open}
      onClose={onClose}
      title="Exportar Historia"
      subtitle="Ficha, personajes, eventos, ideas y manuscrito en un solo documento"
      icon={MenuBookOutlinedIcon}
      maxWidth="md"
      actions={
        <Box sx={{ width: '100%', display: 'flex', flexDirection: { xs: 'column-reverse', sm: 'row' }, justifyContent: 'space-between', alignItems: 'center', gap: 1 }}>
          <Button variant="outlined" color="inherit" onClick={onClose} size="small" sx={{ width: { xs: '100%', sm: 'auto' }, borderRadius: 2 }}>
            Cerrar
          </Button>
          <Box sx={{ display: 'flex', gap: 1, width: { xs: '100%', sm: 'auto' } }}>
            <CustomButton
              variant="outlined"
              size="small"
              disabled={loading || nothingSelected}
              startIcon={copied ? <CheckIcon fontSize="small" /> : <ContentCopyIcon fontSize="small" />}
              onClick={handleCopy}
              sx={{ flex: 1, borderRadius: 2 }}
            >
              {copied ? '¡Copiado!' : 'Copiar'}
            </CustomButton>
            <CustomButton
              size="small"
              disabled={loading || nothingSelected}
              startIcon={<DownloadIcon fontSize="small" />}
              onClick={handleDownload}
              sx={{ flex: 1, borderRadius: 2 }}
            >
              Descargar .md
            </CustomButton>
          </Box>
        </Box>
      }
    >
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
        <Box sx={{ p: { xs: 1, sm: 1.4 }, bgcolor: 'background.paper', borderRadius: 2.5, border: 1, borderColor: 'divider' }}>
          <Typography variant="caption" sx={{ fontSize: '0.72rem', fontWeight: 800, textTransform: 'uppercase', display: 'block', mb: 0.3, color: 'text.secondary' }}>
            Qué incluir:
          </Typography>
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 0.2 }}>
            {SECTIONS.map(({ key, label }) => (
              <FormControlLabel
                key={key}
                control={<Checkbox size="small" checked={include[key]} onChange={() => toggle(key)} sx={{ p: 0.4 }} />}
                label={<Typography variant="body2" sx={{ fontSize: '0.82rem' }}>{label}</Typography>}
                sx={{ mr: 0, my: -0.2 }}
              />
            ))}
          </Box>
        </Box>

        {loadError && (
          <Alert severity="warning" sx={{ py: 0 }}>
            No se pudieron cargar todos los datos (eventos o ideas). El documento puede estar incompleto.
          </Alert>
        )}

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.6 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary', fontSize: '0.75rem' }}>
              VISTA PREVIA
            </Typography>
            <Chip label={`${markdown.length.toLocaleString('es')} caracteres`} size="small" sx={{ height: 18, fontSize: '0.65rem', fontWeight: 600 }} />
          </Box>

          {loading && <LinearProgress sx={{ borderRadius: 1 }} />}

          <Paper
            elevation={0}
            sx={{
              p: { xs: 1.2, sm: 1.5 },
              maxHeight: { xs: 260, sm: 420 },
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
              opacity: loading ? 0.6 : 1,
            }}
          >
            {nothingSelected ? 'Selecciona al menos una sección para exportar.' : markdown}
          </Paper>
        </Box>
      </Box>
    </CustomModal>
  );
}
