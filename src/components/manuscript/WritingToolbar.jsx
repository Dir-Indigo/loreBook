import React, { useState } from 'react';
import {
  Box,
  Button,
  ButtonGroup,
  Divider,
  IconButton,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
  Tooltip,
} from '@mui/material';
import FormatBoldIcon from '@mui/icons-material/FormatBold';
import RemoveIcon from '@mui/icons-material/Remove';
import AddIcon from '@mui/icons-material/Add';
import CheckIcon from '@mui/icons-material/Check';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import PaletteOutlinedIcon from '@mui/icons-material/PaletteOutlined';
import FontDownloadOutlinedIcon from '@mui/icons-material/FontDownloadOutlined';
import FormatLineSpacingIcon from '@mui/icons-material/FormatLineSpacing';
import WidthNormalOutlinedIcon from '@mui/icons-material/WidthNormalOutlined';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import {
  WRITING_THEMES,
  WRITING_FONTS,
  WRITING_WIDTHS,
  SIZE_LIMITS,
} from '../../hooks/useWritingPrefs';

const LINE_SPACINGS = [
  { value: 1.5, label: 'Compacto' },
  { value: 1.85, label: 'Normal' },
  { value: 2.2, label: 'Amplio' },
];

// Cada entrada del menú "Vista" abre un submenú lateral con sus opciones
const SUBMENUS = [
  { key: 'theme', label: 'Tema', icon: PaletteOutlinedIcon },
  { key: 'font', label: 'Fuente', icon: FontDownloadOutlinedIcon },
  { key: 'lineHeight', label: 'Interlineado', icon: FormatLineSpacingIcon },
  { key: 'width', label: 'Ancho del texto', icon: WidthNormalOutlinedIcon },
];

const optionsFor = (key, prefs) => {
  if (key === 'theme') {
    return Object.entries(WRITING_THEMES).map(([value, t]) => ({ value, label: t.label, selected: prefs.theme === value }));
  }
  if (key === 'font') {
    return Object.entries(WRITING_FONTS).map(([value, f]) => ({ value, label: f.label, selected: prefs.font === value, fontFamily: f.family }));
  }
  if (key === 'lineHeight') {
    return LINE_SPACINGS.map(({ value, label }) => ({ value, label, selected: Math.abs(prefs.lineHeight - value) < 0.03 }));
  }
  return Object.entries(WRITING_WIDTHS).map(([value, label]) => ({ value, label, selected: prefs.width === value }));
};

/**
 * Barra del editor: negrita, tamaño de letra y el menú "Vista" (tema, fuente, interlineado y ancho).
 * Los botones usan onMouseDown para no quitar la selección del texto antes de aplicar el formato.
 */
