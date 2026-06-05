import { useEffect, useRef } from 'react';
import type { ResizeDirection, WindowGeometry, WindowState } from '../types';
import { MIN_HEIGHT, TASKBAR_HEIGHT } from '../lib/layoutConstants';
import { STATE_CLASS } from '../lib/stateClasses';

interface DragGesture {
  type: 'move' | 'resize';
  direction?: ResizeDirection;
  pointerId: number;
  startX: number;
  startY: number;
  origin: WindowGeometry;
  startHeight: number;
}

interface UseWindowGesturesOptions {
  state: WindowState;
  minWidth: number;
  rootRef: React.RefObject<HTMLElement | null>;
  onFocus: () => void;
  onGeometryChange: (geometry: Partial<WindowGeometry>) => void;
}

export function useWindowGestures({
  state,
  minWidth,
  rootRef,
  onFocus,
  onGeometryChange,
}: UseWindowGesturesOptions) {
  const gesture = useRef<DragGesture | null>(null);
  // Read the live callback/minWidth from a ref so the global pointer listeners
  // can keep `[]` deps — that way the effect cleanup runs only on real unmount,
  // letting us clear a stuck gesture without tearing down an in-flight drag when
  // these props change mid-gesture.
  const paramsRef = useRef({ minWidth, onGeometryChange });
  paramsRef.current = { minWidth, onGeometryChange };

  useEffect(() => {
    function handleMove(event: PointerEvent) {
      const active = gesture.current;
      if (!active || event.pointerId !== active.pointerId) return;
      const { minWidth, onGeometryChange } = paramsRef.current;

      const dx = event.clientX - active.startX;
      const dy = event.clientY - active.startY;
      const { origin } = active;

      if (active.type === 'move') {
        const maxX = window.innerWidth - 48;
        const maxY = window.innerHeight - TASKBAR_HEIGHT - 8;
        const nextX = Math.min(Math.max(origin.x + dx, -origin.width + 96), maxX);
        const nextY = Math.min(Math.max(origin.y + dy, 0), maxY);
        onGeometryChange({ x: nextX, y: nextY });
        return;
      }

      if (!active.direction) return;
      const dir = active.direction;
      let { x, y, width } = origin;
      let height = active.startHeight;
      const contentSized = origin.height == null;

      if (dir.includes('e')) {
        width = Math.max(minWidth, origin.width + dx);
      }
      if (dir.includes('w')) {
        const proposed = Math.max(minWidth, origin.width - dx);
        x = origin.x + (origin.width - proposed);
        width = proposed;
      }
      if (dir.includes('s')) {
        height = Math.max(MIN_HEIGHT, active.startHeight + dy);
      }
      if (dir.includes('n')) {
        const bottom = origin.y + active.startHeight;
        let proposed = Math.max(MIN_HEIGHT, active.startHeight - dy);
        // Never let the top edge cross the viewport top — the titlebar is the only
        // move handle, so a window dragged above y=0 would become unmovable. Pin the
        // top at 0 and grow the height down to the (fixed) bottom edge instead.
        if (bottom - proposed < 0) proposed = bottom;
        y = bottom - proposed;
        height = proposed;
      }

      const affectsHeight = dir.includes('n') || dir.includes('s');
      const patch: Partial<WindowGeometry> = { x, y, width };
      if (affectsHeight || !contentSized) {
        patch.height = height;
      }
      onGeometryChange(patch);
    }

    function handleUp(event: PointerEvent) {
      const active = gesture.current;
      if (!active || event.pointerId !== active.pointerId) return;
      gesture.current = null;
      document.body.classList.remove(STATE_CLASS.windowGesturing);
    }

    window.addEventListener('pointermove', handleMove);
    window.addEventListener('pointerup', handleUp);
    window.addEventListener('pointercancel', handleUp);
    return () => {
      window.removeEventListener('pointermove', handleMove);
      window.removeEventListener('pointerup', handleUp);
      window.removeEventListener('pointercancel', handleUp);
      // If the window unmounts mid-gesture (e.g. closed via the taskbar), the
      // pointerup that would clear this class never arrives — clear it here so it
      // doesn't stay stuck on <body> for the rest of the session.
      if (gesture.current) {
        gesture.current = null;
        document.body.classList.remove(STATE_CLASS.windowGesturing);
      }
    };
  }, []);

  function measuredHeight(): number {
    if (state.height != null) return state.height;
    return rootRef.current?.getBoundingClientRect().height ?? MIN_HEIGHT;
  }

  /** Inline width can lag behind the laid-out box when min-width/content sizing applies. */
  function measuredWidth(): number {
    const rect = rootRef.current?.getBoundingClientRect();
    if (rect && rect.width > 0) return Math.round(rect.width);
    return state.width;
  }

  function startMove(event: React.PointerEvent) {
    if (event.button !== 0 || state.maximized) return;
    onFocus();
    gesture.current = {
      type: 'move',
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      origin: { x: state.x, y: state.y, width: state.width, height: state.height },
      startHeight: measuredHeight(),
    };
    document.body.classList.add(STATE_CLASS.windowGesturing);
    event.preventDefault();
  }

  function startResize(event: React.PointerEvent, direction: ResizeDirection) {
    if (event.button !== 0 || state.maximized) return;
    onFocus();
    const width = measuredWidth();
    gesture.current = {
      type: 'resize',
      direction,
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      origin: { x: state.x, y: state.y, width, height: state.height },
      startHeight: measuredHeight(),
    };
    document.body.classList.add(STATE_CLASS.windowGesturing);
    event.preventDefault();
    event.stopPropagation();
  }

  return { startMove, startResize };
}
