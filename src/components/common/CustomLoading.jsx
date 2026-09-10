import React from 'react';
import { Box, Typography, Fade } from '@mui/material';
import { useLoreTheme } from '../../context/ThemeContext';

/**
 * CustomLoading Component (Requirement 2)
 * Centralized, aesthetic animated loading screen with smooth matte transitions.
 */
export default function CustomLoading({
  message = 'Procesando narrativa...',
  subtitle = 'Sincronizando datos con el estudio...',
  fullscreen = false,
  overlay = false,
  size = 64,
}) {
  const { currentThemeConfig } = useLoreTheme();
  const primaryColor = currentThemeConfig.palette.primary.main;
  const secondaryColor = currentThemeConfig.palette.secondary.main;
  const isDark = currentThemeConfig.mode === 'dark';

  const content = (
    <Fade in={true} timeout={300}>
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 2,
          p: 3,
          textAlign: 'center',
          userSelect: 'none',
        }}
      >
        {/* Aesthetic Animated Vector Lorebook Loader */}
        <Box
          sx={{
            position: 'relative',
            width: size + 20,
            height: size + 20,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {/* Outer Breathing Ring */}
          <Box
            sx={{
              position: 'absolute',
              width: '100%',
              height: '100%',
              borderRadius: '50%',
              border: `2px dashed ${secondaryColor}`,
              opacity: 0.5,
              animation: 'spinRing 8s linear infinite',
              '@keyframes spinRing': {
                '0%': { transform: 'rotate(0deg)' },
                '100%': { transform: 'rotate(360deg)' },
              },
            }}
          />

          {/* Glowing Matte Aura */}
          <Box
            sx={{
              position: 'absolute',
              width: size,
              height: size,
              borderRadius: '50%',
              bgcolor: primaryColor,
              opacity: isDark ? 0.15 : 0.08,
              animation: 'pulseGlow 2.2s ease-in-out infinite alternate',
              '@keyframes pulseGlow': {
                '0%': { transform: 'scale(0.85)', opacity: isDark ? 0.1 : 0.05 },
                '100%': { transform: 'scale(1.2)', opacity: isDark ? 0.25 : 0.15 },
              },
            }}
          />

          {/* Central Animated Book SVG */}
          <svg
            width={size}
            height={size}
            viewBox="0 0 64 64"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            style={{
              zIndex: 2,
              filter: `drop-shadow(0 4px 10px ${isDark ? 'rgba(0,0,0,0.5)' : 'rgba(0,0,0,0.1)'})`,
            }}
          >
            {/* Book Spine / Base */}
            <path
              d="M32 46C32 46 22 41 8 43V17C22 15 32 20 32 20C32 20 42 15 56 17V43C42 41 32 46 32 46Z"
              fill={currentThemeConfig.palette.background.paper}
              stroke={primaryColor}
              strokeWidth="2.5"
              strokeLinejoin="round"
            />
            {/* Left page lines */}
            <line x1="14" y1="24" x2="26" y2="25.5" stroke={primaryColor} strokeWidth="2" strokeLinecap="round" opacity="0.6" />
            <line x1="14" y1="30" x2="24" y2="31.5" stroke={primaryColor} strokeWidth="2" strokeLinecap="round" opacity="0.6" />
            <line x1="14" y1="36" x2="26" y2="37.5" stroke={primaryColor} strokeWidth="2" strokeLinecap="round" opacity="0.6" />

            {/* Right page lines */}
            <line x1="38" y1="25.5" x2="50" y2="24" stroke={primaryColor} strokeWidth="2" strokeLinecap="round" opacity="0.6" />
            <line x1="40" y1="31.5" x2="50" y2="30" stroke={primaryColor} strokeWidth="2" strokeLinecap="round" opacity="0.6" />
            <line x1="38" y1="37.5" x2="50" y2="36" stroke={primaryColor} strokeWidth="2" strokeLinecap="round" opacity="0.6" />

            {/* Animated Turning Page in the Center */}
            <path
              d="M32 20C32 20 38 16 46 17V42C38 41 32 46 32 46V20Z"
              fill={secondaryColor}
              opacity="0.85"
            >
              <animateTransform
                attributeName="transform"
                type="scale"
                values="1 1; 0.05 1; -1 1; 0.05 1; 1 1"
                keyTimes="0; 0.25; 0.5; 0.75; 1"
                dur="1.8s"
                repeatCount="indefinite"
                additive="sum"
              />
            </path>

            {/* Book Spine Center Line */}
            <line x1="32" y1="20" x2="32" y2="46" stroke={primaryColor} strokeWidth="3" strokeLinecap="round" />

            {/* Quill / Feather Tip */}
            <circle cx="32" cy="13" r="3" fill={secondaryColor}>
              <animate
                attributeName="cy"
                values="13; 9; 13"
                dur="1.8s"
                repeatCount="indefinite"
              />
            </circle>
          </svg>
        </Box>

        {/* Text Details */}
        {message && (
          <Box>
            <Typography
              variant="subtitle2"
              sx={{
                fontWeight: 700,
                letterSpacing: '-0.01em',
                color: 'text.primary',
                fontSize: '0.95rem',
              }}
            >
              {message}
            </Typography>
            {subtitle && (
              <Typography
                variant="caption"
                sx={{
                  color: 'text.secondary',
                  display: 'block',
                  mt: 0.3,
                }}
              >
                {subtitle}
              </Typography>
            )}
          </Box>
        )}
      </Box>
    </Fade>
  );

  if (fullscreen) {
    return (
      <Box
        sx={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          zIndex: 9999,
          bgcolor: 'background.default',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {content}
      </Box>
    );
  }

  if (overlay) {
    return (
      <Box
        sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          zIndex: 100,
          bgcolor: isDark ? 'rgba(26, 29, 36, 0.75)' : 'rgba(247, 244, 237, 0.75)',
          backdropFilter: 'blur(3px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: 'inherit',
        }}
      >
        {content}
      </Box>
    );
  }

  return content;
}
