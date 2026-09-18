-- Custom Character Archetypes Migration
-- Enables authors to create custom character archetypes per story in addition to standard ones

CREATE TABLE IF NOT EXISTS public.character_archetypes (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  story_id uuid NOT NULL,
  name text NOT NULL,
  color text DEFAULT '#8c6d53'::text,
  description text,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT character_archetypes_pkey PRIMARY KEY (id),
  CONSTRAINT character_archetypes_story_id_fkey FOREIGN KEY (story_id) REFERENCES public.stories(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS character_archetypes_story_idx 
  ON public.character_archetypes (story_id, created_at);

ALTER TABLE public.character_archetypes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS character_archetypes_story_owner_policy ON public.character_archetypes;
CREATE POLICY character_archetypes_story_owner_policy ON public.character_archetypes
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.stories s
      WHERE s.id = character_archetypes.story_id AND s.user_id = auth.uid()
    )
  ) WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.stories s
      WHERE s.id = character_archetypes.story_id AND s.user_id = auth.uid()
    )
  );
