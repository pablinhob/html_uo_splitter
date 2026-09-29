import {
  FIN_SINGLE_BOX_DEPTH_MM,
  FIN_SINGLE_BOX_LONG_MM,
  FIN_SINGLE_BOX_WIDTH_MM,
  FIN_SINGLE_TAIL_DISTANCE_MM,
} from '../../../../config';
import SpinField from '../../../Misc/SpinField';

export default function SingleFinFields({ value, set }) {
  return (
    <>
      <div className="field-row">
        <SpinField
          label="Box long"
          range={FIN_SINGLE_BOX_LONG_MM}
          value={value.singleBoxLongMm}
          onChange={set('singleBoxLongMm')}
        />
        <SpinField
          label="Box width"
          range={FIN_SINGLE_BOX_WIDTH_MM}
          value={value.singleBoxWidthMm}
          onChange={set('singleBoxWidthMm')}
        />
      </div>
      <div className="field-row">
        <SpinField
          label="Box deep"
          range={FIN_SINGLE_BOX_DEPTH_MM}
          value={value.singleBoxDepthMm}
          onChange={set('singleBoxDepthMm')}
        />
        <SpinField
          label="Tail distance"
          range={FIN_SINGLE_TAIL_DISTANCE_MM}
          value={value.singleTailDistanceMm}
          onChange={set('singleTailDistanceMm')}
        />
      </div>
    </>
  );
}
