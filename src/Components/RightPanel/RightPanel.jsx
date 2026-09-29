import Viewer from '../Misc/Viewer';
import LogConsole from './LogConsole';

export default function RightPanel({ viewerObjects }) {
  return (
    <main className="right-panel">
      <Viewer objects={viewerObjects} />
      <LogConsole />
    </main>
  );
}
