import { useRef, useState, type PointerEvent as ReactPointerEvent, type RefObject } from 'react';

const DRAG_THRESHOLD = 4;

export interface MarqueeRect {
  left: number;
  top: number;
  width: number;
  height: number;
}

interface MarqueeDrag {
  pointerId: number;
  startX: number;
  startY: number;
  surfaceLeft: number;
  surfaceTop: number;
  moved: boolean;
}

interface UseMarqueeSelectionOptions {
  /** Live map of icon id → element, used for hit-testing the marquee box. */
  iconRefs: RefObject<Map<string, HTMLButtonElement>>;
  setSelection: (ids: string[]) => void;
  clearSelection: () => void;
  /** Fired on a plain (non-drag) click on the empty desktop. */
  onDesktopClick?: () => void;
}

interface MarqueeSurfaceHandlers {
  onPointerDown: (event: ReactPointerEvent) => void;
  onPointerMove: (event: ReactPointerEvent) => void;
  onPointerUp: (event: ReactPointerEvent) => void;
  onPointerCancel: (event: ReactPointerEvent) => void;
}

/**
 * Rubber-band selection on the desktop surface: drag to draw a marquee that
 * selects every icon it intersects; a plain click clears the selection and
 * notifies `onDesktopClick`. The surface element spreads `surfaceHandlers`.
 */
export function useMarqueeSelection({
  iconRefs,
  setSelection,
  clearSelection,
  onDesktopClick,
}: UseMarqueeSelectionOptions): {
  marquee: MarqueeRect | null;
  surfaceHandlers: MarqueeSurfaceHandlers;
} {
  const [marquee, setMarquee] = useState<MarqueeRect | null>(null);
  const marqueeDrag = useRef<MarqueeDrag | null>(null);

  function handlePointerDown(event: ReactPointerEvent) {
    if (event.button !== 0) return;
    const rect = event.currentTarget.getBoundingClientRect();
    marqueeDrag.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      surfaceLeft: rect.left,
      surfaceTop: rect.top,
      moved: false,
    };
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function handlePointerMove(event: ReactPointerEvent) {
    const drag = marqueeDrag.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    const dx = event.clientX - drag.startX;
    const dy = event.clientY - drag.startY;
    if (!drag.moved && Math.hypot(dx, dy) < DRAG_THRESHOLD) return;
    drag.moved = true;

    const left = Math.min(drag.startX, event.clientX);
    const top = Math.min(drag.startY, event.clientY);
    const right = Math.max(drag.startX, event.clientX);
    const bottom = Math.max(drag.startY, event.clientY);

    setMarquee({
      left: left - drag.surfaceLeft,
      top: top - drag.surfaceTop,
      width: right - left,
      height: bottom - top,
    });

    const hits: string[] = [];
    iconRefs.current.forEach((node, id) => {
      const r = node.getBoundingClientRect();
      const intersects = !(r.right < left || r.left > right || r.bottom < top || r.top > bottom);
      if (intersects) hits.push(id);
    });
    setSelection(hits);
  }

  function handlePointerUp(event: ReactPointerEvent) {
    const drag = marqueeDrag.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    if (!drag.moved) {
      clearSelection();
      onDesktopClick?.();
    }
    marqueeDrag.current = null;
    setMarquee(null);
  }

  return {
    marquee,
    surfaceHandlers: {
      onPointerDown: handlePointerDown,
      onPointerMove: handlePointerMove,
      onPointerUp: handlePointerUp,
      onPointerCancel: handlePointerUp,
    },
  };
}
