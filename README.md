# LoreBook

LoreBook es un workspace de worldbuilding para escritores. Permite gestionar historias, personajes, eventos, relaciones y lineas narrativas visuales mediante un arbol de tableros y un canvas interactivo.

## Principios del proyecto

- La historia es el limite principal de propiedad y seguridad.
- Un tablero organiza contenido, pero no debe convertirse en el propietario del contenido.
- El canvas muestra solo el tablero activo.
- El arbol puede mostrar el inventario completo de eventos de la historia.
- Las entidades globales se reutilizan entre historias, pero siempre deben estar limitadas al usuario propietario mediante RLS.
- Las mutaciones deben actualizar el estado local de forma optimista cuando sea seguro hacerlo.
- Las cargas iniciales deben traer solo datos necesarios para pintar la vista actual.
- Los detalles pesados, como historial, galerias o documentos, se cargan bajo demanda.

## Estructura

```text
src/
  components/       UI reutilizable y vistas
  constants/        configuracion y constantes de dominio
  context/          estado transversal de autenticacion, historias, workspace y carga
  controllers/      frontera entre UI y servicios
  repositories/     consultas directas a Supabase
  services/         reglas de negocio
  pages/            rutas Next.js
  styles/           estilos globales
  utils/            clientes y fachadas de acceso
```

## Flujo de datos

La direccion recomendada es:

```text
UI -> controller -> service -> repository -> Supabase
```

Los componentes no deben consultar Supabase directamente. Las excepciones existentes deben migrarse gradualmente a esta estructura.

`ApiService` funciona como fachada de compatibilidad y logging. Las nuevas operaciones deben exponer un metodo de dominio claro y evitar duplicar consultas entre `ApiService`, controllers y repositories.

`WorkspaceContext` contiene el estado compartido de la historia activa: personajes, relaciones, eventos, conexiones y tableros. Las migraciones futuras deben mover primero las acciones de dominio a este contexto y despues adelgazar las paginas, evitando duplicar estado local.

## Eventos y carga selectiva

Existen tres niveles de consulta:

- `getTree(storyId)`: datos ligeros para el arbol.
- `getAll(storyId, boardId)`: eventos completos del tablero activo para el canvas.
- `getById(eventId)`: ficha completa bajo demanda para editar un evento.

No anadir `event_versions` a consultas generales. El historial se carga solo al abrirlo.

Cuando se agreguen notas, escenarios o multimedia, usar el mismo patron:

```text
listado ligero -> vista activa -> detalle bajo demanda
```

## Seguridad Supabase

La migracion [db-migrations/workspace-foundation.sql](db-migrations/workspace-foundation.sql) habilita RLS, politicas de propietario e indices de consulta.

Antes de agregar una tabla nueva:

1. Definir como se relaciona con `stories`.
2. Definir el propietario efectivo.
3. Crear indices para las consultas principales.
4. Habilitar RLS.
5. Crear politicas `USING` y `WITH CHECK`.
6. Probar lectura, insercion, actualizacion y borrado con dos usuarios distintos.

Los personajes globales no deben exponerse solo por `is_global = true`; RLS debe impedir que un usuario vea personajes globales de otro usuario.

## Reglas de rendimiento

- No cargar historiales, galerias ni documentos en listados.
- Evitar `select('*')` en consultas de arbol, menus o contadores.
- No recargar todo el workspace despues de una mutacion local.
- Mantener caches por historia y por tablero cuando el flujo lo justifique.
- No usar un booleano global de loading para representar varias operaciones simultaneas sin coordinacion.
- Evitar actualizar arrays completos si solo cambio una entidad.
- Usar indices para `(story_id, board_id, order_index)` y relaciones por sus claves foraneas.

## Nuevas entidades previstas

La arquitectura futura contempla:

- `notes` para notas rapidas globales, de historia o de tablero.
- `locations` y sus relaciones con eventos/personajes.
- `character_groups` y miembros de grupo.
- `story_sections` para actos, arcos y capitulos jerarquicos.
- `media_assets` para imagenes de personajes, eventos y escenarios.
- `templates` para fichas reutilizables.

Las notas y otros objetos visuales deben poder aparecer en el canvas sin convertir el canvas en el propietario de los datos.

## Creacion rapida y asistencia IA

La creacion por texto debe comenzar con un parser determinista y una vista previa. La IA debe devolver datos estructurados para revision, nunca escribir directamente en la base de datos.

```text
texto -> borrador estructurado -> validacion -> confirmacion -> persistencia
```

## Verificacion local

```powershell
npm install
npm run dev
npm run build
```

El esquema de Supabase y las migraciones deben ejecutarse manualmente en un entorno controlado. No aplicar migraciones destructivas automaticamente desde la aplicacion.

## Regla para futuros cambios

Antes de implementar una funcionalidad nueva, responder:

- Que entidad es la dueña de estos datos?
- Debe ser global, de historia o de tablero?
- Que consulta ligera necesita el arbol o listado?
- Que detalle debe cargarse bajo demanda?
- Como se protege con RLS?
- Como se actualiza el estado local sin recargar todo?
- Como funcionara en movil?
