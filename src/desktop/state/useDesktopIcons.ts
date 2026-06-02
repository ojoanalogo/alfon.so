import { useCallback, useEffect, useMemo, useState } from 'react';
import type { DesktopIcon } from '@/config';

export interface IconPosition {
  x: number;
  y: number;
}

/** Default left-column layout, mirroring the original vertical icon stack. */
const BASE_X = 16;
const BASE_Y = 16;
/** Wrap to a new column after this many icons (keeps them inside short viewports). */
const MAX_ROWS_DESKTOP = 7;
const ROW_PITCH_DESKTOP = 84;
const COL_PITCH_DESKTOP = 96;
/** Approximate icon footprint on desktop, used for viewport clamping. */
const ICON_WIDTH_DESKTOP = 80;
const ICON_HEIGHT_DESKTOP = 72;
const EDGE_MARGIN = 8;
const TASKBAR_HEIGHT = 40;
const MOBILE_BREAKPOINT = 640;

function isMobileViewport(): boolean {
  return typeof window !== 'undefined' && window.innerWidth < MOBILE_BREAKPOINT;
}

function iconGridForViewport(): { maxRows: number; rowPitch: number; colPitch: number } {
  if (isMobileViewport()) {
    return { maxRows: 4, rowPitch: 100, colPitch: 100 };
  }
  return { maxRows: MAX_ROWS_DESKTOP, rowPitch: ROW_PITCH_DESKTOP, colPitch: COL_PITCH_DESKTOP };
}

function iconFootprint(): { width: number; height: number } {
  if (isMobileViewport()) {
    return { width: 96, height: 104 };
  }
  return { width: ICON_WIDTH_DESKTOP, height: ICON_HEIGHT_DESKTOP };
}

function defaultPositions(icons: DesktopIcon[]): Record<string, IconPosition> {
  const { maxRows, rowPitch, colPitch } = iconGridForViewport();
  const entries = icons.map((icon, index) => {
    const col = Math.floor(index / maxRows);
    const row = index % maxRows;
    return [icon.id, { x: BASE_X + col * colPitch, y: BASE_Y + row * rowPitch }] as const;
  });
  return Object.fromEntries(entries);
}

/** Keep an icon within the visible desktop area (only runs in the browser). */
function clampPosition(pos: IconPosition): IconPosition {
  if (typeof window === 'undefined') return pos;
  const { width: iconWidth, height: iconHeight } = iconFootprint();
  const maxX = Math.max(EDGE_MARGIN, window.innerWidth - iconWidth - EDGE_MARGIN);
  const maxY = Math.max(
    EDGE_MARGIN,
    window.innerHeight - TASKBAR_HEIGHT - iconHeight - EDGE_MARGIN,
  );
  return {
    x: Math.min(Math.max(pos.x, EDGE_MARGIN), maxX),
    y: Math.min(Math.max(pos.y, EDGE_MARGIN), maxY),
  };
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

  useEffect(() => {
    function relayout() {
      setPositions((prev) => {
        const visible = icons.filter((icon) => !deleted.has(icon.id) && !purged.has(icon.id));
        const baseline = defaultPositions(visible);
        const next: Record<string, IconPosition> = {};
        for (const icon of visible) {
          const current = prev[icon.id] ?? baseline[icon.id];
          next[icon.id] = clampPosition(current ?? baseline[icon.id]);
        }
        return next;
      });
    }
    window.addEventListener('resize', relayout);
    return () => window.removeEventListener('resize', relayout);
  }, [icons, deleted, purged]);

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
    setSelectedState(new Set([id]));
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
    setSelectedState(new Set(ids));
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
    setDeleted((prevDeleted) => {
      if (prevDeleted.size === 0) return prevDeleted;
      setPurged((prevPurged) => {
        const next = new Set(prevPurged);
        prevDeleted.forEach((id) => next.add(id));
        return next;
      });
      return new Set();
    });
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
