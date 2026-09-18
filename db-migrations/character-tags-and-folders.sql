-- Character Tags and Folders Migration
-- Enables custom story-level character tags and hierarchical character folders (with default root folder 'Principal')

CREATE TABLE IF NOT EXISTS public.character_folders (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  story_id uuid NOT NULL,
  parent_folder_id uuid,
  name character varying NOT NULL DEFAULT 'Principal'::character varying,
  description text,
  color text DEFAULT '#8c6d53'::text,
  position integer DEFAULT 0,
  is_default boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT character_folders_pkey PRIMARY KEY (id),
  CONSTRAINT character_folders_story_id_fkey FOREIGN KEY (story_id) REFERENCES public.stories(id) ON DELETE CASCADE,
  CONSTRAINT character_folders_parent_folder_id_fkey FOREIGN KEY (parent_folder_id) REFERENCES public.character_folders(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS public.character_tags (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  story_id uuid NOT NULL,
  name text NOT NULL,
  color text DEFAULT '#8c6d53'::text,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT character_tags_pkey PRIMARY KEY (id),
  CONSTRAINT character_tags_story_id_fkey FOREIGN KEY (story_id) REFERENCES public.stories(id) ON DELETE CASCADE
);

ALTER TABLE public.characters 
ADD COLUMN IF NOT EXISTS folder_id uuid REFERENCES public.character_folders(id) ON DELETE SET NULL;

ALTER TABLE public.characters
ADD COLUMN IF NOT EXISTS custom_tag_ids uuid[] DEFAULT '{}'::uuid[];

CREATE INDEX IF NOT EXISTS character_folders_story_parent_idx 
  ON public.character_folders (story_id, parent_folder_id, position, created_at);

CREATE INDEX IF NOT EXISTS character_tags_story_idx 
  ON public.character_tags (story_id, created_at);

CREATE INDEX IF NOT EXISTS characters_folder_idx 
  ON public.characters (folder_id);

ALTER TABLE public.character_folders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.character_tags ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS character_folders_story_owner_policy ON public.character_folders;
CREATE POLICY character_folders_story_owner_policy ON public.character_folders
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.stories s
      WHERE s.id = character_folders.story_id AND s.user_id = auth.uid()
    )
  ) WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.stories s
      WHERE s.id = character_folders.story_id AND s.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS character_tags_story_owner_policy ON public.character_tags;
CREATE POLICY character_tags_story_owner_policy ON public.character_tags
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.stories s
      WHERE s.id = character_tags.story_id AND s.user_id = auth.uid()
    )
  ) WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.stories s
      WHERE s.id = character_tags.story_id AND s.user_id = auth.uid()
    )
  );
