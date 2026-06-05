import { useCallback, useLayoutEffect, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { motion, useMotionValue, useReducedMotion } from 'framer-motion';
import type { ResizeDirection, WindowGeometry, WindowState } from '../types';
import { MIN_WIDTH } from '../lib/layoutConstants';
import WindowControls from './WindowControls';
import WindowTitlebar from './WindowTitlebar';
import { useWindowGestures } from './useWindowGestures';
import { useWindowCenterLayout } from './useWindowCenterLayout';
import { useMaximizeAnimation } from './useMaximizeAnimation';
import { useWindowWidthSync } from './useWindowWidthSync';
import { useWindowVariants } from './useWindowVariants';
import { resolveWindowChrome } from './windowChrome';
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
  onGeometryChange: (geometry: Partial<WindowGeometry>, intent: 'user' | 'auto') => void;
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

  // Don't mount an app's body until its window is first opened, then keep it
  // mounted so per-app state (terminal history, unsaved notes) survives a
  // close+reopen. Render-phase latch with an equality bail-out.
  const [wasOpened, setWasOpened] = useState(state.open);
  if (state.open && !wasOpened) {
    setWasOpened(true);
  }

  const prefersReduced = useReducedMotion();
  const canAnimateMaximize = state.open && !state.minimized && !prefersReduced;
  const { displayMaximized, maximizeTransition } = useMaximizeAnimation(
    state.maximized,
    canAnimateMaximize,
  );

  const reportUser = useCallback(
    (geometry: Partial<WindowGeometry>) => onGeometryChange(geometry, 'user'),
    [onGeometryChange],
  );
  const reportAuto = useCallback(
    (geometry: Partial<WindowGeometry>) => onGeometryChange(geometry, 'auto'),
    [onGeometryChange],
  );

  const layoutWidth = useWindowWidthSync({
    state,
    defaultWidth,
    minWidth,
    center,
    onGeometryChange: reportAuto,
  });

  useWindowCenterLayout({
    rootRef,
    enabled: center && state.open && !state.minimized && !state.maximized,
    width: layoutWidth,
    userSized: state.userSized,
    onGeometryChange: reportAuto,
  });

  const posX = state.x;
  const posY = state.y;

  // framer-motion freezes plain `style` updates for animatable props (left/top/
  // width) — it applies the mount value and ignores later re-render changes.
  // Windows mount at the SSR/mobile seed, so without this they'd stay stuck at
  // that position. Drive position through motion values, which framer tracks and
  // writes to the DOM reactively.
  const mvLeft = useMotionValue(posX);
  const mvTop = useMotionValue(posY);
  const mvWidth = useMotionValue(layoutWidth);
  useLayoutEffect(() => {
    if (displayMaximized) return;
    mvLeft.set(posX);
    mvTop.set(posY);
    mvWidth.set(layoutWidth);
  }, [posX, posY, layoutWidth, displayMaximized, mvLeft, mvTop, mvWidth]);

  const gestureState = useMemo(() => ({ ...state, width: layoutWidth }), [state, layoutWidth]);

  const { startMove, startResize } = useWindowGestures({
    state: gestureState,
    minWidth,
    rootRef,
    onFocus,
    onGeometryChange: reportUser,
  });

  const variants = useWindowVariants(rootRef, state.id, Boolean(prefersReduced));

  const { style, className, status, interactive } = resolveWindowChrome({
    displayMaximized,
    posX,
    posY,
    layoutWidth,
    minWidth,
    height: state.height,
    defaultHeight,
    minHeight,
    zIndex: state.zIndex,
    maximized: state.maximized,
    maximizeTransition,
    focused,
    windowClassName,
    open: state.open,
    minimized: state.minimized,
  });

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
      style={displayMaximized ? style : { ...style, left: mvLeft, top: mvTop, width: mvWidth }}
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
            onMoveStart={startMove}
            onDoubleClick={onToggleMaximize}
          />
        </div>

        <div className={['card-body', bodyClassName].filter(Boolean).join(' ')}>
          {wasOpened ? children : null}
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
