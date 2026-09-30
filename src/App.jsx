import { useState } from 'react';
import { DEFAULT_PLUGS, DEFAULT_SPLIT } from './config';
import useBoardFile from './Hooks/useBoardFile';
import useBoardOpening from './Hooks/useBoardOpening';
import useGeometryWorker from './Hooks/useGeometryWorker';
import useExportDialog from './Hooks/useExportDialog';
import usePiecesWorkflow from './Hooks/usePiecesWorkflow';
import useViewerObjects from './Hooks/useViewerObjects';
import AppHeader from './Components/AppHeader/AppHeader';
import ExportDialog from './Components/ExportDialog';
import LeftPanel from './Components/LeftPanel/LeftPanel';
import RightPanel from './Components/RightPanel/RightPanel';

// Ventana principal (main_window.py): une el estado de la app con los paneles.
export default function App() {
  const geometryWorker = useGeometryWorker();
  const board = useBoardFile(geometryWorker);
  // Paso actual del asistente: 'plugs' | 'split' | 'pieces' | null (sin tabla)
  const [currentStep, setCurrentStep] = useState(null);
  const workflow = usePiecesWorkflow(geometryWorker, board.mesh, () => setCurrentStep('pieces'));
  const [plugs, setPlugs] = useState(DEFAULT_PLUGS);
  const [split, setSplit] = useState(DEFAULT_SPLIT);
  const exportParams = { hollow: workflow.hollow, plugs };
  const exportDialog = useExportDialog(geometryWorker, workflow.pieces, exportParams);
  const viewerObjects = useViewerObjects({ geometryWorker, board, workflow, plugs });

  const opening = useBoardOpening(board, {
    onStart: () => {
      workflow.reset();
      setCurrentStep(null);
    },
    onLoaded: () => setCurrentStep('plugs'),
  });

  const isBusy = board.isBusy || workflow.isBusy;

  return (
    <div className={`app-shell${isBusy ? ' busy' : ''}`}>
      <AppHeader />
      <div className="app">
        <LeftPanel
          file={{ fileName: board.fileName, stats: board.stats, onOpenSTL: opening.onFileInput }}
          steps={{
            currentStep,
            onStepChange: setCurrentStep,
            hasMesh: Boolean(board.mesh),
            hasPieces: workflow.pieces.length > 0,
            isBusy,
          }}
          plugs={{ value: plugs, onChange: setPlugs }}
          split={{
            value: split,
            onChange: setSplit,
            onExecute: () => workflow.split(split, plugs),
          }}
          pieces={{ ...workflow.panel, onExport: exportDialog.open }}
        />
        <RightPanel
          viewerObjects={viewerObjects}
          example={{ isVisible: !board.mesh && !board.isBusy, onOpen: opening.openExample }}
          onPiecePick={workflow.pickPiece}
        />
      </div>
      <ExportDialog dialog={exportDialog} />
    </div>
  );
}
