import { useLayoutEffect, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { motion, useReducedMotion, type Variants } from 'framer-motion';
import type { ResizeDirection, WindowGeometry, WindowState } from '../types';
import { MIN_WIDTH } from '../state/useWindowManager';
import { resolveLayoutWidth } from '../lib/viewport';
import WindowControls from './WindowControls';
import WindowTitlebar from './WindowTitlebar';
import { useWindowGestures } from './useWindowGestures';
import { useWindowCenterLayout } from './useWindowCenterLayout';
import { BORDER_DEFAULT } from '@/styles/tokens';

const RESIZE_DIRECTIONS: ResizeDirection[] = ['n', 's', 'e', 'w', 'ne', 'nw', 'se', 'sw'];

const CARD_CLASS = `desktop-window__card border ${BORDER_DEFAULT} p-0 font-mono text-sm overflow-hidden`;

export interface WindowProps {
  state: WindowState;
  title: string;
  focused: boolean;
  onFocus: () => void;
  onClose: () => void;
  onMinimize: () => void;
  onToggleMaximize: () => void;
  onGeometryChange: (geometry: Partial<WindowGeometry>) => void;
  minWidth?: number;
  defaultWidth: number;
  defaultHeight?: number;
  /** Floor height when the window is content-sized (`state.height === null`). */
  minHeight?: number;
  children: ReactNode;
  bodyClassName?: string;
  /** Replaces the default title text in the titlebar drag region. */
  titleContent?: ReactNode;
  windowClassName?: string;
  /** When true, window is kept centered from its measured on-screen box. */
  center?: boolean;
}

export default function Window({
  state,
  title,
  focused,
  onFocus,
  onClose,
  onMinimize,
  onToggleMaximize,
  onGeometryChange,
  minWidth = MIN_WIDTH,
  defaultWidth,
  defaultHeight,
  minHeight,
  children,
  bodyClassName,
  titleContent,
  windowClassName,
  center = false,
}: WindowProps) {
  const rootRef = useRef<HTMLElement | null>(null);
  const prevMaximizedRef = useRef(state.maximized);
  const [maximizeTransition, setMaximizeTransition] = useState(false);
  const [displayMaximized, setDisplayMaximized] = useState(state.maximized);
  const prefersReduced = useReducedMotion();
  const canAnimateMaximize = state.open && !state.minimized && !prefersReduced;

  if (!canAnimateMaximize && displayMaximized !== state.maximized) {
    setDisplayMaximized(state.maximized);
  }

  useLayoutEffect(() => {
    if (!canAnimateMaximize) {
      prevMaximizedRef.current = state.maximized;
      return;
    }
    if (state.maximized === prevMaximizedRef.current) return;
    prevMaximizedRef.current = state.maximized;

    const frame = requestAnimationFrame(() => {
      setDisplayMaximized(state.maximized);
      setMaximizeTransition(true);
    });
    const timer = window.setTimeout(() => setMaximizeTransition(false), 360);
    return () => {
      cancelAnimationFrame(frame);
      window.clearTimeout(timer);
    };
  }, [state.maximized, canAnimateMaximize]);

  const layoutWidth = useMemo(
    () =>
      resolveLayoutWidth(
        defaultWidth,
        { width: state.width, userSized: state.userSized },
        minWidth,
      ),
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

  const { markUserPositioned, displayX, displayY } = useWindowCenterLayout({
    rootRef,
    enabled: center && state.open && !state.minimized && !state.maximized,
    x: state.x,
    y: state.y,
    width: layoutWidth,
    onGeometryChange,
  });

  const posX = center ? displayX : state.x;
  const posY = center ? displayY : state.y;

  const gestureState = useMemo(() => {
    const width = state.width === layoutWidth ? state.width : layoutWidth;
    if (center) {
      return { ...state, x: displayX, y: displayY, width };
    }
    return { ...state, width };
  }, [state, layoutWidth, center, displayX, displayY]);

  const { startMove, startResize } = useWindowGestures({
    state: gestureState,
    minWidth,
    rootRef,
    onFocus,
    onGeometryChange,
  });

  function handleMoveStart(event: React.PointerEvent) {
    markUserPositioned();
    startMove(event);
  }

  function measureGenieTarget(): { dx: number; dy: number } {
    const el = rootRef.current;
    if (!el) return { dx: 0, dy: 360 };
    const rect = el.getBoundingClientRect();
    const winCenterX = rect.left + rect.width / 2;
    const winBottomY = rect.top + rect.height;
    const tab = document.querySelector(`[data-taskbar-window="${state.id}"]`);
    if (tab) {
      const tabRect = tab.getBoundingClientRect();
      return {
        dx: tabRect.left + tabRect.width / 2 - winCenterX,
        dy: tabRect.top + tabRect.height / 2 - winBottomY,
      };
    }
    return { dx: 0, dy: window.innerHeight - winBottomY + 48 };
  }

  const variants: Variants = {
    open: {
      opacity: 1,
      scaleX: 1,
      scaleY: 1,
      x: 0,
      y: 0,
      transition: prefersReduced
        ? { duration: 0 }
        : { type: 'spring', stiffness: 460, damping: 34, mass: 0.85 },
    },
    closed: {
      opacity: 0,
      scaleX: 0.9,
      scaleY: 0.9,
      x: 0,
      y: 0,
      transition: prefersReduced ? { duration: 0 } : { duration: 0.16, ease: 'easeIn' },
    },
    minimized: () => {
      const target = measureGenieTarget();
      return {
        opacity: 0,
        scaleX: 0.12,
        scaleY: 0.02,
        x: target.dx,
        y: target.dy,
        transition: prefersReduced
          ? { duration: 0 }
          : { duration: 0.42, ease: [0.4, 0.05, 0.25, 1] },
      };
    },
  };

  const status = !state.open ? 'closed' : state.minimized ? 'minimized' : 'open';
  const interactive = state.open && !state.minimized;
  // Content-sized windows with a min-height floor still need the card to stretch
  // to that floor, otherwise the box (and its bottom resize handle) sits below
  // the visible card in empty space.
  const sized = state.height != null || state.maximized || (state.height == null && minHeight != null);

  const style: React.CSSProperties = displayMaximized
    ? {
        left: 0,
        top: 0,
        right: 0,
        bottom: 0,
        width: 'auto',
        height: 'auto',
        zIndex: state.zIndex,
        transformOrigin: 'center center',
      }
    : {
        left: `${posX}px`,
        top: `${posY}px`,
        width: `${layoutWidth}px`,
        minWidth: `${minWidth}px`,
        minHeight: state.height == null && minHeight != null ? minHeight : undefined,
        height:
          state.height != null
            ? `${state.height}px`
            : defaultHeight != null
              ? `${defaultHeight}px`
              : undefined,
        zIndex: state.zIndex,
        transformOrigin: 'bottom center',
      };

  const className = [
    'desktop-window',
    sized && 'is-sized',
    state.maximized && 'desktop-window--expanded',
    maximizeTransition && 'desktop-window--maximize-transition',
    focused && 'is-focused',
    windowClassName,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <motion.section
      ref={rootRef}
      className={className}
      data-window-id={state.id}
      variants={variants}
      initial={false}
      animate={status}
      aria-hidden={!interactive}
      inert={!interactive}
      style={style}
      onPointerDown={() => onFocus()}
    >
      <div className={CARD_CLASS}>
        <div className="window-titlebar flex h-[1.875rem] max-h-[1.875rem] min-h-[1.875rem] items-center overflow-hidden rounded-t-[inherit] border-b border-[color:var(--color-hairline-strong)] shadow-[inset_0_-1px_0_rgb(255_255_255/0.45)] dark:border-b-[rgb(113_113_122/0.55)] dark:shadow-[inset_0_-1px_0_rgb(255_255_255/0.06)]">
          <WindowControls
            onClose={onClose}
            onMinimize={onMinimize}
            onToggleMaximize={onToggleMaximize}
          />
          <WindowTitlebar
            title={title}
            titleContent={titleContent}
            onMoveStart={handleMoveStart}
            onDoubleClick={onToggleMaximize}
          />
        </div>

        <div className={['card-body', bodyClassName].filter(Boolean).join(' ')}>
          {children}
          {!focused && interactive && (
            <div
              className="absolute inset-0 z-[2] cursor-default"
              aria-hidden="true"
              onPointerDown={(event) => {
                event.preventDefault();
                onFocus();
              }}
            />
          )}
        </div>
      </div>

      {!state.maximized &&
        RESIZE_DIRECTIONS.map((direction) => (
          <span
            key={direction}
            className={`desktop-window__resize desktop-window__resize--${direction}`}
            onPointerDown={(event) => startResize(event, direction)}
            aria-hidden="true"
          />
        ))}
    </motion.section>
  );
}
