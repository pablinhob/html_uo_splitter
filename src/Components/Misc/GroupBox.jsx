// isDisabled deshabilita todos los controles del grupo (atributo nativo de fieldset).
export default function GroupBox({ title, isDisabled = false, children }) {
  return (
    <fieldset className="group-box" disabled={isDisabled}>
      <legend>{title}</legend>
      {children}
    </fieldset>
  );
}
