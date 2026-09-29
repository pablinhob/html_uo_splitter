import {
  BOTTOM_WIDTH_MM,
  CUTLAP_WIDTH_MM,
  FIN_SINGLE_BOX_DEPTH_MM,
  FIN_SINGLE_BOX_LONG_MM,
  FIN_SINGLE_BOX_WIDTH_MM,
  FIN_SINGLE_TAIL_DISTANCE_MM,
  FIN_TWIN_ANGLE_DEG,
  FIN_TWIN_CENTER_DISTANCE_MM,
  FIN_TWIN_TAIL_DISTANCE_MM,
  HOLE_RADIUS_PCT,
  LEASH_PLUG_CENTER_MM,
  LEASH_PLUG_DEPTH_MM,
  LEASH_PLUG_DIAMETER_MM,
  LEASH_PLUG_TAIL_DISTANCE_MM,
  PIECE_RADIUS_MM,
  STRINGER_WIDTH_MM,
  TOP_WIDTH_MM,
  WALL_WIDTH_MM,
} from '../config'
import { GroupBox, SliderField, SpinField } from './controls'

export const SPLIT_SHAPES = ['Hexagon', 'Triangle']
export const FIN_TYPES = [
  { value: 'single', label: 'Single Fin' },
  { value: 'twin', label: 'Twin Fin' },
]

export const PIECE_LABELS = { stringer: 'Stringer', a: 'Side A', b: 'Side B' }
export const CUTLAP_LABELS = { a: 'Cutlap A', b: 'Cutlap B' }

const GROUP_HINT = 'Select a piece from the board core to enable actions.'
const STRINGER_HINT = 'No actions available for this piece. Select a piece from the board core.'
const CUTLAP_HINT = 'No actions available for cutlap pieces. Select a piece from the board core.'

export const DEFAULT_PLUGS = {
  leash: {
    diameter: LEASH_PLUG_DIAMETER_MM.default,
    depth: LEASH_PLUG_DEPTH_MM.default,
    tailDistance: LEASH_PLUG_TAIL_DISTANCE_MM.default,
    center: LEASH_PLUG_CENTER_MM.default,
  },
  fin: {
    type: 'single',
    singleBoxLong: FIN_SINGLE_BOX_LONG_MM.default,
    singleBoxWidth: FIN_SINGLE_BOX_WIDTH_MM.default,
    singleBoxDepth: FIN_SINGLE_BOX_DEPTH_MM.default,
    singleTailDistance: FIN_SINGLE_TAIL_DISTANCE_MM.default,
    twinTailDistance: FIN_TWIN_TAIL_DISTANCE_MM.default,
    twinCenterDistance: FIN_TWIN_CENTER_DISTANCE_MM.default,
    twinAngle: FIN_TWIN_ANGLE_DEG.default,
  },
}

export const DEFAULT_SPLIT = {
  shape: SPLIT_SHAPES[0],
  pieceRadius: PIECE_RADIUS_MM.default,
  stringerWidth: STRINGER_WIDTH_MM.default,
  cutlapWidth: CUTLAP_WIDTH_MM.default,
}

export const DEFAULT_HOLLOW = {
  wall: WALL_WIDTH_MM.default,
  top: TOP_WIDTH_MM.default,
  bottom: BOTTOM_WIDTH_MM.default,
  holePct: HOLE_RADIUS_PCT.default,
}

// ---------------------------------------------------------------- 1 - Plugs

function LeashPlugPanel({ value, onChange }) {
  const set = (field) => (next) => onChange({ ...value, [field]: next })
  return (
    <GroupBox title="Leash plug box">
      <div className="field-row">
        <SpinField label="Diameter" range={LEASH_PLUG_DIAMETER_MM} value={value.diameter} onChange={set('diameter')} />
        <SpinField label="Deep" range={LEASH_PLUG_DEPTH_MM} value={value.depth} onChange={set('depth')} />
      </div>
      <div className="field-row">
        <SpinField label="Tail distance" range={LEASH_PLUG_TAIL_DISTANCE_MM} value={value.tailDistance} onChange={set('tailDistance')} />
        <SpinField label="Center" range={LEASH_PLUG_CENTER_MM} value={value.center} onChange={set('center')} />
      </div>
    </GroupBox>
  )
}

