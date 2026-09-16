import { useMemo } from 'react';

/**
 * Computes a topological order (BFS-based DAG rank) for events given their connections.
 * Replaces the duplicated algorithm that existed in TimelineCanvas and SidebarLore.
 *
 * @param {Array} events - Array of event objects with an `id` field.
 * @param {Array} connections - Array of connection objects with `source_event_id` and `target_event_id`.
 * @returns {Map<string, number>} Map from event id to its computed order level (1-based).
 */
export function useEventOrder(events, connections) {
  return useMemo(() => {
    const orderMap = new Map();
    if (!events?.length) return orderMap;

    const inDegree = new Map();
    const adjacency = new Map();

    events.forEach((ev) => {
      inDegree.set(ev.id, 0);
      adjacency.set(ev.id, []);
    });

    (connections || []).forEach((conn) => {
      if (inDegree.has(conn.target_event_id)) {
        inDegree.set(conn.target_event_id, (inDegree.get(conn.target_event_id) || 0) + 1);
      }
      if (adjacency.has(conn.source_event_id)) {
        adjacency.get(conn.source_event_id).push(conn.target_event_id);
      }
    });

    const queue = [];
    events.forEach((ev) => {
      if ((inDegree.get(ev.id) || 0) === 0) {
        queue.push({ id: ev.id, level: 1 });
      }
    });

    while (queue.length > 0) {
      const { id, level } = queue.shift();
      const newLevel = Math.max(orderMap.get(id) || 1, level);
      orderMap.set(id, newLevel);

      (adjacency.get(id) || []).forEach((targetId) => {
        const targetLevel = newLevel + 1;
        if (!orderMap.has(targetId) || orderMap.get(targetId) < targetLevel) {
          orderMap.set(targetId, targetLevel);
          queue.push({ id: targetId, level: targetLevel });
        }
      });
    }

    // Fallback for disconnected nodes
    events.forEach((ev, idx) => {
      if (!orderMap.has(ev.id)) {
        orderMap.set(ev.id, Number(ev.order_index) || (idx + 1));
      }
    });

    return orderMap;
  }, [events, connections]);
}
