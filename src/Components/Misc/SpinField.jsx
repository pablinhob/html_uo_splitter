import { useState } from 'react';

const clamp = (number, range) => Math.min(range.max, Math.max(range.min, number));

// QSpinBox entero: se deja escribir libremente y se valida (clamp) al salir.
export default function SpinField({ label, range, value, onChange, unit = 'mm' }) {
  const [draft, setDraft] = useState(String(value));
  const [syncedValue, setSyncedValue] = useState(value);

  // Si el valor cambia desde fuera, el borrador se reinicia durante el render
  // (https://react.dev/learn/you-might-not-need-an-effect).
  if (value !== syncedValue) {
    setSyncedValue(value);
    setDraft(String(value));
  }

  const commit = (text) => {
    const parsed = Math.round(Number(text));
    const isValid = Number.isFinite(parsed) && text.trim() !== '';
    const next = isValid ? clamp(parsed, range) : value;
    setDraft(String(next));
    if (next !== value) onChange(next);
  };

  const onInputChange = (event) => {
    setDraft(event.target.value);
    // Las flechas del spin cambian el valor al momento, como en Qt.
    const parsed = Number(event.target.value);
    if (Number.isInteger(parsed) && parsed === clamp(parsed, range)) onChange(parsed);
  };

  const onKeyDown = (event) => {
    if (event.key === 'Enter') commit(event.target.value);
  };

  return (
    <label className="spin-field">
      <span>{label}</span>
      <input
        type="number"
        min={range.min}
        max={range.max}
        step={1}
        value={draft}
        onChange={onInputChange}
        onBlur={(event) => commit(event.target.value)}
        onKeyDown={onKeyDown}
      />
      <span className="unit">{unit}</span>
    </label>
  );
}
