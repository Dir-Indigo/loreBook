import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Typography,
  Box,
  Fade,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';

/**
 * CustomModal (RF-5.4, Phase 2.2)
 * Clean matte dialog with smooth transition, subtle backdrop and strict MUI iconography.
 */
export default function CustomModal({
  open,
  onClose,
  title,
  subtitle,
  icon: TitleIcon,
  children,
  actions,
  maxWidth = 'sm',
  fullWidth = true,
}) {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth={maxWidth}
      fullWidth={fullWidth}
      TransitionComponent={Fade}
      transitionDuration={220}
      PaperProps={{
        elevation: 2,
        sx: {
          borderRadius: 3,
          overflow: 'hidden',
        },
      }}
      BackdropProps={{
        sx: {
          backdropFilter: 'blur(3px)',
          backgroundColor: 'rgba(0, 0, 0, 0.45)',
        },
      }}
    >
      {title && (
        <DialogTitle
          sx={{
            m: 0,
            p: 2.5,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: 1,
            borderColor: 'divider',
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            {TitleIcon && (
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: 38,
                  height: 38,
                  borderRadius: 2,
                  bgcolor: 'primary.main',
                  color: 'primary.contrastText',
                }}
              >
                <TitleIcon fontSize="small" />
              </Box>
            )}
            <Box>
              <Typography variant="h6" component="div" sx={{ fontWeight: 600, fontSize: '1.1rem' }}>
                {title}
              </Typography>
              {subtitle && (
                <Typography variant="caption" color="text.secondary">
                  {subtitle}
                </Typography>
              )}
            </Box>
          </Box>
          <IconButton
            aria-label="close"
            onClick={onClose}
            size="small"
            sx={{
              color: 'text.secondary',
              '&:hover': {
                color: 'text.primary',
                bgcolor: 'action.hover',
              },
            }}
          >
            <CloseIcon fontSize="small" />
          </IconButton>
        </DialogTitle>
      )}

      <DialogContent sx={{ p: 3 }}>
        {children}
      </DialogContent>

      {actions && (
        <DialogActions
          sx={{
            p: 2,
            px: 3,
            borderTop: 1,
            borderColor: 'divider',
            bgcolor: (theme) =>
              theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.015)',
          }}
        >
          {actions}
        </DialogActions>
      )}
    </Dialog>
  );
}
