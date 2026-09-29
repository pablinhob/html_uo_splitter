import { useState } from 'react'
import { DEFAULT_HOLLOW, DEFAULT_PLUGS, DEFAULT_SPLIT } from './config'
import { logger } from './Helpers/logger'
import { keyId } from './Helpers/pieces'
import { computeObjectStats, faceCount, loadStl, vertexCount } from './Helpers/stl'
import useViewerObjects from './Hooks/useViewerObjects'
import ExportDialog from './Components/ExportDialog'
import LeftPanel from './Components/LeftPanel/LeftPanel'
import RightPanel from './Components/RightPanel/RightPanel'

// La lógica geométrica (core/) aún no está migrada: estas acciones solo avisan.
const NOT_MIGRATED = 'not migrated yet (core geometry pending)'

export default function App() {
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

  // Sección abierta del acordeón: 'plugs' | 'split' | 'pieces' | null
  const [expanded, setExpanded] = useState(null)

  const viewerObjects = useViewerObjects(mesh, pieces, selectedPiece)

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
      <LeftPanel
        fileName={fileName}
        hasMesh={Boolean(mesh)}
        hasPieces={pieces.length > 0}
        stats={stats}
        busy={busy}
        expanded={expanded}
        onExpandedChange={setExpanded}
        onOpenStl={onOpenStl}
        plugs={plugs}
        onPlugsChange={setPlugs}
        split={split}
        onSplitChange={setSplit}
        onExecute={onExecute}
        piecesPanelProps={{
          pieceKeys: pieces.map((piece) => piece.key),
          selected: selectedPiece,
          onSelect: onSelectPiece,
          hollow,
          onHollowChange,
          onApply: onApplyHollow,
          onExport: onExportHollow,
          exportEnabled,
        }}
      />

      <RightPanel viewerObjects={viewerObjects} />

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
