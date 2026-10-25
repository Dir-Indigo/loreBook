-- ============================================================================
-- PROPUESTA (NO APLICADA) — Roles y acceso de SuperAdmin en LoreBook
-- Revisar contra el esquema real de Supabase antes de ejecutar. No está en
-- db-migrations/ a propósito: el proyecto pidió no modificar la base de datos
-- durante la implementación de mejoras.
-- ============================================================================
--
-- PROBLEMA 1 (crítico). db-migrations/workspace-foundation.sql define:
--     CREATE POLICY profiles_owner_policy ON public.profiles
--       FOR ALL USING (id = auth.uid()) WITH CHECK (id = auth.uid());
--   Eso permite a cualquier usuario autenticado hacer, desde el navegador:
--     supabase.from('profiles').update({ role: 'superadmin' }).eq('id', <su id>)
--   Es decir, auto-promoverse a SuperAdmin.
--
-- PROBLEMA 2. Con esa política, un SuperAdmin solo ve su propio perfil y solo
--   cuenta sus propias historias/personajes/eventos: el panel /admin no puede
--   mostrar la plataforma completa.
--
-- PROBLEMA 3. El registro envía `role` en user_metadata (AuthContext.signUp).
--   Verificar que el trigger que crea la fila en profiles lo IGNORE.
-- ============================================================================

-- 1) Helpers. SECURITY DEFINER evita la recursión de RLS al consultar profiles
--    desde sus propias políticas.
CREATE OR REPLACE FUNCTION public.current_user_role()
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid()
$$;

CREATE OR REPLACE FUNCTION public.is_superadmin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(public.current_user_role() = 'superadmin', false)
$$;

-- 2) profiles: cada usuario lee y edita lo suyo, pero NO puede cambiar su rol.
DROP POLICY IF EXISTS profiles_owner_policy ON public.profiles;

CREATE POLICY profiles_select_own_or_admin ON public.profiles
  FOR SELECT USING (id = auth.uid() OR public.is_superadmin());

CREATE POLICY profiles_insert_own ON public.profiles
  FOR INSERT WITH CHECK (id = auth.uid() AND role = 'writer');

CREATE POLICY profiles_update_own_without_role ON public.profiles
  FOR UPDATE
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid() AND role = public.current_user_role());

CREATE POLICY profiles_update_admin ON public.profiles
  FOR UPDATE
  USING (public.is_superadmin())
  WITH CHECK (public.is_superadmin());

-- 3) Lectura global para el panel (solo conteos y listados de administración).
--    Las políticas permisivas se combinan con OR: no restan acceso a los dueños.
CREATE POLICY stories_select_admin ON public.stories
  FOR SELECT USING (public.is_superadmin());

CREATE POLICY characters_select_admin ON public.characters
  FOR SELECT USING (public.is_superadmin());

CREATE POLICY timeline_events_select_admin ON public.timeline_events
  FOR SELECT USING (public.is_superadmin());

-- 4) Trigger de alta de usuario: debe asignar siempre 'writer'.
--    Ejemplo (adaptar al nombre/columnas reales del trigger existente):
--
--    CREATE OR REPLACE FUNCTION public.handle_new_user()
--    RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
--    BEGIN
--      INSERT INTO public.profiles (id, email, full_name, role)
--      VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'full_name', 'writer');
--      RETURN NEW;
--    END;
--    $$;
--
--    El primer SuperAdmin se crea manualmente:
--    UPDATE public.profiles SET role = 'superadmin' WHERE email = '<correo>';

-- 5) Verificación sugerida tras aplicar (como usuario normal, desde el SQL editor
--    con `SET ROLE authenticated` y un `request.jwt.claims` de prueba):
--    - UPDATE profiles SET role = 'superadmin' WHERE id = auth.uid();  -> debe fallar / 0 filas
--    - SELECT count(*) FROM profiles;                                   -> solo 1
--    Como SuperAdmin:
--    - SELECT count(*) FROM profiles;                                   -> todos
