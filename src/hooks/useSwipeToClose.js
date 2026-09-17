import { useRef, useEffect } from 'react';

/**
 * useSwipeToClose
 *
 * Attaches touch event listeners to `ref` and calls `onClose` when the user
 * performs a horizontal swipe that exceeds `threshold` pixels.
 *
 * @param {React.RefObject} ref        - Ref to the container element
 * @param {Function}        onClose    - Callback to fire when swipe is detected
 * @param {'left'|'right'}  direction  - The swipe direction that triggers onClose
 *                                       'left'  → swiping leftward  (closing a right-side panel)
 *                                       'right' → swiping rightward (closing a left-side panel)
 * @param {number}          threshold  - Minimum pixel distance (default 60)
 * @param {boolean}         enabled    - Whether the hook is active (default true)
 */
export function useSwipeToClose(ref, onClose, direction = 'left', threshold = 60, enabled = true) {
  const touchStart = useRef(null);

  useEffect(() => {
    if (!enabled) return;
    const el = ref?.current;
    if (!el) return;

    const handleTouchStart = (e) => {
      const touch = e.touches[0];
      touchStart.current = { x: touch.clientX, y: touch.clientY };
    };

    const handleTouchEnd = (e) => {
      if (!touchStart.current) return;
      const touch = e.changedTouches[0];
      const deltaX = touch.clientX - touchStart.current.x;
      const deltaY = touch.clientY - touchStart.current.y;

      // Only count as horizontal swipe if horizontal movement dominates
      if (Math.abs(deltaX) < Math.abs(deltaY)) {
        touchStart.current = null;
        return;
      }

      const isLeftSwipe  = deltaX < -threshold;
      const isRightSwipe = deltaX >  threshold;

      if (direction === 'left'  && isLeftSwipe)  onClose();
      if (direction === 'right' && isRightSwipe) onClose();

      touchStart.current = null;
    };

    el.addEventListener('touchstart', handleTouchStart, { passive: true });
    el.addEventListener('touchend',   handleTouchEnd,   { passive: true });

    return () => {
      el.removeEventListener('touchstart', handleTouchStart);
      el.removeEventListener('touchend',   handleTouchEnd);
    };
  }, [ref, onClose, direction, threshold, enabled]);
}
