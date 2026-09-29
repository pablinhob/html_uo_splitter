import { useMemo, useRef, useState } from 'react'
import {
  BOARD_COLOR,
  CUTLAP_COLOR,
  PLUG_SUPPORT_COLOR,
  STRINGER_COLOR,
} from './config'
import { logger } from './logger'
import { computeObjectStats, faceCount, loadStl, vertexCount } from './mesh/stl'
import { Accordion } from './components/controls'
import {
  ALL_KEY,
  DEFAULT_HOLLOW,
  DEFAULT_PLUGS,
  DEFAULT_SPLIT,
  keyId,
  ObjectStatsPanel,
  PiecesPanel,
  PlugsSetupPanel,
  SplitterParametrizationPanel,
} from './components/panels'
import Viewer from './components/Viewer'
import LogConsole from './components/LogConsole'
import ExportDialog from './components/ExportDialog'

const GHOST_COLOR = '#808080'
const GHOST_OPACITY = 0.1

// La lógica geométrica (core/) aún no está migrada: estas acciones solo avisan.
const NOT_MIGRATED = 'not migrated yet (core geometry pending)'

function pieceColor(key) {
  if (key[0] === 'support') return PLUG_SUPPORT_COLOR
  if (key[0] === 'stringer') return STRINGER_COLOR
  if (key.length === 3 && key[1] === 'cutlap') return CUTLAP_COLOR
  return BOARD_COLOR
}

function matchesSelection(selection, key) {
  if (keyId(selection) === 'all') return true
  return keyId(key.slice(0, selection.length)) === keyId(selection)
}

const PlusIcon = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <path d="M12 4v16M4 12h16" />
  </svg>
)
const FolderIcon = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <path d="M3 6h6l2 2h10v11H3z" />
  </svg>
)
const SaveIcon = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <path d="M4 4h13l3 3v13H4zM8 4v5h8V4M8 20v-6h8v6" />
  </svg>
)

function ActionButton({ icon, label, onClick, disabled }) {
  return (
    <button type="button" className="action-button" title={label} onClick={onClick} disabled={disabled}>
      {icon}
      <span>{label}</span>
    </button>
  )
}

