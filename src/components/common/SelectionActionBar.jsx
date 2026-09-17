import React from 'react';
import {
  Box,
  IconButton,
  Tooltip,
  Chip,
  Divider,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';

export default function SelectionActionBar({
  count = 0,
  actions = [],
  onClear,
  position = 'bottom',
}) {
  if (!count) return null;

  const visibleActions = actions.filter((action) => !action.hidden);

  return (
    <Box
      role="toolbar"
      aria-label="Acciones de selección"
      sx={{
        position: position === 'bottom' ? 'fixed' : 'absolute',
        left: '50%',
        bottom: { xs: 'calc(12px + env(safe-area-inset-bottom, 0px))', sm: 20 },
        zIndex: 1300,
        display: 'flex',
        alignItems: 'center',
        gap: { xs: 0.5, sm: 0.8 },
        px: { xs: 1.2, sm: 1.8 },
        py: { xs: 0.7, sm: 1 },
        border: 1,
        borderColor: 'divider',
        borderRadius: 3,
        bgcolor: (t) => t.palette.mode === 'dark' ? 'rgba(26, 32, 40, 0.96)' : 'rgba(255, 255, 255, 0.96)',
        backdropFilter: 'blur(14px)',
        boxShadow: (t) => t.palette.mode === 'dark'
          ? '0 8px 32px rgba(0, 0, 0, 0.5)'
          : '0 8px 28px rgba(0, 0, 0, 0.16)',
        transform: 'translateX(-50%)',
        animation: 'selection-action-bar-enter 180ms ease-out',
      }}
    >
      {/* Selection counter badge */}
      <Chip
        label={String(count)}
        size="small"
        color="primary"
        variant="filled"
        sx={{
          fontWeight: 800,
          fontSize: { xs: '0.78rem', sm: '0.85rem' },
          height: { xs: 26, sm: 30 },
          minWidth: { xs: 28, sm: 34 },
          flexShrink: 0,
          '& .MuiChip-label': { px: { xs: 0.8, sm: 1 } },
        }}
      />

      <Divider orientation="vertical" flexItem sx={{ mx: 0.5, my: 0.3 }} />

      {/* Icon-only action buttons */}
      {visibleActions.map((action, index) => (
        <React.Fragment key={action.key}>
          <Tooltip title={action.label} arrow placement="top">
            <span>
              <IconButton
                size="small"
                aria-label={action.label}
                disabled={action.disabled}
                onClick={action.onClick}
                sx={{
                  p: { xs: 0.75, sm: 1 },
                  borderRadius: 2,
                  border: '1px solid',
                  borderColor: action.color && action.color !== 'inherit'
                    ? `${action.color}.main`
                    : 'divider',
                  bgcolor: action.color && action.color !== 'inherit'
                    ? `${action.color}.main`
                    : 'action.hover',
                  color: action.color && action.color !== 'inherit' ? '#fff' : 'text.primary',
                  transition: 'all 0.15s ease',
                  '&:hover': {
                    bgcolor: action.color && action.color !== 'inherit'
                      ? `${action.color}.dark`
                      : 'action.selected',
                    transform: 'scale(1.1)',
                  },
                  '&.Mui-disabled': { opacity: 0.4 },
                  '& svg': { fontSize: { xs: '1.15rem', sm: '1.35rem' } },
                }}
              >
                {action.icon}
              </IconButton>
            </span>
          </Tooltip>
          {/* Divider between logical groups every 2 actions */}
          {index < visibleActions.length - 1 && (index + 1) % 2 === 0 && (
            <Divider orientation="vertical" flexItem sx={{ mx: 0.3, my: 0.3 }} />
          )}
        </React.Fragment>
      ))}

      <Divider orientation="vertical" flexItem sx={{ mx: 0.5, my: 0.3 }} />

      {/* Clear selection */}
      {onClear && (
        <Tooltip title="Limpiar selección" arrow placement="top">
          <IconButton
            size="small"
            aria-label="Limpiar selección"
            onClick={onClear}
            sx={{
              p: 0.7,
              borderRadius: 1.8,
              color: 'text.secondary',
              '&:hover': { bgcolor: 'error.main', color: '#fff' },
              transition: 'all 0.15s ease',
            }}
          >
            <CloseIcon sx={{ fontSize: '1.1rem' }} />
          </IconButton>
        </Tooltip>
      )}
    </Box>
  );
}
