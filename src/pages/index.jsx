import React, { useEffect, useRef, useState } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { Box, Button, Container, Typography, Chip, Divider } from '@mui/material';
import { alpha } from '@mui/material/styles';
import AutoStoriesIcon from '@mui/icons-material/AutoStories';
import AccountTreeOutlinedIcon from '@mui/icons-material/AccountTreeOutlined';
import PeopleOutlineIcon from '@mui/icons-material/PeopleOutline';
import LightbulbOutlinedIcon from '@mui/icons-material/LightbulbOutlined';
import HistoryEduIcon from '@mui/icons-material/HistoryEdu';
import PublicOutlinedIcon from '@mui/icons-material/PublicOutlined';
import BoltOutlinedIcon from '@mui/icons-material/BoltOutlined';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import { useAuth } from '../context/AuthContext';

const FEATURES = [
  {
    icon: AccountTreeOutlinedIcon,
    title: 'Estructura narrativa visual',
    text: 'Un lienzo infinito donde cada escena es una carta. Conéctalas, ordénalas y ve el hilo de tu historia de un vistazo, con varios tableros para tramas paralelas.',
  },
  {
    icon: PeopleOutlineIcon,
    title: 'Personajes con memoria',
    text: 'Fichas completas con roles, etiquetas, carpetas y relaciones. Marca quién aparece en cada escena y reutiliza personajes entre historias.',
  },
  {
    icon: LightbulbOutlinedIcon,
    title: 'Pizarra de ideas',
    text: 'Captura una idea en segundos y clasifícala: idea, pendiente, hecha o descartada. Nada se pierde entre la inspiración y el manuscrito.',
  },
  {
    icon: HistoryEduIcon,
    title: 'Manuscrito con versiones',
    text: 'Escribe por capítulos con guardado automático. Crea puntos de control, compara cambios y vuelve a cualquier versión anterior cuando quieras.',
  },
  {
    icon: PublicOutlinedIcon,
    title: 'Universos y varias historias',
    text: 'Agrupa tus historias en un mismo universo y comparte personajes globales entre ellas, sin duplicar trabajo.',
  },
  {
    icon: BoltOutlinedIcon,
    title: 'Rápido y sin interrupciones',
    text: 'Los cambios se ven al instante mientras se guardan en segundo plano. Tu creatividad no espera al servidor.',
  },
];

const STEPS = [
  { n: '1', title: 'Crea tu historia', text: 'Dale título, género y una portada. Empiezas con un tablero listo para usar.' },
  { n: '2', title: 'Construye tu mundo', text: 'Suma personajes, escenas e ideas. Conecta todo en el lienzo.' },
  { n: '3', title: 'Escribe y versiona', text: 'Redacta tus capítulos y guarda puntos de control mientras avanzas.' },
];

const BENEFITS = [
  'Todo tu proyecto en un solo lugar',
  'Visión clara de la estructura de tu trama',
  'Sin perder ideas ni versiones de tu texto',
  'Pensado para escritores y creadores de mundos',
];

// Aparece con un suave desplazamiento cuando entra en pantalla
function Reveal({ children, delay = 0, sx }) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node || typeof IntersectionObserver === 'undefined') {
      setVisible(true);
      return undefined;
    }
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.15 }
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <Box
      ref={ref}
      sx={{
        opacity: visible ? 1 : 0,
        transform: visible ? 'none' : 'translateY(18px)',
        transition: `opacity 0.6s ease ${delay}ms, transform 0.6s ease ${delay}ms`,
        ...sx,
      }}
    >
      {children}
    </Box>
  );
}

