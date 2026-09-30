import { BOTTOM_WIDTH_MM, HOLE_RADIUS_PCT, TOP_WIDTH_MM, WALL_WIDTH_MM } from '../../../config';
import GroupBox from '../../Misc/GroupBox';
import SliderField from '../../Misc/SliderField';

/**
 * pieces: las mismas props que recibe PiecesPanel.
 * isDisabled: la selección no admite vaciado (todo el grupo deshabilitado).
 * isPreviewDisabled: no hay una pieza concreta que previsualizar (p. ej. "all").
 */
export default function HollowingActions({ pieces, isDisabled, isPreviewDisabled }) {
  const { hollow, onHollowChange, onApply } = pieces;
  const set = (field) => (next) => onHollowChange({ ...hollow, [field]: next });
  return (
    <GroupBox title="Polygon hollowing actions" isDisabled={isDisabled}>
      <SliderField
        label="Wall width"
        range={WALL_WIDTH_MM}
        value={hollow.wallMm}
        onChange={set('wallMm')}
        unit=" mm"
        decimals={1}
      />
      <SliderField
        label="Top width"
        range={TOP_WIDTH_MM}
        value={hollow.topMm}
        onChange={set('topMm')}
        unit=" mm"
        decimals={1}
        disabled
      />
      <SliderField
        label="Bottom width"
        range={BOTTOM_WIDTH_MM}
        value={hollow.bottomMm}
        onChange={set('bottomMm')}
        unit=" mm"
        decimals={1}
        disabled
      />
      <SliderField
        label="Hole radius"
        range={HOLE_RADIUS_PCT}
        value={hollow.holePct}
        onChange={set('holePct')}
        unit=" %"
      />
      <button type="button" onClick={onApply} disabled={isPreviewDisabled}>
        Preview part hollowing
      </button>
    </GroupBox>
  );
}
