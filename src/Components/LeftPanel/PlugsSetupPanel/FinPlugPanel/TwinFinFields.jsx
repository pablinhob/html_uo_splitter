import {
  FIN_TWIN_ANGLE_DEG,
  FIN_TWIN_CENTER_DISTANCE_MM,
  FIN_TWIN_TAIL_DISTANCE_MM,
} from '../../../../config';
import SpinField from '../../../Misc/SpinField';

export default function TwinFinFields({ value, set }) {
  return (
    <>
      <div className="field-row">
        <SpinField
          label="Tail distance"
          range={FIN_TWIN_TAIL_DISTANCE_MM}
          value={value.twinTailDistanceMm}
          onChange={set('twinTailDistanceMm')}
        />
        <SpinField
          label="Center distance"
          range={FIN_TWIN_CENTER_DISTANCE_MM}
          value={value.twinCenterDistanceMm}
          onChange={set('twinCenterDistanceMm')}
        />
      </div>
      <div className="field-row">
        <SpinField
          label="Angle"
          range={FIN_TWIN_ANGLE_DEG}
          value={value.twinAngleDeg}
          onChange={set('twinAngleDeg')}
          unit="°"
        />
      </div>
    </>
  );
}
