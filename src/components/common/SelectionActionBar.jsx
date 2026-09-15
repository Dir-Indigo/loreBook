import React from 'react';
import { Box, Button, IconButton, Tooltip, Typography } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';

export default function SelectionActionBar({
  count = 0,
  actions = [],
  onClear,
  position = 'bottom',
}) {
  if (!count) return null;

  return (
    <Box
      role="toolbar"
      aria-label="Acciones de selección"
      sx={{
        position: position === 'bottom' ? 'fixed' : 'absolute',
        left: '50%',
        bottom: 18,
        zIndex: 1300,
        display: 'flex',
        alignItems: 'center',
        gap: 1,
        px: 1.5,
        py: 1,
        border: 1,
        borderColor: 'divider',
        borderRadius: 2.5,
        bgcolor: 'background.paper',
        boxShadow: '0 10px 28px rgba(0, 0, 0, 0.16)',
        transform: 'translateX(-50%)',
        animation: 'selection-action-bar-enter 180ms ease-out',
      }}
    >
      <Typography variant="body2" sx={{ px: 0.8, fontWeight: 700, whiteSpace: 'nowrap' }}>
        {count} seleccionados
      </Typography>
      {actions.filter((action) => !action.hidden).map((action) => (
        <Tooltip key={action.key} title={action.tooltip || action.label} arrow>
          <span>
            <Button
              size="medium"
              aria-label={action.label}
              disabled={action.disabled}
              onClick={action.onClick}
              color={action.color || 'inherit'}
              variant={action.variant || 'outlined'}
              startIcon={action.icon}
              sx={{
                minHeight: 38,
                px: 1.5,
                borderRadius: 1.5,
                fontWeight: 700,
                textTransform: 'none',
                whiteSpace: 'nowrap',
              }}
            >
              {action.label}
            </Button>
          </span>
        </Tooltip>
      ))}
      {onClear && (
        <Tooltip title="Limpiar selección" arrow>
          <IconButton size="small" aria-label="Limpiar selección" onClick={onClear}>
            <CloseIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      )}
    </Box>
  );
}
