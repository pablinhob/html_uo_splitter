import { keyId } from '../../../Helpers/pieces';

// Botones de selección directa: "All" y las piezas sueltas (stringer).
export default function PiecesShortcuts({ nodes, selected, onSelect }) {
  return (
    <div className="pieces-shortcuts">
      {nodes.map((node) => {
        const isSelected = Boolean(selected) && keyId(selected) === keyId(node.key);
        return (
          <button
            key={keyId(node.key)}
            type="button"
            className={`pieces-shortcut${isSelected ? ' selected' : ''}`}
            aria-pressed={isSelected}
            onClick={() => onSelect(node.key, node.label)}
          >
            {node.label}
          </button>
        );
      })}
    </div>
  );
}
