// Botón de un modelo de ejemplo: preview cuadrado y nombre debajo.
export default function ExampleButton({ example, onOpen }) {
  return (
    <button type="button" className="example-button" onClick={() => onOpen(example)}>
      <img src={`${import.meta.env.BASE_URL}${example.previewPath}`} alt="" />
      <span>{example.label}</span>
    </button>
  );
}
