import { useLayoutEffect, useMemo } from 'react';
import type { WindowGeometry, WindowState } from '../types';
import { resolveLayoutWidth } from '../lib/viewport';

interface WidthSyncOptions {
  state: WindowState;
  defaultWidth: number;
  minWidth: number;
  center: boolean;
  onGeometryChange: (geometry: Partial<WindowGeometry>) => void;
}

/**
 * Resolve the width to paint (app default unless the user resized) and
 * self-correct the stored width when it drifts — e.g. after a viewport change.
 * Centered windows are driven by useWindowCenterLayout instead, so they opt out.
 */
export function useWindowWidthSync({
  state,
  defaultWidth,
  minWidth,
  center,
  onGeometryChange,
}: WidthSyncOptions): number {
  const layoutWidth = useMemo(
    () =>
      resolveLayoutWidth(defaultWidth, { width: state.width, userSized: state.userSized }, minWidth),
    [defaultWidth, state.width, state.userSized, minWidth],
  );

  useLayoutEffect(() => {
    if (center || !state.open || state.minimized || state.maximized || state.userSized) return;
    if (Math.abs(state.width - layoutWidth) <= 1) return;
    onGeometryChange({ width: layoutWidth });
  }, [
    center,
    state.open,
    state.minimized,
    state.maximized,
    state.userSized,
    state.width,
    layoutWidth,
    onGeometryChange,
  ]);

  return layoutWidth;
}
