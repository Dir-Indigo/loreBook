# 01 · Auditoría general — LoreBook

> Fase de **solo auditoría**: no se modificó código de producción. Fecha: 2026-10-25 · Rama: `fix/optimizacion-skill-claude`.
> Skill de diseño usada: `ui-ux-pro-max` v2.15.0 (instalada y operativa; ver §7).

## 1. Resumen ejecutivo

LoreBook es un workspace de worldbuilding para escritores (historias, personajes, eventos en un canvas de nodos, tableros anidados, manuscrito con versionado tipo git y notas rápidas). Tiene una base **mejor de lo habitual** para su tamaño: capas definidas (UI → controller → service → repository), RLS con `story_id` como frontera de propiedad, carga inicial paralela, modales pesados con `dynamic()`, 4 temas "matte" con identidad propia y un README con principios claros.

Los problemas no están en la idea sino en la **ejecución a escala**: componentes de 900–1500 líneas, capas que se saltan (controladores que consultan Supabase), operaciones multi-paso sin transacción, funciones **declaradas pero no implementadas** (backup/restore de eventos, API de admin), accesibilidad casi inexistente (5 `aria-label` para 105 `IconButton`) y ausencia total de tests y linter.

## 2. Stack detectado

| Capa | Tecnología |
|---|---|
| Framework | Next.js 14 (Pages Router), React 18, JavaScript (sin TypeScript) |
| UI | MUI v5 + Emotion, `@mui/icons-material`, tema custom (`constants/theme.js`) |
| Canvas | `@xyflow/react` 12 |
| Backend / BaaS | Supabase (Auth + Postgres + Storage + RLS), cliente directo desde el navegador |
| Estado | 12 Context providers; 368 `useState`, 94 `useEffect` |
| Calidad | Sin ESLint propio, sin Prettier, sin tests, sin TypeScript |
| Dependencias | Solo 9 — saludable, no sobran librerías |

## 3. Arquitectura

```
pages/ → MainLayout → SidebarLore + SidebarDetail + WorkspaceContainer(views)
UI → ApiService (fachada + logging) → controllers (handleLoading) → services → repositories → Supabase
Providers: Auth > Loading > Story > Workspace > WorkspaceView > Manuscript > QuickNotes > GlobalActions > CharacterDrawer > SidebarDetail > Theme
```

**Fortalezas**
- Separación de capas declarada y mayormente respetada: la UI no consulta Supabase (las apariciones de `supabase` en `CharacterModal`/`SidebarLore`/`StoryModal` son solo comprobaciones de URL de Storage).
- `WorkspaceContext` separa contexto de datos y de acciones, usa un `latestRef` para identidades estables y carga 8 recursos con `Promise.all`.
- RLS habilitada en todas las tablas; políticas por `story_id` → `stories.user_id = auth.uid()`.
- `dynamic()` en `StoryModal` y `CharacterModal`; uso consciente de `useMemo`/`useCallback` (67/137).

**Debilidades**
- Capa saltada: `boardController` y `relationshipController` contienen consultas Supabase (sin service/repository); `eventService` importa `supabase` sin usarlo; `AuthContext` consulta `profiles` directamente.
- `handleLoading` está **copiado en 6 controladores** con variaciones (unos reciben una promesa que lanza, otros una que devuelve `{data,error}`).
- 11 providers anidados en `_app.jsx`; `LoreThemeProvider` es el más interno, así que `CssBaseline` y el tema no existen durante los estados de carga de los providers externos.
- `ApiService` es boilerplate repetitivo (`bridge('X','tabla',fn,setLoading,...)`) y **loguea cada petición con su payload en producción**.

## 4. Hallazgos críticos (verificados en código)

| # | Hallazgo | Evidencia |
|---|---|---|
| C1 | **El panel `/admin` está roto**: usa `ApiService.getAllProfilesForAdmin`, `getPlatformStats` y `updateProfileRole`, que **no existen** en `ApiService` → `TypeError` al entrar como superadmin | `grep` solo los encuentra en `pages/admin/index.jsx` |
| C2 | **Backup/restore de eventos son stubs**: `eventService.createBackup` / `restoreVersion` tienen cuerpo `// ... complex logic ...` (devuelven `undefined`) y `update(..., createBackup)` ignora el flag. `EventModal` muestra un checkbox "crear backup" activo por defecto que **no hace nada** | `services/eventService.js` (update, createBackup, restoreVersion); `EventModal.jsx:533,660,903` |
| C3 | **El autosave del manuscrito puede perder texto**: el `useEffect` limpia el timer (2,5 s) al cambiar de capítulo o desmontar sin hacer *flush*; además guarda aunque no haya cambios (no consulta `isDirty`) | `ManuscriptContext.js`, bloque "Auto-guardado diferido" |
| C4 | **Rol enviado desde el cliente en el registro**: `signUp(..., role='writer')` manda `role` en `user_metadata`. Si el trigger de `profiles` (no está versionado en `db-migrations/`) lo copia, cualquiera podría registrarse como `superadmin` | `AuthContext.js` signUp. **No verificable desde el repo: revisar el trigger en Supabase de inmediato** |
| C5 | **Operaciones multi-paso sin transacción**: crear evento (insert + vínculos + versión), actualizar evento (**borra** vínculos y reinserta), `assignTagsBatch` (leer-modificar-escribir N filas, con condición de carrera), `clone`/`copyAsLocal` | `eventService.js`, `characterRepository.js` |
| C6 | **Logging de payloads en producción** (`console.groupCollapsed` con `Payload`) y ~40 `console.*` en controladores/contextos | `ApiService.js` (`logRequest`) |

