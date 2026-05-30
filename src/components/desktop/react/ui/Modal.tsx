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
    <div className="desktop-modal" role="presentation">
      <div
        ref={dialogRef}
        className="desktop-modal__dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="desktop-modal-title"
        data-overlay-root
      >
        <header className="desktop-modal__header">
          <h2 id="desktop-modal-title" className="desktop-modal__title">
            {title}
          </h2>
          <button
            type="button"
            className="desktop-modal__close"
            aria-label="Cerrar"
            onClick={onClose}
          >
            ×
          </button>
        </header>

        <div className="desktop-modal__body">{children}</div>

        <footer className="desktop-modal__footer">
          {onConfirm && (
            <button
              type="button"
              className={[
                'desktop-modal__btn',
                destructive ? 'desktop-modal__btn--destructive' : 'desktop-modal__btn--primary',
              ].join(' ')}
              onClick={handleConfirm}
            >
              {confirmLabel ?? 'Confirmar'}
            </button>
          )}
          <button type="button" className="desktop-modal__btn" onClick={onClose}>
            {cancelLabel}
          </button>
        </footer>
      </div>
    </div>
  );
}
