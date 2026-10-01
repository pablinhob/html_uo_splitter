import { keyId } from '../../../Helpers/pieces';

// Opciones de un grupo: la mitad entera si es seleccionable y después sus piezas.
const groupOptions = (side) => [
  ...(side.isSelectable === false ? [] : [{ node: side, text: `All in ${side.label}` }]),
  ...side.children.map((node) => ({ node, text: node.label })),
];

/**
 * Sección de piezas como desplegable, con un grupo por mitad (Side A, Side B).
 * Si la selección actual no es de esta sección, muestra el texto de placeholder.
 * - tag: etiqueta junto al título; tagTone: 'accent' | 'warning'.
 * - nodes: mitades de buildPiecesSections, con sus piezas en children.
 */
export default function PiecesSelect({
  title,
  tag,
  tagTone,
  placeholder,
  nodes,
  selected,
  onSelect,
}) {
  const options = new Map(
    nodes.flatMap((side) =>
      groupOptions(side).map(({ node }) => [
        keyId(node.key),
        { node, label: node === side ? `${title} - ${side.label}` : node.label },
      ]),
    ),
  );
  const selectedId = selected ? keyId(selected) : '';
  const value = options.has(selectedId) ? selectedId : '';

  const onChange = (event) => {
    const { node, label } = options.get(event.target.value);
    onSelect(node.key, label);
  };

  return (
    <label className="pieces-select">
      <span className="pieces-select-title">
        {title}
        <span className={`pieces-select-tag ${tagTone}`}>{tag}</span>
      </span>
      <select value={value} onChange={onChange}>
        <option value="" disabled>
          {placeholder}
        </option>
        {nodes.map((side) => (
          <optgroup key={keyId(side.key)} label={side.label}>
            {groupOptions(side).map(({ node, text }) => (
              <option key={keyId(node.key)} value={keyId(node.key)}>
                {text}
              </option>
            ))}
          </optgroup>
        ))}
      </select>
    </label>
  );
}