function FinPlugPanel({ value, onChange }) {
  const set = (field) => (next) => onChange({ ...value, [field]: next })
  return (
    <GroupBox title="Fin plug configuration">
      <select value={value.type} onChange={(event) => set('type')(event.target.value)}>
        {FIN_TYPES.map((type) => (
          <option key={type.value} value={type.value}>
            {type.label}
          </option>
        ))}
      </select>

      {value.type === 'single' ? (
        <>
          <div className="field-row">
            <SpinField label="Box long" range={FIN_SINGLE_BOX_LONG_MM} value={value.singleBoxLong} onChange={set('singleBoxLong')} />
            <SpinField label="Box width" range={FIN_SINGLE_BOX_WIDTH_MM} value={value.singleBoxWidth} onChange={set('singleBoxWidth')} />
          </div>
          <div className="field-row">
            <SpinField label="Box deep" range={FIN_SINGLE_BOX_DEPTH_MM} value={value.singleBoxDepth} onChange={set('singleBoxDepth')} />
            <SpinField label="Tail distance" range={FIN_SINGLE_TAIL_DISTANCE_MM} value={value.singleTailDistance} onChange={set('singleTailDistance')} />
          </div>
        </>
      ) : (
        <>
          <div className="field-row">
            <SpinField label="Tail distance" range={FIN_TWIN_TAIL_DISTANCE_MM} value={value.twinTailDistance} onChange={set('twinTailDistance')} />
            <SpinField label="Center distance" range={FIN_TWIN_CENTER_DISTANCE_MM} value={value.twinCenterDistance} onChange={set('twinCenterDistance')} />
          </div>
          <div className="field-row">
            <SpinField label="Angle" range={FIN_TWIN_ANGLE_DEG} value={value.twinAngle} onChange={set('twinAngle')} unit="°" />
          </div>
        </>
      )}
    </GroupBox>
  )
}

export function PlugsSetupPanel({ value, onChange, onContinue }) {
  return (
    <div className="panel">
      <LeashPlugPanel value={value.leash} onChange={(leash) => onChange({ ...value, leash })} />
      <FinPlugPanel value={value.fin} onChange={(fin) => onChange({ ...value, fin })} />
      <button type="button" onClick={onContinue}>
        Continue
      </button>
    </div>
  )
}

// ---------------------------------------------------------------- 2 - Split

export function SplitterParametrizationPanel({ value, onChange, onExecute, busy }) {
  const set = (field) => (next) => onChange({ ...value, [field]: next })
  return (
    <div className="panel">
      <label className="stacked-field">
        <span>Split polygon</span>
        <select value={value.shape} onChange={(event) => set('shape')(event.target.value)}>
          {SPLIT_SHAPES.map((shape) => (
            <option key={shape}>{shape}</option>
          ))}
        </select>
      </label>
      <SliderField label="Circumscribed radius" range={PIECE_RADIUS_MM} value={value.pieceRadius} onChange={set('pieceRadius')} unit=" mm" />
      <SliderField label="Stringer width" range={STRINGER_WIDTH_MM} value={value.stringerWidth} onChange={set('stringerWidth')} unit=" mm" />
      <SliderField label="Cutlap width" range={CUTLAP_WIDTH_MM} value={value.cutlapWidth} onChange={set('cutlapWidth')} unit=" mm" />
      <button type="button" onClick={onExecute} disabled={busy}>
        Split base polygons
      </button>
    </div>
  )
}

// ---------------------------------------------------------------- 3 - Pieces

// Las claves de pieza son arrays, igual que las tuplas de Python:
// ['stringer'], ['a', 3], ['a', 'cutlap', 2]...
export const keyId = (key) => key.join('|')
export const ALL_KEY = ['all']

export function classifyPiece(key) {
  if (!key) return 'none'
  if (keyId(key) === 'all') return 'group'
  if (keyId(key) === 'stringer') return 'stringer'
  if (key.length === 1) return 'group'
  if (key[1] === 'cutlap') return key.length === 3 ? 'cutlap_piece' : 'group'
  return 'core'
}

