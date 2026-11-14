import React, { useEffect, useRef, useState } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { Box, Button, Container, Typography, Chip } from '@mui/material';
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
import CloudDoneOutlinedIcon from '@mui/icons-material/CloudDoneOutlined';
import FormatBoldIcon from '@mui/icons-material/FormatBold';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import FavoriteIcon from '@mui/icons-material/Favorite';
import { useAuth } from '../context/AuthContext';

const FEATURES = [
  {
    icon: AccountTreeOutlinedIcon,
    color: '#b58ad6',
    title: 'Estructura narrativa visual',
    text: 'Un lienzo infinito donde cada escena es una carta. Conéctalas, ordénalas y ve el hilo de tu historia de un vistazo, con varios tableros para tramas paralelas.',
  },
  {
    icon: PeopleOutlineIcon,
    color: '#d98c8c',
    title: 'Personajes con memoria',
    text: 'Fichas completas con roles, etiquetas, carpetas y relaciones. Marca quién aparece en cada escena y reutiliza personajes entre historias.',
  },
  {
    icon: LightbulbOutlinedIcon,
    color: '#c9a66b',
    title: 'Pizarra de ideas',
    text: 'Captura una idea en segundos y clasifícala: idea, pendiente, hecha o descartada. Nada se pierde entre la inspiración y el manuscrito.',
  },
  {
    icon: HistoryEduIcon,
    color: '#6fa37a',
    title: 'Manuscrito con copias de seguridad',
    text: 'Escribe por capítulos con guardado automático y negrita. Crea copias de seguridad, compara cambios y vuelve atrás cuando quieras.',
  },
  {
    icon: PublicOutlinedIcon,
    color: '#6c9bbf',
    title: 'Universos y varias historias',
    text: 'Agrupa tus historias en un mismo universo y comparte personajes globales entre ellas, sin duplicar trabajo.',
  },
  {
    icon: BoltOutlinedIcon,
    color: '#c98a5e',
    title: 'Rápido y sin interrupciones',
    text: 'Los cambios se ven al instante mientras se guardan en segundo plano. Tu creatividad no espera al servidor.',
  },
];

const STEPS = [
  { n: '1', title: 'Crea tu historia', text: 'Dale título, género y una portada. Empiezas con un tablero listo para usar.' },
  { n: '2', title: 'Construye tu mundo', text: 'Suma personajes, escenas e ideas. Conecta todo en el lienzo.' },
  { n: '3', title: 'Escribe sin miedo', text: 'Redacta tus capítulos con autoguardado y crea copias de seguridad cuando quieras.' },
];

const MARQUEE = ['Tramas', 'Personajes', 'Ideas', 'Capítulos', 'Universos', 'Relaciones', 'Copias de seguridad', 'Modo sepia', 'Modo noche'];

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
      { threshold: 0.12 }
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <Box
      ref={ref}
      sx={{
        opacity: visible ? 1 : 0,
        transform: visible ? 'none' : 'translateY(22px)',
        transition: `opacity 0.7s ease ${delay}ms, transform 0.7s cubic-bezier(0.2, 0.7, 0.2, 1) ${delay}ms`,
        ...sx,
      }}
    >
      {children}
    </Box>
  );
}

// Ventana tipo navegador que enmarca las maquetas del producto
function Frame({ title, children, sx }) {
  return (
    <Box
      aria-hidden
      sx={{
        borderRadius: 3.5,
        border: 1,
        borderColor: 'divider',
        bgcolor: 'background.paper',
        overflow: 'hidden',
        boxShadow: '0 30px 70px -28px rgba(40, 25, 10, 0.4)',
        ...sx,
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.7, px: 1.6, py: 1, borderBottom: 1, borderColor: 'divider', bgcolor: 'custom.sidebar' }}>
        {['#ec6a5e', '#f4bf4f', '#61c554'].map((c) => (
          <Box key={c} sx={{ width: 9, height: 9, borderRadius: '50%', bgcolor: c }} />
        ))}
        <Typography variant="caption" sx={{ ml: 1.2, color: 'text.secondary', fontWeight: 600, fontSize: '0.68rem' }}>{title}</Typography>
      </Box>
      {children}
    </Box>
  );
}

