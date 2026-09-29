import { useEffect, useState } from 'react'

// QSpinBox entero: se deja escribir libremente y se valida (clamp) al salir.
export default function SpinField({ label, range, value, onChange, unit = 'mm' }) {
  const [draft, setDraft] = useState(String(value))
  useEffect(() => setDraft(String(value)), [value])

  const commit = (text) => {
    const parsed = Math.round(Number(text))
    const next = Number.isFinite(parsed) && text.trim() !== ''
      ? Math.min(range.max, Math.max(range.min, parsed))
      : value
    setDraft(String(next))
    if (next !== value) onChange(next)
  }

  return (
    <label className="spin-field">
      <span>{label}</span>
      <input
        type="number"
        min={range.min}
        max={range.max}
        step={1}
        value={draft}
        onChange={(event) => {
          setDraft(event.target.value)
          // Las flechas del spin cambian el valor al momento, como en Qt.
          const parsed = Number(event.target.value)
          if (Number.isInteger(parsed) && parsed >= range.min && parsed <= range.max) {
            onChange(parsed)
          }
        }}
        onBlur={(event) => commit(event.target.value)}
        onKeyDown={(event) => event.key === 'Enter' && commit(event.target.value)}
      />
      <span className="unit">{unit}</span>
    </label>
  )
}
