import {
  BOTTOM_WIDTH_MM,
  HOLE_RADIUS_PCT,
  TOP_WIDTH_MM,
  WALL_WIDTH_MM,
} from '../../../config'
import GroupBox from '../../Misc/GroupBox'
import SliderField from '../../Misc/SliderField'

export default function HollowingActions({ hollow, onChange, onApply, onExport, exportEnabled }) {
  const set = (field) => (next) => onChange({ ...hollow, [field]: next })
  return (
    <GroupBox title="Polygon hollowing actions">
      <SliderField label="Wall width" range={WALL_WIDTH_MM} value={hollow.wall} onChange={set('wall')} unit=" mm" decimals={1} />
      <SliderField label="Top width" range={TOP_WIDTH_MM} value={hollow.top} onChange={set('top')} unit=" mm" decimals={1} disabled />
      <SliderField label="Bottom width" range={BOTTOM_WIDTH_MM} value={hollow.bottom} onChange={set('bottom')} unit=" mm" decimals={1} disabled />
      <SliderField label="Hole radius" range={HOLE_RADIUS_PCT} value={hollow.holePct} onChange={set('holePct')} unit=" %" />
      <div className="button-row">
        <button type="button" onClick={onApply}>
          Preview hollowing
        </button>
        <button type="button" onClick={onExport} disabled={!exportEnabled}>
          Export Hollowing
        </button>
      </div>
    </GroupBox>
  )
}
