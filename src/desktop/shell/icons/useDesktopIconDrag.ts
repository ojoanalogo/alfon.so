import { useEffect, useRef, useState, type RefObject } from 'react';
import type { IconPosition } from '../../state/useDesktopIcons';
import {
  computeIconDragMotion,
  easeOutCubic,
  ICON_DRAG_RAMP_IN_MS,
  ICON_DRAG_RAMP_OUT_MS,
} from './iconDragTransform';
import { isPointerOverTrash } from './trashDrop';

const DRAG_THRESHOLD = 2;
const BEND_SMOOTH = 0.45;
const WOBBLE_SMOOTH = 0.78;

export interface IconDragState {
  tiltX: number;
  tiltY: number;
  /** 0–1 ease-in/out for scale, tilt, and skew */
  ramp: number;
  draggingIds: ReadonlySet<string>;
}

interface IconDrag {
  id: string;
  pointerId: number;
  startX: number;
  startY: number;
  lastX: number;
  lastY: number;
  origins: Record<string, IconPosition>;
  moved: boolean;
  motionStart: number;
  bendX: number;
  bendY: number;
  wobbleX: number;
  wobbleY: number;
  tiltX: number;
  tiltY: number;
}

interface ReleaseAnimation {
  tiltX: number;
  tiltY: number;
  draggingIds: Set<string>;
  releaseStart: number;
}

interface UseDesktopIconDragOptions {
  positions: Record<string, IconPosition>;
  selected: Set<string>;
  selectOnly: (id: string) => void;
  moveIcons: (origins: Record<string, IconPosition>, dx: number, dy: number) => void;
  deleteIcons: (ids: string[]) => void;
  trashRef: RefObject<HTMLElement | null>;
  suppressTrashClickRef: RefObject<boolean>;
}

function prefersReducedMotion(): boolean {
  return (
    typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );
}

