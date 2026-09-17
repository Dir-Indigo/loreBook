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
        elevation: 3,
        sx: {
          borderRadius: { xs: 2.5, sm: 3 },
          m: { xs: 1, sm: 2 },
          maxHeight: { xs: 'calc(100dvh - 20px)', sm: 'calc(100vh - 64px)' },
          display: 'flex',
          flexDirection: 'column',
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
            p: { xs: 1.5, sm: 2.2 },
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 1,
            borderBottom: 1,
            borderColor: 'divider',
            flexShrink: 0,
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 1, sm: 1.5 }, minWidth: 0, flexGrow: 1 }}>
            {TitleIcon && (
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: { xs: 32, sm: 38 },
                  height: { xs: 32, sm: 38 },
                  borderRadius: 2,
                  bgcolor: 'primary.main',
                  color: 'primary.contrastText',
                  flexShrink: 0,
                }}
              >
                <TitleIcon sx={{ fontSize: { xs: 18, sm: 20 } }} />
              </Box>
            )}
            <Box sx={{ minWidth: 0 }}>
              <Typography variant="h6" component="div" sx={{ fontWeight: 700, fontSize: { xs: '1rem', sm: '1.15rem' }, lineHeight: 1.2 }}>
                {title}
              </Typography>
              {subtitle && (
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', fontSize: { xs: '0.72rem', sm: '0.75rem' }, lineHeight: 1.25, mt: 0.2 }}>
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
              flexShrink: 0,
              p: 0.5,
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

      <DialogContent sx={{ p: { xs: 1.5, sm: 2.5 }, flexGrow: 1, overflowY: 'auto' }}>
        {children}
      </DialogContent>

      {actions && (
        <DialogActions
          sx={{
            p: { xs: 1.2, sm: 1.8 },
            px: { xs: 1.5, sm: 2.5 },
            borderTop: 1,
            borderColor: 'divider',
            flexShrink: 0,
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
