import React from 'react';
import { useRouter } from 'next/router';
import { Box, Typography } from '@mui/material';
import ExploreOffOutlinedIcon from '@mui/icons-material/ExploreOffOutlined';
import { useAuth } from '../context/AuthContext';
import CustomButton from '../components/common/CustomButton';

export default function NotFoundPage() {
  const router = useRouter();
  const { user } = useAuth();

  return (
    <Box
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 1.5,
        px: 3,
        textAlign: 'center',
        bgcolor: 'background.default',
      }}
    >
      <ExploreOffOutlinedIcon sx={{ fontSize: 56, color: 'text.disabled' }} />
      <Typography variant="h4" sx={{ fontWeight: 800 }}>
        Página no encontrada
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 420 }}>
        La dirección que buscas no existe o fue movida.
      </Typography>
      <CustomButton variant="contained" onClick={() => router.replace(user ? '/dashboard' : '/login')}>
        {user ? 'Volver al espacio de trabajo' : 'Ir a iniciar sesión'}
      </CustomButton>
    </Box>
  );
}
