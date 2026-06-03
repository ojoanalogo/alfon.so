import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import type { PointerEvent as ReactPointerEvent, ReactNode } from 'react';
import { EDGE_MARGIN, TASKBAR_HEIGHT } from '../lib/layoutConstants';

const DIALOG_BTN =
  'cursor-pointer border px-[0.625rem] py-1 font-[inherit] text-[0.6875rem] hover:border-[color:var(--color-highlight-border)] hover:text-primary dark:bg-[rgb(0_0_0/0.25)]';

export interface DialogPosition {
  x: number;
  y: number;
}

/**
 * Keep a dialog fully inside the work area so its titlebar — the only drag handle —
 * can never leave the viewport. Mirrors the window-gesture clamp: top never above 0,
 * bottom never under the taskbar.
 */
export function clampDialogPosition(
  x: number,
  y: number,
  width: number,
  height: number,
  viewportWidth: number,
  viewportHeight: number,
): DialogPosition {
  const maxX = Math.max(EDGE_MARGIN, viewportWidth - width - EDGE_MARGIN);
  const maxY = Math.max(EDGE_MARGIN, viewportHeight - TASKBAR_HEIGHT - height - EDGE_MARGIN);
  return {
    x: Math.min(Math.max(x, EDGE_MARGIN), maxX),
    y: Math.min(Math.max(y, EDGE_MARGIN), maxY),
  };
}

interface DragState {
  pointerId: number;
  offsetX: number;
  offsetY: number;
  width: number;
  height: number;
}

interface DialogProps {
  title: string;
  children: ReactNode;
  onClose: () => void;
  /** Primary action label. */
  confirmLabel?: string;
  /** Destructive confirm styling. */
  destructive?: boolean;
  onConfirm?: () => void;
  /** When omitted, only a close button is shown. */
  cancelLabel?: string;
}

/**
 * A draggable dialog window that floats above the desktop windows. Generic and
 * app-agnostic — any app passes a title, body, and confirm/cancel actions. Drag it
 * by the titlebar; Escape cancels. Unlike a backdrop modal it can be moved aside.
 */
export default function Dialog({
  title,
  children,
  onClose,
  confirmLabel,
  destructive = false,
  onConfirm,
  cancelLabel = 'Cancelar',
}: DialogProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<DragState | null>(null);
  // `null` until first drag — render centered via CSS, then switch to pixel coords.
  const [pos, setPos] = useState<DialogPosition | null>(null);

  // Escape to cancel.
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        event.stopPropagation();
        onClose();
      }
    }
    window.addEventListener('keydown', handleKeyDown, true);
    return () => window.removeEventListener('keydown', handleKeyDown, true);
  }, [onClose]);

  // Focus the first actionable control on mount.
  useEffect(() => {
    const node = dialogRef.current;
    if (!node) return;
    const focusable = node.querySelector<HTMLElement>(
      'button:not([disabled]), [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
    );
    focusable?.focus();
  }, []);

  // Global drag listeners live for the component's lifetime and read the active
  // gesture from a ref (mirrors useWindowGestures), so there are no interdependent
  // callbacks to re-bind on every move.
  useEffect(() => {
    function handleMove(event: PointerEvent) {
      const drag = dragRef.current;
      if (!drag || event.pointerId !== drag.pointerId) return;
      setPos(
        clampDialogPosition(
          event.clientX - drag.offsetX,
          event.clientY - drag.offsetY,
          drag.width,
          drag.height,
          window.innerWidth,
          window.innerHeight,
        ),
      );
    }
    function handleUp(event: PointerEvent) {
      const drag = dragRef.current;
      if (!drag || event.pointerId !== drag.pointerId) return;
      dragRef.current = null;
    }
    window.addEventListener('pointermove', handleMove);
    window.addEventListener('pointerup', handleUp);
    window.addEventListener('pointercancel', handleUp);
    return () => {
      window.removeEventListener('pointermove', handleMove);
      window.removeEventListener('pointerup', handleUp);
      window.removeEventListener('pointercancel', handleUp);
    };
  }, []);

  function startDrag(event: ReactPointerEvent) {
    if (event.button !== 0) return;
    const node = dialogRef.current;
    if (!node) return;
    const rect = node.getBoundingClientRect();
    dragRef.current = {
      pointerId: event.pointerId,
      offsetX: event.clientX - rect.left,
      offsetY: event.clientY - rect.top,
      width: rect.width,
      height: rect.height,
    };
    setPos({ x: rect.left, y: rect.top });
  }

  function handleConfirm() {
    onConfirm?.();
    onClose();
  }

  const positionClass = pos ? 'fixed' : 'fixed left-1/2 top-[18%] -translate-x-1/2';

  // Render through the document body so the dialog escapes the origin window's
  // stacking + containing block (windows use transform/backdrop-blur, which would
  // otherwise trap `position: fixed`). This lets it float and be dragged anywhere
  // on the desktop, like a native system dialog.
  if (typeof document === 'undefined') return null;

  return createPortal(
    <div
      ref={dialogRef}
      className={`${positionClass} z-[300] w-[min(22rem,calc(100vw-1rem))] border border-[color:var(--color-hairline-strong)] bg-[rgb(255_255_255/0.96)] font-[ui-monospace,monospace] text-[0.75rem] text-primary shadow-[inset_0_1px_0_rgb(255_255_255/0.8),3px_4px_0_rgb(0_0_0/0.15)] backdrop-blur-[8px] dark:bg-[rgb(24_24_27/0.96)]`}
      style={pos ? { left: `${pos.x}px`, top: `${pos.y}px` } : undefined}
      role="dialog"
      aria-modal="false"
      aria-labelledby="desktop-dialog-title"
      data-overlay-root
    >
      <header
        className="flex cursor-grab items-center justify-between gap-2 border-b border-b-[rgb(113_113_122/0.3)] px-3 py-2 active:cursor-grabbing"
        onPointerDown={startDrag}
        data-dialog-titlebar
      >
        <h2 id="desktop-dialog-title" className="m-0 text-[0.75rem] font-semibold select-none">
          {title}
        </h2>
        <button
          type="button"
          className="cursor-pointer border border-transparent bg-transparent px-1 py-0 text-[1.125rem] leading-none text-muted hover:text-primary"
          aria-label="Cerrar"
          onClick={onClose}
          onPointerDown={(event) => event.stopPropagation()}
        >
          ×
        </button>
      </header>

      <div className="p-3 text-[0.6875rem] leading-[1.5] text-secondary">{children}</div>

      <footer className="flex justify-end gap-[0.375rem] border-t border-t-[rgb(113_113_122/0.3)] px-3 py-2">
        {onConfirm && (
          <button
            type="button"
            className={[
              DIALOG_BTN,
              destructive
                ? 'border-[rgb(220_38_38/0.5)] bg-[rgb(220_38_38/0.1)] text-[rgb(220_38_38)] dark:text-[rgb(248_113_113)]'
                : 'border-[color:var(--color-highlight-border)] bg-[var(--color-highlight-bg)] text-primary',
            ].join(' ')}
            onClick={handleConfirm}
          >
            {confirmLabel ?? 'Confirmar'}
          </button>
        )}
        <button
          type="button"
          className={`${DIALOG_BTN} border-[rgb(113_113_122/0.4)] bg-[var(--color-control-fill)] text-secondary`}
          onClick={onClose}
        >
          {cancelLabel}
        </button>
      </footer>
    </div>,
    document.body,
  );
}
