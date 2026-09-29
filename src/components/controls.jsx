import { useEffect, useState } from 'react'

export function GroupBox({ title, children }) {
  return (
    <fieldset className="group-box">
      <legend>{title}</legend>
      {children}
    </fieldset>
  )
}

// QSpinBox entero: se deja escribir libremente y se valida (clamp) al salir.
export function SpinField({ label, range, value, onChange, unit = 'mm' }) {
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

// QSlider con etiqueta "Título: valor unidad" encima.
export function SliderField({ label, range, value, onChange, unit = '', decimals = 0, disabled }) {
  const step = 10 ** -decimals
  return (
    <div className={`slider-field${disabled ? ' disabled' : ''}`}>
      <span>
        {label}: {value.toFixed(decimals)}
        {unit}
      </span>
      <input
        type="range"
        min={range.min}
        max={range.max}
        step={step}
        value={value}
        disabled={disabled}
        onChange={(event) => onChange(Number(Number(event.target.value).toFixed(decimals)))}
      />
    </div>
  )
}

export function Accordion({ title, expanded, enabled, onToggle, children }) {
  return (
    <section className={`accordion${expanded ? ' expanded' : ''}`}>
      <button
        type="button"
        className="accordion-header"
        disabled={!enabled}
        aria-expanded={expanded}
        onClick={onToggle}
      >
        <span className="arrow" aria-hidden="true">
          {expanded ? '▼' : '▶'}
        </span>
        {title}
      </button>
      {expanded && <div className="accordion-body">{children}</div>}
    </section>
  )
}