export function useDesktopIconDrag({
  positions,
  selected,
  selectOnly,
  moveIcons,
  deleteIcons,
  trashRef,
  suppressTrashClickRef,
}: UseDesktopIconDragOptions) {
  const dragRef = useRef<IconDrag | null>(null);
  const releaseRef = useRef<ReleaseAnimation | null>(null);
  const rafRef = useRef(0);
  const suppressClickRef = useRef(false);
  const overTrashRef = useRef(false);
  const snapshotRef = useRef({
    positions,
    selected,
    selectOnly,
    moveIcons,
    deleteIcons,
    trashRef,
    suppressTrashClickRef,
  });
  snapshotRef.current = {
    positions,
    selected,
    selectOnly,
    moveIcons,
    deleteIcons,
    trashRef,
    suppressTrashClickRef,
  };

  const [visual, setVisual] = useState<IconDragState>({
    tiltX: 0,
    tiltY: 0,
    ramp: 0,
    draggingIds: new Set(),
  });

  useEffect(() => {
    function rampIn(motionStart: number, now: number): number {
      if (prefersReducedMotion()) return 1;
      const t = Math.min(1, (now - motionStart) / ICON_DRAG_RAMP_IN_MS);
      return easeOutCubic(t);
    }

    function rampOut(releaseStart: number, now: number): number {
      if (prefersReducedMotion()) return 0;
      const t = Math.min(1, (now - releaseStart) / ICON_DRAG_RAMP_OUT_MS);
      return 1 - easeOutCubic(t);
    }

    function publishVisual(tiltX: number, tiltY: number, ramp: number, draggingIds: Set<string>) {
      setVisual({
        tiltX,
        tiltY,
        ramp,
        draggingIds,
      });
    }

    function tick(now: number) {
      rafRef.current = 0;
      const release = releaseRef.current;

      if (release) {
        const ramp = rampOut(release.releaseStart, now);
        publishVisual(release.tiltX, release.tiltY, ramp, release.draggingIds);
        if (ramp <= 0) {
          releaseRef.current = null;
          publishVisual(0, 0, 0, new Set());
          return;
        }
        scheduleFrame();
        return;
      }

      const drag = dragRef.current;
      if (!drag?.moved) return;

      const ramp = rampIn(drag.motionStart, now);
      publishVisual(drag.tiltX, drag.tiltY, ramp, new Set(Object.keys(drag.origins)));
      scheduleFrame();
    }

    function scheduleFrame() {
      if (rafRef.current) return;
      rafRef.current = requestAnimationFrame(tick);
    }

    function updateTilt(drag: IconDrag, event: PointerEvent) {
      const motion = computeIconDragMotion(
        drag.startX,
        drag.startY,
        event.clientX,
        event.clientY,
        drag.lastX,
        drag.lastY,
      );
      drag.lastX = event.clientX;
      drag.lastY = event.clientY;

      drag.bendX = drag.bendX * (1 - BEND_SMOOTH) + motion.bendX * BEND_SMOOTH;
      drag.bendY = drag.bendY * (1 - BEND_SMOOTH) + motion.bendY * BEND_SMOOTH;
      drag.wobbleX = drag.wobbleX * (1 - WOBBLE_SMOOTH) + motion.wobbleX * WOBBLE_SMOOTH;
      drag.wobbleY = drag.wobbleY * (1 - WOBBLE_SMOOTH) + motion.wobbleY * WOBBLE_SMOOTH;
      drag.tiltX = drag.bendX + drag.wobbleX;
      drag.tiltY = drag.bendY + drag.wobbleY;
    }

    function handleMove(event: PointerEvent) {
      const drag = dragRef.current;
      if (!drag || event.pointerId !== drag.pointerId) return;

      const dx = event.clientX - drag.startX;
      const dy = event.clientY - drag.startY;
      if (!drag.moved && Math.hypot(dx, dy) < DRAG_THRESHOLD) return;

      const {
        positions: pos,
        selected: sel,
        selectOnly: select,
        moveIcons: move,
      } = snapshotRef.current;

      if (!drag.moved) {
        drag.moved = true;
        drag.motionStart = performance.now();
        if (!sel.has(drag.id)) {
          select(drag.id);
          const origin = pos[drag.id];
          if (origin) drag.origins = { [drag.id]: origin };
        }
        document.body.classList.add('is-window-gesturing');
        publishVisual(0, 0, 0, new Set(Object.keys(drag.origins)));
        scheduleFrame();
      }

      updateTilt(drag, event);
      move(drag.origins, dx, dy);
      scheduleFrame();

      const { trashRef: trash } = snapshotRef.current;
      const overTrash = isPointerOverTrash(event.clientX, event.clientY, trash.current);
      if (overTrash !== overTrashRef.current) {
        overTrashRef.current = overTrash;
        document.body.classList.toggle('is-trash-drop-target', overTrash);
      }
    }

    /** Single end-of-drag reset shared by every termination path. */
    function teardown() {
      document.body.classList.remove('is-window-gesturing', 'is-trash-drop-target');
      overTrashRef.current = false;
      dragRef.current = null;
    }

    function endDrag(event: PointerEvent) {
      const drag = dragRef.current;
      if (!drag || event.pointerId !== drag.pointerId) return;

      const {
        trashRef: trash,
        deleteIcons: remove,
        suppressTrashClickRef: suppressTrash,
      } = snapshotRef.current;

      if (drag.moved) {
        suppressClickRef.current = true;

        const droppedOnTrash = isPointerOverTrash(event.clientX, event.clientY, trash.current);
        if (droppedOnTrash) {
          remove(Object.keys(drag.origins));
          suppressTrash.current = true;
          teardown();
          publishVisual(0, 0, 0, new Set());
          return;
        }

        const released = {
          tiltX: drag.tiltX,
          tiltY: drag.tiltY,
          draggingIds: new Set(Object.keys(drag.origins)),
          releaseStart: performance.now(),
        };
        teardown();
        releaseRef.current = released;
        scheduleFrame();
        return;
      }

      teardown();
      publishVisual(0, 0, 0, new Set());
    }

    window.addEventListener('pointermove', handleMove);
    window.addEventListener('pointerup', endDrag);
    window.addEventListener('pointercancel', endDrag);
    return () => {
      window.removeEventListener('pointermove', handleMove);
      window.removeEventListener('pointerup', endDrag);
      window.removeEventListener('pointercancel', endDrag);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  function startDrag(
    event: React.PointerEvent,
    iconId: string,
    origins: Record<string, IconPosition>,
  ) {
    if (event.button !== 0 || Object.keys(origins).length === 0) return;
    event.preventDefault();
    event.stopPropagation();

    releaseRef.current = null;

    dragRef.current = {
      id: iconId,
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      lastX: event.clientX,
      lastY: event.clientY,
      origins,
      moved: false,
      motionStart: 0,
      bendX: 0,
      bendY: 0,
      wobbleX: 0,
      wobbleY: 0,
      tiltX: 0,
      tiltY: 0,
    };
  }

  function consumeSuppressedClick(): boolean {
    if (!suppressClickRef.current) return false;
    suppressClickRef.current = false;
    return true;
  }

  return { visual, startDrag, consumeSuppressedClick };
}
