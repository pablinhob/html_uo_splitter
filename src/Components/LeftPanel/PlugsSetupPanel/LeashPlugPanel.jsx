import {
  LEASH_PLUG_CENTER_MM,
  LEASH_PLUG_DEPTH_MM,
  LEASH_PLUG_DIAMETER_MM,
  LEASH_PLUG_TAIL_DISTANCE_MM,
} from '../../../config';
import GroupBox from '../../Misc/GroupBox';
import SpinField from '../../Misc/SpinField';

export default function LeashPlugPanel({ value, onChange }) {
  const set = (field) => (next) => onChange({ ...value, [field]: next });
  return (
    <GroupBox title="Leash plug box">
      <div className="field-row">
        <SpinField
          label="Diameter"
          range={LEASH_PLUG_DIAMETER_MM}
          value={value.diameterMm}
          onChange={set('diameterMm')}
        />
        <SpinField
          label="Deep"
          range={LEASH_PLUG_DEPTH_MM}
          value={value.depthMm}
          onChange={set('depthMm')}
        />
      </div>
      <div className="field-row">
        <SpinField
          label="Tail distance"
          range={LEASH_PLUG_TAIL_DISTANCE_MM}
          value={value.tailDistanceMm}
          onChange={set('tailDistanceMm')}
        />
        <SpinField
          label="Center"
          range={LEASH_PLUG_CENTER_MM}
          value={value.centerMm}
          onChange={set('centerMm')}
        />
      </div>
    </GroupBox>
  );
}