export default function App() {
  const fileInputRef = useRef(null)

  const [mesh, setMesh] = useState(null)
  const [fileName, setFileName] = useState(null)
  const [stats, setStats] = useState(null)
  const [busy, setBusy] = useState(false)

  const [plugs, setPlugs] = useState(DEFAULT_PLUGS)
  const [split, setSplit] = useState(DEFAULT_SPLIT)
  const [hollow, setHollow] = useState(DEFAULT_HOLLOW)

  // pieces: [{ key, geometry }] (clave como array, p. ej. ['a', 'cutlap', 2])
  const [pieces, setPieces] = useState([])
  const [selectedPiece, setSelectedPiece] = useState(null)
  const [exportEnabled, setExportEnabled] = useState(false)
  const [exportOpen, setExportOpen] = useState(false)

  // Acordeón exclusivo: solo una sección abierta a la vez.
  const [expanded, setExpanded] = useState(null)
  const toggle = (section) => setExpanded((current) => (current === section ? null : section))

  const viewerObjects = useMemo(() => {
    if (pieces.length) {
      const selection = selectedPiece ?? ALL_KEY
      const objects = pieces.map(({ key, geometry }) => ({
        key: keyId(key),
        geometry,
        color: pieceColor(key),
        visible: matchesSelection(selection, key),
        edges: true,
        frame: true,
      }))
      if (mesh && keyId(selection) !== 'all') {
        objects.push({ key: 'ghost', geometry: mesh, color: GHOST_COLOR, opacity: GHOST_OPACITY })
      }
      return objects
    }
    return mesh ? [{ key: 'board', geometry: mesh, color: BOARD_COLOR, frame: true }] : []
  }, [mesh, pieces, selectedPiece])

  const onOpenStl = async (event) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) {
      logger.info('STL loading cancelled')
      return
    }

    setFileName(file.name)
    setPieces([])
    setSelectedPiece(null)
    setExportEnabled(false)
    if (expanded === 'pieces') setExpanded(null)

    logger.info(`Loading file: ${file.name}`)
    setBusy(true)
    try {
      const geometry = await loadStl(file)
      mesh?.dispose()
      setMesh(geometry)
      setExpanded('plugs')
      logger.info(
        `STL loaded successfully: ${vertexCount(geometry)} vertices, ${faceCount(geometry)} faces`,
      )
      const objectStats = computeObjectStats(geometry)
      setStats(objectStats)
      const [x, y, z] = objectStats.sizeCm
      logger.info(
        `Bounding box: ${x.toFixed(1)} x ${y.toFixed(1)} x ${z.toFixed(1)} cm, ` +
          `volume: ${objectStats.volumeCm3.toFixed(1)} cm3 (${objectStats.volumeLiters.toFixed(2)} L)`,
      )
    } catch (error) {
      logger.error(`Could not parse STL file '${file.name}': ${error.message}`)
      mesh?.dispose()
      setMesh(null)
      setStats(null)
      setExpanded(null)
    } finally {
      setBusy(false)
    }
  }

  const onExecute = () => {
    if (!mesh) {
      logger.warning('No STL loaded, nothing to split')
      return
    }
    logger.info(`Splitting board lengthwise and into ${split.shape.toLowerCase()} pieces...`)
    logger.warning(`Split: ${NOT_MIGRATED}`)
  }

  const onSelectPiece = (key, label) => {
    setSelectedPiece(key)
    setExportEnabled(false)
    logger.info(`Showing: ${label}`)
  }

  const onHollowChange = (next) => {
    setHollow(next)
    setExportEnabled(false)
  }

  const onApplyHollow = () => {
    if (!selectedPiece || selectedPiece.length !== 2 || selectedPiece[1] === 'cutlap') {
      logger.warning('Select a core piece before applying')
      return
    }
    logger.info(
      `Hollowing ${keyId(selectedPiece)}: wall=${hollow.wall} mm, top=${hollow.top} mm, ` +
        `bottom=${hollow.bottom} mm, hole=${hollow.holePct}%`,
    )
    logger.warning(`Preview hollowing: ${NOT_MIGRATED}`)
  }

  const onExportHollow = () => {
    if (!pieces.length) {
      logger.warning('Nothing to export, run a preview first')
      return
    }
    logger.info('Exporting hollowing for all pieces...')
    setExportOpen(true)
  }

  return (
    <div className={`app${busy ? ' busy' : ''}`}>
      <aside className="left-panel">
        <div className="actions">
          <ActionButton icon={<PlusIcon />} label="Add STL shape" onClick={() => fileInputRef.current.click()} />
          <ActionButton icon={<FolderIcon />} label="Open Previous" disabled />
          <ActionButton icon={<SaveIcon />} label="Save Project" disabled />
          <ActionButton icon={<SaveIcon />} label="Save As" disabled />
          <input ref={fileInputRef} type="file" accept=".stl" hidden onChange={onOpenStl} />
        </div>

        <p className="file-path" title={fileName ?? undefined}>
          {fileName ?? 'No file selected'}
        </p>

        <Accordion
          title="1 - Plugs setup"
          enabled={!!mesh}
          expanded={expanded === 'plugs'}
          onToggle={() => toggle('plugs')}
        >
          <PlugsSetupPanel value={plugs} onChange={setPlugs} onContinue={() => setExpanded('split')} />
        </Accordion>
        <Accordion
          title="2 - Split model into polygons"
          enabled={!!mesh}
          expanded={expanded === 'split'}
          onToggle={() => toggle('split')}
        >
          <SplitterParametrizationPanel value={split} onChange={setSplit} onExecute={onExecute} busy={busy} />
        </Accordion>
        <Accordion
          title="3 - Process polygons"
          enabled={pieces.length > 0}
          expanded={expanded === 'pieces'}
          onToggle={() => toggle('pieces')}
        >
          <PiecesPanel
            pieceKeys={pieces.map((piece) => piece.key)}
            selected={selectedPiece}
            onSelect={onSelectPiece}
            hollow={hollow}
            onHollowChange={onHollowChange}
            onApply={onApplyHollow}
            onExport={onExportHollow}
            exportEnabled={exportEnabled}
          />
        </Accordion>

        <div className="spacer" />
        <ObjectStatsPanel stats={stats} />
      </aside>

      <main className="right-panel">
        <Viewer objects={viewerObjects} />
        <LogConsole />
      </main>

      <ExportDialog
        open={exportOpen}
        status="Processing hollowing for every piece, this may take a while..."
        objects={[]}
        ready={false}
        onExport={() => logger.warning(`Export file: ${NOT_MIGRATED}`)}
        onClose={() => setExportOpen(false)}
      />
    </div>
  )
}
