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
export const createController = (name) => {
  const report = (error) => console.error(`[${name} Error]:`, error);

  const execute = async (task, setLoading, onResult) => {
    if (setLoading) setLoading(true);
    try {
      return onResult(await (typeof task === 'function' ? task() : task));
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
