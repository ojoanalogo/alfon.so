import { useState } from 'react';
import Modal from '../../ui/Modal';
import { WINDOW_ACTION_BTN, WINDOW_ACTION_BTN_DESTRUCTIVE } from '@/styles/tokens';
import type { TrashController } from '@desktop/wrappers';

interface TrashFooterProps {
  trash: TrashController;
}

export default function TrashFooter({ trash }: TrashFooterProps) {
  const { items, onRestoreAll, onEmpty } = trash;
  const [confirmEmpty, setConfirmEmpty] = useState(false);

  if (items.length === 0) return null;

  return (
    <>
      <div className="explorer-actions flex flex-wrap gap-2">
        <button type="button" className={WINDOW_ACTION_BTN} onClick={onRestoreAll}>
          restaurar todo
        </button>
        <button
          type="button"
          className={WINDOW_ACTION_BTN_DESTRUCTIVE}
          onClick={() => setConfirmEmpty(true)}
        >
          vaciar papelera
        </button>
      </div>

      {confirmEmpty && (
        <Modal
          title="Vaciar papelera"
          confirmLabel="Vaciar"
          destructive
          onConfirm={onEmpty}
          onClose={() => setConfirmEmpty(false)}
        >
          <p>
            ¿Eliminar permanentemente {items.length} icono{items.length === 1 ? '' : 's'}? Esta
            acción no se puede deshacer.
          </p>
        </Modal>
      )}
    </>
  );
}
