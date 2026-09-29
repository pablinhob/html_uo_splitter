import { useState } from 'react';
import { DEFAULT_PLUGS, DEFAULT_SPLIT, NOT_MIGRATED_MESSAGE } from './config';
import logger from './Helpers/logger';
import useBoardFile from './Hooks/useBoardFile';
import useGeometryWorker from './Hooks/useGeometryWorker';
import useExportDialog from './Hooks/useExportDialog';
import usePiecesWorkflow from './Hooks/usePiecesWorkflow';
import useViewerObjects from './Hooks/useViewerObjects';
import ExportDialog from './Components/ExportDialog';
import LeftPanel from './Components/LeftPanel/LeftPanel';
import RightPanel from './Components/RightPanel/RightPanel';

// Ventana principal (main_window.py): une el estado de la app con los paneles.
export default function App() {
  const geometryWorker = useGeometryWorker();
  const board = useBoardFile(geometryWorker);
  const workflow = usePiecesWorkflow(board.mesh);
  const exportDialog = useExportDialog(workflow.pieces);
  const [plugs, setPlugs] = useState(DEFAULT_PLUGS);
  const [split, setSplit] = useState(DEFAULT_SPLIT);
  // Sección abierta del acordeón: 'plugs' | 'split' | 'pieces' | null
  const [expanded, setExpanded] = useState(null);
  const viewerObjects = useViewerObjects(board.mesh, workflow.pieces, workflow.selectedPiece);

  const onOpenSTL = async (event) => {
    const [file] = event.target.files;
    event.target.value = '';
    if (!file) {
      logger.info('STL loading cancelled');
      return;
    }
    workflow.reset();
    setExpanded(null);
    const isLoaded = await board.openSTL(file);
    if (isLoaded) setExpanded('plugs');
  };

  return (
    <div className={`app${board.isBusy ? ' busy' : ''}`}>
      <LeftPanel
        file={{ fileName: board.fileName, stats: board.stats, onOpenSTL }}
        steps={{
          expanded,
          onExpandedChange: setExpanded,
          hasMesh: Boolean(board.mesh),
          hasPieces: workflow.pieces.length > 0,
          isBusy: board.isBusy,
        }}
        plugs={{ value: plugs, onChange: setPlugs }}
        split={{ value: split, onChange: setSplit, onExecute: () => workflow.split(split) }}
        pieces={{ ...workflow.panel, onExport: exportDialog.open }}
      />
      <RightPanel viewerObjects={viewerObjects} />
      <ExportDialog
        open={exportDialog.isOpen}
        status="Processing hollowing for every piece, this may take a while..."
        objects={[]}
        ready={false}
        onExport={() => logger.warning(`Export file: ${NOT_MIGRATED_MESSAGE}`)}
        onClose={exportDialog.close}
      />
    </div>
  );
}
