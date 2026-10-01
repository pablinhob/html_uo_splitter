import { useEffect, useRef } from 'react';

/**
 * Diálogo modal de confirmación (como QMessageBox.question). Escape o "Cancel"
 * llaman a onCancel; el botón principal, a onConfirm.
 */
export default function ConfirmDialog({
  isOpen,
  title,
  message,
  confirmLabel,
  onConfirm,
  onCancel,
}) {
  const dialogRef = useRef(null);

  useEffect(() => {
    const element = dialogRef.current;
    if (isOpen && !element.open) element.showModal();
    if (!isOpen && element.open) element.close();
  }, [isOpen]);

  return (
    <dialog className="confirm-dialog" ref={dialogRef} onClose={onCancel}>
      <h2>{title}</h2>
      <p>{message}</p>
      <footer>
        <button type="button" onClick={onCancel}>
          Cancel
        </button>
        <button type="button" className="confirm-dialog-accept" onClick={onConfirm}>
          {confirmLabel}
        </button>
      </footer>
    </dialog>
  );
}
