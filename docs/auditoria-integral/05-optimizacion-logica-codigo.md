# 05 · Optimización de lógica, arquitectura y código

Todas las propuestas usan el stack actual (sin dependencias nuevas, salvo ESLint/Prettier como devDependencies, ya implícitas en `next lint`). Ningún cambio altera contratos de datos salvo donde se indica.

## 1. Seguridad (prioridad máxima)

| ID | Riesgo | Propuesta |
|---|---|---|
| S1 | `signUp` envía `role` desde el cliente (C4) | Quitar el parámetro. El trigger `handle_new_user` debe **ignorar** `raw_user_meta_data->>'role'` y asignar `'writer'`. Versionar el trigger en `db-migrations/`. Añadir política que impida a un usuario actualizar su propio `role` (`WITH CHECK (role = (SELECT role FROM profiles WHERE id = auth.uid()))`). |
| S2 | Admin con guard solo de cliente | Todas las operaciones admin vía RPC `SECURITY DEFINER` que valide `role = 'superadmin'` en servidor; el guard de cliente queda como UX. |
| S3 | Logging de payloads (`ApiService.logRequest`) | Activar solo si `process.env.NODE_ENV !== 'production'`; nunca registrar `payload` completo (contenido de capítulos, perfiles). |
| S4 | `.or(story_id.eq.${storyId},is_global.eq.true)` | Validar `storyId` como UUID antes de interpolar (`isUuid()`), o resolver con dos consultas / vista. Confirmar que la política de `characters` **limita `is_global` al propietario** (la migración actual exige `story_id` de una historia propia, por lo que los globales de otras historias propias dependen de la política; documentarlo y probarlo). |
| S5 | Mensajes de error | Mapear códigos Postgres/Auth a mensajes genéricos (`23505` → "Ya existe…"); no mostrar `error.message` crudo. |
| S6 | Archivos subidos (`storageService`) | Validar tipo MIME y tamaño en cliente **y** en políticas del bucket; rutas con prefijo `user_id/`. |
| S7 | `db-squema.sql` ignorado en git | Mantener un esquema versionado (sin datos) para que las políticas sean auditables. |

## 2. Corrección funcional (bugs/stubs)

1. **Admin (C1):** crear `profileRepository`/`adminService`/`adminController` y exponer `ApiService.admin.{getProfiles, getStats, updateRole}`. Estadísticas con `count: 'exact', head: true` (4 consultas ligeras) o una RPC.
2. **Backup/restore de eventos (C2):** decidir: (a) implementar `createBackup` = insertar fila en `event_versions` con `snapshot_data` y `version_number = max+1`, `restoreVersion` = leer snapshot y aplicarlo; o (b) quitar el checkbox y los métodos. Hoy es una promesa falsa al usuario.
3. **Autosave (C3):** ver §4.2.
4. **Import sin uso** de `supabase` en `eventService`: eliminar.

## 3. Datos y consultas

### 3.1 Transacciones con RPC (C5)
Crear funciones SQL (migración nueva en `db-migrations/`):
```sql
create function create_event_with_links(p_event jsonb, p_character_ids uuid[]) returns timeline_events ...
create function update_event_links(p_event_id uuid, p_data jsonb, p_character_ids uuid[]) returns timeline_events ...
create function assign_tags_batch(p_ids uuid[], p_add uuid[], p_remove uuid[]) returns setof characters ...
```
`SECURITY INVOKER` (respeta RLS). Los services llaman `supabase.rpc(...)` y la firma pública de `ApiService` **no cambia**. Beneficios: atomicidad, 1 viaje de red en lugar de 3–N, sin condición de carrera en tags.

### 3.2 Selección de columnas
Sustituir los 16 `select('*')` por listas explícitas. Para `characters.getAll`, columnas de tarjeta (id, name, avatar_url, role_archetype, color_tag, folder_id, custom_tag_ids, is_global, story_id); detalle completo con `getById` bajo demanda (coherente con el principio del README: "los detalles pesados se cargan bajo demanda").

### 3.3 Paginación y escala
Notas, personajes y eventos del árbol: `range()` + "cargar más" o virtualización con `@tanstack/react-virtual` solo si se superan ~300 elementos (decisión posterior, no necesaria ahora; sin dependencia nueva hasta medirlo).

### 3.4 Índices
Verificar en Supabase índices en `story_id`, `board_id`, `order_index` (timeline_events), `story_id` (characters, notes, chapters), `event_id` (event_characters, event_versions). Las políticas RLS hacen `EXISTS` sobre `stories`: indexar `stories(user_id)`.

## 4. Frontend: rendimiento

### 4.1 Contextos
- Dividir en **estado de alta frecuencia vs. datos estables**. El caso crítico es `ManuscriptContext`: separar `ManuscriptEditorContext` (`workingDraft/Title/Summary/Status`) de `ManuscriptDataContext` (capítulos, versiones, modales).
- Memoizar los `value` de `GlobalActions`, `CharacterDrawer`, `SidebarDetail`, `QuickNotes` (`useMemo`) y verificar que las acciones sean estables.
- Reordenar `_app.jsx`: `LoreThemeProvider` (+ `CssBaseline`) **fuera**, para que loaders y errores de los providers ya estén tematizados. Combinar los 11 providers con un helper `composeProviders([...])` para quitar la "pirámide".

