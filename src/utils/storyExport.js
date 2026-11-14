import { EVENT_IMPORTANCE } from '../constants/constants';

const CHAPTER_STATUS_LABELS = { draft: 'Borrador', review: 'En revisión', done: 'Finalizado' };
const NOTE_STATUS_SECTIONS = [
  { key: 'idea', title: 'Ideas' },
  { key: 'pending', title: 'Pendientes' },
  { key: 'done', title: 'Hechas' },
  { key: 'discarded', title: 'Descartadas' },
];

// Registros creados de forma optimista y aún sin confirmar por el servidor
const isConfirmed = (item) => !(typeof item?.id === 'string' && item.id.startsWith('temp-'));

const heading = (level, text) => `${'#'.repeat(level)} ${text}\n`;

const countWords = (text) => (text || '').trim().split(/\s+/).filter(Boolean).length;

const formatDate = (value) => (
  value ? new Date(value).toLocaleDateString('es', { day: 'numeric', month: 'long', year: 'numeric' }) : null
);

// Cita multilínea en Markdown
const quote = (text) => text.split('\n').map((line) => `> ${line}`).join('\n');

/** personaje id -> [{ withName, type, description }] (ambos lados de cada relación) */
export const buildRelationshipsByChar = (characters = [], relationships = []) => {
  const names = new Map(characters.map((c) => [c.id, c.name]));
  const map = {};
  relationships.forEach((rel) => {
    const sourceName = names.get(rel.source_character_id) || 'Personaje';
    const targetName = names.get(rel.target_character_id) || 'Personaje';
    (map[rel.source_character_id] ||= []).push({ withName: targetName, type: rel.relationship_type, description: rel.description });
    (map[rel.target_character_id] ||= []).push({ withName: sourceName, type: rel.relationship_type, description: rel.description });
  });
  return map;
};

/**
 * Ficha de un personaje en Markdown. La comparten la exportación de personajes y la de la historia.
 * `level` es el nivel del título del personaje; sus secciones usan level + 1.
 */
export const renderCharacterMarkdown = (char, {
  index,
  relsByChar = {},
  include = {},
  level = 2,
  tagsById = null,
  foldersById = null,
}) => {
  const { bio = true, psychology = true, relationships = true, notes = true } = include;
  const attr = char.attributes || {};
  const charRels = relsByChar[char.id] || [];
  const sub = level + 1;

  let doc = heading(level, `${index}. ${char.name}`);
  doc += `- **Rol / Arquetipo:** ${char.role_archetype || 'Sin rol definido'}\n`;
  doc += `- **Ámbito:** ${char.is_global ? 'Global (Compartido en todo el universo)' : 'Local'}\n`;

  if (foldersById && char.folder_id && foldersById.get(char.folder_id)) {
    doc += `- **Carpeta:** ${foldersById.get(char.folder_id)}\n`;
  }
  if (tagsById && Array.isArray(char.custom_tag_ids) && char.custom_tag_ids.length > 0) {
    const names = char.custom_tag_ids.map((id) => tagsById.get(id)).filter(Boolean);
    if (names.length) doc += `- **Etiquetas:** ${names.join(', ')}\n`;
  }

  if (bio && char.biography) {
    doc += `\n${heading(sub, 'Biografía & Trasfondo')}${char.biography}\n`;
  }

  if (psychology && (attr.goal || attr.conflict || attr.strengths || attr.flaws)) {
    doc += `\n${heading(sub, 'Perfil Psicológico & Motivaciones')}`;
    if (attr.goal) doc += `- **Objetivo Principal:** ${attr.goal}\n`;
    if (attr.conflict) doc += `- **Conflicto / Obstáculo:** ${attr.conflict}\n`;
    if (attr.strengths) doc += `- **Fortalezas & Talentos:** ${attr.strengths}\n`;
    if (attr.flaws) doc += `- **Debilidades & Defectos:** ${attr.flaws}\n`;
  }

  if (relationships && charRels.length > 0) {
    doc += `\n${heading(sub, 'Vínculos & Relaciones')}`;
    charRels.forEach((rel) => {
      doc += `- **${rel.type}** con *${rel.withName}*${rel.description ? `: ${rel.description}` : ''}\n`;
    });
  }

  if (notes && attr.notes) {
    doc += `\n${heading(sub, 'Notas del Autor / Secretos')}${quote(attr.notes)}\n`;
  }

  return doc;
};

