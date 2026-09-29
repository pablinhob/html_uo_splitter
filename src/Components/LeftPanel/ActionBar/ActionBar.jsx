import { useRef } from 'react';
import ActionButton from './ActionButton';

const plusIcon = 'M12 4v16M4 12h16';
const folderIcon = 'M3 6h6l2 2h10v11H3z';
const saveIcon = 'M4 4h13l3 3v13H4zM8 4v5h8V4M8 20v-6h8v6';

// Open Previous / Save Project / Save As siguen sin implementar, como en el original.
export default function ActionBar({ onOpenSTL }) {
  const fileInputRef = useRef(null);
  return (
    <div className="actions">
      <ActionButton
        iconPath={plusIcon}
        label="Add STL shape"
        onClick={() => fileInputRef.current.click()}
      />
      <ActionButton iconPath={folderIcon} label="Open Project" disabled />
      <ActionButton iconPath={saveIcon} label="Save Project" disabled />
      <ActionButton iconPath={saveIcon} label="Save As" disabled />
      <input ref={fileInputRef} type="file" accept=".stl" hidden onChange={onOpenSTL} />
    </div>
  );
}
