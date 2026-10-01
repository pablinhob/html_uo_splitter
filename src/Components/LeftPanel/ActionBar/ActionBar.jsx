import { useRef, useState } from 'react';
import ActionButton from './ActionButton';
import ConfirmDialog from './ConfirmDialog';

const plusIcon = 'M12 4v16M4 12h16';
const folderIcon = 'M3 6h6l2 2h10v11H3z';
const saveIcon = 'M4 4h13l3 3v13H4zM8 4v5h8V4M8 20v-6h8v6';

/**
 * Open Previous / Save Project / Save As siguen sin implementar, como en el original.
 * Si ya hay una tabla cargada (hasBoard), abrir otro STL pide confirmación antes,
 * porque se pierden la tabla, las piezas y el paso en curso.
 */
export default function ActionBar({ onOpenSTL, hasBoard }) {
  const fileInputRef = useRef(null);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);

  // El clic en "Discard and open" sigue siendo un gesto del usuario, así que el
  // navegador permite abrir el selector de ficheros desde ahí.
  const chooseFile = () => {
    setIsConfirmOpen(false);
    fileInputRef.current.click();
  };

  const onAddSTL = () => {
    if (hasBoard) {
      setIsConfirmOpen(true);
      return;
    }

    chooseFile();
  };

  return (
    <div className="actions">
      <ActionButton iconPath={plusIcon} label="Add STL shape" onClick={onAddSTL} />
      <ActionButton iconPath={folderIcon} label="Open Project" disabled />
      <ActionButton iconPath={saveIcon} label="Save Project" disabled />
      <ActionButton iconPath={saveIcon} label="Save As" disabled />
      <input ref={fileInputRef} type="file" accept=".stl" hidden onChange={onOpenSTL} />
      <ConfirmDialog
        isOpen={isConfirmOpen}
        title="Discard current work?"
        message="Opening a new STL shape will discard the current board, its split pieces and the hollowing preview."
        confirmLabel="Discard and open"
        onConfirm={chooseFile}
        onCancel={() => setIsConfirmOpen(false)}
      />
    </div>
  );
}
