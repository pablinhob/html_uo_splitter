import { BOARD_COLOR, CUTLAP_COLOR, PLUG_SUPPORT_COLOR, STRINGER_COLOR } from '../config';

// Las claves de pieza son arrays, igual que las tuplas de Python:
// ['stringer'], ['a', 3], ['a', 'cutlap', 2]...

export const PIECE_LABELS = { stringer: 'Stringer', a: 'Side A', b: 'Side B' };
export const CUTLAP_LABELS = { a: 'Cutlap A', b: 'Cutlap B' };
export const ALL_KEY = ['all'];

export const keyId = (key) => key.join('|');

// La selección es "all" (toda la tabla): no hay pieza que previsualizar, pero sí se
// pueden ajustar los parámetros de vaciado y exportar todas las piezas.
export const isAllSelected = (key) => Boolean(key) && keyId(key) === keyId(ALL_KEY);

export function classifyPiece(key) {
  if (!key) return 'none';
  if (keyId(key) === 'all') return 'group';
  if (keyId(key) === 'stringer') return 'stringer';
  if (key.length === 1) return 'group';
  if (key[1] === 'cutlap') return key.length === 3 ? 'cutlap_piece' : 'group';
  return 'core';
}

export function pieceColor(key) {
  if (key[0] === 'support') return PLUG_SUPPORT_COLOR;
  if (key[0] === 'stringer') return STRINGER_COLOR;
  if (key.length === 3 && key[1] === 'cutlap') return CUTLAP_COLOR;
  return BOARD_COLOR;
}

export function matchesSelection(selection, key) {
  if (keyId(selection) === 'all') return true;
  return keyId(key.slice(0, selection.length)) === keyId(selection);
}

const leafNode = (key, label) => ({ key, label, children: [] });

// Ordena por el índice de la clave y numera desde 1 ("Main Split 1", ...).
const numberedNodes = (keys, indexPosition, prefix) =>
  [...keys]
    .sort((left, right) => left[indexPosition] - right[indexPosition])
    .map((key, position) => leafNode(key, `${prefix} ${position + 1}`));

// Agrupa las claves de cada mitad ('a', 'b') en piezas interiores y de cutlap.
function groupBySide(pieceKeys) {
  const sides = new Map();
  pieceKeys
    .filter((key) => key.length > 1)
    .forEach((key) => {
      const [half] = key;
      if (!sides.has(half)) sides.set(half, { interior: [], cutlap: [] });
      const group = sides.get(half);
      if (key.length === 2) group.interior.push(key);
      if (key.length === 3 && key[1] === 'cutlap') group.cutlap.push(key);
    });
  return sides;
}

function sideNode(half, group) {
  const children = numberedNodes(group.interior, 1, 'Main Split');
  if (group.cutlap.length > 0) {
    children.unshift({
      key: [half, 'cutlap'],
      label: CUTLAP_LABELS[half] ?? 'Cutlap',
      children: numberedNodes(group.cutlap, 2, 'Cutlap split'),
    });
  }
  return { key: [half], label: PIECE_LABELS[half] ?? half, children };
}

// Árbol equivalente a PiecesPanel.populate(): All, piezas sueltas y, por cada
// mitad, su grupo de cutlaps y sus Main Splits.
export function buildPiecesTree(pieceKeys) {
  const singles = pieceKeys
    .filter((key) => key.length === 1)
    .map((key) => leafNode(key, PIECE_LABELS[key[0]] ?? key[0]));
  const sides = Array.from(groupBySide(pieceKeys), ([half, group]) => sideNode(half, group));
  return [leafNode(ALL_KEY, 'All'), ...singles, ...sides];
}

// Etiqueta de una pieza en el árbol ("Main Split 3"...), para el log al seleccionarla.
export function pieceLabel(pieceKeys, key) {
  const find = (nodes) =>
    nodes.reduce(
      (found, node) => found ?? (keyId(node.key) === keyId(key) ? node.label : find(node.children)),
      null,
    );
  return find(buildPiecesTree(pieceKeys)) ?? keyId(key);
}

/**
 * Nombre de cada objeto en el fichero exportado (_piece_name de export_window.py):
 * "Stringer", "Side A - Split 3", "Cutlap B - Split 1", "Support 2 - Side A - Split 3".
 * Los soportes tienen clave ['support', índice, claveDeLaCelda].
 */
export function pieceName(key) {
  if (key[0] === 'support') return `Support ${key[1] + 1} - ${pieceName(key[2])}`;
  if (key.length === 1) return PIECE_LABELS[key[0]] ?? String(key[0]);
  if (key.length === 3 && key[1] === 'cutlap') {
    return `${CUTLAP_LABELS[key[0]] ?? 'Cutlap'} - Split ${key[2] + 1}`;
  }
  if (key.length === 2) return `${PIECE_LABELS[key[0]] ?? key[0]} - Split ${key[1] + 1}`;
  return key.join('-');
}

// Pieza del núcleo que se puede vaciar (_is_hollowable): ni stringer ni cutlap.
export const isHollowable = (key) => key.length === 2 && key[1] !== 'cutlap';
