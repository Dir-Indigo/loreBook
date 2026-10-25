# 07 · Quick wins (alto impacto, ≤ 1 día cada uno)

Ordenados por relación impacto/esfuerzo. Ninguno cambia lógica de negocio ni contratos de API.

| # | Quick win | Tipo | Esfuerzo | Dónde |
|---|---|---|---|---|
| 1 | **Quitar `role` del `signUp`** y verificar el trigger de `profiles` en Supabase | Seguridad | 1–2 h | `AuthContext.js`, SQL |
| 2 | **Logging solo en desarrollo y sin payload** | Seguridad/Perf | 15 min | `ApiService.js` (`logRequest`) |
| 3 | **Autosave solo si hay cambios** + `flush` al cambiar de capítulo | Datos | 2 h | `ManuscriptContext.js` |
| 4 | **Ocultar o implementar el checkbox "crear backup"** de `EventModal` (hoy no hace nada) | Honestidad UX | 30 min (ocultar) | `EventModal.jsx:903` |
| 5 | **Implementar la API de admin** o deshabilitar el enlace Admin hasta tenerla | Bug | 3–4 h | `ApiService.js`, repos |
| 6 | **`:focus-visible` global + `prefers-reduced-motion`** | A11y | 20 min | `globals.css` |
| 7 | **`100vh` → `100dvh`** en `MainLayout` | Móvil | 10 min | `MainLayout.jsx` |
| 8 | **`next/font`** en lugar de `@import` de Google Fonts | Rendimiento | 30 min | `_app.jsx`, `globals.css`, `theme.js` |
| 9 | **Confirmación fuerte para borrar historia** (escribir nombre + conteo) | UX | 1–2 h | `StoryModal.jsx:466` |
| 10 | **Mover `LoreThemeProvider` al exterior de `_app.jsx`** | Visual/Perf | 10 min | `_app.jsx` |
| 11 | **`aria-label` + `Tooltip` en los `IconButton` de `SidebarLore` y `QuickNotesPanel`** (29 de 105) | A11y | 2 h | esos dos archivos |
| 12 | **Redirigir `/characters/[story_id]` e `/ideas/*` a `/dashboard`** | Navegación | 30 min | `next.config.js` |
| 13 | **Quitar el import sin uso de `supabase`** en `eventService` | Limpieza | 5 min | `eventService.js` |
| 14 | **`isStorageUrl()` único** (3 copias de `includes('supabase.co/storage')`) | DRY | 30 min | `storageService.js` |
| 15 | **`controllers/_base.js` con `handleLoading` único** (6 copias) | DRY | 1–2 h | `controllers/*` |
| 16 | **Validar UUID** antes del `.or()` interpolado | Seguridad | 20 min | `characterRepository.js` |
| 17 | **Subir fuentes mínimas a 0.75 rem** y revisar contraste del texto secundario | Visual/A11y | 2 h | `sx` con `fontSize` < 0.75 |
| 18 | **`.eslintrc.json` + `next lint` en CI** | Calidad | 30 min | raíz |
| 19 | **Reemplazar los 6 `window.alert` de `CharactersWorkspaceView` por Snackbar de MUI** | UX | 1–2 h | `CharactersWorkspaceView.jsx` |
| 20 | **`aria-live="polite"` en el indicador de guardado y errores** | A11y | 30 min | manuscrito/eventos |

## Cómo medir el efecto
- Antes/después: `IconButton` sin nombre accesible (script `grep`), nº de diálogos nativos, Lighthouse (Performance/Accesibilidad), CLS de `/dashboard`.
- Los quick wins 1–5 reducen **riesgo** (seguridad, pérdida de datos, funciones rotas); 6–12 mejoran **percepción de calidad**; 13–20 reducen **deuda**.

## Recomendación de orden
Día 1: #1, #2, #4, #6, #7, #10, #13. Día 2: #3, #5, #8, #12. Día 3: #9, #11, #14–#16. Día 4: #17–#20.
