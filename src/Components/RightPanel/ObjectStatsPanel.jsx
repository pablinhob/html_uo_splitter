import { formatSizeCm, formatVolume } from '../../Helpers/units';

// Información del modelo sobre el visor, abajo a la derecha. stats: { sizeMm, volumeMm3 }.
export default function ObjectStatsPanel({ stats }) {
  return (
    <section className="object-stats" aria-label="Object info">
      <h2 className="object-stats-title">Object info</h2>
      <dl>
        <dt>Bounding box</dt>
        <dd>{formatSizeCm(stats.sizeMm)}</dd>
        <dt>Volume</dt>
        <dd>{formatVolume(stats.volumeMm3)}</dd>
      </dl>
    </section>
  );
}
