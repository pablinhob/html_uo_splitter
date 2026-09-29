export default function GroupBox({ title, children }) {
  return (
    <fieldset className="group-box">
      <legend>{title}</legend>
      {children}
    </fieldset>
  );
}
