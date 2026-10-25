# 06 · Plan de implementación por fases

Escala: **Impacto** A/M/B · **Esfuerzo** S (≤ 0,5 d) / M (1–2 d) / L (3–5 d) / XL (> 1 sem). Cada fase termina con la app funcionando y se puede liberar sola. Ningún paso cambia la lógica de negocio ni los contratos de `ApiService`.

## Fase 0 — Red de seguridad (1–2 días)
Objetivo: poder cambiar código sin miedo.
| # | Tarea | Impacto | Esfuerzo |
|---|---|---|---|
| 0.1 | `.eslintrc.json` (`next/core-web-vitals`) + Prettier; corregir solo errores bloqueantes | M | S |
| 0.2 | Tests unitarios de `diffUtils`, helpers puros de `WorkspaceContext` | M | S |
| 0.3 | Capturas de las pantallas clave en 375/768/1440 px y 4 temas (línea base visual) | M | S |
| 0.4 | Medir línea base: Lighthouse, bundle (`next build`), axe | M | S |
| 0.5 | CI: lint + build | M | S |

## Fase 1 — Correcciones críticas y seguridad (2–4 días)
| # | Tarea | Ref. | Impacto | Esfuerzo |
|---|---|---|---|---|
| 1.1 | **Verificar y blindar el trigger de `profiles`/rol**; quitar `role` del `signUp`; política anti-auto-promoción; versionar en `db-migrations/` | C4, S1 | A | S–M |
| 1.2 | Implementar API de admin (repo/service/controller/RPC con validación de rol) | C1, S2 | A | M |
| 1.3 | Decidir y resolver backup/restore de eventos (implementar o retirar el checkbox) | C2 | A | M |
| 1.4 | Autosave del manuscrito: solo si `isDirty`, `flush` al cambiar de capítulo/cerrar, indicador de guardado | C3 | A | M |
| 1.5 | `logRequest` solo en desarrollo y sin payload; limpiar `console.*` | C6, S3 | M | S |
| 1.6 | Validar UUID en el filtro `.or(...)`; mapear errores a mensajes seguros | S4, S5 | M | S |
| 1.7 | Confirmación reforzada para borrar historia (nombre + conteo) | UX | A | S |

## Fase 2 — Quick wins de UX y accesibilidad (3–5 días)
| # | Tarea | Impacto | Esfuerzo |
|---|---|---|---|
| 2.1 | Crear `ConfirmDialog`/`useConfirm` y `useNotify` (Snackbar); reemplazar los 10 `window.confirm/alert` | A | M |
| 2.2 | Crear `IconAction` y sustituir los 105 `IconButton` (búsqueda mecánica) | A | M–L |
| 2.3 | `:focus-visible` global + `prefers-reduced-motion` + `100dvh` + `next/font` | A | S |
| 2.4 | Mínimo de `fontSize` 0.75 rem; revisar contraste en los 4 temas | M | M |
| 2.5 | `aria-labelledby` en `CustomModal`; `aria-live` en notificaciones y estado de guardado | M | S |
| 2.6 | Redirigir rutas legacy (`/characters/[id]`, `/ideas/*`) a `/dashboard` | M | S |

## Fase 3 — Design system (3–5 días)
| # | Tarea | Impacto | Esfuerzo |
|---|---|---|---|
| 3.1 | Añadir tokens `status.*`, `brand`, `overlay` a `MATTE_THEMES` y `theme.js` | A | M |
| 3.2 | Reemplazar hex literales en los 26 archivos (empezar por EventNode, Ideas, QuickNotes) | M | M–L |
| 3.3 | `EmptyState`, `StatusBadge`, `FormField`, `Skeleton*`; `DataTable` con orden/filtro/estados | M | M |
| 3.4 | Un solo sistema de carga: skeletons + loaders locales; retirar overlay global | A | M |
| 3.5 | Regla ESLint que prohíbe hex en JSX y `window.alert/confirm` | M | S |

## Fase 4 — Datos y rendimiento (1–2 semanas)
| # | Tarea | Impacto | Esfuerzo |
|---|---|---|---|
| 4.1 | RPC transaccionales: `create_event_with_links`, `update_event_links`, `assign_tags_batch` | A | L |
| 4.2 | Proyecciones de columnas en lugar de `select('*')`; detalle bajo demanda | M | M |
| 4.3 | Revisar índices y políticas RLS (`stories(user_id)`, `story_id`, `board_id`) con `EXPLAIN` | M | M |
| 4.4 | Dividir `ManuscriptContext` (editor vs datos); diffs con debounce / bajo demanda | A | M |
| 4.5 | Memoizar `value` de contextos; mover `LoreThemeProvider` al exterior; `composeProviders` | M | S–M |
| 4.6 | Canvas: `memo(EventNode)`, guardado de posición en `onNodeDragStop` en lote | M | M |
| 4.7 | `middleware.js`/`withAuth` único; eliminar guards duplicados | M | M |

## Fase 5 — Refactor estructural (2–3 semanas, por módulo)
| # | Tarea | Impacto | Esfuerzo |
|---|---|---|---|
| 5.1 | `controllers/_base.js` (`handleLoading` único) + `unwrap` en services | M | M |
| 5.2 | `boardRepository/relationshipRepository` + services; cumplir la regla de capas; `no-restricted-imports` | M | M |
| 5.3 | Dividir `CharactersWorkspaceView` → hooks + subcomponentes | A | XL |
| 5.4 | Dividir `SidebarLore`, `CharacterModal`, `EventNode`, `EventModal` | A | XL |
| 5.5 | Unificar Notas (`QuickNotesPanel` + `NotesDetailView`) en `NoteList/NoteCard` | M | L |
| 5.6 | `ImageSourcePicker` compartido (historia/personaje) | M | M |
| 5.7 | Estructura `features/*` incremental + alias `@/` | M | L |

## Fase 6 — Experiencia avanzada (continuo)
Paleta de comandos (Ctrl+K), deep links de vista, undo/redo en canvas y borrados, atajos del editor, modo foco, creación rápida de eventos en el lienzo, tests E2E (Playwright), virtualización si las medidas lo justifican.

## Dependencias entre tareas
`0.x → todo` · `3.1 → 3.2, 2.2` · `2.1 → 1.7 (reutiliza ConfirmDialog; o hacer 1.7 con Dialog simple y migrar)` · `4.1 → 5.x` · `4.4 → 1.4` (el autosave de 1.4 se mejora, no se rehace).

## Criterios de salida por fase
- F1: ningún usuario puede elevar su rol; `/admin` funciona; no se pierde texto al cambiar de capítulo (prueba manual con red lenta).
- F2: 0 `window.confirm/alert`; axe sin violaciones críticas en login, dashboard y modales.
- F3: 0 hex en JSX; los 4 temas pasan 4.5:1.
- F4: crear/editar evento = 1 llamada de red; escribir 5.000 palabras sin jank (< 16 ms por pulsación en el perfilador).
- F5: ningún archivo > 400 líneas ni componente con > 10 `useState`.

## Estimación total
≈ 6–9 semanas-persona para F0–F5 (una persona); las fases 1–2 (≈ 1,5 semanas) concentran el ~60 % del valor percibido y del riesgo reducido.
