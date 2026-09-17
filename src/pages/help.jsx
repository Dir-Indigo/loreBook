import React, { useState } from 'react';
import { useRouter } from 'next/router';
import { Box, Typography, Container, Chip, Divider, Accordion, AccordionSummary, AccordionDetails } from '@mui/material';
import AutoStoriesIcon from '@mui/icons-material/AutoStories';
import AccountTreeOutlinedIcon from '@mui/icons-material/AccountTreeOutlined';
import PeopleOutlineIcon from '@mui/icons-material/PeopleOutline';
import LightbulbOutlinedIcon from '@mui/icons-material/LightbulbOutlined';
import LayersOutlinedIcon from '@mui/icons-material/LayersOutlined';
import TimelineOutlinedIcon from '@mui/icons-material/TimelineOutlined';
import HubOutlinedIcon from '@mui/icons-material/HubOutlined';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import CustomButton from '../components/common/CustomButton';

// ── Data ──────────────────────────────────────────────────────────────────────

const FEATURES = [
  {
    icon: AccountTreeOutlinedIcon,
    title: 'Pizarra de Escenas',
    description:
      'Tu lienzo principal. Crea eventos, escenas y momentos clave de tu historia. Organízalos en tableros de línea narrativa y conéctalos para visualizar el flujo de tu trama.',
    color: '#6366f1',
  },
  {
    icon: PeopleOutlineIcon,
    title: 'Personajes',
    description:
      'Construye fichas detalladas para cada personaje: nombre, rol, biografía, avatar y color distintivo. Márcalos como globales para compartirlos entre múltiples historias.',
    color: '#ec4899',
  },
  {
    icon: HubOutlinedIcon,
    title: 'Vínculos y Relaciones',
    description:
      'Traza conexiones entre personajes: alianzas, rivalidades, relaciones familiares o cualquier vínculo narrativo. El panel de relaciones vive dentro del mismo drawer.',
    color: '#14b8a6',
  },
  {
    icon: LightbulbOutlinedIcon,
    title: 'Gestor de Ideas',
    description:
      'Captura ideas al instante desde cualquier pantalla. El panel lateral de ideas guarda notas rápidas asignadas a cada historia o como globales para todo el workspace.',
    color: '#f59e0b',
  },
  {
    icon: LayersOutlinedIcon,
    title: 'Historias y Universos',
    description:
      'Gestiona múltiples proyectos simultáneamente. Agrupa historias en sagas o universos compartidos. Cambia de historia activa en un clic desde cualquier pantalla.',
    color: '#8b5cf6',
  },
  {
    icon: TimelineOutlinedIcon,
    title: 'Líneas Narrativas',
    description:
      'Cada historia puede tener múltiples tableros de línea narrativa (actos, arcos, tramas secundarias). Ordena eventos con flechas de conexión para visualizar la estructura.',
    color: '#10b981',
  },
];

const FAQ = [
  {
    q: '¿Qué es un personaje global?',
    a: 'Un personaje global pertenece a tu workspace completo y puede aparecer en múltiples historias. Ideal para personajes recurrentes en una saga o universo compartido. Puedes crear una copia local en cualquier historia si necesitas una versión independiente.',
  },
  {
    q: '¿Qué diferencia hay entre clonar y copiar como local?',
    a: '"Clonar" duplica un personaje dentro de la misma historia con un sufijo personalizable (útil para versiones alternas). "Copiar como local" toma un personaje global y crea una copia independiente asignada a la historia activa.',
  },
  {
    q: '¿Puedo tener varias historias a la vez?',
    a: 'Sí. Puedes crear tantas historias como necesites. La historia "activa" es la que está en foco en la pizarra principal. Cámbiala en cualquier momento desde el selector de historia en la barra superior.',
  },
  {
    q: '¿Qué es una Saga o Universo?',
    a: 'Es una historia "contenedor" que agrupa otras historias relacionadas. Por ejemplo: una trilogía tendría una Saga madre y tres historias hijo vinculadas a ella. Es completamente opcional.',
  },
  {
    q: '¿Mis datos se guardan automáticamente?',
    a: 'Sí. Todo se guarda en tiempo real en la base de datos. No hay botón de "guardar" global — cada cambio se persiste inmediatamente.',
  },
  {
    q: '¿Puedo subir imágenes de portada o avatares?',
    a: 'Sí. Tanto las portadas de historia como los avatares de personaje admiten subida de imagen desde tu dispositivo. La imagen se recorta y optimiza automáticamente antes de guardarse para no saturar el almacenamiento.',
  },
];

// ── Page ──────────────────────────────────────────────────────────────────────