// Maqueta estilizada del lienzo de eventos (decorativa)
function CanvasMock() {
  const cards = [
    { top: '8%', left: '6%', title: 'El primer día', color: '#b58ad6', tag: '#1' },
    { top: '34%', left: '38%', title: 'Juramento de venganza', color: '#d98c8c', tag: '#2' },
    { top: '6%', left: '62%', title: 'Consolidación', color: '#6fa37a', tag: '#3' },
    { top: '62%', left: '64%', title: 'Secuela', color: '#c9a66b', tag: '#4' },
  ];
  return (
    <Box
      aria-hidden
      sx={{
        position: 'relative',
        height: { xs: 240, md: 330 },
        borderRadius: 4,
        border: 1,
        borderColor: 'divider',
        bgcolor: 'background.paper',
        overflow: 'hidden',
        boxShadow: '0 24px 60px -20px rgba(0,0,0,0.25)',
        backgroundImage: (t) => `radial-gradient(${alpha(t.palette.text.primary, 0.12)} 1px, transparent 1px)`,
        backgroundSize: '18px 18px',
      }}
    >
      <Box component="svg" viewBox="0 0 100 100" preserveAspectRatio="none" sx={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}>
        <path d="M22 22 C 30 22, 30 46, 40 46" fill="none" stroke="currentColor" strokeOpacity="0.45" strokeWidth="0.5" strokeDasharray="1.6 1.2" vectorEffect="non-scaling-stroke" />
        <path d="M58 46 C 66 46, 62 20, 64 20" fill="none" stroke="currentColor" strokeOpacity="0.45" strokeWidth="0.5" strokeDasharray="1.6 1.2" vectorEffect="non-scaling-stroke" />
        <path d="M58 52 C 66 52, 62 74, 66 74" fill="none" stroke="currentColor" strokeOpacity="0.45" strokeWidth="0.5" strokeDasharray="1.6 1.2" vectorEffect="non-scaling-stroke" />
      </Box>
      {cards.map((c, i) => (
        <Box
          key={c.tag}
          sx={{
            position: 'absolute',
            top: c.top,
            left: c.left,
            width: { xs: 120, md: 170 },
            p: 1.2,
            borderRadius: 2.5,
            bgcolor: 'background.paper',
            border: 1,
            borderColor: 'divider',
            borderTop: `3px solid ${c.color}`,
            boxShadow: '0 6px 18px rgba(0,0,0,0.08)',
            animation: 'floatCard 6s ease-in-out infinite',
            animationDelay: `${i * 0.7}s`,
          }}
        >
          <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 700 }}>
            {c.tag}
          </Typography>
          <Typography variant="body2" sx={{ fontWeight: 700, fontSize: { xs: '0.72rem', md: '0.82rem' }, lineHeight: 1.25 }}>
            {c.title}
          </Typography>
          <Box sx={{ mt: 0.8, display: 'flex', gap: 0.4 }}>
            {[0, 1, 2].map((d) => (
              <Box key={d} sx={{ width: 14, height: 14, borderRadius: '50%', bgcolor: alpha(c.color, 0.35 + d * 0.2) }} />
            ))}
          </Box>
        </Box>
      ))}
    </Box>
  );
}

