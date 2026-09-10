import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import {
  Box,
  Paper,
  Typography,
  TextField,
  MenuItem,
  Alert,
  Tabs,
  Tab,
  Divider,
} from '@mui/material';
import AutoStoriesIcon from '@mui/icons-material/AutoStories';
import LoginIcon from '@mui/icons-material/Login';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import { useAuth } from '../context/AuthContext';
import CustomButton from '../components/common/CustomButton';

export default function LoginPage() {
  const router = useRouter();
  const { user, signInWithPassword, signUp, loading: authLoading } = useAuth();

  const [tabIndex, setTabIndex] = useState(0); // 0: Login, 1: Register
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState('writer'); // 'writer' | 'superadmin'
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (user && !authLoading) {
      router.replace('/dashboard');
    }
  }, [user, authLoading, router]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    setSubmitting(true);

    try {
      const { data, error } = await signInWithPassword(email.trim(), password);
      if (error) {
        setErrorMsg(error.message || 'Error al iniciar sesión. Verifica tus credenciales.');
      } else {
        router.push('/dashboard');
      }
    } catch (err) {
      setErrorMsg(err.message || 'Ocurrió un error inesperado');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    if (!email.trim() || !password) return;

    setSubmitting(true);
    try {
      const { data, error } = await signUp(
        email.trim(),
        password,
        fullName.trim() || email.split('@')[0],
        role
      );

      if (error) {
        setErrorMsg(error.message || 'Error al registrar la cuenta');
      } else {
        setSuccessMsg('¡Cuenta creada e iniciada exitosamente!');
        router.push('/dashboard');
      }
    } catch (err) {
      setErrorMsg(err.message || 'Ocurrió un error inesperado');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Box
      sx={{
        width: '100vw',
        height: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: 'background.default',
        p: 2,
      }}
    >
      <Paper
        elevation={0}
        sx={{
          width: '100%',
          maxWidth: 440,
          p: 4,
          borderRadius: 3,
          border: 1,
          borderColor: 'divider',
          bgcolor: 'background.paper',
        }}
      >
        {/* Brand Header */}
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 3 }}>
          <Box
            sx={{
              width: 48,
              height: 48,
              borderRadius: 2,
              bgcolor: 'primary.main',
              color: 'primary.contrastText',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              mb: 1.5,
            }}
          >
            <AutoStoriesIcon sx={{ fontSize: 28 }} />
          </Box>
          <Typography variant="h5" sx={{ fontWeight: 700, letterSpacing: '-0.02em' }}>
            Lorebook Studio
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, textAlign: 'center' }}>
            Plataforma de Worldbuilding y Líneas de Tiempo Secuenciales
          </Typography>
        </Box>

        {/* Tabs */}
        <Tabs
          value={tabIndex}
          onChange={(e, val) => {
            setTabIndex(val);
            setErrorMsg('');
            setSuccessMsg('');
          }}
          variant="fullWidth"
          sx={{ mb: 3, borderBottom: 1, borderColor: 'divider' }}
        >
          <Tab icon={<LoginIcon fontSize="small" />} iconPosition="start" label="Iniciar Sesión" />
          <Tab icon={<PersonAddIcon fontSize="small" />} iconPosition="start" label="Registrarse" />
        </Tabs>

        {errorMsg && (
          <Alert severity="error" sx={{ mb: 2.5, borderRadius: 2 }}>
            {errorMsg}
          </Alert>
        )}

        {successMsg && (
          <Alert severity="success" sx={{ mb: 2.5, borderRadius: 2 }}>
            {successMsg}
          </Alert>
        )}

        {tabIndex === 0 ? (
          /* Login Form */
          <Box component="form" onSubmit={handleLogin} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              label="Correo Electrónico"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              fullWidth
              autoComplete="email"
              autoFocus
            />
            <TextField
              label="Contraseña"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              fullWidth
              autoComplete="current-password"
            />
            <CustomButton
              type="submit"
              size="large"
              loading={submitting}
              startIcon={<LoginIcon fontSize="small" />}
              sx={{ mt: 1 }}
            >
              Entrar al Estudio
            </CustomButton>
          </Box>
        ) : (
          /* Register Form */
          <Box component="form" onSubmit={handleRegister} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              label="Nombre Completo o Seudónimo"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
              fullWidth
            />
            <TextField
              label="Correo Electrónico"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              fullWidth
              autoComplete="email"
            />
            <TextField
              label="Contraseña"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              fullWidth
              autoComplete="new-password"
            />
            <TextField
              select
              label="Rol Inicial en la Plataforma"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              fullWidth
              helperText="El rol SuperAdmin tiene acceso exclusivo al panel /admin (RF-1.2, RF-1.3)"
            >
              <MenuItem value="writer">Escritor (Usuario Estándar)</MenuItem>
              <MenuItem value="superadmin">SuperAdmin (Administrador General)</MenuItem>
            </TextField>
            <CustomButton
              type="submit"
              size="large"
              loading={submitting}
              startIcon={<PersonAddIcon fontSize="small" />}
              sx={{ mt: 1 }}
            >
              Crear Cuenta
            </CustomButton>
          </Box>
        )}
      </Paper>
    </Box>
  );
}