export default function WritingToolbar({ onBold, prefs, onChangePrefs, onResetPrefs, tone }) {
  const [menuAnchor, setMenuAnchor] = useState(null);
  const [subMenu, setSubMenu] = useState({ key: null, anchor: null });
  const keepSelection = (e) => e.preventDefault();
  const borderColor = tone?.border || 'divider';

  const closeAll = () => {
    setSubMenu({ key: null, anchor: null });
    setMenuAnchor(null);
  };

  const choose = (key, value) => {
    onChangePrefs({ [key]: value });
    closeAll();
  };

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8, flexWrap: 'wrap' }}>
      <Tooltip title="Negrita (Ctrl+B)">
        <IconButton
          size="small"
          onMouseDown={keepSelection}
          onClick={onBold}
          aria-label="Negrita"
          sx={{ border: 1, borderColor, borderRadius: 1.8, p: 0.5, color: 'inherit' }}
        >
          <FormatBoldIcon sx={{ fontSize: 18 }} />
        </IconButton>
      </Tooltip>

      <ButtonGroup size="small" variant="outlined" color="inherit" sx={{ '& .MuiButton-root': { borderColor, minWidth: 32, p: 0.4 } }}>
        <Tooltip title="Letra más pequeña">
          <span>
            <Button onClick={() => onChangePrefs({ size: prefs.size - 1 })} disabled={prefs.size <= SIZE_LIMITS.min} aria-label="Reducir tamaño de letra">
              <RemoveIcon sx={{ fontSize: 16 }} />
            </Button>
          </span>
        </Tooltip>
        <Button disableRipple sx={{ pointerEvents: 'none', fontSize: '0.72rem', fontWeight: 700 }}>{prefs.size}</Button>
        <Tooltip title="Letra más grande">
          <span>
            <Button onClick={() => onChangePrefs({ size: prefs.size + 1 })} disabled={prefs.size >= SIZE_LIMITS.max} aria-label="Aumentar tamaño de letra">
              <AddIcon sx={{ fontSize: 16 }} />
            </Button>
          </span>
        </Tooltip>
      </ButtonGroup>

      <Button
        size="small"
        variant="outlined"
        color="inherit"
        endIcon={<KeyboardArrowDownIcon sx={{ fontSize: 18 }} />}
        onClick={(e) => setMenuAnchor(e.currentTarget)}
        aria-haspopup="menu"
        aria-expanded={Boolean(menuAnchor)}
        sx={{ textTransform: 'none', fontWeight: 700, fontSize: '0.72rem', py: 0.3, borderRadius: 1.8, borderColor }}
      >
        Vista
      </Button>

      {/* Menú principal */}
      <Menu
        anchorEl={menuAnchor}
        open={Boolean(menuAnchor)}
        onClose={closeAll}
        PaperProps={{ sx: { minWidth: 210, borderRadius: 2 } }}
      >
        {SUBMENUS.map(({ key, label, icon: Icon }) => (
          <MenuItem
            key={key}
            selected={subMenu.key === key}
            onClick={(e) => setSubMenu({ key, anchor: e.currentTarget })}
            onMouseEnter={(e) => setSubMenu({ key, anchor: e.currentTarget })}
          >
            <ListItemIcon><Icon fontSize="small" /></ListItemIcon>
            <ListItemText primaryTypographyProps={{ fontSize: '0.85rem' }}>{label}</ListItemText>
            <ChevronRightIcon fontSize="small" sx={{ ml: 1, color: 'text.secondary' }} />
          </MenuItem>
        ))}
        <Divider />
        <MenuItem
          onClick={() => {
            onResetPrefs();
            closeAll();
          }}
          onMouseEnter={() => setSubMenu({ key: null, anchor: null })}
        >
          <ListItemIcon><RestartAltIcon fontSize="small" /></ListItemIcon>
          <ListItemText primaryTypographyProps={{ fontSize: '0.85rem' }}>Restablecer vista</ListItemText>
        </MenuItem>
      </Menu>

      {/* Submenú lateral con las opciones de la entrada seleccionada */}
      <Menu
        anchorEl={subMenu.anchor}
        open={Boolean(subMenu.key && subMenu.anchor)}
        onClose={closeAll}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'left' }}
        autoFocus={false}
        disableAutoFocusItem
        disableAutoFocus
        disableEnforceFocus
        disableRestoreFocus
        hideBackdrop
        sx={{ pointerEvents: 'none' }}
        PaperProps={{ sx: { minWidth: 180, borderRadius: 2, pointerEvents: 'auto' } }}
      >
        {subMenu.key && optionsFor(subMenu.key, prefs).map((option) => (
          <MenuItem key={option.value} onClick={() => choose(subMenu.key, option.value)}>
            <ListItemIcon sx={{ minWidth: 28 }}>
              {option.selected && <CheckIcon fontSize="small" />}
            </ListItemIcon>
            <ListItemText
              primaryTypographyProps={{ fontSize: '0.85rem', fontFamily: option.fontFamily, fontWeight: option.selected ? 700 : 400 }}
            >
              {option.label}
            </ListItemText>
          </MenuItem>
        ))}
      </Menu>
    </Box>
  );
}
