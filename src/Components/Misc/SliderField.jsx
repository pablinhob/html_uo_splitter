// QSlider con etiqueta "Título: valor unidad" encima.
export default function SliderField({
  label,
  range,
  value,
  onChange,
  unit = '',
  decimals = 0,
  disabled,
}) {
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