## 5. Hallazgos altos

- **God components**: `CharactersWorkspaceView` 1534 líneas, `SidebarLore` 1328, `CharacterModal` 1133, `EventNode` 1074, `CharacterCard` 951, `EventModal` 948, `IdeasWorkspaceView` 934, `QuickNotesPanel` 905, `WorkspaceNavbar` 883 (≈ 9.000 de 26.700 líneas en 9 archivos).
- **Guards solo en cliente y repetidos**: no hay `middleware.js`; cada página repite `useEffect → router.replace('/login')`. `help`, `characters/[story_id]` e `ideas/*` **no tienen guard** (la RLS protege datos, pero la UI se renderiza vacía).
- **Rutas legacy duplicadas**: `/characters/[story_id]` y `/ideas/*` replican vistas que ya viven en `/dashboard`; `MainLayout.handleSelectStory` mantiene un caso especial para ellas.
- **Consultas**: 16 `select('*')`; `characters.getAll` trae todas las columnas para listar; sin paginación en personajes/eventos/notas; el filtro `or(story_id.eq.${storyId},is_global.eq.true)` interpola strings.
- **Scroll global bloqueado**: `html, body { overflow: hidden; height: 100% }` y `100vh` en `MainLayout` → en móvil la barra del navegador recorta contenido (solo hay un uso de `dvh`, en `CustomModal`).
- **Fuentes vía `@import` CSS** (bloquea render) en vez de `next/font`.
- **Overlay de carga global**: `LoadingContext` pinta un overlay ante cualquier `setLoading(true)` → parpadeos para operaciones locales (mover un nodo, guardar).
- **Sin tests ni lint**: `next lint` no tiene configuración.

## 6. Hallazgos medios / bajos

- `AuthContext.fetchProfile` depende de `profile` → la suscripción `onAuthStateChange` se recrea al cambiar el perfil; además hace `await` de consultas dentro del callback de auth (patrón que Supabase desaconseja por riesgo de bloqueo).
- `value` de varios contextos sin `useMemo` explícito (`GlobalActionsContext`, `CharacterDrawerContext`, `SidebarDetailContext`, `QuickNotesContext`: verificar) → re-render en cascada.
- `key={index}` en 4 sitios; 1 `<img>` y 7 `alt=`; sin `next/image`.
- `window.confirm` / `window.alert` en 10 puntos, inconsistentes con el resto de modales.
- ~101 usos de `fontSize` < 0.8 rem.
- 0 usos de `prefers-reduced-motion` pese a las animaciones "bounce" de selección.
- El README dice que las excepciones a la regla de capas "se migrarán", pero no las lista.

## 7. Cómo se aplicó UI/UX Pro Max

Se ejecutó `search.py --design-system` con contexto "writing / worldbuilding / productivity SaaS". Devolvió Flat Design + teal/naranja + Plus Jakarta Sans, orientado a landing pages, que **choca con la identidad actual** (paleta tierra/arena, Outfit). Por la regla "respetar la identidad visual existente" **se descartó esa paleta** y se usaron las reglas transversales de la skill: prioridades 1–10 (accesibilidad, touch ≥ 44 px, contraste 4.5:1, foco visible, reduced-motion, estados de carga, tokens semánticos en vez de hex sueltos). La consulta de stack `nextjs` sobre re-renders devolvió **0 resultados**; esas recomendaciones provienen de las reglas generales de la skill y de revisión manual, no de una coincidencia en su base.

## 8. Puntuaciones (1–10)

| Dimensión | Nota | Justificación |
|---|---|---|
| Diseño visual | **7.5** | Identidad coherente (4 temas matte, sombras suaves, radios consistentes, Outfit). Penalizan: hex hardcodeados en 26 archivos (`#8c6d53` ×22), texto minúsculo, mezcla de `CustomButton` y `Button` directo, 1.504 `sx` inline. |
| Usabilidad | **6.5** | Flujos ricos (canvas, multi-selección, pull-to-refresh, notas rápidas). Penalizan: `confirm/alert` nativos, sin skeletons, overlay global, rutas duplicadas, backup falso en EventModal, admin roto. |
| Arquitectura / lógica | **6** | Capas y contextos bien pensados; pero capas saltadas, `handleLoading` ×6, stubs, sin transacciones, 9 god-components, 11 providers anidados. |
| Rendimiento | **6.5** | Buen `Promise.all`, memo/callback, `dynamic`. Penalizan: `select('*')`, sin paginación/virtualización, fuente bloqueante, N updates en `assignTagsBatch`, autosave sin dirty-check, logging por petición. |
| Accesibilidad | **3** | 5 `aria-label` para 105 `IconButton`, sin reduced-motion, 7 `alt`, texto pequeño, foco en canvas sin revisar, diálogos nativos. Punto más débil. |
| Consistencia de código | **5.5** | Convenciones razonables y comentarios útiles, pero sin lint/format/tests/TS, duplicación de controladores y archivos gigantes. |
| **Global** | **6.2 / 10** | Producto prometedor con deuda concentrada y corregible sin reescribir. |

> Limitaciones: auditoría estática del código; no se ejecutó la app, no se midió Lighthouse/bundle, y no se tuvo acceso al esquema real de Supabase (`db-squema.sql` está en `.gitignore`), por lo que RLS/triggers se evaluaron solo desde `db-migrations/`.
