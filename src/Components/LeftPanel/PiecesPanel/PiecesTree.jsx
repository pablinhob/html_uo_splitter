import { keyId } from '../../../Helpers/pieces';

// Lista recursiva del árbol de piezas (sustituye al QTreeWidget).
export default function PiecesTree({ nodes, selected, onSelect }) {
  return (
    <ul>
      {nodes.map((node) => (
        <li key={keyId(node.key)}>
          <button
            type="button"
            className={`tree-item${selected && keyId(selected) === keyId(node.key) ? ' selected' : ''}`}
            onClick={() => onSelect(node.key, node.label)}
          >
            {node.label}
          </button>
          {node.children.length > 0 && (
            <PiecesTree nodes={node.children} selected={selected} onSelect={onSelect} />
          )}
        </li>
      ))}
    </ul>
  );
}
