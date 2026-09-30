import ActionBar from './ActionBar/ActionBar';
import DonationBanner from './DonationBanner/DonationBanner';
import ObjectStatsPanel from './ObjectStatsPanel';
import PiecesPanel from './PiecesPanel/PiecesPanel';
import PlugsSetupPanel from './PlugsSetupPanel/PlugsSetupPanel';
import SplitterParametrizationPanel from './SplitterParametrizationPanel';
import StepWizard from './StepWizard/StepWizard';

/**
 * Panel izquierdo: acciones, fichero cargado, los tres pasos en un asistente
 * (un paso visible a la vez), información del objeto y el banner de donaciones.
 * El estado vive en App; aquí solo se presenta.
 *
 * - file:   { fileName, stats, onOpenSTL }
 * - steps:  { currentStep, onStepChange, hasMesh, hasPieces, isBusy }
 * - plugs:  { value, onChange }
 * - split:  { value, onChange, onExecute }
 * - pieces: props de PiecesPanel
 */
// Los tres pasos del asistente, en orden.
function stepSections({ steps, plugs, split, pieces }) {
  return [
    {
      id: 'plugs',
      label: 'Plugs',
      title: 'Plugs setup',
      enabled: steps.hasMesh,
      content: <PlugsSetupPanel value={plugs.value} onChange={plugs.onChange} />,
    },
    {
      id: 'split',
      label: 'Split',
      title: 'Split model into polygons',
      enabled: steps.hasMesh,
      content: <SplitterParametrizationPanel split={split} />,
      // Al terminar el split, App avanza solo al paso 3.
      nextAction: { label: 'Split', onClick: split.onExecute },
    },
    {
      id: 'pieces',
      label: 'Process',
      title: 'Process polygons',
      enabled: steps.hasPieces,
      content: <PiecesPanel pieces={pieces} />,

      // La exportación es el último "siguiente": requiere la previsualización actual.
      nextAction: {
        label: 'Export hollowing',
        onClick: pieces.onExport,
        isDisabled: !pieces.exportEnabled,
      },
    },
  ];
}

export default function LeftPanel({ file, steps, plugs, split, pieces }) {
  const sections = stepSections({ steps, plugs, split, pieces });

  return (
    <aside className="left-panel">
      <ActionBar onOpenSTL={file.onOpenSTL} />
      <p className="file-path" title={file.fileName ?? undefined}>
        {file.fileName ?? 'No file selected'}
      </p>
      <StepWizard
        sections={sections}
        currentStep={steps.currentStep}
        onStepChange={steps.onStepChange}
        isBusy={steps.isBusy}
      />
      <div className="spacer" />
      <ObjectStatsPanel stats={file.stats} />
      <DonationBanner />
    </aside>
  );
}
