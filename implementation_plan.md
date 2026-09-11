# Plan: Líneas Narrativas (Tableros de Nodos) con Árbol de Carpetas

## Descripción

Actualmente todos los eventos de una historia viven en un único canvas compartido. El usuario necesita poder crear **múltiples tableros de nodos** (como "Arco 1", "Flashback", "Línea alternativa") dentro de la misma historia, reutilizando los mismos personajes. Los tableros se organizan en una **estructura de árbol de N profundidades** (carpetas anidadas) y se gestionan desde el sidebar.

---

## Arquitectura propuesta

```
historia
 └── tablero (board) — puede tener padre (parent_board_id)
      └── sub-tablero
           └── sub-sub-tablero (N profundidades)
```

- Cada `timeline_event` pertenece a **un** tablero (`board_id`).  
- El canvas renderiza únicamente los eventos del tablero activo.  
- Los personajes pertenecen a la historia, **no** al tablero → se reutilizan en todos.

---

## User Review Required

> [!IMPORTANT]
> Al añadir `board_id` a `timeline_events`, los **eventos existentes** quedarán sin tablero (`board_id = NULL`). El plan los asigna automáticamente al **tablero raíz** que se crea para cada historia. Esto no rompe datos existentes.

> [!WARNING]
> El canvas mostrará **solo** eventos del tablero activo. Esto es el comportamiento deseado pero hay que tenerlo claro: si creas un evento en el tablero A, no aparece en el tablero B.

---

## Open Questions

> [!IMPORTANT]
> ¿Quieres que los **cables de conexión** entre eventos (DAG) sean **locales a cada tablero** (una conexión solo existe dentro del mismo tablero), o quieres poder conectar eventos de distintos tableros? *→ Se asume local por ahora.*

---

## Proposed Changes

### 1. Base de datos (Supabase)

#### [NEW] Tabla `narrative_boards`
```sql
CREATE TABLE public.narrative_boards (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  story_id UUID NOT NULL REFERENCES public.stories(id) ON DELETE CASCADE,
  parent_board_id UUID REFERENCES public.narrative_boards(id) ON DELETE CASCADE,
  name VARCHAR(120) NOT NULL DEFAULT 'Nuevo tablero',
  description TEXT,
  color TEXT DEFAULT '#8c6d53',
  position INTEGER DEFAULT 0,   -- orden entre hermanos
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

#### [MODIFY] Tabla `timeline_events`
```sql
ALTER TABLE public.timeline_events
  ADD COLUMN board_id UUID REFERENCES public.narrative_boards(id) ON DELETE SET NULL;
```

#### Migración automática de eventos existentes
- Por cada `story_id` distinto en `timeline_events`, crear un board raíz "Principal" y asignar todos sus eventos a ese board.

#### RLS para `narrative_boards`
- Misma política que `timeline_events`: solo el propietario de la historia puede operar sus tableros.

---

### 2. ApiService.js

#### [MODIFY] [`ApiService.js`](file:///d:/AAA/loreBook/src/utils/ApiService.js)
Añadir métodos:
- `getBoards(storyId)` — lista el árbol completo (todos los niveles, ordenados)
- `createBoard(storyId, { name, parentBoardId, color })` — crea tablero/sub-tablero
- `updateBoard(boardId, updates)` — renombrar, cambiar color, reordenar
- `deleteBoard(boardId)` — elimina recursivamente (cascada en DB)
- `moveEventToBoard(eventId, newBoardId)` — reasigna `board_id`

Modificar:
- `getEvents(storyId, boardId)` → filtrar por `board_id` si se provee
- `createEvent(eventData, ...)` → incluir `board_id` en el payload

---

### 3. SidebarLore.jsx → Árbol de Tableros

#### [MODIFY] [`SidebarLore.jsx`](file:///d:/AAA/loreBook/src/components/layout/SidebarLore.jsx)
- Reemplazar la sección "Línea Narrativa" por un **árbol de tableros** interactivo.
- Cada nodo del árbol muestra:
  - ícono de carpeta/tablero
  - nombre del tablero
  - contador de eventos
  - botones `+` (sub-tablero) y `⋯` (renombrar/eliminar/cambiar color)
- El tablero activo queda resaltado (es el que se muestra en el canvas).
- Los tableros se pueden expandir/colapsar (acordeón anidado).
- Árbol construido recursivamente con un componente `BoardTreeItem`.

---

### 4. [NEW] Componente `BoardTreeItem.jsx`

`src/components/sidebar/BoardTreeItem.jsx`

- Componente recursivo que renderiza un tablero y sus hijos.
- Props: `board`, `children`, `level`, `activeBoardId`, `onSelect`, `onCreate`, `onRename`, `onDelete`, `onChangeColor`
- Menú contextual con `⋯`: renombrar (inline edit), cambiar color (picker pequeño), eliminar.
- Indentación visual proporcional al `level`.

---

### 5. dashboard.jsx

#### [MODIFY] [`dashboard.jsx`](file:///d:/AAA/loreBook/src/pages/dashboard.jsx)
- Añadir estados: `boards`, `activeBoardId`
- `loadBoards(storyId)` → llamar `ApiService.getBoards(storyId)`
- `loadStoryData(storyId, boardId)` → filtrar eventos por tablero activo
- Handlers: `handleCreateBoard`, `handleUpdateBoard`, `handleDeleteBoard`, `handleSelectBoard`
- Al cambiar de historia → seleccionar el board raíz automáticamente
- Pasar `boards`, `activeBoardId`, y handlers al `SidebarLore`

---

### 6. TimelineCanvas.jsx

#### [MODIFY] [`TimelineCanvas.jsx`](file:///d:/AAA/loreBook/src/components/canvas/TimelineCanvas.jsx)
- Añadir prop `activeBoardId` para mostrar en el HUD el nombre del tablero activo.
- El canvas no necesita cambios de lógica: recibe solo los eventos del board activo desde el padre.

---

### 7. EventModal.jsx

#### [MODIFY] EventModal — no necesita cambios
- El `board_id` se pasa automáticamente desde `dashboard.jsx` al crear un evento (siempre en el board activo).

---

## Verification Plan

### Automático
- No hay tests automatizados configurados; se verifica manualmente.

### Manual
1. Recargar página → ver tablero "Principal" para historias existentes.
2. Crear sub-tablero dentro de "Principal" → aparece anidado en el árbol.
3. Crear sub-sub-tablero → N profundidades funcionan.
4. Cambiar tablero activo desde sidebar → canvas cambia, muestra solo esos eventos.
5. Crear evento en tablero B → no aparece en tablero A.
6. Renombrar / eliminar tablero.
7. Mover evento de tablero (via menú contextual del nodo en el canvas, o drag futuro).
8. Eliminar tablero con eventos → eventos quedan sin tablero (o se mueven al padre).
