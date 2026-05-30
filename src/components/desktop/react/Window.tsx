import { useEffect, useRef } from 'react';
import type { ReactNode } from 'react';
import { motion, useReducedMotion, type Variants } from 'framer-motion';
import type { ResizeDirection, WindowGeometry, WindowState } from './types';
import { MIN_HEIGHT, MIN_WIDTH, TASKBAR_HEIGHT } from './useWindowManager';

const RESIZE_DIRECTIONS: ResizeDirection[] = ['n', 's', 'e', 'w', 'ne', 'nw', 'se', 'sw'];

interface DragGesture {
  type: 'move' | 'resize';
  direction?: ResizeDirection;
  pointerId: number;
  startX: number;
  startY: number;
  origin: WindowGeometry;
  /** Concrete starting height even when the window was auto-sized. */
  startHeight: number;
}

interface WindowProps {
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

const CARD_CLASS =
  'desktop-window__card rounded-lg border border-gray-400/50 p-0 font-mono text-sm overflow-hidden dark:border-gray-400/30';

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
  const gesture = useRef<DragGesture | null>(null);
  const prefersReduced = useReducedMotion();

  useEffect(() => {
    function handleMove(event: PointerEvent) {
      const active = gesture.current;
      if (!active || event.pointerId !== active.pointerId) return;

      const dx = event.clientX - active.startX;
      const dy = event.clientY - active.startY;
      const { origin } = active;

      if (active.type === 'move') {
        const maxX = window.innerWidth - 48;
        const maxY = window.innerHeight - TASKBAR_HEIGHT - 8;
        const nextX = Math.min(Math.max(origin.x + dx, -origin.width + 96), maxX);
        const nextY = Math.min(Math.max(origin.y + dy, 0), maxY);
        onGeometryChange({ x: nextX, y: nextY });
        return;
      }

      const dir = active.direction!;
      let { x, y, width } = origin;
      let height = active.startHeight;

      if (dir.includes('e')) {
        width = Math.max(minWidth, origin.width + dx);
      }
      if (dir.includes('w')) {
        const proposed = Math.max(minWidth, origin.width - dx);
        x = origin.x + (origin.width - proposed);
        width = proposed;
      }
      if (dir.includes('s')) {
        height = Math.max(MIN_HEIGHT, active.startHeight + dy);
      }
      if (dir.includes('n')) {
        const proposed = Math.max(MIN_HEIGHT, active.startHeight - dy);
        y = origin.y + (active.startHeight - proposed);
        height = proposed;
      }

      onGeometryChange({ x, y, width, height });
    }

    function handleUp(event: PointerEvent) {
      const active = gesture.current;
      if (!active || event.pointerId !== active.pointerId) return;
      gesture.current = null;
      document.body.classList.remove('is-window-gesturing');
    }

    window.addEventListener('pointermove', handleMove);
    window.addEventListener('pointerup', handleUp);
    window.addEventListener('pointercancel', handleUp);
    return () => {
      window.removeEventListener('pointermove', handleMove);
      window.removeEventListener('pointerup', handleUp);
      window.removeEventListener('pointercancel', handleUp);
    };
  }, [onGeometryChange, minWidth]);

  function measuredHeight(): number {
    if (state.height != null) return state.height;
    return rootRef.current?.getBoundingClientRect().height ?? MIN_HEIGHT;
  }

  function startMove(event: React.PointerEvent) {
    if (event.button !== 0 || state.maximized) return;
    onFocus();
    gesture.current = {
      type: 'move',
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      origin: { x: state.x, y: state.y, width: state.width, height: state.height },
      startHeight: measuredHeight(),
    };
    document.body.classList.add('is-window-gesturing');
    event.preventDefault();
  }

  function startResize(event: React.PointerEvent, direction: ResizeDirection) {
    if (event.button !== 0 || state.maximized) return;
    onFocus();
    gesture.current = {
      type: 'resize',
      direction,
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      origin: { x: state.x, y: state.y, width: state.width, height: state.height },
      startHeight: measuredHeight(),
    };
    document.body.classList.add('is-window-gesturing');
    event.preventDefault();
    event.stopPropagation();
  }

  // Measures the dock-bound genie target: where the window should collapse to
  // (its taskbar tab) when minimized. Read at animation start for accuracy.
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
        <div className="window-titlebar">
          <div className="window-controls" role="group" aria-label="Controles de ventana">
            <button
              type="button"
              className="window-control window-control--close"
              aria-label="Cerrar ventana"
              onPointerDown={(event) => event.stopPropagation()}
              onClick={onClose}
            />
            <button
              type="button"
              className="window-control window-control--min"
              aria-label="Minimizar ventana"
              onPointerDown={(event) => event.stopPropagation()}
              onClick={onMinimize}
            />
            <button
              type="button"
              className="window-control window-control--max"
              aria-label="Maximizar ventana"
              onPointerDown={(event) => event.stopPropagation()}
              onClick={onToggleMaximize}
            />
          </div>
          <div
            className="window-titlebar__drag cursor-grab select-none"
            onPointerDown={startMove}
            onDoubleClick={onToggleMaximize}
          >
            {titleContent ?? <span className="window-titlebar__title">{title}</span>}
          </div>
        </div>

        <div className={['card-body', bodyClassName].filter(Boolean).join(' ')}>
          {children}
          {!focused && interactive && (
            <div
              className="desktop-window__focus-capture"
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
