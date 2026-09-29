import Accordion from '../Misc/Accordion'
import ActionBar from './ActionBar/ActionBar'
import ObjectStatsPanel from './ObjectStatsPanel'
import PiecesPanel from './PiecesPanel/PiecesPanel'
import PlugsSetupPanel from './PlugsSetupPanel/PlugsSetupPanel'
import SplitterParametrizationPanel from './SplitterParametrizationPanel'

/**
 * Panel izquierdo: acciones, fichero cargado, los tres pasos en acordeón
 * exclusivo (solo uno abierto a la vez) e información del objeto.
 * El estado vive en App; aquí solo se presenta.
 */
export default function LeftPanel({
  fileName,
  hasMesh,
  hasPieces,
  stats,
  busy,
  expanded,
  onExpandedChange,
  onOpenStl,
  plugs,
  onPlugsChange,
  split,
  onSplitChange,
  onExecute,
  piecesPanelProps,
}) {
  const toggle = (section) => onExpandedChange(expanded === section ? null : section)

  return (
    <aside className="left-panel">
      <ActionBar onOpenStl={onOpenStl} />

      <p className="file-path" title={fileName ?? undefined}>
        {fileName ?? 'No file selected'}
      </p>

      <Accordion
        title="1 - Plugs setup"
        enabled={hasMesh}
        expanded={expanded === 'plugs'}
        onToggle={() => toggle('plugs')}
      >
        <PlugsSetupPanel
          value={plugs}
          onChange={onPlugsChange}
          onContinue={() => onExpandedChange('split')}
        />
      </Accordion>
      <Accordion
        title="2 - Split model into polygons"
        enabled={hasMesh}
        expanded={expanded === 'split'}
        onToggle={() => toggle('split')}
      >
        <SplitterParametrizationPanel
          value={split}
          onChange={onSplitChange}
          onExecute={onExecute}
          busy={busy}
        />
      </Accordion>
      <Accordion
        title="3 - Process polygons"
        enabled={hasPieces}
        expanded={expanded === 'pieces'}
        onToggle={() => toggle('pieces')}
      >
        <PiecesPanel {...piecesPanelProps} />
      </Accordion>

      <div className="spacer" />
      <ObjectStatsPanel stats={stats} />
    </aside>
  )
}
