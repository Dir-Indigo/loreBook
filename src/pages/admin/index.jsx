import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/router';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Chip,
  IconButton,
  Tooltip,
  CircularProgress,
  Alert,
  Avatar,
} from '@mui/material';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import PeopleIcon from '@mui/icons-material/People';
import AutoStoriesIcon from '@mui/icons-material/AutoStories';
import PersonIcon from '@mui/icons-material/Person';
import TimelineIcon from '@mui/icons-material/Timeline';
import SwapHorizIcon from '@mui/icons-material/SwapHoriz';
import SecurityIcon from '@mui/icons-material/Security';
import { useAuth } from '../../context/AuthContext';
import { ApiService } from '../../utils/ApiService';
import Navbar from '../../components/layout/Navbar';
import CustomTable from '../../components/common/CustomTable';
import CustomButton from '../../components/common/CustomButton';
import CustomLoading from '../../components/common/CustomLoading';

export default function AdminPage() {
  const router = useRouter();
  const { user, profile, isSuperAdmin, loading: authLoading } = useAuth();

  const [profiles, setProfiles] = useState([]);
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalStories: 0,
    totalCharacters: 0,
    totalEvents: 0,
  });
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);
  const [alertInfo, setAlertInfo] = useState(null);

  // RBAC route guard (RF-1.3)
  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        router.replace('/login');
      } else if (!isSuperAdmin) {
        router.replace('/dashboard');
      }
    }
  }, [user, isSuperAdmin, authLoading, router]);

  const loadAdminData = useCallback(async () => {
    setLoading(true);
    const [profilesRes, statsRes] = await Promise.all([
      ApiService.getAllProfilesForAdmin(),
      ApiService.getPlatformStats(),
    ]);

    if (profilesRes.data) {
      setProfiles(profilesRes.data);
    }
    if (statsRes.data) {
      setStats(statsRes.data);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    if (isSuperAdmin) {
      loadAdminData();
    }
  }, [isSuperAdmin, loadAdminData]);

  const handleToggleRole = async (targetUser) => {
    const nextRole = targetUser.role === 'superadmin' ? 'writer' : 'superadmin';
    if (targetUser.id === user?.id && targetUser.role === 'superadmin') {
      if (!window.confirm('¿Estás seguro de quitarte a ti mismo los permisos de SuperAdmin?')) {
        return;
      }
    }

    setUpdatingId(targetUser.id);
    const { error } = await ApiService.updateProfileRole(targetUser.id, nextRole);
    if (!error) {
      setAlertInfo({
        severity: 'success',
        text: `Rol de ${targetUser.email} actualizado a: ${nextRole}`,
      });
      await loadAdminData();
    } else {
      setAlertInfo({
        severity: 'error',
        text: 'No se pudo actualizar el rol del usuario.',
      });
    }
    setUpdatingId(null);
  };

  const tableColumns = [
    {
      id: 'user',
      label: 'Usuario',
      minWidth: 200,
      render: (_, row) => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Avatar
            src={row.avatar_url}
            sx={{ width: 34, height: 34, bgcolor: 'primary.main', fontSize: '0.9rem', fontWeight: 600 }}
          >
            {row.full_name?.charAt(0) || row.email?.charAt(0)}
          </Avatar>
          <Box>
            <Typography variant="body2" sx={{ fontWeight: 600 }}>
              {row.full_name || 'Sin nombre'}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {row.email}
            </Typography>
          </Box>
        </Box>
      ),
    },
    {
      id: 'role',
      label: 'Rol en Plataforma',
      minWidth: 140,
      render: (role) => (
        <Chip
          icon={role === 'superadmin' ? <SecurityIcon fontSize="inherit" /> : undefined}
          label={role === 'superadmin' ? 'SuperAdmin' : 'Escritor'}
          color={role === 'superadmin' ? 'secondary' : 'default'}
          size="small"
          sx={{ fontWeight: 600, fontSize: '0.75rem' }}
        />
      ),
    },
    {
      id: 'created_at',
      label: 'Fecha de Registro',
      minWidth: 160,
      render: (date) => (
        <Typography variant="caption" color="text.secondary">
          {date ? new Date(date).toLocaleDateString() : 'N/A'}
        </Typography>
      ),
    },
    {
      id: 'actions',
      label: 'Gestión de Rol',
      minWidth: 150,
      align: 'right',
      render: (_, row) => (
        <CustomButton
          size="small"
          variant="outlined"
          color={row.role === 'superadmin' ? 'default' : 'secondary'}
          startIcon={<SwapHorizIcon fontSize="small" />}
          loading={updatingId === row.id}
          onClick={() => handleToggleRole(row)}
          sx={{ fontSize: '0.75rem', py: 0.3 }}
        >
          {row.role === 'superadmin' ? 'Cambiar a Escritor' : 'Hacer SuperAdmin'}
        </CustomButton>
      ),
    },
  ];

  if (authLoading || (loading && !isSuperAdmin)) {
    return (
      <CustomLoading
        fullscreen
        message="Panel de Administración"
        subtitle="Verificando permisos de SuperAdmin y cargando métricas..."
      />
    );
  }

  if (!isSuperAdmin) {
    return null;
  }

  return (
    <Box
      sx={{
        width: '100vw',
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        bgcolor: 'background.default',
        overflow: 'hidden',
      }}
    >
      <Navbar />

      <Box sx={{ flexGrow: 1, p: 3, overflowY: 'auto' }}>
        <Box sx={{ maxWidth: 1200, mx: 'auto', display: 'flex', flexDirection: 'column', gap: 3 }}>
          {/* Header */}
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Box
                sx={{
                  width: 44,
                  height: 44,
                  borderRadius: 2,
                  bgcolor: 'secondary.main',
                  color: 'secondary.contrastText',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <AdminPanelSettingsIcon sx={{ fontSize: 26 }} />
              </Box>
              <Box>
                <Typography variant="h5" sx={{ fontWeight: 700, letterSpacing: '-0.01em' }}>
                  Panel de Administración
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Control centralizado de usuarios, roles (RBAC) y métricas de la plataforma
                </Typography>
              </Box>
            </Box>

            <CustomButton
              variant="contained"
              onClick={() => router.push('/dashboard')}
              startIcon={<AutoStoriesIcon fontSize="small" />}
            >
              Volver al Lienzo
            </CustomButton>
          </Box>

          {alertInfo && (
            <Alert
              severity={alertInfo.severity}
              onClose={() => setAlertInfo(null)}
              sx={{ borderRadius: 2 }}
            >
              {alertInfo.text}
            </Alert>
          )}

          {/* Metrics Grid */}
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6} md={3}>
              <Paper
                elevation={0}
                sx={{
                  p: 2.5,
                  border: 1,
                  borderColor: 'divider',
                  borderRadius: 2.5,
                  bgcolor: 'background.paper',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 2,
                }}
              >
                <Box
                  sx={{
                    width: 44,
                    height: 44,
                    borderRadius: 2,
                    bgcolor: 'background.subtle',
                    color: 'primary.main',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <PeopleIcon />
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                    Usuarios Totales
                  </Typography>
                  <Typography variant="h5" sx={{ fontWeight: 800 }}>
                    {stats.totalUsers}
                  </Typography>
                </Box>
              </Paper>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <Paper
                elevation={0}
                sx={{
                  p: 2.5,
                  border: 1,
                  borderColor: 'divider',
                  borderRadius: 2.5,
                  bgcolor: 'background.paper',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 2,
                }}
              >
                <Box
                  sx={{
                    width: 44,
                    height: 44,
                    borderRadius: 2,
                    bgcolor: 'background.subtle',
                    color: 'secondary.main',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <AutoStoriesIcon />
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                    Historias / Universos
                  </Typography>
                  <Typography variant="h5" sx={{ fontWeight: 800 }}>
                    {stats.totalStories}
                  </Typography>
                </Box>
              </Paper>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <Paper
                elevation={0}
                sx={{
                  p: 2.5,
                  border: 1,
                  borderColor: 'divider',
                  borderRadius: 2.5,
                  bgcolor: 'background.paper',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 2,
                }}
              >
                <Box
                  sx={{
                    width: 44,
                    height: 44,
                    borderRadius: 2,
                    bgcolor: 'background.subtle',
                    color: 'primary.main',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <PersonIcon />
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                    Personajes Creados
                  </Typography>
                  <Typography variant="h5" sx={{ fontWeight: 800 }}>
                    {stats.totalCharacters}
                  </Typography>
                </Box>
              </Paper>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <Paper
                elevation={0}
                sx={{
                  p: 2.5,
                  border: 1,
                  borderColor: 'divider',
                  borderRadius: 2.5,
                  bgcolor: 'background.paper',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 2,
                }}
              >
                <Box
                  sx={{
                    width: 44,
                    height: 44,
                    borderRadius: 2,
                    bgcolor: 'background.subtle',
                    color: 'secondary.main',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <TimelineIcon />
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                    Eventos Narrativos
                  </Typography>
                  <Typography variant="h5" sx={{ fontWeight: 800 }}>
                    {stats.totalEvents}
                  </Typography>
                </Box>
              </Paper>
            </Grid>
          </Grid>

          {/* User Management Table */}
          <Box>
            <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1.5 }}>
              Listado General de Usuarios
            </Typography>
            <CustomTable
              columns={tableColumns}
              data={profiles}
              searchable={true}
              searchPlaceholder="Buscar por nombre o correo electrónico..."
              searchKeys={['email', 'full_name', 'role']}
              emptyMessage="No se encontraron usuarios en la plataforma"
            />
          </Box>
        </Box>
      </Box>
    </Box>
  );
}