// Árbol equivalente a PiecesPanel.populate(): All, piezas sueltas y, por cada
// mitad, su grupo de cutlaps y sus Main Splits.
function buildTree(pieceKeys) {
  const nodes = [{ key: ALL_KEY, label: 'All', children: [] }]
  const sides = new Map()
  for (const key of pieceKeys) {
    if (key.length === 1) {
      nodes.push({ key, label: PIECE_LABELS[key[0]] ?? key[0], children: [] })
      continue
    }
    const half = key[0]
    if (!sides.has(half)) sides.set(half, { interior: [], cutlap: [] })
    const group = sides.get(half)
    if (key.length === 2) group.interior.push(key)
    else if (key.length === 3 && key[1] === 'cutlap') group.cutlap.push(key)
  }

  for (const [half, group] of sides) {
    const halfNode = { key: [half], label: PIECE_LABELS[half] ?? half, children: [] }
    if (group.cutlap.length) {
      halfNode.children.push({
        key: [half, 'cutlap'],
        label: CUTLAP_LABELS[half] ?? 'Cutlap',
        children: [...group.cutlap]
          .sort((a, b) => a[2] - b[2])
          .map((key, index) => ({ key, label: `Cutlap split ${index + 1}`, children: [] })),
      })
    }
    ;[...group.interior]
      .sort((a, b) => a[1] - b[1])
      .forEach((key, index) => halfNode.children.push({ key, label: `Main Split ${index + 1}`, children: [] }))
    nodes.push(halfNode)
  }
  return nodes
}

function TreeNodes({ nodes, selected, onSelect }) {
  return (
    <ul>
      {nodes.map((node) => (
        <li key={keyId(node.key)}>
          <button
            type="button"
            className={`tree-item${selected && keyId(selected) === keyId(node.key) ? ' selected' : ''}`}
            onClick={() => onSelect(node.key, node.label)}
          >
            {node.label}
          </button>
          {node.children.length > 0 && <TreeNodes nodes={node.children} selected={selected} onSelect={onSelect} />}
        </li>
      ))}
    </ul>
  )
}

export function PiecesPanel({
  pieceKeys,
  selected,
  onSelect,
  hollow,
  onHollowChange,
  onApply,
  onExport,
  exportEnabled,
}) {
  const category = classifyPiece(selected)
  const hint = { group: GROUP_HINT, stringer: STRINGER_HINT, cutlap_piece: CUTLAP_HINT }[category]
  const set = (field) => (next) => onHollowChange({ ...hollow, [field]: next })

  return (
    <div className="panel">
      <div className="tree">
        {pieceKeys.length ? (
          <TreeNodes nodes={buildTree(pieceKeys)} selected={selected} onSelect={onSelect} />
        ) : (
          <p className="tree-placeholder">No pieces yet - run Execute to split the board</p>
        )}
      </div>

      {category === 'core' ? (
        <GroupBox title="Polygon hollowing actions">
          <SliderField label="Wall width" range={WALL_WIDTH_MM} value={hollow.wall} onChange={set('wall')} unit=" mm" decimals={1} />
          <SliderField label="Top width" range={TOP_WIDTH_MM} value={hollow.top} onChange={set('top')} unit=" mm" decimals={1} disabled />
          <SliderField label="Bottom width" range={BOTTOM_WIDTH_MM} value={hollow.bottom} onChange={set('bottom')} unit=" mm" decimals={1} disabled />
          <SliderField label="Hole radius" range={HOLE_RADIUS_PCT} value={hollow.holePct} onChange={set('holePct')} unit=" %" />
          <div className="button-row">
            <button type="button" onClick={onApply}>
              Preview hollowing
            </button>
            <button type="button" onClick={onExport} disabled={!exportEnabled}>
              Export Hollowing
            </button>
          </div>
        </GroupBox>
      ) : (
        hint && <p className="hint">{hint}</p>
      )}
    </div>
  )
}

// ---------------------------------------------------------------- Stats

export function ObjectStatsPanel({ stats }) {
  return (
    <GroupBox title="Object info">
      <p>
        Bounding box:{' '}
        {stats ? `${stats.sizeCm.map((v) => v.toFixed(1)).join(' x ')} cm` : '-'}
      </p>
      <p>
        Volume:{' '}
        {stats ? `${stats.volumeCm3.toFixed(1)} cm³ (${stats.volumeLiters.toFixed(2)} L)` : '-'}
      </p>
    </GroupBox>
  )
}
