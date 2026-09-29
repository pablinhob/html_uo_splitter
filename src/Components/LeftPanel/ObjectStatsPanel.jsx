import GroupBox from '../Misc/GroupBox'

export default function ObjectStatsPanel({ stats }) {
  return (
    <GroupBox title="Object info">
      <p>
        Bounding box:{' '}
        {stats ? `${stats.sizeCm.map((v) => v.toFixed(1)).join(' x ')} cm` : '-'}
      </p>
      <p>
        Volume:{' '}
        {stats ? `${stats.volumeCm3.toFixed(1)} cm³ (${stats.volumeLiters.toFixed(2)} L)` : '-'}
      </p>
    </GroupBox>
  )
}
