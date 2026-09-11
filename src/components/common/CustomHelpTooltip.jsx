import React from 'react';
import { IconButton, Tooltip, Box, Typography } from '@mui/material';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import { useLoreTheme } from '@/context/ThemeContext';

/**
 * Reusable tooltip component for help/info, activated on hover.
 * Dynamically styled based on the active theme.
 */
export default function CustomHelpTooltip({ title, content }) {
  const { currentThemeConfig } = useLoreTheme();
  
  return (
    <Tooltip
      arrow
      placement="top"
      slotProps={{
        tooltip: {
          sx: {
            bgcolor: 'background.paper',
            color: 'text.primary',
            border: `1px solid`,
            borderColor: 'divider',
            boxShadow: 2,
            p: 1.5,
            borderRadius: 2,
            maxWidth: 250,
          },
        },
        arrow: {
          sx: {
            color: 'divider',
          },
        },
      }}
      title={
        <Box>
          <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 0.5, color: 'primary.main' }}>
            {title}
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            {content}
          </Typography>
        </Box>
      }
    >
      <IconButton size="small" sx={{ ml: 0.5, p: 0.5 }}>
        <InfoOutlinedIcon fontSize="small" sx={{ color: 'text.disabled', '&:hover': { color: 'primary.main' } }} />
      </IconButton>
    </Tooltip>
  );
}
