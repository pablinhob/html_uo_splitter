import {
  BOARD_COLOR,
  CUTLAP_COLOR,
  PLUG_SUPPORT_COLOR,
  STRINGER_COLOR,
} from '../config'

// Las claves de pieza son arrays, igual que las tuplas de Python:
// ['stringer'], ['a', 3], ['a', 'cutlap', 2]...

export const PIECE_LABELS = { stringer: 'Stringer', a: 'Side A', b: 'Side B' }
export const CUTLAP_LABELS = { a: 'Cutlap A', b: 'Cutlap B' }
export const ALL_KEY = ['all']

export const keyId = (key) => key.join('|')

export function classifyPiece(key) {
  if (!key) return 'none'
  if (keyId(key) === 'all') return 'group'
  if (keyId(key) === 'stringer') return 'stringer'
  if (key.length === 1) return 'group'
  if (key[1] === 'cutlap') return key.length === 3 ? 'cutlap_piece' : 'group'
  return 'core'
}

export function pieceColor(key) {
  if (key[0] === 'support') return PLUG_SUPPORT_COLOR
  if (key[0] === 'stringer') return STRINGER_COLOR
  if (key.length === 3 && key[1] === 'cutlap') return CUTLAP_COLOR
  return BOARD_COLOR
}

export function matchesSelection(selection, key) {
  if (keyId(selection) === 'all') return true
  return keyId(key.slice(0, selection.length)) === keyId(selection)
}

// Árbol equivalente a PiecesPanel.populate(): All, piezas sueltas y, por cada
// mitad, su grupo de cutlaps y sus Main Splits.
export function buildPiecesTree(pieceKeys) {
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
