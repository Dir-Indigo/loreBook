import React from 'react';
import { Box, Skeleton } from '@mui/material';

/**
 * WorkspaceSkeleton
 * Esqueleto del área de trabajo (barra de herramientas + rejilla de tarjetas) mientras carga la historia.
 * Reserva el espacio final para evitar saltos de layout y es anunciado como "cargando" a lectores de pantalla.
 */
export default function WorkspaceSkeleton({ cards = 6 }) {
  return (
    <Box
      role="status"
      aria-busy="true"
      aria-label="Cargando estudio"
      sx={{ width: '100%', height: '100%', p: { xs: 1.5, sm: 2.5 }, display: 'flex', flexDirection: 'column', gap: 2, overflow: 'hidden' }}
    >
      <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center' }}>
        <Skeleton variant="rounded" width={220} height={36} />
        <Skeleton variant="rounded" width={120} height={36} sx={{ display: { xs: 'none', sm: 'block' } }} />
        <Box sx={{ flexGrow: 1 }} />
        <Skeleton variant="circular" width={36} height={36} />
      </Box>
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', lg: 'repeat(3, 1fr)' },
          gap: 2,
        }}
      >
        {Array.from({ length: cards }, (_, index) => (
          <Skeleton key={index} variant="rounded" height={140} />
        ))}
      </Box>
    </Box>
  );
}
