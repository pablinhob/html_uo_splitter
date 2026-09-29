import { formatSizeCm, formatVolume } from '../../Helpers/units';
import GroupBox from '../Misc/GroupBox';

// stats: { sizeMm: [x, y, z], volumeMm3 } o null si no hay modelo.
export default function ObjectStatsPanel({ stats }) {
  return (
    <GroupBox title="Object info">
      <p>Bounding box: {stats ? formatSizeCm(stats.sizeMm) : '-'}</p>
      <p>Volume: {stats ? formatVolume(stats.volumeMm3) : '-'}</p>
    </GroupBox>
  );
}
