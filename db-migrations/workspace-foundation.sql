-- LoreBook workspace foundation.
-- Run this migration in Supabase after reviewing it against the live schema.

CREATE INDEX IF NOT EXISTS stories_user_created_idx
  ON public.stories (user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS characters_story_name_idx
  ON public.characters (story_id, name);

CREATE INDEX IF NOT EXISTS characters_global_idx
  ON public.characters (is_global)
  WHERE is_global = true;

CREATE INDEX IF NOT EXISTS narrative_boards_story_parent_position_idx
  ON public.narrative_boards (story_id, parent_board_id, position, created_at);

CREATE INDEX IF NOT EXISTS timeline_events_story_board_order_idx
  ON public.timeline_events (story_id, board_id, order_index);

CREATE INDEX IF NOT EXISTS event_characters_event_idx
  ON public.event_characters (event_id);

CREATE INDEX IF NOT EXISTS event_characters_character_idx
  ON public.event_characters (character_id);

CREATE INDEX IF NOT EXISTS event_connections_story_idx
  ON public.event_connections (story_id);

CREATE INDEX IF NOT EXISTS event_versions_event_version_idx
  ON public.event_versions (event_id, version_number DESC);

CREATE INDEX IF NOT EXISTS character_relationships_story_idx
  ON public.character_relationships (story_id);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.characters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.character_relationships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.timeline_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_characters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.narrative_boards ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS profiles_owner_policy ON public.profiles;
CREATE POLICY profiles_owner_policy ON public.profiles
  FOR ALL USING (id = auth.uid()) WITH CHECK (id = auth.uid());

DROP POLICY IF EXISTS stories_owner_policy ON public.stories;
CREATE POLICY stories_owner_policy ON public.stories
  FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS characters_story_owner_policy ON public.characters;
CREATE POLICY characters_story_owner_policy ON public.characters
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.stories s
      WHERE s.id = characters.story_id AND s.user_id = auth.uid()
    )
  ) WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.stories s
      WHERE s.id = characters.story_id AND s.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS relationships_story_owner_policy ON public.character_relationships;
CREATE POLICY relationships_story_owner_policy ON public.character_relationships
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.stories s
      WHERE s.id = character_relationships.story_id AND s.user_id = auth.uid()
    )
  ) WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.stories s
      WHERE s.id = character_relationships.story_id AND s.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS events_story_owner_policy ON public.timeline_events;
CREATE POLICY events_story_owner_policy ON public.timeline_events
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.stories s
      WHERE s.id = timeline_events.story_id AND s.user_id = auth.uid()
    )
  ) WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.stories s
      WHERE s.id = timeline_events.story_id AND s.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS event_characters_story_owner_policy ON public.event_characters;
CREATE POLICY event_characters_story_owner_policy ON public.event_characters
  FOR ALL USING (
    EXISTS (
      SELECT 1
      FROM public.timeline_events e
      JOIN public.stories s ON s.id = e.story_id
      WHERE e.id = event_characters.event_id AND s.user_id = auth.uid()
    )
  ) WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.timeline_events e
      JOIN public.stories s ON s.id = e.story_id
      WHERE e.id = event_characters.event_id AND s.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS event_versions_story_owner_policy ON public.event_versions;
CREATE POLICY event_versions_story_owner_policy ON public.event_versions
  FOR ALL USING (
    EXISTS (
      SELECT 1
      FROM public.timeline_events e
      JOIN public.stories s ON s.id = e.story_id
      WHERE e.id = event_versions.event_id AND s.user_id = auth.uid()
    )
  ) WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.timeline_events e
      JOIN public.stories s ON s.id = e.story_id
      WHERE e.id = event_versions.event_id AND s.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS connections_story_owner_policy ON public.event_connections;
CREATE POLICY connections_story_owner_policy ON public.event_connections
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.stories s
      WHERE s.id = event_connections.story_id AND s.user_id = auth.uid()
    )
  ) WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.stories s
      WHERE s.id = event_connections.story_id AND s.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS boards_story_owner_policy ON public.narrative_boards;
CREATE POLICY boards_story_owner_policy ON public.narrative_boards
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.stories s
      WHERE s.id = narrative_boards.story_id AND s.user_id = auth.uid()
    )
  ) WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.stories s
      WHERE s.id = narrative_boards.story_id AND s.user_id = auth.uid()
    )
  );
