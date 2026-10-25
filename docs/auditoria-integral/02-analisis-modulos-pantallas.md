# 02 · Análisis por pantalla / módulo

Nivel de evidencia: métricas (líneas, `useState`, `aria-*`, hex) medidas con `grep`/`wc`; el resto, lectura de código. **No se ejecutó la app**, por lo que los juicios visuales se infieren del código (tema, `sx`, estructura) y deben validarse con capturas en la fase 1.

Métricas de los módulos grandes (medidas):

| Archivo | Líneas | useState | useEffect | `aria-*` | `<IconButton>` | hex literales |
|---|---|---|---|---|---|---|
| CharactersWorkspaceView | 1534 | 32 | 2 | 0 | 5 | 2 |
| SidebarLore | 1328 | 17 | 5 | 0 | 17 | 1 |
| CharacterModal | 1133 | 29 | 3 | 0 | 2 | 3 |
| EventNode | 1074 | 10 | 3 | 0 | 9 | 18 |
| CharacterCard | 951 | 4 | 0 | 0 | 1 | 4 |
| EventModal | 948 | 16 | 3 | 0 | 0 | 6 |
| IdeasWorkspaceView | 934 | 14 | 6 | 0 | 4 | 17 |
| QuickNotesPanel | 905 | 13 | 5 | 0 | 12 | 12 |
| WorkspaceNavbar | 883 | 4 | 0 | 0 | 4 | 0 |
| StoryModal | 733 | 14 | 1 | 0 | 2 | 0 |

---

## 1. Login / Registro (`pages/login.jsx`, 250 líneas)
- **Estado actual:** formulario único con alternancia login/registro, `autoComplete` correcto.
- **Problemas:** el registro envía `role` desde el cliente (ver C4); sin indicador de fuerza/reglas de contraseña ni validación de formato más allá de `trim`; mensajes de error de Supabase probablemente sin traducir/normalizar; sin "olvidé mi contraseña".
- **Mejoras visuales:** mantener; asegurar contraste 4.5:1 en textos secundarios y estado de error con icono + texto (no solo color).
- **Mejoras de flujo:** recuperación de contraseña; mostrar/ocultar contraseña; `aria-live` para errores; enfocar el primer campo con error.
- **Mejoras de código:** eliminar el parámetro `role` del cliente (asignar en servidor/trigger); mapear errores a mensajes propios en un único `authErrorMessage()`.
- **Prioridad:** Alta (seguridad) · **Impacto:** Alto · **Complejidad:** Baja

## 2. Layout principal (`MainLayout`, `Navbar`, `SidebarLore`, `SidebarDetail`)
- **Estado actual:** navbar + sidebar primario (árbol de tableros, manuscrito, ideas) + sidebar secundario exclusivo (personajes **o** notas) + lienzo. Buena idea de "un solo panel secundario".
- **Problemas:** `SidebarLore` (1328 líneas, 17 IconButton sin `aria-label`) mezcla portada de historia, árbol de tableros, manuscrito, ideas y modales; exclusión mutua de paneles implementada con `useEffect` + `lastSecondaryRef` (frágil, provoca doble render); `100vh`/`overflow:hidden` global; `Navbar` repite el patrón `setActiveView + router.push` 3 veces en el menú móvil; `window.alert` para "la carpeta Principal no se puede eliminar".
- **Mejoras visuales:** colapso de sidebar con transición única y persistida; indicador claro de la historia activa; botones de icono de ≥ 44 px en táctil.
- **Mejoras de flujo:** atajos de teclado (Ctrl+K selector de historia / búsqueda global); navegación con breadcrumb del tablero activo.
- **Mejoras de código:** dividir `SidebarLore` en `StoryHeader`, `BoardTree`, `ManuscriptSection`, `IdeasSection` (ya existen dos); mover la exclusión de paneles a un reducer en `SidebarDetailContext`; helper `goToView(view)`; `100dvh`.
- **Prioridad:** Alta · **Impacto:** Alto · **Complejidad:** Media

## 3. Dashboard / Workspace (`pages/dashboard.jsx`, `WorkspaceContainer`, `WorkspaceNavbar`)
- **Estado actual:** pestañas de vista (Eventos, Ideas, Personajes, Manuscrito) dentro de `/dashboard`.
- **Problemas:** pantalla completa de "Cargando estudio…" con `LinearProgress` + spinner (sin skeleton del layout); guard de auth repetido por página; `WorkspaceNavbar` 883 líneas con solo 4 `useState` (probable JSX masivo y repetido); rutas legacy `/characters/[story_id]`, `/ideas/*` duplican las vistas.
- **Mejoras visuales:** skeleton de sidebar + lienzo en lugar de spinner centrado (reduce CLS y sensación de espera).
- **Mejoras de flujo:** deep-link de vista (`/dashboard?view=characters`) para poder compartir/recargar; eliminar o redirigir rutas legacy.
- **Mejoras de código:** `middleware.js` o HOC `withAuth` único; extraer `WorkspaceNavbar` a subcomponentes (`ViewTabs`, `BoardSwitcher`, `Toolbar`); redirects 301 en `next.config.js` para rutas legacy.
- **Prioridad:** Media · **Impacto:** Medio · **Complejidad:** Baja

