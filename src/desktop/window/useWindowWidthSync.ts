import { useLayoutEffect, useMemo } from 'react';
import type { WindowGeometry, WindowState } from '../types';
import { resolveLayoutWidth } from '../lib/viewport';
import { useViewportSize } from '../lib/useViewportSize';

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
  // Track the live viewport width so the painted width follows a desktop shrink:
  // resolveLayoutWidth needs a viewport signal in the memo deps, otherwise an
  // open, non-user-sized window keeps a width wider than the shrunken viewport.
  const { width: viewportWidth } = useViewportSize();
  const layoutWidth = useMemo(
    () =>
      resolveLayoutWidth(
        defaultWidth,
        { width: state.width, userSized: state.userSized },
        minWidth,
        viewportWidth,
      ),
    [defaultWidth, state.width, state.userSized, minWidth, viewportWidth],
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