export default function HelpPage() {
  const router = useRouter();
  const [expanded, setExpanded] = useState(false);

  const handleAccordion = (panel) => (_, isExpanded) => {
    setExpanded(isExpanded ? panel : false);
  };

  return (
    <Box
      sx={{
        height: '100%',
        width: '100%',
        overflowY: 'auto',
        bgcolor: 'background.default',
      }}
    >
      <Container maxWidth="md" sx={{ py: { xs: 4, sm: 7 }, px: { xs: 2, sm: 3 } }}>

        {/* Back button */}
        <CustomButton
          variant="text"
          color="inherit"
          size="small"
          startIcon={<ArrowBackIcon fontSize="small" />}
          onClick={() => router.back()}
          sx={{ mb: 4, fontWeight: 600, opacity: 0.65, '&:hover': { opacity: 1 } }}
        >
          Volver
        </CustomButton>

        {/* Hero */}
        <Box sx={{ mb: 7, textAlign: 'center' }}>
          <Box
            sx={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 72,
              height: 72,
              borderRadius: 4,
              bgcolor: 'primary.main',
              color: 'primary.contrastText',
              mb: 3,
              boxShadow: (t) => `0 8px 28px ${t.palette.primary.main}55`,
            }}
          >
            <AutoStoriesIcon sx={{ fontSize: 38 }} />
          </Box>

          <Typography
            variant="h3"
            sx={{ fontWeight: 900, letterSpacing: '-0.03em', mb: 1.5, fontSize: { xs: '2rem', sm: '2.6rem' } }}
          >
            Lorebook Studio
          </Typography>

          <Typography
            variant="h6"
            color="text.secondary"
            sx={{ fontWeight: 400, maxWidth: 520, mx: 'auto', lineHeight: 1.6, fontSize: { xs: '1rem', sm: '1.15rem' } }}
          >
            La pizarra para escritores y guionistas. Organiza tus historias, personajes y tramas en un solo lugar.
          </Typography>

          <Box sx={{ mt: 2.5, display: 'flex', gap: 1, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Chip label="Escritores" size="small" variant="outlined" sx={{ fontWeight: 600 }} />
            <Chip label="Guionistas" size="small" variant="outlined" sx={{ fontWeight: 600 }} />
            <Chip label="Worldbuilding" size="small" variant="outlined" sx={{ fontWeight: 600 }} />
            <Chip label="Series y Sagas" size="small" variant="outlined" sx={{ fontWeight: 600 }} />
          </Box>
        </Box>

        <Divider sx={{ mb: 7 }} />

        {/* What is it */}
        <Box sx={{ mb: 7 }}>
          <Typography variant="overline" sx={{ fontWeight: 800, color: 'primary.main', letterSpacing: '0.1em' }}>
            ¿Qué es esto?
          </Typography>
          <Typography variant="h5" sx={{ fontWeight: 800, mt: 0.5, mb: 2 }}>
            Tu estudio creativo, siempre ordenado
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ lineHeight: 1.9, maxWidth: 640 }}>
            Lorebook Studio es un espacio de trabajo visual diseñado para que nunca pierdas el hilo de tu historia.
            Puedes gestionar múltiples proyectos, crear fichas detalladas de personajes, trazar relaciones entre ellos,
            organizar escenas en tableros de línea narrativa y capturar ideas al vuelo — todo sin salir de una sola pestaña.
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ lineHeight: 1.9, maxWidth: 640, mt: 1.5 }}>
            Pensado tanto para el novelista que construye un universo de fantasía épica como para el guionista
            que necesita tener claro quién aparece en cada escena y por qué.
          </Typography>
        </Box>

        {/* Features grid */}
        <Box sx={{ mb: 7 }}>
          <Typography variant="overline" sx={{ fontWeight: 800, color: 'primary.main', letterSpacing: '0.1em' }}>
            Herramientas
          </Typography>
          <Typography variant="h5" sx={{ fontWeight: 800, mt: 0.5, mb: 4 }}>
            Lo que puedes hacer
          </Typography>

          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
              gap: 2.5,
            }}
          >
            {FEATURES.map(({ icon: Icon, title, description, color }) => (
              <Box
                key={title}
                sx={{
                  p: 2.8,
                  borderRadius: 3.5,
                  border: '1px solid',
                  borderColor: 'divider',
                  bgcolor: 'background.paper',
                  transition: 'all 0.18s ease',
                  '&:hover': {
                    borderColor: color,
                    boxShadow: `0 4px 20px ${color}22`,
                    transform: 'translateY(-2px)',
                  },
                }}
              >
                <Box
                  sx={{
                    display: 'inline-flex',
                    p: 1,
                    borderRadius: 2,
                    bgcolor: `${color}18`,
                    mb: 1.5,
                  }}
                >
                  <Icon sx={{ fontSize: 22, color }} />
                </Box>
                <Typography variant="subtitle1" sx={{ fontWeight: 800, mb: 0.6 }}>
                  {title}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.7, fontSize: '0.88rem' }}>
                  {description}
                </Typography>
              </Box>
            ))}
          </Box>
        </Box>

        {/* Quick start */}
        <Box
          sx={{
            mb: 7,
            p: { xs: 2.5, sm: 3.5 },
            borderRadius: 4,
            bgcolor: 'primary.main',
            color: 'primary.contrastText',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          <Box
            sx={{
              position: 'absolute',
              top: -30,
              right: -30,
              width: 160,
              height: 160,
              borderRadius: '50%',
              bgcolor: 'rgba(255,255,255,0.06)',
            }}
          />
          <Typography variant="overline" sx={{ fontWeight: 800, opacity: 0.7, letterSpacing: '0.1em' }}>
            Guía rápida
          </Typography>
          <Typography variant="h5" sx={{ fontWeight: 800, mt: 0.5, mb: 3 }}>
            Empieza en 3 pasos
          </Typography>

          {[
            { n: '01', title: 'Crea tu primera historia', desc: 'Pulsa el botón de historia en la barra superior y crea un proyecto con título, género y portada opcional.' },
            { n: '02', title: 'Añade personajes', desc: 'Desde la pizarra principal, abre el panel de personajes (ícono de personas) y crea fichas. Puedes hacerlos globales si aparecen en varias historias.' },
            { n: '03', title: 'Organiza tus escenas', desc: 'Crea tableros de línea narrativa y añade eventos. Conéctalos con flechas para visualizar el orden de la trama.' },
          ].map(({ n, title, desc }) => (
            <Box key={n} sx={{ display: 'flex', gap: 2, mb: 2.5, '&:last-child': { mb: 0 } }}>
              <Typography
                sx={{
                  fontWeight: 900,
                  fontSize: '1.8rem',
                  lineHeight: 1,
                  opacity: 0.25,
                  minWidth: 42,
                  fontVariantNumeric: 'tabular-nums',
                }}
              >
                {n}
              </Typography>
              <Box>
                <Typography variant="subtitle1" sx={{ fontWeight: 800, mb: 0.3 }}>
                  {title}
                </Typography>
                <Typography variant="body2" sx={{ opacity: 0.82, lineHeight: 1.7 }}>
                  {desc}
                </Typography>
              </Box>
            </Box>
          ))}
        </Box>

        {/* FAQ */}
        <Box sx={{ mb: 7 }}>
          <Typography variant="overline" sx={{ fontWeight: 800, color: 'primary.main', letterSpacing: '0.1em' }}>
            Preguntas frecuentes
          </Typography>
          <Typography variant="h5" sx={{ fontWeight: 800, mt: 0.5, mb: 3 }}>
            ¿Tienes dudas?
          </Typography>

          {FAQ.map((item, i) => (
            <Accordion
              key={i}
              expanded={expanded === i}
              onChange={handleAccordion(i)}
              elevation={0}
              disableGutters
              sx={{
                border: '1px solid',
                borderColor: expanded === i ? 'primary.main' : 'divider',
                borderRadius: '12px !important',
                mb: 1.5,
                overflow: 'hidden',
                '&:before': { display: 'none' },
                transition: 'border-color 0.15s ease',
              }}
            >
              <AccordionSummary
                expandIcon={<ExpandMoreIcon />}
                sx={{
                  px: 2.5,
                  py: 0.5,
                  '& .MuiAccordionSummary-content': { my: 1.5 },
                }}
              >
                <Typography variant="body1" sx={{ fontWeight: 700, fontSize: '0.95rem' }}>
                  {item.q}
                </Typography>
              </AccordionSummary>
              <AccordionDetails sx={{ px: 2.5, pb: 2.5, pt: 0 }}>
                <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.8 }}>
                  {item.a}
                </Typography>
              </AccordionDetails>
            </Accordion>
          ))}
        </Box>

        <Divider sx={{ mb: 5 }} />

        {/* Footer */}
        <Box sx={{ textAlign: 'center', pb: 4 }}>
          <Typography variant="body2" color="text.disabled" sx={{ fontWeight: 600, mb: 0.5 }}>
            Lorebook Studio
          </Typography>
          <Typography variant="caption" color="text.disabled">
            Creado por <strong>Director Dorian</strong> · Una herramienta para quienes construyen mundos
          </Typography>
        </Box>

      </Container>
    </Box>
  );
}
