import { useEffect, useRef, useState } from 'react';
import { EXPORT_FORMATS } from '../config';
import Viewer from './Misc/Viewer/Viewer';

/**
 * Ventana "Export hollowing" (export_window.py) como diálogo modal.
 * dialog (useExportDialog): { isOpen, status, objects, isReady, exportFile(format), close }
 */
export default function ExportDialog({ dialog }) {
  const { isOpen: open, status, objects, isReady: ready, exportFile, close: onClose } = dialog;
  const dialogRef = useRef(null);
  const [formatIndex, setFormatIndex] = useState(0);

  useEffect(() => {
    const element = dialogRef.current;
    if (open && !element.open) element.showModal();
    if (!open && element.open) element.close();
  }, [open]);

  return (
    <dialog className="export-dialog" ref={dialogRef} onClose={onClose}>
      <header>
        <h2>Export hollowing</h2>
        <button type="button" className="close" aria-label="Close" onClick={onClose}>
          ×
        </button>
      </header>
      <p className="status">{status}</p>
      {open && <Viewer objects={objects} />}
      <footer>
        <select
          value={formatIndex}
          disabled={!ready}
          onChange={(event) => setFormatIndex(Number(event.target.value))}
        >
          {EXPORT_FORMATS.map((format, index) => (
            <option key={format.label} value={index}>
              {format.label}
            </option>
          ))}
        </select>
        <button
          type="button"
          disabled={!ready}
          onClick={() => exportFile(EXPORT_FORMATS[formatIndex])}
        >
          Export file
        </button>
      </footer>
    </dialog>
  );
}
