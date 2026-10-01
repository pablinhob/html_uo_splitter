import Viewer from '../Misc/Viewer/Viewer';
import ExampleOverlay from './ExampleOverlay/ExampleOverlay';
import LogConsole from './LogConsole';
import ObjectStatsPanel from './ObjectStatsPanel';

// example: { isVisible, onOpen } — botón del modelo de ejemplo sobre el visor.
// onPiecePick({ key }) — clic en una pieza del visor.
// viewer: { objects, stats } — objetos del visor e información del modelo (o null).
export default function RightPanel({ viewer, example, onPiecePick }) {
  const { objects, stats } = viewer;
  return (
    <main className="right-panel">
      <div className="viewer-area">
        <Viewer objects={objects} onObjectClick={onPiecePick} />
        {example.isVisible && <ExampleOverlay onOpen={example.onOpen} />}
        {stats !== null && <ObjectStatsPanel stats={stats} />}
      </div>
      <LogConsole />
    </main>
  );
}
