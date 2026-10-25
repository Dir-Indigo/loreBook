# 04 · Mejoras de usabilidad, flujos y accesibilidad

Basado en las prioridades de UI/UX Pro Max: 1 Accesibilidad · 2 Touch/interacción · 3 Rendimiento percibido · 8 Formularios y feedback · 9 Navegación.

## 1. Accesibilidad (nota actual 3/10 → objetivo 7/10)

| Problema | Evidencia | Corrección |
|---|---|---|
| Botones de icono sin nombre accesible | 105 `<IconButton>` vs 5 `aria-label` en todo `src` | `IconAction` con `label` obligatorio (ver 03) |
| Diálogos nativos | 10 `window.confirm/alert` | `ConfirmDialog` / `useNotify` (MUI Dialog gestiona foco y `role="dialog"`) |
| Sin `prefers-reduced-motion` | 0 coincidencias; `selected-event-bounce` y `selected-character-bounce` en `globals.css` | `@media (prefers-reduced-motion: reduce) { * { animation: none !important; transition-duration: 0.01ms !important } }` |
| Imágenes | 7 `alt=` en todo el proyecto, 1 `<img>` | `alt` descriptivo en avatares/portadas (o `alt=""` si decorativas) |
| Canvas no operable con teclado | nodos React Flow sin atajos propios | `nodesFocusable`, Enter = abrir, Supr = borrar (con confirmación), flechas = mover, `aria-label` por nodo con título |
| Texto diminuto | ~101 `fontSize` < 0.8 rem | mínimo 0.75 rem, preferible 0.875 rem |
| Foco | `outline` no definido globalmente | regla `:focus-visible` global |
| Modales | `CustomModal` sin `aria-labelledby` | `aria-labelledby` ← id del título; devolver foco al disparador |
| Estado dinámico | errores y guardados no anunciados | `aria-live="polite"` en snackbar y "Guardado" |
| Contraste | no auditado con los 4 temas | validar los pares texto/fondo de cada tema ≥ 4.5:1 (script de contraste en CI) |

## 2. Feedback y estados de carga
- **Reemplazar el overlay global** de `LoadingContext` por feedback local: skeletons en sidebar/lienzo, botón con spinner durante guardado, y barra superior fina solo para cargas de historia. Hoy cualquier petición lo activa.
- Pantalla de carga de `/dashboard`: sustituir spinner a pantalla completa por esqueleto del layout (navbar + sidebar + lienzo) → menos salto visual.
- Indicador persistente de guardado en manuscrito y eventos: *Guardando… → Guardado hace 3 s → Error · Reintentar*.
- Estados vacíos con acción (p. ej. "Aún no hay personajes · Crear el primero").
- Errores: mensajes en español claros y sin detalles internos (hoy se hace `console.error` + `alert` genérico); botón **Reintentar** cuando es de red.

## 3. Acciones destructivas
| Acción | Hoy | Propuesta |
|---|---|---|
| Borrar historia (y todos sus eventos) | `window.confirm` de una línea | Modal con conteo de elementos y confirmación escribiendo el nombre; ofrecer "Exportar antes" |
| Borrar personajes en lote | `window.confirm` | `ConfirmDialog` + snackbar **Deshacer** 8 s (borrado diferido) |
| Borrar capítulo / tablero | confirm / sin definir | igual; aclarar si arrastra hijos |
| Quitarse el rol superadmin | `window.confirm` | `ConfirmDialog` tono danger |
| Restaurar versión (evento/capítulo) | directo | vista previa del diff + confirmar |

## 4. Navegación y clics
- **Deep links de vista** (`/dashboard?view=characters&board=<id>`): recargar o compartir mantiene contexto; botón Atrás coherente.
- Eliminar/redirigir rutas duplicadas (`/characters/[story_id]`, `/ideas/*`).
- **Paleta de comandos** (Ctrl+K): cambiar de historia, saltar a personaje/evento/capítulo, crear. Reduce de 3–4 clics a 1.
- Un único patrón `goToView(view)` en el menú móvil (hoy repite `setActiveView + router.push` ×3).
- Breadcrumb del tablero activo (historia › tablero › sub-tablero).

## 5. Formularios
- `CharacterModal` (1133 líneas, 29 estados): dividir en secciones colapsables con progreso; validar en línea (al salir del campo) con el error junto al campo y resumen enfocable al enviar.
- Etiquetas visibles siempre (no solo placeholder); texto de ayuda donde el campo no es obvio (arquetipo, "global" vs "local").
- Aviso de cambios sin guardar al cerrar modal/pestaña (`beforeunload` + confirm propio).
- Autosave de borradores del formulario de personaje/evento en `sessionStorage` (envuelto en try/catch).
- Validación **también en servidor**: restricciones `CHECK`/`NOT NULL`/longitudes en Postgres; el cliente solo mejora la experiencia.

## 6. Búsqueda, filtros y listas
- Búsqueda + filtros (carpeta, etiqueta, arquetipo, global/local) combinables y **persistidos en la URL**; chips de filtros activos con "Limpiar".
- Listas largas (personajes, notas, eventos del árbol): virtualizar o paginar (>100 elementos).
- Multi-selección: mantener la barra `SelectionActionBar`, añadir "Seleccionar todo lo filtrado" y contador accesible.

## 7. Responsive y táctil
- `100vh` → `100dvh` en `MainLayout`; quitar el `overflow:hidden` global y aplicarlo solo al contenedor de la app, para evitar recortes con la barra del navegador móvil.
- Objetivos táctiles ≥ 44 px (hoy muchos `IconButton size="small"`), separación ≥ 8 px entre acciones.
- Sidebars en móvil como `Drawer` temporal con gesto (ya existe `useSwipeToClose`); comprobar solapamiento Notas/Personajes.
- Probar en 375 / 768 / 1024 / 1440 px (checklist de la skill).

## 8. Escritura (manuscrito)
- Atajos: `Ctrl+S` checkpoint, `Ctrl+Shift+D` diff, `Ctrl+Alt+←/→` capítulo anterior/siguiente.
- Modo foco (oculta sidebars) y ancho de lectura configurable.
- Contador de palabras con objetivo diario opcional.
- Protección contra pérdida: `flush` en cambio de capítulo, `visibilitychange` y `beforeunload` (ver C3).

## 9. Métricas de éxito sugeridas
| Métrica | Hoy (estimado) | Objetivo |
|---|---|---|
| `IconButton` con nombre accesible | ~5 % | 100 % |
| Diálogos nativos | 10 | 0 |
| Clics para crear un evento con personajes | modal completo | 1 doble clic + título inline |
| Violaciones axe críticas/serias | sin medir | 0 |
| CLS en carga de `/dashboard` | sin medir | < 0.1 |
