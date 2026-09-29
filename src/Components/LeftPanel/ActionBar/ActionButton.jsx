// Botón con icono encima del texto (QToolButton con ToolButtonTextUnderIcon).
export default function ActionButton({ iconPath, label, onClick, disabled }) {
  return (
    <button
      type="button"
      className="action-button"
      title={label}
      onClick={onClick}
      disabled={disabled}
    >
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d={iconPath} />
      </svg>
      <span>{label}</span>
    </button>
  );
}
