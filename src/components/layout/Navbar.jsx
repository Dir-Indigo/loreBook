import React, { useState } from 'react';
import { useRouter } from 'next/router';
import {
  AppBar,
  Toolbar,
  Typography,
  Box,
  IconButton,
  Menu,
  MenuItem,
  Chip,
  Tooltip,
  Divider,
  ListItemIcon,
  ListItemText,
} from '@mui/material';
import AutoStoriesIcon from '@mui/icons-material/AutoStories';
import PaletteIcon from '@mui/icons-material/Palette';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import LogoutIcon from '@mui/icons-material/Logout';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import CheckIcon from '@mui/icons-material/Check';
import DashboardIcon from '@mui/icons-material/Dashboard';
import LayersIcon from '@mui/icons-material/Layers';
import { useLoreTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import CustomButton from '../common/CustomButton';

export default function Navbar({ activeStory, onOpenStorySelector }) {
  const router = useRouter();
  const { activeThemeKey, setThemeKey, themes } = useLoreTheme();
  const { user, profile, isSuperAdmin, signOut } = useAuth();

  const [themeAnchorEl, setThemeAnchorEl] = useState(null);
  const [userAnchorEl, setUserAnchorEl] = useState(null);

  const handleOpenThemeMenu = (event) => setThemeAnchorEl(event.currentTarget);
  const handleCloseThemeMenu = () => setThemeAnchorEl(null);

  const handleOpenUserMenu = (event) => setUserAnchorEl(event.currentTarget);
  const handleCloseUserMenu = () => setUserAnchorEl(null);

  const handleSelectTheme = (key) => {
    setThemeKey(key);
    handleCloseThemeMenu();
  };

  const handleSignOut = async () => {
    handleCloseUserMenu();
    await signOut();
    router.push('/login');
  };

  const isAdminPage = router.pathname.startsWith('/admin');

  return (
    <AppBar
      position="static"
      elevation={0}
      sx={{
        bgcolor: 'background.paper',
        color: 'text.primary',
        borderBottom: 1,
        borderColor: 'divider',
        zIndex: (theme) => theme.zIndex.drawer + 1,
      }}
    >
      <Toolbar variant="dense" sx={{ minHeight: 52, px: 2, display: 'flex', gap: 2 }}>
        {/* Brand */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1.2,
            cursor: 'pointer',
            userSelect: 'none',
          }}
          onClick={() => router.push('/dashboard')}
        >
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 32,
              height: 32,
              borderRadius: 1.5,
              bgcolor: 'primary.main',
              color: 'primary.contrastText',
            }}
          >
            <AutoStoriesIcon fontSize="small" />
          </Box>
          <Typography
            variant="subtitle1"
            sx={{
              fontWeight: 700,
              letterSpacing: '-0.01em',
              display: { xs: 'none', sm: 'block' },
            }}
          >
            Lorebook Studio
          </Typography>
        </Box>

        <Divider orientation="vertical" flexItem sx={{ my: 1 }} />

        {/* Story / Universe Context Button */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <CustomButton
            variant="outlined"
            color="primary"
            size="small"
            startIcon={<LayersIcon fontSize="small" />}
            onClick={onOpenStorySelector}
            sx={{
              py: 0.5,
              px: 1.5,
              bgcolor: 'background.subtle',
              borderColor: 'divider',
              color: 'text.primary',
              maxWidth: 320,
            }}
          >
            <Typography variant="body2" noWrap sx={{ fontWeight: 600 }}>
              {activeStory ? activeStory.title : 'Seleccionar Historia'}
            </Typography>
          </CustomButton>

          {activeStory?.universe && (
            <Chip
              size="small"
              icon={<LayersIcon fontSize="inherit" />}
              label={`Universo: ${activeStory.universe.title}`}
              variant="outlined"
              sx={{
                fontSize: '0.75rem',
                height: 24,
                borderColor: 'primary.light',
                color: 'primary.main',
                display: { xs: 'none', md: 'flex' },
              }}
            />
          )}
        </Box>

        <Box sx={{ flexGrow: 1 }} />

        {/* Action Controls */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {/* Admin Switcher */}
          {isSuperAdmin && (
            <Tooltip title={isAdminPage ? 'Ir al Lienzo' : 'Panel de Administración (SuperAdmin)'}>
              <CustomButton
                variant={isAdminPage ? 'contained' : 'outlined'}
                color="secondary"
                size="small"
                startIcon={isAdminPage ? <DashboardIcon fontSize="small" /> : <AdminPanelSettingsIcon fontSize="small" />}
                onClick={() => router.push(isAdminPage ? '/dashboard' : '/admin')}
                sx={{ py: 0.5, px: 1.5 }}
              >
                {isAdminPage ? 'Lienzo' : 'Admin'}
              </CustomButton>
            </Tooltip>
          )}

          {/* Theme Selector (RF-5.4, RF-5.5) */}
          <Tooltip title="Cambiar Paleta de Color Mate">
            <IconButton
              onClick={handleOpenThemeMenu}
              size="small"
              sx={{
                border: 1,
                borderColor: 'divider',
                borderRadius: 1.5,
                p: 0.8,
              }}
            >
              <PaletteIcon fontSize="small" color="action" />
            </IconButton>
          </Tooltip>

          <Menu
            anchorEl={themeAnchorEl}
            open={Boolean(themeAnchorEl)}
            onClose={handleCloseThemeMenu}
            transformOrigin={{ horizontal: 'right', vertical: 'top' }}
            anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
            PaperProps={{
              sx: { minWidth: 220, borderRadius: 2, p: 0.5 },
            }}
          >
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ px: 2, py: 1, display: 'block', fontWeight: 600, textTransform: 'uppercase' }}
            >
              Paletas Mate Anti-Fatiga
            </Typography>
            <Divider sx={{ my: 0.5 }} />
            {Object.values(themes).map((t) => {
              const isSelected = activeThemeKey === t.id;
              return (
                <MenuItem
                  key={t.id}
                  onClick={() => handleSelectTheme(t.id)}
                  selected={isSelected}
                  sx={{ borderRadius: 1, my: 0.3 }}
                >
                  <Box
                    sx={{
                      width: 14,
                      height: 14,
                      borderRadius: '50%',
                      bgcolor: t.palette.primary.main,
                      border: '2px solid',
                      borderColor: t.palette.background.canvas,
                      mr: 1.5,
                    }}
                  />
                  <ListItemText
                    primary={t.name}
                    secondary={t.mode === 'dark' ? 'Modo Oscuro' : 'Modo Claro'}
                    primaryTypographyProps={{ variant: 'body2', fontWeight: isSelected ? 600 : 400 }}
                    secondaryTypographyProps={{ variant: 'caption', fontSize: '0.7rem' }}
                  />
                  {isSelected && <CheckIcon fontSize="small" color="primary" />}
                </MenuItem>
              );
            })}
          </Menu>

          {/* User Profile / RBAC */}
          <Chip
            avatar={<AccountCircleIcon fontSize="small" />}
            label={profile?.role === 'superadmin' ? 'SuperAdmin' : 'Escritor'}
            size="small"
            color={profile?.role === 'superadmin' ? 'secondary' : 'default'}
            onClick={handleOpenUserMenu}
            sx={{
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: '0.75rem',
              height: 28,
            }}
          />

          <Menu
            anchorEl={userAnchorEl}
            open={Boolean(userAnchorEl)}
            onClose={handleCloseUserMenu}
            transformOrigin={{ horizontal: 'right', vertical: 'top' }}
            anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
            PaperProps={{
              sx: { minWidth: 220, borderRadius: 2, p: 0.5 },
            }}
          >
            <Box sx={{ px: 2, py: 1 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                {profile?.full_name || 'Usuario'}
              </Typography>
              <Typography variant="caption" color="text.secondary" noWrap sx={{ display: 'block' }}>
                {user?.email}
              </Typography>
            </Box>
            <Divider sx={{ my: 0.5 }} />
            {isSuperAdmin && (
              <MenuItem onClick={() => { handleCloseUserMenu(); router.push('/admin'); }}>
                <ListItemIcon>
                  <AdminPanelSettingsIcon fontSize="small" />
                </ListItemIcon>
                <ListItemText primary="Panel de Administración" />
              </MenuItem>
            )}
            <MenuItem onClick={handleSignOut} sx={{ color: 'error.main' }}>
              <ListItemIcon sx={{ color: 'inherit' }}>
                <LogoutIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText primary="Cerrar Sesión" />
            </MenuItem>
          </Menu>
        </Box>
      </Toolbar>
    </AppBar>
  );
}
