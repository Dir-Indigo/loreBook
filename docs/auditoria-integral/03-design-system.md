# 03 · Propuesta de Design System

**Principio rector:** *evolucionar, no rehacer*. La identidad matte/tierra (`warm_sand`, `sepia_writer`, `muted_dark`, `slate_executive`) y la tipografía Outfit se **conservan**. La skill UI/UX Pro Max sugirió una paleta teal/naranja pensada para landing pages; se descarta por romper la identidad. Se adoptan de la skill solo las reglas: tokens semánticos, contraste 4.5:1, objetivos táctiles ≥ 44 px, foco visible, `prefers-reduced-motion`, duración de transición 150–300 ms.

## 1. Estado actual (qué ya es un sistema)
- `constants/theme.js` genera el tema MUI desde `MATTE_THEMES`; ya define `palette.custom.{canvas, sidebar, subtle, node, tagColors}`, `shape.borderRadius = 10`, sombras suaves, overrides de `Button/Paper/Dialog/Card/Chip/TableCell/TextField`.
- `components/common` ofrece `CustomButton`, `CustomModal`, `CustomTable`, `CustomLoading`.

## 2. Brechas
| Brecha | Evidencia | Efecto |
|---|---|---|
| Color fuera de tokens | hex literales en 26 archivos; `#8c6d53` ×22; `#16a34a`, `#2ea043`, `#f85149`, `#ea580c` sueltos | no cambian con el tema oscuro; contrastes no auditables |
| Sin tokens de estado | éxito/aviso/error/info se eligen a mano | inconsistencia entre alertas, chips y bordes |
| Tipografía sin escala | ~101 `fontSize` < 0.8 rem en `sx` | texto ilegible, sin jerarquía común |
| Espaciado ad hoc | 1.504 `sx` inline con `p/m/gap` variados | desalineaciones |
| Sin componentes semánticos | no hay `ConfirmDialog`, `EmptyState`, `StatusBadge`, `FormField`, `IconAction` | `window.confirm/alert`, duplicación |
| Movimiento | animaciones `bounce` sin reduced-motion | accesibilidad |

## 3. Tokens propuestos (extender, no reemplazar)

### 3.1 Color — añadir a cada tema en `MATTE_THEMES`
```js
palette.status = {
  success: { main, bg, border },   // reemplaza #16a34a / #2ea043
  warning: { main, bg, border },   // reemplaza #eab308 / #ffca28
  danger:  { main, bg, border },   // reemplaza #f85149 / #e65100
  info:    { main, bg, border },
}
palette.brand = primary.main        // reemplaza los 22 '#8c6d53'
palette.custom.overlay              // reemplaza rgba(0,0,0,0.45) de modales
```
Reglas: cada par texto/fondo ≥ 4.5:1 (3:1 para texto grande e iconos); el color nunca es el único portador de significado (añadir icono o texto). Los colores de usuario (tags, nodos, notas) salen de `tagColors` con **variante light/dark** y su `contrastText` calculado.

### 3.2 Tipografía (Outfit se mantiene)
| Token | Tamaño / interlineado | Uso |
|---|---|---|
| `caption` | 0.75 rem / 1.4 (mínimo absoluto) | metadatos |
| `body2` | 0.875 rem / 1.5 | UI densa |
| `body1` | 1 rem / 1.6 | texto base y editor |
| `h6`–`h4` | 1.125 / 1.25 / 1.5 rem | títulos de panel / modal / página |
Prohibido < 0.75 rem. El editor de manuscrito admite fuente serif opcional (Lora/Source Serif) como preferencia de usuario.

### 3.3 Espaciado, radios, elevación
- Escala base 4 px: `0.5, 1, 1.5, 2, 3, 4` (theme.spacing) — nada de valores sueltos.
- Radios: `sm 6` (chips, inputs), `md 10` (cards, botones), `lg 14` (diálogos) — ya existen.
- Elevación: 3 niveles (`flat`, `raised`, `overlay`); en tema oscuro, separar por borde + luminosidad, no por sombra.

### 3.4 Movimiento
`--motion-fast 150ms`, `--motion-base 220ms`, `--motion-slow 320ms`, easing `cubic-bezier(.2,0,0,1)`; todo envuelto en `@media (prefers-reduced-motion: reduce)` → duración 0 y sin `bounce`. Animar solo `transform/opacity`.

### 3.5 Interacción
- Objetivo táctil ≥ 44×44 px (usar `size="medium"` + `padding` en táctil; hoy muchos `IconButton size="small"`).
- Foco visible global: `:focus-visible { outline: 2px solid primary.main; outline-offset: 2px }`.
- Estados obligatorios: hover, focus-visible, active, disabled, loading.

## 4. Biblioteca de componentes objetivo
| Componente | Reemplaza / unifica | Props clave |
|---|---|---|
| `IconAction` | 105 `IconButton` sin etiqueta | `label` **obligatorio** (→ `aria-label` + `Tooltip`), `icon`, `onClick`, `size` |
| `ConfirmDialog` + `useConfirm()` | 4 `window.confirm` | `title, description, confirmText, tone ('danger'), requireText?` |
| `useNotify()` (Snackbar) | 6 `window.alert` | `success/error/info(message, {undo})` |
| `EmptyState` | pantallas vacías ad hoc | `icon, title, description, action` |
| `StatusBadge` | chips de global/plantilla/estado de capítulo | `tone`, `label`, `icon` |
| `FormField` | TextField + label + helper + error | `label`, `error`, `helper`, `required` |
| `DataTable` (evolución de `CustomTable`) | tablas admin/listas | orden, filtro, paginación servidor, `loading`, `empty` |
| `Skeleton*` | spinners de pantalla completa | `SidebarSkeleton`, `CanvasSkeleton`, `CardSkeleton` |
| `ImageSourcePicker` | lógica URL/subida/recorte ×3 | `value`, `onChange`, `bucket` |
| `Panel` / `PanelHeader` | cabeceras de sidebars y drawers | `title, actions, onClose` |

## 5. Reglas de uso (para el equipo)
1. Cero hex en componentes: usar `theme.palette.*` o `sx={{ color: 'status.danger.main' }}`.
2. Todo botón de solo icono pasa por `IconAction`.
3. Toda acción destructiva pasa por `ConfirmDialog`; las reversibles, por snackbar con **Deshacer**.
4. Todo listado define `loading`, `empty` y `error`.
5. Un componente nuevo > 300 líneas necesita justificación o se divide.

## 6. Migración sin riesgo
Orden: (1) tokens en `theme.js` sin tocar componentes → (2) crear los componentes nuevos → (3) sustituir por búsqueda mecánica (`window.confirm`, `<IconButton`, hex) → (4) regla ESLint `no-restricted-syntax` para impedir regresiones (hex en JSX, `window.alert`).
