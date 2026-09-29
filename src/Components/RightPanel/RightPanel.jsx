import Viewer from '../Misc/Viewer';
import ExampleOverlay from './ExampleOverlay/ExampleOverlay';
import LogConsole from './LogConsole';

// example: { isVisible, onOpen } — botón del modelo de ejemplo sobre el visor.
export default function RightPanel({ viewerObjects, example }) {
  return (
    <main className="right-panel">
      <div className="viewer-area">
        <Viewer objects={viewerObjects} />
        {example.isVisible && <ExampleOverlay onOpen={example.onOpen} />}
      </div>
      <LogConsole />
    </main>
  );
}