const buildStorySheet = ({ story, characters, boards, events, notes, chapters, totalWords }) => {
  let doc = heading(2, 'Ficha de la historia');
  if (story?.universe?.title) doc += `- **Universo:** ${story.universe.title}\n`;
  if (story?.genre) doc += `- **Género:** ${story.genre}\n`;
  const created = formatDate(story?.created_at);
  const updated = formatDate(story?.updated_at);
  if (created) doc += `- **Creada:** ${created}\n`;
  if (updated) doc += `- **Última actualización:** ${updated}\n`;
  doc += `- **Contenido:** ${characters.length} personajes · ${boards.length} tableros · ${events.length} eventos · ${notes.length} ideas · ${chapters.length} capítulos · ${totalWords.toLocaleString('es')} palabras\n`;

  doc += `\n${heading(3, 'Sinopsis')}${story?.synopsis || '*Sin sinopsis.*'}\n`;
  return doc;
};

const buildCharactersSection = ({ characters, relationships, folders, tags, include }) => {
  let doc = heading(2, 'Personajes');
  if (!characters.length) return `${doc}\n*Sin personajes.*\n`;

  const relsByChar = buildRelationshipsByChar(characters, relationships);
  const tagsById = new Map(tags.map((t) => [t.id, t.name]));
  const foldersById = new Map(folders.map((f) => [f.id, f.name]));

  doc += '\n';
  characters.forEach((char, i) => {
    doc += `${renderCharacterMarkdown(char, { index: i + 1, relsByChar, include, level: 3, tagsById, foldersById })}\n`;
  });
  return doc;
};

const buildStructureSection = ({ boards, events, connections }) => {
  let doc = heading(2, 'Estructura narrativa');
  if (!events.length) return `${doc}\n*Sin eventos.*\n`;

  const importanceLabel = new Map(EVENT_IMPORTANCE.map((i) => [i.value, i.label]));
  const eventsById = new Map(events.map((e) => [e.id, e]));
  const sortedBoards = [...boards].sort((a, b) => (a.position ?? 0) - (b.position ?? 0));
  const boardsById = new Map(boards.map((b) => [b.id, b]));

  const groups = sortedBoards.map((board) => ({ board, items: events.filter((e) => e.board_id === board.id) }));
  const orphans = events.filter((e) => !e.board_id || !boardsById.has(e.board_id));
  if (orphans.length) groups.push({ board: { id: null, name: 'Sin tablero' }, items: orphans });

  groups.filter((g) => g.items.length > 0).forEach(({ board, items }) => {
    const parent = board.parent_board_id ? boardsById.get(board.parent_board_id) : null;
    doc += `\n${heading(3, `Tablero: ${board.name}${parent ? ` (dentro de ${parent.name})` : ''}`)}`;

    [...items].sort((a, b) => (a.order_index ?? 0) - (b.order_index ?? 0)).forEach((event, i) => {
      doc += `\n${heading(4, `${i + 1}. ${event.title || 'Evento sin título'}`)}`;
      if (event.importance_level) {
        doc += `- **Importancia:** ${importanceLabel.get(event.importance_level) || event.importance_level}\n`;
      }

      const people = (event.event_characters || []).map((ec) => ec.character?.name).filter(Boolean);
      if (people.length) doc += `- **Personajes:** ${people.join(', ')}\n`;

      const from = connections.filter((c) => c.target_event_id === event.id).map((c) => eventsById.get(c.source_event_id)?.title).filter(Boolean);
      const to = connections.filter((c) => c.source_event_id === event.id).map((c) => eventsById.get(c.target_event_id)?.title).filter(Boolean);
      if (from.length) doc += `- **Viene de:** ${from.join(', ')}\n`;
      if (to.length) doc += `- **Lleva a:** ${to.join(', ')}\n`;

      if (event.summary) doc += `\n${event.summary}\n`;
      if (event.details) doc += `\n${event.details}\n`;
    });
  });
  return doc;
};

