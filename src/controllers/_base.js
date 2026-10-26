/**
 * Base común de los controladores: gestiona el indicador de carga y convierte
 * cualquier fallo en `{ data, error }`, de modo que la UI nunca recibe excepciones.
 *
 * run(task, setLoading)
 *   `task` es una promesa (o función que la devuelve) que resuelve el dato directamente
 *   y lanza ante error. Es el formato de los services.
 *
 * runQuery(task, setLoading, { fallback })
 *   `task` resuelve `{ data, error }` (formato de los repositories / Supabase).
 *   `fallback` es el valor de `data` cuando hay error (por defecto null).
 */
import { supabase } from '../utils/supabaseClient';

// Errores de sesión vencida: Supabase responde 401 / "JWT expired" / PGRST301
const isAuthError = (error) =>
  error?.status === 401 ||
  error?.code === 'PGRST301' ||
  /jwt|token.*expired|invalid claim/i.test(error?.message || '');

// Renueva la sesión una sola vez (si el refresh token ya no sirve, onAuthStateChange cerrará la sesión)
let refreshing = null;
const refreshSessionOnce = () => {
  if (!refreshing) {
    refreshing = supabase.auth.refreshSession().catch(() => null).finally(() => { refreshing = null; });
  }
  return refreshing;
};

export const createController = (name) => {
  const report = (error) => console.error(`[${name} Error]:`, error);

  const execute = async (task, setLoading, onResult) => {
    if (setLoading) setLoading(true);
    const attempt = async () => onResult(await (typeof task === 'function' ? task() : task));
    try {
      try {
        return await attempt();
      } catch (error) {
        // Tras apagar/dormir el equipo el token guardado puede estar vencido: renovar y reintentar una vez
        if (!isAuthError(error) || typeof task !== 'function') throw error;
        await refreshSessionOnce();
        return await attempt();
      }
    } catch (error) {
      report(error);
      return { data: null, error };
    } finally {
      if (setLoading) setLoading(false);
    }
  };

  const run = (task, setLoading) => execute(task, setLoading, (data) => ({ data, error: null }));

  const runQuery = async (task, setLoading, { fallback = null } = {}) => {
    const result = await execute(task, setLoading, (response) => {
      if (response?.error) throw response.error;
      return { data: response?.data ?? null, error: null };
    });
    return result.error ? { data: fallback, error: result.error } : result;
  };

  return { run, runQuery };
};