## 4. Eventos — Canvas (`TimelineCanvas`, `EventNode`, `EventModal`, `EventVersionsModal`)
- **Estado actual:** React Flow con nodos de evento, conexiones (DAG), posiciones persistidas, versionado de eventos.
- **Problemas:** `EventNode` 1074 líneas con **18 hex literales** y 9 IconButton sin etiqueta (el nodo es el elemento más repetido de la pantalla → coste de render alto); `EventModal` 948 líneas, 16 estados locales; **backup/restore son stubs (C2)**; creación/edición sin transacción (C5); `savePosition` por evento (verificar que haya debounce/batch al arrastrar); `bounce` animado en selección sin `prefers-reduced-motion`; teclado: nodos y conexiones no operables sin ratón.
- **Mejoras visuales:** colores de evento desde tokens del tema (`custom.node`, `tagColors`); densidad de nodo configurable (compacto/detallado).
- **Mejoras de flujo:** Supr para borrar con confirmación en modal propio; undo/redo para mover/crear; creación rápida (doble clic en lienzo → título inline) en vez de abrir el modal completo.
- **Mejoras de código:** `React.memo(EventNode)` con comparador por `data` (ya hay 1 `memo`; validar); separar `EventNode` en `NodeHeader/NodeBody/NodeActions`; implementar `create_event_with_links` y `update_event_with_links` como funciones RPC de Postgres (transacción); implementar o eliminar el backup.
- **Prioridad:** Alta · **Impacto:** Alto · **Complejidad:** Alta

## 5. Personajes (`CharactersWorkspaceView`, `CharacterCard`, `CharacterModal`, `CharacterDrawer`, `CharactersDetailView`, carpetas/etiquetas/arquetipos)
- **Estado actual:** la funcionalidad más completa: carpetas en árbol, etiquetas, arquetipos personalizados, multi-selección, mover/clonar/globalizar/exportar, relaciones.
- **Problemas:** `CharactersWorkspaceView` es el mayor archivo (1534 líneas, 32 `useState`); 5 `window.alert` y 1 `window.confirm` (CharactersDetailView); `assignTagsBatch` hace N updates con condición de carrera; `getAll` trae `*` + sin paginación ni virtualización de tarjetas (951 líneas por `CharacterCard`); el formulario `CharacterModal` (1133 líneas, 29 estados) es un único bloque largo; lógica duplicada entre `CharactersWorkspaceView`, `CharactersDetailView` y `useCharacterActions`.
- **Mejoras visuales:** `CharacterCard` con variantes (`compact`/`detailed`) en vez de una pieza monolítica; `StatusBadge` para global/plantilla/local.
- **Mejoras de flujo:** formulario en secciones colapsables (Básico · Apariencia · Historia · Relaciones) con guardado parcial; búsqueda + filtros combinables persistidos en URL; deshacer tras borrar/mover (snackbar con "Deshacer") en lugar de `alert`.
- **Mejoras de código:** reducir con `useReducer` + hooks (`useCharacterSelection`, `useCharacterFilters`, `useFolderTree`); RPC `assign_tags_batch` con `array_append/array_remove`; listado con columnas mínimas y detalle bajo demanda (alineado con el principio del propio README).
- **Prioridad:** Alta · **Impacto:** Alto · **Complejidad:** Alta

## 6. Ideas y Notas rápidas (`IdeasWorkspaceView`, `QuickNotesPanel`, `NotesDetailView`)
- **Estado actual:** tablero de ideas y panel lateral de notas rápidas con contexto propio.
- **Problemas:** tres archivos de 776–934 líneas con funcionalidad solapada (lista/edición de notas en el panel y en `NotesDetailView`); 12–17 hex literales cada uno (colores de "post-it" fijos, no pasan por el tema oscuro); `QuickNotesContext` 323 líneas con lógica de filtrado/orden probablemente recalculada en cada render.
- **Mejoras visuales:** paleta de notas como tokens con variante dark; contraste 4.5:1 para texto sobre cada color de nota.
- **Mejoras de flujo:** captura rápida con atajo global (Ctrl+Shift+N) y guardado automático visible ("Guardado ✓").
- **Mejoras de código:** unificar en un único `NoteCard`/`NoteList` reutilizado por ambos; `useNotesFilter` memoizado.
- **Prioridad:** Media · **Impacto:** Medio · **Complejidad:** Media

