import { useState } from 'react';
import Modal from '../../ui/Modal';
import type { TrashController } from '../types';

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
        <button type="button" className="window-action-btn" onClick={onRestoreAll}>
          restaurar todo
        </button>
        <button
          type="button"
          className="window-action-btn window-action-btn--destructive"
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