const buildIdeasSection = ({ notes }) => {
  let doc = heading(2, 'Ideas');
  if (!notes.length) return `${doc}\n*Sin ideas.*\n`;

  NOTE_STATUS_SECTIONS.forEach(({ key, title }) => {
    const items = notes.filter((n) => (n.status || 'idea') === key);
    if (!items.length) return;
    doc += `\n${heading(3, `${title} (${items.length})`)}`;
    items.forEach((note) => {
      const [first, ...rest] = (note.content || '').split('\n');
      doc += `- ${note.is_pinned ? '📌 ' : ''}${first}${rest.length ? `\n${rest.map((l) => `  ${l}`).join('\n')}` : ''}\n`;
    });
  });
  return doc;
};

const buildManuscriptSection = ({ chapters, totalWords }) => {
  let doc = heading(2, 'Manuscrito');
  if (!chapters.length) return `${doc}\n*Sin capítulos.*\n`;

  doc += `*${chapters.length} capítulos · ${totalWords.toLocaleString('es')} palabras*\n`;
  chapters.forEach((chapter, i) => {
    doc += `\n${heading(3, `Capítulo ${i + 1}: ${chapter.title || 'Sin título'}`)}`;
    doc += `*${CHAPTER_STATUS_LABELS[chapter.status] || 'Borrador'} · ${countWords(chapter.content).toLocaleString('es')} palabras*\n`;
    if (chapter.summary) doc += `\n${quote(chapter.summary)}\n`;
    doc += `\n${chapter.content?.trim() || '*Capítulo vacío.*'}\n`;
  });
  return doc;
};

/**
 * Documento Markdown con toda la información de una historia.
 * `include` activa/desactiva secciones: { sheet, characters, structure, ideas, manuscript }
 * y los campos de personaje: { bio, psychology, relationships, notes }.
 */
export const buildStoryMarkdown = ({
  story,
  characters = [],
  relationships = [],
  folders = [],
  tags = [],
  boards = [],
  events = [],
  connections = [],
  notes = [],
  chapters = [],
  include = {},
}) => {
  const data = {
    story,
    characters: characters.filter(isConfirmed),
    relationships: relationships.filter(isConfirmed),
    folders: folders.filter(isConfirmed),
    tags: tags.filter(isConfirmed),
    boards: boards.filter(isConfirmed),
    events: events.filter(isConfirmed),
    connections: connections.filter(isConfirmed),
    notes: notes.filter(isConfirmed),
    chapters: [...chapters].filter(isConfirmed).sort((a, b) => (a.order_index ?? 0) - (b.order_index ?? 0)),
    include,
  };
  data.totalWords = data.chapters.reduce((sum, c) => sum + countWords(c.content), 0);

  const sections = [];
  sections.push(`# ${(story?.title || 'Historia').toUpperCase()}\n*Exportado con Lorebook Studio · ${formatDate(new Date())}*\n`);

  const { sheet = true, characters: withCharacters = true, structure = true, ideas = true, manuscript = true } = include;
  if (sheet) sections.push(buildStorySheet(data));
  if (withCharacters) sections.push(buildCharactersSection(data));
  if (structure) sections.push(buildStructureSection(data));
  if (ideas) sections.push(buildIdeasSection(data));
  if (manuscript) sections.push(buildManuscriptSection(data));

  return sections.join('\n---\n\n').trimEnd() + '\n';
};
