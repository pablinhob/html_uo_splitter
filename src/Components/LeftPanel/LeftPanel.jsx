import Accordion from '../Misc/Accordion';
import ActionBar from './ActionBar/ActionBar';
import DonationBanner from './DonationBanner/DonationBanner';
import ObjectStatsPanel from './ObjectStatsPanel';
import PiecesPanel from './PiecesPanel/PiecesPanel';
import PlugsSetupPanel from './PlugsSetupPanel/PlugsSetupPanel';
import SplitterParametrizationPanel from './SplitterParametrizationPanel';

/**
 * Panel izquierdo: acciones, fichero cargado, los tres pasos en acordeón
 * exclusivo (solo uno abierto a la vez), información del objeto y el banner de
 * donaciones.
 * El estado vive en App; aquí solo se presenta.
 *
 * - file:   { fileName, stats, onOpenSTL }
 * - steps:  { expanded, onExpandedChange, hasMesh, hasPieces, isBusy }
 * - plugs:  { value, onChange }
 * - split:  { value, onChange, onExecute }
 * - pieces: props de PiecesPanel
 */
// Los tres pasos del acordeón, en orden.
function stepSections({ steps, plugs, split, pieces }) {
  return [
    {
      id: 'plugs',
      title: '1 - Plugs setup',
      enabled: steps.hasMesh,
      content: (
        <PlugsSetupPanel
          value={plugs.value}
          onChange={plugs.onChange}
          onContinue={() => steps.onExpandedChange('split')}
        />
      ),
    },
    {
      id: 'split',
      title: '2 - Split model into polygons',
      enabled: steps.hasMesh,
      content: <SplitterParametrizationPanel split={split} busy={steps.isBusy} />,
    },
    {
      id: 'pieces',
      title: '3 - Process polygons',
      enabled: steps.hasPieces,
      content: <PiecesPanel pieces={pieces} />,
    },
  ];
}

export default function LeftPanel({ file, steps, plugs, split, pieces }) {
  const { expanded, onExpandedChange } = steps;
  const sections = stepSections({ steps, plugs, split, pieces });

  return (
    <aside className="left-panel">
      <ActionBar onOpenSTL={file.onOpenSTL} />
      <p className="file-path" title={file.fileName ?? undefined}>
        {file.fileName ?? 'No file selected'}
      </p>
      {sections.map((section) => (
        <Accordion
          key={section.id}
          title={section.title}
          enabled={section.enabled}
          expanded={expanded === section.id}
          onToggle={() => onExpandedChange(expanded === section.id ? null : section.id)}
        >
          {section.content}
        </Accordion>
      ))}
      <div className="spacer" />
      <ObjectStatsPanel stats={file.stats} />
      <DonationBanner />
    </aside>
  );
}
