import React from 'react';
import { Box, CircularProgress, Typography } from '@mui/material';

export default function CustomSpinner({ size = 24, message }) {
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, p: 1 }}>
      <CircularProgress size={size} color="inherit" />
      {message && (
        <Typography variant="body2" color="text.secondary">
          {message}
        </Typography>
      )}
    </Box>
  );
}
