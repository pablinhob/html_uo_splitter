import {
  FIN_SINGLE_BOX_DEPTH_MM,
  FIN_SINGLE_BOX_LONG_MM,
  FIN_SINGLE_BOX_WIDTH_MM,
  FIN_SINGLE_TAIL_DISTANCE_MM,
  FIN_TWIN_ANGLE_DEG,
  FIN_TWIN_CENTER_DISTANCE_MM,
  FIN_TWIN_TAIL_DISTANCE_MM,
  FIN_TYPES,
} from '../../../config'
import GroupBox from '../../Misc/GroupBox'
import SpinField from '../../Misc/SpinField'

export default function FinPlugPanel({ value, onChange }) {
  const set = (field) => (next) => onChange({ ...value, [field]: next })
  return (
    <GroupBox title="Fin plug configuration">
      <select value={value.type} onChange={(event) => set('type')(event.target.value)}>
        {FIN_TYPES.map((type) => (
          <option key={type.value} value={type.value}>
            {type.label}
          </option>
        ))}
      </select>

      {value.type === 'single' ? (
        <>
          <div className="field-row">
            <SpinField label="Box long" range={FIN_SINGLE_BOX_LONG_MM} value={value.singleBoxLong} onChange={set('singleBoxLong')} />
            <SpinField label="Box width" range={FIN_SINGLE_BOX_WIDTH_MM} value={value.singleBoxWidth} onChange={set('singleBoxWidth')} />
          </div>
          <div className="field-row">
            <SpinField label="Box deep" range={FIN_SINGLE_BOX_DEPTH_MM} value={value.singleBoxDepth} onChange={set('singleBoxDepth')} />
            <SpinField label="Tail distance" range={FIN_SINGLE_TAIL_DISTANCE_MM} value={value.singleTailDistance} onChange={set('singleTailDistance')} />
          </div>
        </>
      ) : (
        <>
          <div className="field-row">
            <SpinField label="Tail distance" range={FIN_TWIN_TAIL_DISTANCE_MM} value={value.twinTailDistance} onChange={set('twinTailDistance')} />
            <SpinField label="Center distance" range={FIN_TWIN_CENTER_DISTANCE_MM} value={value.twinCenterDistance} onChange={set('twinCenterDistance')} />
          </div>
          <div className="field-row">
            <SpinField label="Angle" range={FIN_TWIN_ANGLE_DEG} value={value.twinAngle} onChange={set('twinAngle')} unit="°" />
          </div>
        </>
      )}
    </GroupBox>
  )
}
