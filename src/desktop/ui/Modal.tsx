import { useCallback, useEffect, useRef } from 'react';
import type { ReactNode } from 'react';

interface UseOverlayDismissOptions {
  onClose: () => void;
  enabled?: boolean;
}

function useOverlayDismiss({ onClose, enabled = true }: UseOverlayDismissOptions) {
  const onCloseRef = useRef(onClose);

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  const stableClose = useCallback(() => onCloseRef.current(), []);

  useEffect(() => {
    if (!enabled) return;

    function handlePointerDown(event: PointerEvent) {
      const target = event.target as HTMLElement;
      if (target.closest('[data-overlay-root]')) return;
      stableClose();
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        event.stopPropagation();
        stableClose();
      }
    }

    window.addEventListener('pointerdown', handlePointerDown, true);
    window.addEventListener('keydown', handleKeyDown, true);
    return () => {
      window.removeEventListener('pointerdown', handlePointerDown, true);
      window.removeEventListener('keydown', handleKeyDown, true);
    };
  }, [enabled, stableClose]);
}

const MODAL_BTN =
  'cursor-pointer border px-[0.625rem] py-1 font-[inherit] text-[0.6875rem] hover:border-[color:var(--color-highlight-border)] hover:text-primary dark:bg-[rgb(0_0_0/0.25)]';

interface ModalProps {
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

export default function Modal({
  title,
  children,
  onClose,
  confirmLabel,
  destructive = false,
  onConfirm,
  cancelLabel = 'Cancelar',
}: ModalProps) {
  const dialogRef = useRef<HTMLDivElement>(null);

  useOverlayDismiss({ onClose });

  useEffect(() => {
    const node = dialogRef.current;
    if (!node) return;
    const focusable = node.querySelector<HTMLElement>(
      'button:not([disabled]), [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
    );
    focusable?.focus();
  }, []);

  function handleConfirm() {
    onConfirm?.();
    onClose();
  }

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center bg-[rgb(0_0_0/0.35)] p-4 backdrop-blur-[2px]"
      role="presentation"
    >
      <div
        ref={dialogRef}
        className="w-[min(22rem,100%)] border border-[color:var(--color-hairline-strong)] bg-[rgb(255_255_255/0.96)] font-[ui-monospace,monospace] text-[0.75rem] text-primary shadow-[inset_0_1px_0_rgb(255_255_255/0.8),3px_4px_0_rgb(0_0_0/0.15)] backdrop-blur-[8px] dark:bg-[rgb(24_24_27/0.96)]"
        role="dialog"
        aria-modal="true"
        aria-labelledby="desktop-modal-title"
        data-overlay-root
      >
        <header className="flex items-center justify-between gap-2 border-b border-b-[rgb(113_113_122/0.3)] px-3 py-2">
          <h2 id="desktop-modal-title" className="m-0 text-[0.75rem] font-semibold">
            {title}
          </h2>
          <button
            type="button"
            className="cursor-pointer border border-transparent bg-transparent px-1 py-0 text-[1.125rem] leading-none text-muted hover:text-primary"
            aria-label="Cerrar"
            onClick={onClose}
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
                MODAL_BTN,
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
            className={`${MODAL_BTN} border-[rgb(113_113_122/0.4)] bg-[var(--color-control-fill)] text-secondary`}
            onClick={onClose}
          >
            {cancelLabel}
          </button>
        </footer>
      </div>
    </div>
  );
}
