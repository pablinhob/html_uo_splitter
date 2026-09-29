import { useRef } from 'react'
import ActionButton from './ActionButton'

const PLUS_ICON = 'M12 4v16M4 12h16'
const FOLDER_ICON = 'M3 6h6l2 2h10v11H3z'
const SAVE_ICON = 'M4 4h13l3 3v13H4zM8 4v5h8V4M8 20v-6h8v6'

// Open Previous / Save Project / Save As siguen sin implementar, como en el original.
export default function ActionBar({ onOpenStl }) {
  const fileInputRef = useRef(null)
  return (
    <div className="actions">
      <ActionButton iconPath={PLUS_ICON} label="Add STL shape" onClick={() => fileInputRef.current.click()} />
      <ActionButton iconPath={FOLDER_ICON} label="Open Previous" disabled />
      <ActionButton iconPath={SAVE_ICON} label="Save Project" disabled />
      <ActionButton iconPath={SAVE_ICON} label="Save As" disabled />
      <input ref={fileInputRef} type="file" accept=".stl" hidden onChange={onOpenStl} />
    </div>
  )
}
