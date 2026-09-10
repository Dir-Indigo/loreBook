import React from 'react';
import { Button, CircularProgress } from '@mui/material';

/**
 * CustomButton (RNF-2, RNF-3, Phase 2.2)
 * Flat matte button with smooth micro-animations and official MUI icons.
 */
export default function CustomButton({
  children,
  variant = 'contained',
  color = 'primary',
  size = 'medium',
  loading = false,
  startIcon,
  endIcon,
  sx = {},
  disabled,
  ...props
}) {
  return (
    <Button
      variant={variant}
      color={color}
      size={size}
      disabled={disabled || loading}
      startIcon={loading ? <CircularProgress size={16} color="inherit" /> : startIcon}
      endIcon={endIcon}
      sx={{
        borderRadius: 2,
        fontWeight: 600,
        textTransform: 'none',
        boxShadow: 'none',
        transition: 'all 0.18s cubic-bezier(0.4, 0, 0.2, 1)',
        '&:hover': {
          boxShadow: 'none',
          transform: 'translateY(-1px)',
        },
        '&:active': {
          transform: 'translateY(0)',
        },
        ...sx,
      }}
      {...props}
    >
      {children}
    </Button>
  );
}