// Maqueta del lienzo de eventos
function CanvasMock({ height = { xs: 240, md: 340 } }) {
  const cards = [
    { top: '8%', left: '5%', title: 'El primer día', color: '#b58ad6', tag: '#1' },
    { top: '36%', left: '37%', title: 'Juramento de venganza', color: '#d98c8c', tag: '#2' },
    { top: '6%', left: '64%', title: 'Consolidación', color: '#6fa37a', tag: '#3' },
    { top: '64%', left: '66%', title: 'Secuela', color: '#c9a66b', tag: '#4' },
  ];
  return (
    <Box
      sx={{
        position: 'relative',
        height,
        backgroundImage: (t) => `radial-gradient(${alpha(t.palette.text.primary, 0.14)} 1px, transparent 1px)`,
        backgroundSize: '18px 18px',
      }}
    >
      <Box component="svg" viewBox="0 0 100 100" preserveAspectRatio="none" sx={{ position: 'absolute', inset: 0, width: '100%', height: '100%', color: 'text.secondary' }}>
        <path d="M24 22 C 32 22, 30 48, 39 48" fill="none" stroke="currentColor" strokeOpacity="0.5" strokeWidth="1.2" strokeDasharray="4 3" vectorEffect="non-scaling-stroke" />
        <path d="M60 48 C 68 48, 62 20, 65 20" fill="none" stroke="currentColor" strokeOpacity="0.5" strokeWidth="1.2" strokeDasharray="4 3" vectorEffect="non-scaling-stroke" />
        <path d="M60 54 C 68 54, 62 76, 67 76" fill="none" stroke="currentColor" strokeOpacity="0.5" strokeWidth="1.2" strokeDasharray="4 3" vectorEffect="non-scaling-stroke" />
      </Box>
      {cards.map((c, i) => (
        <Box
          key={c.tag}
          sx={{
            position: 'absolute',
            top: c.top,
            left: c.left,
            width: { xs: 120, md: 172 },
            p: 1.2,
            borderRadius: 2.5,
            bgcolor: 'background.paper',
            border: 1,
            borderColor: 'divider',
            borderTop: `3px solid ${c.color}`,
            boxShadow: '0 8px 20px rgba(0,0,0,0.1)',
            animation: 'floatCard 6s ease-in-out infinite',
            animationDelay: `${i * 0.7}s`,
          }}
        >
          <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 700 }}>{c.tag}</Typography>
          <Typography variant="body2" sx={{ fontWeight: 700, fontSize: { xs: '0.72rem', md: '0.82rem' }, lineHeight: 1.25 }}>{c.title}</Typography>
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

// Maqueta de la galería de personajes
function CharactersMock() {
  const people = [
    { name: 'Mara', role: 'Protagonista', color: '#d98c8c' },
    { name: 'Kael', role: 'Antagonista', color: '#b58ad6' },
    { name: 'Iris', role: 'Mentora', color: '#6fa37a' },
    { name: 'Bram', role: 'Aliado', color: '#6c9bbf' },
    { name: 'Noa', role: 'Secundario', color: '#c9a66b' },
    { name: 'Sombra', role: 'Misterioso', color: '#8a8f9c' },
  ];
  return (
    <Box sx={{ p: 2, display: 'grid', gridTemplateColumns: { xs: '1fr 1fr', sm: 'repeat(3, 1fr)' }, gap: 1.2 }}>
      {people.map((p) => (
        <Box
          key={p.name}
          sx={{
            p: 1.2,
            borderRadius: 2.5,
            border: 1,
            borderColor: 'divider',
            borderLeft: `4px solid ${p.color}`,
            bgcolor: alpha(p.color, 0.1),
            display: 'flex',
            alignItems: 'center',
            gap: 1,
          }}
        >
          <Box sx={{ width: 34, height: 34, borderRadius: '50%', bgcolor: p.color, color: '#fff', fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {p.name[0]}
          </Box>
          <Box sx={{ minWidth: 0 }}>
            <Typography variant="body2" sx={{ fontWeight: 800, lineHeight: 1.2 }} noWrap>{p.name}</Typography>
            <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.68rem' }} noWrap>{p.role}</Typography>
          </Box>
        </Box>
      ))}
    </Box>
  );
}

// Maqueta del editor del manuscrito
function ManuscriptMock() {
  return (
    <Box sx={{ p: { xs: 2, sm: 3 }, bgcolor: '#f4ecd8', color: '#433422' }}>
      <Box sx={{ display: 'flex', gap: 0.8, mb: 2, alignItems: 'center' }}>
        <Box sx={{ width: 28, height: 28, borderRadius: 1.5, border: '1px solid #d8cba9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <FormatBoldIcon sx={{ fontSize: 17 }} />
        </Box>
        <Box sx={{ px: 1, height: 28, borderRadius: 1.5, border: '1px solid #d8cba9', display: 'flex', alignItems: 'center', fontSize: '0.72rem', fontWeight: 700 }}>A−  19  A+</Box>
        <Box sx={{ px: 1.2, height: 28, borderRadius: 1.5, border: '1px solid #d8cba9', display: 'flex', alignItems: 'center', fontSize: '0.72rem', fontWeight: 700 }}>Vista ▾</Box>
      </Box>
      <Typography sx={{ fontWeight: 900, fontSize: '1.4rem', letterSpacing: '-0.02em', mb: 1.2 }}>Capítulo 1</Typography>
      <Typography sx={{ fontFamily: 'Georgia, "Times New Roman", serif', fontSize: '0.98rem', lineHeight: 1.85 }}>
        La niebla cubría el valle cuando Mara cruzó el puente. <strong>Nadie</strong> debía saber lo que llevaba consigo, ni siquiera Kael, que la esperaba al otro lado con las manos vacías y la mirada de quien ya conoce el final.
      </Typography>
      <Box sx={{ mt: 2, pt: 1.2, borderTop: '1px solid #d8cba9', display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.72rem', color: '#7a6a52' }}>
        <span>163 palabras</span>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <CloudDoneOutlinedIcon sx={{ fontSize: 15 }} /> Guardado automáticamente
        </Box>
      </Box>
    </Box>
  );
}

// Bloque de presentación: texto + maqueta, alternando lados
function Showcase({ reverse, eyebrow, title, text, bullets, children }) {
  return (
    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1.1fr' }, gap: { xs: 4, md: 7 }, alignItems: 'center' }}>
      <Reveal sx={{ order: { xs: 1, md: reverse ? 2 : 1 } }}>
        <Chip icon={<AutoAwesomeIcon sx={{ fontSize: '14px !important' }} />} label={eyebrow} size="small" sx={{ mb: 1.6, fontWeight: 700, bgcolor: (t) => alpha(t.palette.primary.main, 0.12), color: 'primary.main', '& .MuiChip-icon': { color: 'primary.main' } }} />
        <Typography component="h3" sx={{ fontWeight: 800, fontSize: { xs: '1.6rem', md: '2.1rem' }, lineHeight: 1.15, letterSpacing: '-0.02em' }}>{title}</Typography>
        <Typography sx={{ mt: 1.5, color: 'text.secondary', lineHeight: 1.7 }}>{text}</Typography>
        <Box sx={{ mt: 2.2, display: 'flex', flexDirection: 'column', gap: 1 }}>
          {bullets.map((b) => (
            <Box key={b} sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
              <CheckCircleOutlineIcon sx={{ color: 'primary.main', fontSize: 20 }} />
              <Typography variant="body2" sx={{ fontWeight: 600 }}>{b}</Typography>
            </Box>
          ))}
        </Box>
      </Reveal>
      <Reveal delay={120} sx={{ order: { xs: 2, md: reverse ? 1 : 2 } }}>
        {children}
      </Reveal>
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
          content="Lorebook Studio reúne estructura narrativa, personajes, ideas y manuscrito con copias de seguridad en un solo lugar para escritores y creadores de mundos."
        />
        <meta property="og:title" content="Lorebook Studio" />
        <meta property="og:description" content="Planifica, construye y escribe tus historias en un solo lugar." />
      </Head>

      <style>{`
        @keyframes floatCard { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-7px); } }
        @keyframes orbDrift { 0%,100% { transform: translate(0,0) scale(1); } 50% { transform: translate(30px,-24px) scale(1.08); } }
        @keyframes marquee { from { transform: translateX(0); } to { transform: translateX(-50%); } }
        @keyframes badgePop { 0%,100% { transform: translateY(0) rotate(-2deg); } 50% { transform: translateY(-5px) rotate(1deg); } }
        @media (prefers-reduced-motion: reduce) { * { animation: none !important; } }
      `}</style>

      {/* La app bloquea el scroll del body: la landing tiene su propio contenedor con scroll */}
      <Box sx={{ height: '100dvh', overflowY: 'auto', overflowX: 'hidden', bgcolor: 'background.default', color: 'text.primary' }}>
        {/* Barra superior */}
        <Box
          component="header"
          sx={{
            position: 'sticky',
            top: 0,
            zIndex: 10,
            backdropFilter: 'blur(12px)',
            bgcolor: (t) => alpha(t.palette.background.default, 0.8),
            borderBottom: 1,
            borderColor: 'divider',
          }}
        >
          <Container maxWidth="lg" sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', py: 1.2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2 }}>
              <Box sx={{ width: 34, height: 34, borderRadius: 1.8, bgcolor: 'primary.main', color: 'primary.contrastText', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: (t) => `0 6px 16px ${alpha(t.palette.primary.main, 0.4)}` }}>
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
        <Box sx={{ position: 'relative', overflow: 'hidden' }}>
          {/* Luces de fondo */}
          <Box aria-hidden sx={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
            <Box sx={{ position: 'absolute', top: -120, left: '-8%', width: 460, height: 460, borderRadius: '50%', filter: 'blur(90px)', bgcolor: (t) => alpha(t.palette.primary.main, 0.28), animation: 'orbDrift 14s ease-in-out infinite' }} />
            <Box sx={{ position: 'absolute', top: 60, right: '-6%', width: 420, height: 420, borderRadius: '50%', filter: 'blur(90px)', bgcolor: (t) => alpha(t.palette.secondary.main, 0.24), animation: 'orbDrift 18s ease-in-out infinite reverse' }} />
            <Box sx={{ position: 'absolute', inset: 0, backgroundImage: (t) => `radial-gradient(${alpha(t.palette.text.primary, 0.09)} 1px, transparent 1px)`, backgroundSize: '26px 26px', maskImage: 'linear-gradient(to bottom, black 30%, transparent 95%)', WebkitMaskImage: 'linear-gradient(to bottom, black 30%, transparent 95%)' }} />
          </Box>

          <Container maxWidth="lg" sx={{ position: 'relative', pt: { xs: 5, md: 9 }, pb: { xs: 7, md: 11 } }}>
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1.08fr' }, gap: { xs: 6, md: 6 }, alignItems: 'center' }}>
              <Reveal>
                <Chip icon={<AutoAwesomeIcon sx={{ fontSize: '15px !important' }} />} label="Para escritores y creadores de mundos" size="small" sx={{ mb: 2.2, fontWeight: 700, bgcolor: (t) => alpha(t.palette.background.paper, 0.8), border: 1, borderColor: 'divider', '& .MuiChip-icon': { color: 'primary.main' } }} />
                <Typography component="h1" sx={{ fontWeight: 900, fontSize: { xs: '2.4rem', md: '3.7rem' }, lineHeight: 1.04, letterSpacing: '-0.035em' }}>
                  Planifica, construye y escribe tus historias{' '}
                  <Box
                    component="span"
                    sx={{
                      background: (t) => `linear-gradient(100deg, ${t.palette.primary.main}, ${t.palette.secondary.main})`,
                      WebkitBackgroundClip: 'text',
                      backgroundClip: 'text',
                      color: 'transparent',
                    }}
                  >
                    en un solo lugar
                  </Box>
                </Typography>
                <Typography sx={{ mt: 2.5, fontSize: { xs: '1.02rem', md: '1.18rem' }, color: 'text.secondary', maxWidth: 520, lineHeight: 1.65 }}>
                  Lorebook Studio une el lienzo de tu trama, tus personajes, tus ideas y tu manuscrito. Menos pestañas y notas sueltas; más tiempo para contar tu historia.
                </Typography>
                <Box sx={{ mt: 3.8, display: 'flex', flexWrap: 'wrap', gap: 1.5 }}>
                  <Button
                    variant="contained"
                    size="large"
                    endIcon={<ArrowForwardIcon />}
                    onClick={goPrimary}
                    sx={{ textTransform: 'none', fontWeight: 800, borderRadius: 3, px: 3.4, py: 1.4, fontSize: '1rem', boxShadow: (t) => `0 14px 30px -10px ${alpha(t.palette.primary.main, 0.7)}`, transition: 'transform 0.2s ease', '&:hover': { transform: 'translateY(-2px)' } }}
                  >
                    {primaryLabel}
                  </Button>
                  <Button
                    variant="outlined"
                    size="large"
                    color="inherit"
                    onClick={() => document.getElementById('funciones')?.scrollIntoView({ behavior: 'smooth' })}
                    sx={{ textTransform: 'none', fontWeight: 700, borderRadius: 3, px: 3, py: 1.4, borderColor: 'divider', bgcolor: (t) => alpha(t.palette.background.paper, 0.6) }}
                  >
                    Ver qué incluye
                  </Button>
                </Box>
              </Reveal>

              <Reveal delay={150} sx={{ position: 'relative' }}>
                <Frame title="Lorebook Studio · Estructura narrativa">
                  <CanvasMock />
                </Frame>
                {/* Insignias flotantes */}
                <Box sx={{ display: { xs: 'none', sm: 'flex' }, position: 'absolute', top: -16, right: -10, px: 1.4, py: 0.7, gap: 0.6, alignItems: 'center', borderRadius: 3, bgcolor: 'background.paper', border: 1, borderColor: 'divider', boxShadow: '0 12px 28px -10px rgba(0,0,0,0.3)', animation: 'badgePop 5s ease-in-out infinite' }}>
                  <CloudDoneOutlinedIcon sx={{ fontSize: 17, color: 'success.main' }} />
                  <Typography variant="caption" sx={{ fontWeight: 700 }}>Guardado automáticamente</Typography>
                </Box>
                <Box sx={{ display: { xs: 'none', sm: 'flex' }, position: 'absolute', bottom: -18, left: -14, px: 1.4, py: 0.7, gap: 0.6, alignItems: 'center', borderRadius: 3, bgcolor: 'background.paper', border: 1, borderColor: 'divider', boxShadow: '0 12px 28px -10px rgba(0,0,0,0.3)', animation: 'badgePop 6s ease-in-out infinite', animationDelay: '1s' }}>
                  <PeopleOutlineIcon sx={{ fontSize: 17, color: 'primary.main' }} />
                  <Typography variant="caption" sx={{ fontWeight: 700 }}>+ Nuevo personaje</Typography>
                </Box>
              </Reveal>
            </Box>
          </Container>
        </Box>

        {/* Cinta de conceptos */}
        <Box sx={{ borderTop: 1, borderBottom: 1, borderColor: 'divider', bgcolor: 'custom.sidebar', overflow: 'hidden', py: 1.6 }}>
          <Box sx={{ display: 'flex', width: 'max-content', animation: 'marquee 32s linear infinite' }}>
            {[...MARQUEE, ...MARQUEE].map((word, i) => (
              <Box key={`${word}-${i}`} sx={{ display: 'flex', alignItems: 'center', gap: 2.5, pr: 2.5 }}>
                <Typography sx={{ fontWeight: 800, fontSize: '0.95rem', letterSpacing: '0.04em', textTransform: 'uppercase', color: 'text.secondary', whiteSpace: 'nowrap' }}>{word}</Typography>
                <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: 'primary.main', opacity: 0.6 }} />
              </Box>
            ))}
          </Box>
        </Box>

        {/* Presentaciones */}
        <Container maxWidth="lg" sx={{ py: { xs: 8, md: 12 }, display: 'flex', flexDirection: 'column', gap: { xs: 9, md: 13 } }}>
          <Showcase
            eyebrow="Estructura narrativa"
            title="Ve el hilo de tu historia de un vistazo"
            text="Cada escena es una carta en un lienzo infinito. Arrástralas, conéctalas y organiza tramas paralelas en distintos tableros."
            bullets={['Doble clic para crear una escena al instante', 'Conexiones entre eventos y personajes presentes', 'Varios tableros para tramas paralelas']}
          >
            <Frame title="Estructura narrativa"><CanvasMock height={{ xs: 230, md: 300 }} /></Frame>
          </Showcase>

          <Showcase
            reverse
            eyebrow="Personajes"
            title="Tu reparto, siempre a mano"
            text="Fichas completas con rol, biografía, psicología y vínculos. Organízalos en carpetas y etiquetas, y reutilízalos entre historias."
            bullets={['Carpetas, etiquetas y arquetipos propios', 'Relaciones entre personajes', 'Exporta las fichas cuando las necesites']}
          >
            <Frame title="Personajes"><CharactersMock /></Frame>
          </Showcase>

          <Showcase
            eyebrow="Manuscrito"
            title="Escribe cómodo, sin miedo a perder nada"
            text="Un editor pensado para la prosa, con negrita, modo sepia y noche suave para cuidar tu vista, y autoguardado constante."
            bullets={['Autoguardado: tu texto nunca queda a medias', 'Copias de seguridad con comparación de cambios', 'Tema, fuente y espaciado a tu gusto']}
          >
            <Frame title="Capítulo 1"><ManuscriptMock /></Frame>
          </Showcase>
        </Container>

        {/* Funciones */}
        <Box sx={{ bgcolor: 'custom.sidebar', borderTop: 1, borderBottom: 1, borderColor: 'divider' }}>
          <Container id="funciones" maxWidth="lg" sx={{ py: { xs: 8, md: 11 } }}>
            <Reveal sx={{ textAlign: 'center', mb: 5.5 }}>
              <Typography sx={{ fontWeight: 900, fontSize: { xs: '1.8rem', md: '2.5rem' }, letterSpacing: '-0.025em' }}>
                Todo lo que necesita tu historia
              </Typography>
              <Typography sx={{ mt: 1.2, color: 'text.secondary', maxWidth: 560, mx: 'auto' }}>
                Herramientas pensadas para el proceso real de escribir: desde la primera chispa hasta el último capítulo.
              </Typography>
            </Reveal>
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: 'repeat(3, 1fr)' }, gap: 2.5 }}>
              {FEATURES.map(({ icon: Icon, title, text, color }, i) => (
                <Reveal key={title} delay={(i % 3) * 90}>
                  <Box
                    sx={{
                      position: 'relative',
                      height: '100%',
                      p: 3,
                      borderRadius: 3.5,
                      border: 1,
                      borderColor: 'divider',
                      bgcolor: 'background.paper',
                      overflow: 'hidden',
                      transition: 'transform 0.25s ease, box-shadow 0.25s ease, border-color 0.25s ease',
                      '&::before': { content: '""', position: 'absolute', top: 0, left: 0, right: 0, height: 3, bgcolor: color, opacity: 0.85 },
                      '&:hover': { transform: 'translateY(-6px)', boxShadow: `0 20px 40px -16px ${alpha(color, 0.55)}`, borderColor: color },
                    }}
                  >
                    <Box sx={{ width: 48, height: 48, borderRadius: 2.5, bgcolor: alpha(color, 0.16), color, display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 2 }}>
                      <Icon />
                    </Box>
                    <Typography sx={{ fontWeight: 800, fontSize: '1.08rem', mb: 0.8 }}>{title}</Typography>
                    <Typography variant="body2" sx={{ color: 'text.secondary', lineHeight: 1.7 }}>{text}</Typography>
                  </Box>
                </Reveal>
              ))}
            </Box>
          </Container>
        </Box>

        {/* Cómo funciona */}
        <Container maxWidth="lg" sx={{ py: { xs: 8, md: 11 } }}>
          <Reveal sx={{ textAlign: 'center', mb: 6 }}>
            <Typography sx={{ fontWeight: 900, fontSize: { xs: '1.8rem', md: '2.4rem' }, letterSpacing: '-0.025em' }}>
              Empieza en tres pasos
            </Typography>
          </Reveal>
          <Box sx={{ position: 'relative', display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' }, gap: { xs: 4, md: 3 } }}>
            <Box aria-hidden sx={{ display: { xs: 'none', md: 'block' }, position: 'absolute', top: 27, left: '16%', right: '16%', borderTop: 2, borderStyle: 'dashed', borderColor: 'divider' }} />
            {STEPS.map((step, i) => (
              <Reveal key={step.n} delay={i * 120} sx={{ textAlign: { xs: 'left', md: 'center' } }}>
                <Box sx={{ display: 'flex', flexDirection: { xs: 'row', md: 'column' }, alignItems: { xs: 'flex-start', md: 'center' }, gap: 2 }}>
                  <Box sx={{ position: 'relative', flexShrink: 0, width: 54, height: 54, borderRadius: '50%', bgcolor: 'primary.main', color: 'primary.contrastText', fontWeight: 900, fontSize: '1.2rem', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: (t) => `0 0 0 6px ${alpha(t.palette.primary.main, 0.15)}` }}>
                    {step.n}
                  </Box>
                  <Box>
                    <Typography sx={{ fontWeight: 800, mb: 0.5, fontSize: '1.05rem' }}>{step.title}</Typography>
                    <Typography variant="body2" sx={{ color: 'text.secondary', lineHeight: 1.65, maxWidth: 300, mx: { md: 'auto' } }}>{step.text}</Typography>
                  </Box>
                </Box>
              </Reveal>
            ))}
          </Box>
        </Container>

        {/* Llamado final */}
        <Container maxWidth="md" sx={{ pb: { xs: 8, md: 11 } }}>
          <Reveal>
            <Box
              sx={{
                position: 'relative',
                overflow: 'hidden',
                textAlign: 'center',
                p: { xs: 4.5, md: 7 },
                borderRadius: 5,
                color: 'primary.contrastText',
                background: (t) => `linear-gradient(135deg, ${t.palette.primary.dark || t.palette.primary.main}, ${t.palette.primary.main} 55%, ${t.palette.secondary.main})`,
                boxShadow: '0 30px 70px -26px rgba(40, 25, 10, 0.55)',
              }}
            >
              <Box aria-hidden sx={{ position: 'absolute', top: -60, right: -40, width: 220, height: 220, borderRadius: '50%', bgcolor: 'rgba(255,255,255,0.12)', filter: 'blur(6px)' }} />
              <Box aria-hidden sx={{ position: 'absolute', bottom: -70, left: -50, width: 240, height: 240, borderRadius: '50%', bgcolor: 'rgba(255,255,255,0.09)', filter: 'blur(6px)' }} />
              <Typography sx={{ position: 'relative', fontWeight: 900, fontSize: { xs: '1.7rem', md: '2.4rem' }, letterSpacing: '-0.025em' }}>
                Tu próxima historia empieza aquí
              </Typography>
              <Typography sx={{ position: 'relative', mt: 1.4, opacity: 0.92, maxWidth: 480, mx: 'auto' }}>
                Ordena tus ideas, da forma a tu mundo y escribe con la tranquilidad de que nada se pierde.
              </Typography>
              <Button
                variant="contained"
                size="large"
                onClick={goPrimary}
                endIcon={<ArrowForwardIcon />}
                sx={{ position: 'relative', mt: 3.4, textTransform: 'none', fontWeight: 800, borderRadius: 3, px: 4, py: 1.3, bgcolor: 'background.paper', color: 'primary.main', boxShadow: '0 14px 30px -12px rgba(0,0,0,0.5)', '&:hover': { bgcolor: 'background.default', transform: 'translateY(-2px)' }, transition: 'transform 0.2s ease' }}
              >
                {primaryLabel}
              </Button>
            </Box>
          </Reveal>
        </Container>

        {/* Pie */}
        <Box sx={{ borderTop: 1, borderColor: 'divider', bgcolor: 'custom.sidebar' }}>
          <Container maxWidth="lg" sx={{ py: 3, display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 1.5 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Box sx={{ width: 26, height: 26, borderRadius: 1.4, bgcolor: 'primary.main', color: 'primary.contrastText', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <AutoStoriesIcon sx={{ fontSize: 16 }} />
              </Box>
              <Typography variant="caption" color="text.secondary">
                © {new Date().getFullYear()} Lorebook Studio
              </Typography>
            </Box>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.6, fontWeight: 600 }}>
              Hecho por Tu amigo Director Dorian
              <FavoriteIcon sx={{ fontSize: 14, color: '#d98c8c' }} />
            </Typography>
          </Container>
        </Box>
      </Box>
    </>
  );
}
