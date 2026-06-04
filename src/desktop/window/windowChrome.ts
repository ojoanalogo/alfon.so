import type { CSSProperties } from 'react';
import { resolveWindowHeightStyle } from '../lib/viewport';

export type WindowStatus = 'open' | 'closed' | 'minimized';

interface WindowChromeInput {
  /** Maximized for display purposes (lags `maximized` during the animation). */
  displayMaximized: boolean;
  posX: number;
  posY: number;
  layoutWidth: number;
  minWidth: number;
  height: number | null;
  defaultHeight?: number;
  minHeight?: number;
  zIndex: number;
  maximized: boolean;
  maximizeTransition: boolean;
  focused: boolean;
  windowClassName?: string;
  open: boolean;
  minimized: boolean;
}

export interface WindowChrome {
  style: CSSProperties;
  className: string;
  status: WindowStatus;
  /** Window is open and not minimized — pointer events + tab focus allowed. */
  interactive: boolean;
}

/** Derive the positioned style, class list, and status flags for a window shell. */
export function resolveWindowChrome({
  displayMaximized,
  posX,
  posY,
  layoutWidth,
  minWidth,
  height,
  defaultHeight,
  minHeight,
  zIndex,
  maximized,
  maximizeTransition,
  focused,
  windowClassName,
  open,
  minimized,
}: WindowChromeInput): WindowChrome {
  // Content-sized windows with a min-height floor still need the card to stretch
  // to that floor, otherwise the box (and its bottom resize handle) sits below
  // the visible card in empty space.
  const sized = height != null || maximized || (height == null && minHeight != null);

  const style: CSSProperties = displayMaximized
    ? {
        left: 0,
        top: 0,
        right: 0,
        bottom: 0,
        width: 'auto',
        height: 'auto',
        zIndex,
        transformOrigin: 'center center',
      }
    : {
        left: `${posX}px`,
        top: `${posY}px`,
        width: `${layoutWidth}px`,
        minWidth: `${minWidth}px`,
        ...resolveWindowHeightStyle(height, defaultHeight, minHeight),
        zIndex,
        transformOrigin: 'bottom center',
      };

  const className = [
    'desktop-window',
    sized && 'is-sized',
    maximized && 'desktop-window--expanded',
    maximizeTransition && 'desktop-window--maximize-transition',
    focused && 'is-focused',
    windowClassName,
  ]
    .filter(Boolean)
    .join(' ');

  const status: WindowStatus = !open ? 'closed' : minimized ? 'minimized' : 'open';

  return { style, className, status, interactive: open && !minimized };
}
