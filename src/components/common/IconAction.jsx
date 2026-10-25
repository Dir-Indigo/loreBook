import React from 'react';
import { IconButton, Tooltip } from '@mui/material';

/**
 * IconAction
 * Botón de solo icono con nombre accesible obligatorio: `label` se usa como
 * `aria-label` y como tooltip visible. Si el botón está deshabilitado se envuelve
 * en un <span> para que el tooltip siga funcionando (MUI no lo muestra sobre disabled).
 */
export default function IconAction({
  label,
  tooltip = true,
  tooltipPlacement,
  disabled = false,
  children,
  ...buttonProps
}) {
  if (process.env.NODE_ENV !== 'production' && !label) {
    console.warn('[IconAction] Falta la prop "label": el botón no tendría nombre accesible.');
  }

  const button = (
    <IconButton aria-label={label} disabled={disabled} {...buttonProps}>
      {children}
    </IconButton>
  );

  if (!tooltip || !label) return button;

  return (
    <Tooltip title={label} placement={tooltipPlacement}>
      {disabled ? <span style={{ display: 'inline-flex' }}>{button}</span> : button}
    </Tooltip>
  );
}
