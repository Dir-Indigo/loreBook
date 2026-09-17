import React, { useState, useEffect, useRef } from 'react';
import { Box, Typography, CircularProgress } from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import { useLoreTheme } from '../../context/ThemeContext';

const THRESHOLD = 65;
const MAX_PULL = 110;

export default function PullToRefresh({ children }) {
  const { currentThemeConfig } = useLoreTheme();
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const startYRef = useRef(0);
  const isPullingRef = useRef(false);

  useEffect(() => {
    const handleTouchStart = (e) => {
      // Only start pull-to-refresh if touching near top or at scroll 0
      const touch = e.touches[0];
      if (!touch) return;

      // Check if near top of the screen (top 140px, or window/scrollable container at scrollTop === 0)
      const isNearTop = touch.clientY <= 140;
      if (isNearTop) {
        startYRef.current = touch.clientY;
        isPullingRef.current = true;
      }
    };

    const handleTouchMove = (e) => {
      if (!isPullingRef.current || isRefreshing) return;
      const touch = e.touches[0];
      if (!touch) return;

      const diff = touch.clientY - startYRef.current;
      if (diff > 0) {
        // Apply rubber-band dampening
        const dampened = Math.min(MAX_PULL, diff * 0.55);
        setPullDistance(dampened);
      } else {
        setPullDistance(0);
      }
    };

    const handleTouchEnd = () => {
      if (!isPullingRef.current) return;
      isPullingRef.current = false;

      if (pullDistance >= THRESHOLD && !isRefreshing) {
        setIsRefreshing(true);
        setPullDistance(THRESHOLD);
        // Provide haptic feedback if available
        if (typeof navigator !== 'undefined' && navigator.vibrate) {
          try { navigator.vibrate(40); } catch (e) { /* ignore */ }
        }
        setTimeout(() => {
          window.location.reload();
        }, 500);
      } else {
        setPullDistance(0);
      }
    };

    window.addEventListener('touchstart', handleTouchStart, { passive: true });
    window.addEventListener('touchmove', handleTouchMove, { passive: true });
    window.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
    };
  }, [pullDistance, isRefreshing]);

  const progress = Math.min(1, pullDistance / THRESHOLD);
  const rotation = progress * 360;

  return (
    <>
      {/* Pull-to-refresh Visual Indicator */}
      {(pullDistance > 0 || isRefreshing) && (
        <Box
          sx={{
            position: 'fixed',
            top: Math.max(12, pullDistance - 20),
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            px: 2,
            py: 0.8,
            borderRadius: 6,
            bgcolor: 'background.paper',
            border: 1,
            borderColor: 'divider',
            boxShadow: '0 8px 24px rgba(0,0,0,0.18)',
            transition: isPullingRef.current ? 'none' : 'all 0.25s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
            pointerEvents: 'none',
          }}
        >
          {isRefreshing ? (
            <CircularProgress size={18} thickness={5} color="primary" />
          ) : (
            <RefreshIcon
              sx={{
                fontSize: 20,
                color: progress >= 1 ? 'primary.main' : 'text.secondary',
                transform: `rotate(${rotation}deg)`,
                transition: 'color 0.2s ease',
              }}
            />
          )}
          <Typography
            variant="caption"
            sx={{
              fontWeight: 700,
              fontSize: '0.75rem',
              color: isRefreshing ? 'primary.main' : (progress >= 1 ? 'text.primary' : 'text.secondary'),
            }}
          >
            {isRefreshing ? 'Actualizando...' : (progress >= 1 ? 'Suelta para recargar' : 'Desliza para recargar')}
          </Typography>
        </Box>
      )}
      {children}
    </>
  );
}
