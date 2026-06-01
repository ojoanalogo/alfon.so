import { useRef } from 'react';
import type { ReactNode } from 'react';
import { motion, useReducedMotion, type Variants } from 'framer-motion';
import type { ResizeDirection, WindowGeometry, WindowState } from '../types';
import { MIN_WIDTH } from '../useWindowManager';
import WindowControls from './WindowControls';
import WindowTitlebar from './WindowTitlebar';
import { useWindowGestures } from './useWindowGestures';
import { BORDER_DEFAULT } from '../../../../styles/tokens';

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
  children: ReactNode;
  bodyClassName?: string;
  /** Replaces the default title text in the titlebar drag region. */
  titleContent?: ReactNode;
  windowClassName?: string;
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
  children,
  bodyClassName,
  titleContent,
  windowClassName,
}: WindowProps) {
  const rootRef = useRef<HTMLElement | null>(null);
  const prefersReduced = useReducedMotion();

  const { startMove, startResize } = useWindowGestures({
    state,
    minWidth,
    rootRef,
    onFocus,
    onGeometryChange,
  });

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
        transition: prefersReduced ? { duration: 0 } : { duration: 0.42, ease: [0.4, 0.05, 0.25, 1] },
      };
    },
  };

  const status = !state.open ? 'closed' : state.minimized ? 'minimized' : 'open';
  const interactive = state.open && !state.minimized;
  const sized = state.height != null || state.maximized;

  const style: React.CSSProperties = state.maximized
    ? { zIndex: state.zIndex, transformOrigin: 'bottom center' }
    : {
        left: `${state.x}px`,
        top: `${state.y}px`,
        width: `${state.width}px`,
        minWidth: `${minWidth}px`,
        height: state.height != null ? `${state.height}px` : undefined,
        zIndex: state.zIndex,
        transformOrigin: 'bottom center',
      };

  const className = [
    'desktop-window',
    sized && 'is-sized',
    state.maximized && 'desktop-window--expanded',
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
            onMoveStart={startMove}
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