### 4.2 Manuscrito
- Diffs (`computeLineDiff`, `computeWordDiff`) **solo** cuando el modal de diff / modo revisión está abierto o con debounce de 400 ms; hoy corren por pulsación sobre todo el texto.
- `isDirty` con un contador/versión (`dirtyRef`) o hash en lugar de comparar strings completos.
- Autosave robusto:
```js
// idea: guardar solo si hay cambios y hacer flush al salir
useEffect(() => {
  if (!isDirty) return;
  const t = setTimeout(() => saveDraft(true), 2500);
  return () => clearTimeout(t);
}, [isDirty, workingDraft, ...]);
useEffect(() => () => { flushRef.current?.(); }, [activeChapterId]);   // flush al cambiar/desmontar
useEffect(() => { /* visibilitychange + beforeunload → flush */ }, []);
```

### 4.3 Canvas
- Confirmar `React.memo(EventNode)` con comparador estable y `nodeTypes` definido **fuera** del componente.
- `savePosition`: guardar en `onNodeDragStop` (no durante el arrastre) y agrupar múltiples nodos en un único `upsert`.
- Extraer los 18 colores de `EventNode` a tokens.

### 4.4 Cosas pequeñas de alto retorno
- `next/font/google` para Outfit/Inter (elimina el `@import` bloqueante y evita FOUT).
- `100dvh` y mover `overflow:hidden` al contenedor raíz.
- `reactStrictMode` ya activo: aprovechar para detectar efectos sin cleanup.
- `key` estable en las 4 listas con `key={index}`.
- Eliminar los ~40 `console.*` o canalizarlos por un `logger` con nivel.

## 5. Arquitectura y limpieza

### 5.1 Eliminar duplicación (DRY)
| Duplicado | Solución |
|---|---|
| `handleLoading` ×6 | `controllers/_base.js` con `createController(name)` / `run(promise, setLoading, name)` |
| `ApiService.bridge('GET_X','tabla',...)` ×50 | generar la fachada desde un mapa `{ domain: { method: [controllerFn, 'ACTION', 'table'] } }`, o simplemente quitar `endpoint/action` (solo se usan para logging) |
| `if (error) throw error; return data;` en cada método de service | `unwrap(await repo.x())` en `services/_unwrap.js` |
| `isStorageUrl` ×3 | `storageService.isStorageUrl()` |
| Guard de auth en cada página | `middleware.js` (cookie de sesión de Supabase) o HOC `withAuth(Page, { role })` |
| Mapeo de IDs de personaje `(typeof c==='object'? c.id : c)` | `toIds(list)` |

### 5.2 Cumplir la regla de capas
- `boardController`, `relationshipController` → crear `boardRepository` (ya existe en `repositories/`, no se usa desde el controller), `relationshipRepository`, y los services; los controllers solo orquestan.
- `AuthContext` → `profileRepository`.
- Añadir `eslint-plugin-import` / regla `no-restricted-imports` para prohibir `supabaseClient` fuera de `repositories/` y `storageService`.

### 5.3 Dividir los god-components (patrón de extracción)
Para cada archivo > 600 líneas:
1. Extraer **hooks** de estado (`useCharacterFilters`, `useCharacterSelection`, `useFolderTree`, `useEventForm`, `useNotesFilter`).
2. Extraer **subcomponentes de presentación** (`CharacterCard` → `CardHeader/CardBody/CardActions`; `EventNode` → ídem).
3. Mover constantes/estilos `sx` repetidos a `styles/*.js` o a `theme.components`.
4. Objetivo: ningún archivo > 400 líneas; ningún componente con > 10 `useState` (usar `useReducer`).
Orden: CharactersWorkspaceView → SidebarLore → CharacterModal → EventNode → EventModal.

### 5.4 Calidad automatizada (sin dependencias de runtime)
- `.eslintrc.json` (`next/core-web-vitals`) + `eslint-plugin-jsx-a11y` (ya incluido en `eslint-config-next`) activando `jsx-a11y/control-has-associated-label`.
- Prettier + `.editorconfig`.
- `jsconfig.json` ya existe: añadir alias `@/` para evitar `../../../`.
- Tests mínimos con Vitest/Jest: `diffUtils`, `getNextOrderIndex`, `buildDuplicateEventData`, `toIds`, reducers; un test de humo E2E del flujo login → crear historia (Playwright, opcional).
- CI: `lint` + `build` + tests en cada PR.

## 6. Estructura de carpetas objetivo (incremental)
```
src/
  features/
    characters/ {components, hooks, services, repositories, controllers}
    events/  manuscript/  notes/  boards/  stories/  admin/
  shared/ {ui, hooks, utils, theme}
  pages/            # solo rutas finas
```
Migración por feature, sin mover todo a la vez; los imports antiguos se mantienen vía re-exports durante la transición.

## 7. Riesgos y mitigaciones de este plan
- RPC nuevas: probar con datos de desarrollo; mantener la implementación anterior detrás de un flag hasta validar.
- Dividir contextos cambia los hooks de consumo: exportar un hook de compatibilidad (`useManuscript()` que combine ambos) y migrar consumidores gradualmente.
- Cambiar `select('*')` puede romper pantallas que usen una columna no listada: cubrir con búsqueda de usos y una pasada manual por pantalla.