## 7. Manuscrito (`ManuscriptWorkspaceView`, `ManuscriptContext`, `CommitModal`, `VersionHistoryDrawer`, `DiffViewerModal`)
- **Estado actual:** editor con borrador, commits tipo git, historial, diff de líneas y palabras, modo revisión. Es el módulo más diferencial del producto.
- **Problemas:** **riesgo de pérdida de datos por autosave (C3)**; el estado de edición (`workingDraft`, etc.) vive en un Context global → cada pulsación re-renderiza a todos los consumidores de `ManuscriptContext` (y `computeLineDiff` + `computeWordDiff` se recalculan **por pulsación** sobre el texto completo, O(n·m)); `isDirty` compara strings completos; sin indicador "Guardando… / Guardado"; sin `beforeunload` si hay cambios sin enviar; 7 `console.*` en el contexto.
- **Mejoras visuales:** tipografía de lectura/escritura configurable (serif, ancho de línea 60–75 ch), modo foco; barra de estado con palabras, estado de guardado y rama.
- **Mejoras de flujo:** `Ctrl+S` = checkpoint; aviso al salir; restaurar versión con vista previa del diff antes de confirmar.
- **Mejoras de código:** separar `ManuscriptEditorContext` (alta frecuencia) de `ManuscriptDataContext` (capítulos/versiones); calcular diffs **con debounce (300–500 ms)** o solo al abrir el modal; autosave con `flush` en cleanup + `navigator.sendBeacon`/`visibilitychange`; guardar solo si `isDirty`.
- **Prioridad:** Alta · **Impacto:** Alto · **Complejidad:** Media

## 8. Historias (`StoryModal`, `StoryContext`)
- **Estado actual:** selector/gestor de historias con portada (URL o subida).
- **Problemas:** 733 líneas, 14 estados; `window.confirm` para borrar una historia **y todos sus eventos** (acción más destructiva de la app, con confirmación nativa de una línea); lógica de "coverMode" duplicada en `StoryModal`, `SidebarLore` y `CharacterModal` (mismo `includes('supabase.co/storage')`).
- **Mejoras de flujo:** confirmación por escritura del nombre de la historia; exportar antes de borrar; mostrar conteo de lo que se perderá.
- **Mejoras de código:** `isStorageUrl(url)` en `storageService`; componente `ImageSourcePicker` (URL/subida/recorte) compartido por historia y personaje (junto a `ImageCropModal`).
- **Prioridad:** Alta (destructivo) · **Impacto:** Medio · **Complejidad:** Baja

## 9. Administración (`pages/admin/index.jsx`)
- **Estado actual:** tabla de usuarios con cambio de rol y 4 estadísticas.
- **Problemas:** **funciones de API inexistentes (C1)** → pantalla no funcional; guard solo de cliente (la autorización real debe estar en RLS/RPC con `role = 'superadmin'` verificado en servidor); `window.confirm`; tabla sin búsqueda ni orden.
- **Mejoras de código:** implementar `adminController/Service/Repository` con RPC `SECURITY DEFINER` que compruebe el rol; paginación/ordenación en servidor para `profiles`.
- **Prioridad:** Alta (rota + sensible) · **Impacto:** Medio · **Complejidad:** Media

## 10. Ayuda (`pages/help.jsx`, 362 líneas)
- **Problemas:** contenido estático embebido en JSX; sin guard (aceptable) pero depende del layout autenticado.
- **Mejoras:** mover el contenido a datos (`helpContent.js`) y renderizar con un acordeón accesible; buscador.
- **Prioridad:** Baja · **Impacto:** Bajo · **Complejidad:** Baja

## 11. Componentes comunes (`components/common`)
- **Estado actual:** `CustomButton`, `CustomModal`, `CustomTable`, `CustomLoading`, `CustomSpinner`, `CustomHelpTooltip`, `SelectionActionBar`, `SpeedDialActions`, `PullToRefresh`, `ImageCropModal`.
- **Problemas:** `CustomModal` es correcto (usa `100dvh`, `Fade`) pero no gestiona `aria-labelledby` ni foco inicial; `CustomTable` ya pagina en cliente pero no ordena/filtra ni muestra estado vacío/skeleton (verificar); `CustomLoading` (219 líneas) y `CustomSpinner` coexisten con el overlay global de `LoadingContext` → tres sistemas de carga; faltan `ConfirmDialog`, `EmptyState`, `StatusBadge`, `FormField`, `IconAction` (IconButton + Tooltip + aria-label obligatorio).
- **Prioridad:** Alta (palanca de todo lo demás) · **Impacto:** Alto · **Complejidad:** Media
