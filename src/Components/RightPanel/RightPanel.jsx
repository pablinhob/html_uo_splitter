import Viewer from '../Misc/Viewer';
import ExampleOverlay from './ExampleOverlay/ExampleOverlay';
import LogConsole from './LogConsole';

// example: { isVisible, onOpen } — botón del modelo de ejemplo sobre el visor.
// onPiecePick({ key }) — clic en una pieza del visor.
export default function RightPanel({ viewerObjects, example, onPiecePick }) {
  return (
    <main className="right-panel">
      <div className="viewer-area">
        <Viewer objects={viewerObjects} onObjectClick={onPiecePick} />
        {example.isVisible && <ExampleOverlay onOpen={example.onOpen} />}
      </div>
      <LogConsole />
    </main>
  );
}
