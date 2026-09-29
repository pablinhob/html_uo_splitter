import {
  CUTLAP_WIDTH_MM,
  PIECE_RADIUS_MM,
  SPLIT_SHAPES,
  STRINGER_WIDTH_MM,
} from '../../config'
import SliderField from '../Misc/SliderField'

export default function SplitterParametrizationPanel({ value, onChange, onExecute, busy }) {
  const set = (field) => (next) => onChange({ ...value, [field]: next })
  return (
    <div className="panel">
      <label className="stacked-field">
        <span>Split polygon</span>
        <select value={value.shape} onChange={(event) => set('shape')(event.target.value)}>
          {SPLIT_SHAPES.map((shape) => (
            <option key={shape}>{shape}</option>
          ))}
        </select>
      </label>
      <SliderField label="Circumscribed radius" range={PIECE_RADIUS_MM} value={value.pieceRadius} onChange={set('pieceRadius')} unit=" mm" />
      <SliderField label="Stringer width" range={STRINGER_WIDTH_MM} value={value.stringerWidth} onChange={set('stringerWidth')} unit=" mm" />
      <SliderField label="Cutlap width" range={CUTLAP_WIDTH_MM} value={value.cutlapWidth} onChange={set('cutlapWidth')} unit=" mm" />
      <button type="button" onClick={onExecute} disabled={busy}>
        Split base polygons
      </button>
    </div>
  )
}