export default function LandingPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const isLoggedIn = Boolean(user) && !loading;

  const goPrimary = () => router.push(isLoggedIn ? '/dashboard' : '/login');
  const primaryLabel = isLoggedIn ? 'Ir a mi espacio de trabajo' : 'Comenzar ahora';

  return (
    <>
      <Head>
        <title>Lorebook Studio — Planifica, construye y escribe tus historias</title>
        <meta
          name="description"
          content="Lorebook Studio reúne estructura narrativa, personajes, ideas y manuscrito con versiones en un solo lugar para escritores y creadores de mundos."
        />
        <meta property="og:title" content="Lorebook Studio" />
        <meta property="og:description" content="Planifica, construye y escribe tus historias en un solo lugar." />
      </Head>

      <style>{`
        @keyframes floatCard { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-6px); } }
        @media (prefers-reduced-motion: reduce) { * { animation: none !important; } }
      `}</style>

      {/* La app bloquea el scroll del body: la landing tiene su propio contenedor con scroll */}
      <Box sx={{ height: '100dvh', overflowY: 'auto', bgcolor: 'background.default', color: 'text.primary' }}>
        {/* Barra superior */}
        <Box
          component="header"
          sx={{
            position: 'sticky',
            top: 0,
            zIndex: 10,
            backdropFilter: 'blur(10px)',
            bgcolor: (t) => alpha(t.palette.background.default, 0.85),
            borderBottom: 1,
            borderColor: 'divider',
          }}
        >
          <Container maxWidth="lg" sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', py: 1.2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2 }}>
              <Box sx={{ width: 34, height: 34, borderRadius: 1.8, bgcolor: 'primary.main', color: 'primary.contrastText', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <AutoStoriesIcon fontSize="small" />
              </Box>
              <Typography sx={{ fontWeight: 800, letterSpacing: '-0.01em' }}>Lorebook Studio</Typography>
            </Box>
            <Box sx={{ display: 'flex', gap: 1 }}>
              {!isLoggedIn && (
                <Button onClick={() => router.push('/login')} sx={{ textTransform: 'none', fontWeight: 700, color: 'text.primary' }}>
                  Iniciar sesión
                </Button>
              )}
              <Button variant="contained" onClick={goPrimary} sx={{ textTransform: 'none', fontWeight: 700, borderRadius: 2 }}>
                {isLoggedIn ? 'Mi espacio' : 'Comenzar'}
              </Button>
            </Box>
          </Container>
        </Box>

        {/* Hero */}
        <Container maxWidth="lg" sx={{ pt: { xs: 5, md: 9 }, pb: { xs: 6, md: 10 } }}>
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1.05fr 1fr' }, gap: { xs: 5, md: 6 }, alignItems: 'center' }}>
            <Reveal>
              <Chip label="Para escritores y creadores de mundos" size="small" sx={{ mb: 2, fontWeight: 700, bgcolor: (t) => alpha(t.palette.primary.main, 0.12), color: 'primary.main' }} />
              <Typography component="h1" sx={{ fontWeight: 800, fontSize: { xs: '2.2rem', md: '3.3rem' }, lineHeight: 1.08, letterSpacing: '-0.03em' }}>
                Planifica, construye y escribe tus historias{' '}
                <Box component="span" sx={{ color: 'primary.main' }}>en un solo lugar</Box>
              </Typography>
              <Typography sx={{ mt: 2.5, fontSize: { xs: '1rem', md: '1.15rem' }, color: 'text.secondary', maxWidth: 520, lineHeight: 1.6 }}>
                Lorebook Studio une el lienzo de tu trama, tus personajes, tus ideas y tu manuscrito. Menos pestañas y notas sueltas; más tiempo para contar tu historia.
              </Typography>
              <Box sx={{ mt: 3.5, display: 'flex', flexWrap: 'wrap', gap: 1.5 }}>
                <Button
                  variant="contained"
                  size="large"
                  endIcon={<ArrowForwardIcon />}
                  onClick={goPrimary}
                  sx={{ textTransform: 'none', fontWeight: 700, borderRadius: 2.5, px: 3, py: 1.2 }}
                >
                  {primaryLabel}
                </Button>
                <Button
                  variant="outlined"
                  size="large"
                  color="inherit"
                  onClick={() => document.getElementById('funciones')?.scrollIntoView({ behavior: 'smooth' })}
                  sx={{ textTransform: 'none', fontWeight: 700, borderRadius: 2.5, px: 3, py: 1.2, borderColor: 'divider' }}
                >
                  Ver qué incluye
                </Button>
              </Box>
            </Reveal>
            <Reveal delay={150}>
              <CanvasMock />
            </Reveal>
          </Box>
        </Container>

        {/* Beneficios rápidos */}
        <Box sx={{ borderTop: 1, borderBottom: 1, borderColor: 'divider', bgcolor: 'custom.sidebar' }}>
          <Container maxWidth="lg" sx={{ py: 3 }}>
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: 'repeat(4, 1fr)' }, gap: 2 }}>
              {BENEFITS.map((b) => (
                <Box key={b} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <CheckCircleOutlineIcon sx={{ color: 'primary.main', fontSize: 20 }} />
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>{b}</Typography>
                </Box>
              ))}
            </Box>
          </Container>
        </Box>

        {/* Funciones */}
        <Container id="funciones" maxWidth="lg" sx={{ py: { xs: 7, md: 10 } }}>
          <Reveal sx={{ textAlign: 'center', mb: 5 }}>
            <Typography sx={{ fontWeight: 800, fontSize: { xs: '1.7rem', md: '2.3rem' }, letterSpacing: '-0.02em' }}>
              Todo lo que necesita tu historia
            </Typography>
            <Typography sx={{ mt: 1.2, color: 'text.secondary', maxWidth: 560, mx: 'auto' }}>
              Herramientas pensadas para el proceso real de escribir: desde la primera chispa hasta el último capítulo.
            </Typography>
          </Reveal>
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: 'repeat(3, 1fr)' }, gap: 2.5 }}>
            {FEATURES.map(({ icon: Icon, title, text }, i) => (
              <Reveal key={title} delay={(i % 3) * 90}>
                <Box
                  sx={{
                    height: '100%',
                    p: 3,
                    borderRadius: 3,
                    border: 1,
                    borderColor: 'divider',
                    bgcolor: 'background.paper',
                    transition: 'transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease',
                    '&:hover': { transform: 'translateY(-4px)', boxShadow: '0 14px 30px -12px rgba(0,0,0,0.18)', borderColor: 'primary.main' },
                  }}
                >
                  <Box sx={{ width: 44, height: 44, borderRadius: 2.2, bgcolor: (t) => alpha(t.palette.primary.main, 0.12), color: 'primary.main', display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 2 }}>
                    <Icon />
                  </Box>
                  <Typography sx={{ fontWeight: 800, fontSize: '1.05rem', mb: 0.8 }}>{title}</Typography>
                  <Typography variant="body2" sx={{ color: 'text.secondary', lineHeight: 1.65 }}>{text}</Typography>
                </Box>
              </Reveal>
            ))}
          </Box>
        </Container>

        {/* Cómo funciona */}
        <Box sx={{ bgcolor: 'custom.sidebar', borderTop: 1, borderBottom: 1, borderColor: 'divider' }}>
          <Container maxWidth="lg" sx={{ py: { xs: 7, md: 9 } }}>
            <Reveal sx={{ textAlign: 'center', mb: 5 }}>
              <Typography sx={{ fontWeight: 800, fontSize: { xs: '1.7rem', md: '2.2rem' }, letterSpacing: '-0.02em' }}>
                Empieza en tres pasos
              </Typography>
            </Reveal>
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' }, gap: 3 }}>
              {STEPS.map((step, i) => (
                <Reveal key={step.n} delay={i * 110}>
                  <Box sx={{ display: 'flex', gap: 2 }}>
                    <Box sx={{ flexShrink: 0, width: 42, height: 42, borderRadius: '50%', bgcolor: 'primary.main', color: 'primary.contrastText', fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {step.n}
                    </Box>
                    <Box>
                      <Typography sx={{ fontWeight: 800, mb: 0.5 }}>{step.title}</Typography>
                      <Typography variant="body2" sx={{ color: 'text.secondary', lineHeight: 1.6 }}>{step.text}</Typography>
                    </Box>
                  </Box>
                </Reveal>
              ))}
            </Box>
          </Container>
        </Box>

        {/* Llamado final */}
        <Container maxWidth="md" sx={{ py: { xs: 7, md: 10 } }}>
          <Reveal>
            <Box
              sx={{
                textAlign: 'center',
                p: { xs: 4, md: 6 },
                borderRadius: 4,
                bgcolor: 'primary.main',
                color: 'primary.contrastText',
                boxShadow: '0 24px 60px -24px rgba(0,0,0,0.4)',
              }}
            >
              <Typography sx={{ fontWeight: 800, fontSize: { xs: '1.6rem', md: '2.1rem' }, letterSpacing: '-0.02em' }}>
                Tu próxima historia empieza aquí
              </Typography>
              <Typography sx={{ mt: 1.2, opacity: 0.9, maxWidth: 480, mx: 'auto' }}>
                Ordena tus ideas, da forma a tu mundo y escribe con la tranquilidad de que nada se pierde.
              </Typography>
              <Button
                variant="contained"
                size="large"
                onClick={goPrimary}
                endIcon={<ArrowForwardIcon />}
                sx={{ mt: 3, textTransform: 'none', fontWeight: 800, borderRadius: 2.5, px: 3.5, bgcolor: 'background.paper', color: 'primary.main', '&:hover': { bgcolor: 'background.default' } }}
              >
                {primaryLabel}
              </Button>
            </Box>
          </Reveal>
        </Container>

        <Divider />
        <Container maxWidth="lg" sx={{ py: 3, display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', gap: 1 }}>
          <Typography variant="caption" color="text.secondary">
            © {new Date().getFullYear()} Lorebook Studio
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Hecho para quienes construyen mundos con palabras.
          </Typography>
        </Container>
      </Box>
    </>
  );
}
