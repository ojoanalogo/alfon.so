import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { DesktopIcon } from '@/config';
import { clampBoxToWorkArea } from '../lib/geometry';
import { iconFootprint, iconPositionsForIcons } from '../lib/iconGrid';

export interface IconPosition {
  x: number;
  y: number;
}

function defaultPositions(icons: DesktopIcon[]): Record<string, IconPosition> {
  return iconPositionsForIcons(icons);
}

/** Keep an icon within the visible desktop area (only runs in the browser). */
function clampPosition(pos: IconPosition): IconPosition {
  if (typeof window === 'undefined') return pos;
  const { width, height } = iconFootprint(window.innerWidth);
  return clampBoxToWorkArea(pos.x, pos.y, width, height, window.innerWidth, window.innerHeight);
}

export interface DesktopIconsState {
  positions: Record<string, IconPosition>;
  selected: Set<string>;
  /** Icons removed from the desktop (in the trash or emptied). */
  deletedCount: number;
  visibleIcons: DesktopIcon[];
  /** Icons currently sitting in the trash (restorable). */
  trashedIcons: DesktopIcon[];
  trashedCount: number;
  isSelected: (id: string) => boolean;
  selectOnly: (id: string) => void;
  toggleSelection: (id: string) => void;
  setSelection: (ids: string[]) => void;
  clearSelection: () => void;
  /** Move the given icons by a delta from the supplied origin positions. */
  moveIcons: (origins: Record<string, IconPosition>, dx: number, dy: number) => void;
  deleteIcons: (ids: string[]) => void;
  /** Bring specific icons back from the trash to the desktop. */
  restoreIcons: (ids: string[]) => void;
  /** Permanently empty the trash (icons stay gone until reload). */
  emptyTrash: () => void;
  /** Bring back every removed icon (trash + emptied). */
  restoreAll: () => void;
}

export function useDesktopIcons(icons: DesktopIcon[]): DesktopIconsState {
  const [positions, setPositions] = useState<Record<string, IconPosition>>(() =>
    defaultPositions(icons),
  );
  const [selected, setSelectedState] = useState<Set<string>>(() => new Set());
  /** In the trash, restorable. */
  const [deleted, setDeleted] = useState<Set<string>>(() => new Set());
  /** Emptied from the trash — gone until reload. */
  const [purged, setPurged] = useState<Set<string>>(() => new Set());

  // Mirror the trash sets in refs so the resize relayout and emptyTrash can read
  // the latest values without re-subscribing the listener / nesting updaters.
  const deletedRef = useRef(deleted);
  deletedRef.current = deleted;
  const purgedRef = useRef(purged);
  purgedRef.current = purged;

  useEffect(() => {
    let raf = 0;
    function relayout() {
      raf = 0;
      setPositions((prev) => {
        const deleted = deletedRef.current;
        const purged = purgedRef.current;
        const visible = icons.filter((icon) => !deleted.has(icon.id) && !purged.has(icon.id));
        const baseline = defaultPositions(visible);
        const next: Record<string, IconPosition> = {};
        // Iterate every icon, not just the visible ones, so a trashed icon keeps
        // its custom position across a resize and lands there again on restore.
        for (const icon of icons) {
          const pos = prev[icon.id] ?? baseline[icon.id];
          if (pos) next[icon.id] = clampPosition(pos);
        }
        return next;
      });
    }
    // Coalesce resize bursts into one relayout per frame. Only `icons` belongs in
    // the deps — trash changes are read from refs, so a delete/restore/empty no
    // longer tears down and re-adds this global listener (or cancels a pending RAF).
    function schedule() {
      if (raf === 0) raf = requestAnimationFrame(relayout);
    }
    window.addEventListener('resize', schedule);
    return () => {
      if (raf !== 0) cancelAnimationFrame(raf);
      window.removeEventListener('resize', schedule);
    };
  }, [icons]);

  const visibleIcons = useMemo(
    () => icons.filter((icon) => !deleted.has(icon.id) && !purged.has(icon.id)),
    [icons, deleted, purged],
  );

  const trashedIcons = useMemo(
    () => icons.filter((icon) => deleted.has(icon.id)),
    [icons, deleted],
  );

  const isSelected = useCallback((id: string) => selected.has(id), [selected]);

  const selectOnly = useCallback((id: string) => {
    setSelectedState((prev) => (prev.size === 1 && prev.has(id) ? prev : new Set([id])));
  }, []);

  const toggleSelection = useCallback((id: string) => {
    setSelectedState((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const setSelection = useCallback((ids: string[]) => {
    setSelectedState((prev) =>
      prev.size === ids.length && ids.every((id) => prev.has(id)) ? prev : new Set(ids),
    );
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedState((prev) => (prev.size === 0 ? prev : new Set()));
  }, []);

  const moveIcons = useCallback((origins: Record<string, IconPosition>, dx: number, dy: number) => {
    setPositions((prev) => {
      const next = { ...prev };
      for (const [id, origin] of Object.entries(origins)) {
        next[id] = clampPosition({ x: origin.x + dx, y: origin.y + dy });
      }
      return next;
    });
  }, []);

  const deleteIcons = useCallback((ids: string[]) => {
    if (ids.length === 0) return;
    setDeleted((prev) => {
      const next = new Set(prev);
      ids.forEach((id) => next.add(id));
      return next;
    });
    setSelectedState((prev) => {
      if (prev.size === 0) return prev;
      const next = new Set(prev);
      ids.forEach((id) => next.delete(id));
      return next;
    });
  }, []);

  const restoreIcons = useCallback((ids: string[]) => {
    if (ids.length === 0) return;
    setDeleted((prev) => {
      if (prev.size === 0) return prev;
      const next = new Set(prev);
      ids.forEach((id) => next.delete(id));
      return next;
    });
  }, []);

  const emptyTrash = useCallback(() => {
    // Read the trashed set from a ref and issue two independent, pure updates,
    // rather than triggering setPurged as a side effect inside the setDeleted
    // updater (updaters may run twice, e.g. under StrictMode).
    const toPurge = deletedRef.current;
    if (toPurge.size === 0) return;
    setPurged((prev) => {
      const next = new Set(prev);
      toPurge.forEach((id) => next.add(id));
      return next;
    });
    setDeleted((prev) => (prev.size === 0 ? prev : new Set()));
  }, []);

  const restoreAll = useCallback(() => {
    setDeleted((prev) => (prev.size === 0 ? prev : new Set()));
    setPurged((prev) => (prev.size === 0 ? prev : new Set()));
  }, []);

  return {
    positions,
    selected,
    deletedCount: deleted.size + purged.size,
    visibleIcons,
    trashedIcons,
    trashedCount: deleted.size,
    isSelected,
    selectOnly,
    toggleSelection,
    setSelection,
    clearSelection,
    moveIcons,
    deleteIcons,
    restoreIcons,
    emptyTrash,
    restoreAll,
  };
}
