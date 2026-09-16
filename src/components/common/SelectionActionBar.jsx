import React from 'react';
import {
  Box,
  Button,
  IconButton,
  Tooltip,
  Typography,
  Chip,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';

export default function SelectionActionBar({
  count = 0,
  actions = [],
  onClear,
  position = 'bottom',
}) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTiny = useMediaQuery('(max-width:360px)');

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
        justifyContent: 'space-between',
        gap: { xs: 0.8, sm: 1.2 },
        width: { xs: 'calc(100% - 24px)', sm: 'auto' },
        maxWidth: { xs: 440, sm: 600 },
        px: { xs: 1.2, sm: 1.8 },
        py: { xs: 0.8, sm: 1 },
        border: 1,
        borderColor: 'divider',
        borderRadius: { xs: 3, sm: 2.5 },
        bgcolor: (t) => t.palette.mode === 'dark' ? 'rgba(26, 32, 40, 0.94)' : 'rgba(255, 255, 255, 0.94)',
        backdropFilter: 'blur(12px)',
        boxShadow: (t) => t.palette.mode === 'dark'
          ? '0 8px 32px rgba(0, 0, 0, 0.45)'
          : '0 8px 28px rgba(0, 0, 0, 0.16)',
        transform: 'translateX(-50%)',
        animation: 'selection-action-bar-enter 180ms ease-out',
        boxSizing: 'border-box',
      }}
    >
      {/* Selection counter badge */}
      <Chip
        label={isMobile ? (isTiny ? `${count}` : `${count} sel.`) : `${count} seleccionados`}
        size="small"
        color="primary"
        variant="filled"
        sx={{
          fontWeight: 800,
          fontSize: { xs: '0.72rem', sm: '0.78rem' },
          height: { xs: 24, sm: 26 },
          px: { xs: 0.4, sm: 0.8 },
          whiteSpace: 'nowrap',
          flexShrink: 0,
        }}
      />

      {/* Action buttons list */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: { xs: 0.6, sm: 1 },
          flexGrow: 1,
          justifyContent: { xs: 'flex-end', sm: 'center' },
          overflowX: { xs: 'auto', sm: 'visible' },
        }}
      >
        {visibleActions.map((action) => (
          <Tooltip key={action.key} title={action.tooltip || action.label} arrow>
            <span style={{ display: 'inline-flex', flex: isMobile ? '1 1 auto' : 'initial' }}>
              <Button
                size="small"
                aria-label={action.label}
                disabled={action.disabled}
                onClick={action.onClick}
                color={action.color || 'inherit'}
                variant={action.variant || 'outlined'}
                startIcon={action.icon}
                sx={{
                  minHeight: { xs: 32, sm: 36 },
                  px: { xs: 0.8, sm: 1.5 },
                  borderRadius: 1.8,
                  fontWeight: 700,
                  fontSize: { xs: '0.72rem', sm: '0.82rem' },
                  textTransform: 'none',
                  whiteSpace: 'nowrap',
                  width: { xs: '100%', sm: 'auto' },
                  minWidth: { xs: 0, sm: 64 },
                  '& .MuiButton-startIcon': {
                    mr: { xs: 0.4, sm: 0.8 },
                    ml: 0,
                    '& svg': { fontSize: { xs: '1rem', sm: '1.2rem' } },
                  },
                }}
              >
                {/* On tiny screens, show compact or short label if text is long */}
                {isTiny ? (action.shortLabel || action.label.split(' ')[0]) : (isMobile ? (action.shortLabel || action.label) : action.label)}
              </Button>
            </span>
          </Tooltip>
        ))}
      </Box>

      {/* Clear selection icon button */}
      {onClear && (
        <Tooltip title="Limpiar selección" arrow>
          <IconButton
            size="small"
            aria-label="Limpiar selección"
            onClick={onClear}
            sx={{
              p: { xs: 0.6, sm: 0.5 },
              ml: { xs: 0.2, sm: 0.5 },
              bgcolor: 'action.hover',
              flexShrink: 0,
            }}
          >
            <CloseIcon sx={{ fontSize: { xs: 16, sm: 18 } }} />
          </IconButton>
        </Tooltip>
      )}
    </Box>
  );
}
