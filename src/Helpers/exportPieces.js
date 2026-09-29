import { SUBTRACTION_MARGIN_MM } from '../config';
import { hollowStoredPiece } from './hollowRequest';
import { isHollowable, keyId } from './pieces';
import { collectPlugCavities, collectPlugSupports } from './plugSolids';

/**
 * Piezas finales de la exportación (process_and_show de export_window.py):
 *   1. se vacía cada pieza del núcleo (el resto se copia),
 *   2. se le restan las cavidades de los plugs que la tocan,
 *   3. se le añaden, como piezas aparte, los soportes recortados a su celda
 *      original (sin vaciar), a los que también se restan las cavidades.
 * Devuelve { pieces: [{ key, manifold }], warnings: [texto] }; el llamante libera
 * los Manifold. Los errores de una pieza no paran el resto (como en Python).
 */

function boundsOverlap(first, second) {
  const firstBox = first.boundingBox();
  const secondBox = second.boundingBox();
  return [0, 1, 2].every(
    (axis) =>
      firstBox.min[axis] <= secondBox.max[axis] && secondBox.min[axis] <= firstBox.max[axis],
  );
}

// _subtract_plugs: resta las cavidades que se solapan con la pieza (y la libera).
function subtractPlugs(wasm, piece, cavities) {
  const overlapping = cavities.filter((cavity) => boundsOverlap(piece, cavity));
  if (overlapping.length === 0) return piece;
  const result = wasm.Manifold.difference([piece, ...overlapping]);
  piece.delete();
  return result;
}

// _support_fragments: cada soporte recortado a la celda y taladrado.
function supportFragments(wasm, key, cell, context) {
  return context.supports.flatMap((support, index) => {
    if (!boundsOverlap(cell, support)) return [];
    const fragment = cell.intersect(support);
    if (fragment.isEmpty()) {
      fragment.delete();
      return [];
    }
    return [
      { key: ['support', index, key], manifold: subtractPlugs(wasm, fragment, context.cavities) },
    ];
  });
}

function finalPiece(wasm, store, { key, manifold }, context) {
  let piece;
  if (isHollowable(key)) {
    try {
      piece = hollowStoredPiece(wasm, store, key, context.hollow);
    } catch (error) {
      context.warnings.push(`Could not hollow piece ${keyId(key)}: ${error.message}`);
      piece = manifold.translate(0, 0, 0);
    }
  } else {
    piece = manifold.translate(0, 0, 0);
  }
  return [
    { key, manifold: subtractPlugs(wasm, piece, context.cavities) },
    ...supportFragments(wasm, key, manifold, context),
  ];
}

// params: { hollow, plugs }. progress(texto) informa de cada pieza.
export default function buildExportPieces(wasm, store, { hollow, plugs }, progress) {
  const { probe } = store.board();
  const board = { wasm, probe };
  const context = {
    hollow,
    cavities: collectPlugCavities(board, plugs, SUBTRACTION_MARGIN_MM),
    supports: collectPlugSupports(board, plugs),
    warnings: [],
  };
  try {
    const stored = [...store.pieces().values()];
    const pieces = stored.flatMap((piece, index) => {
      progress(`Processing piece ${index + 1}/${stored.length}: ${keyId(piece.key)}...`);
      return finalPiece(wasm, store, piece, context);
    });
    return { pieces, warnings: context.warnings };
  } finally {
    [...context.cavities, ...context.supports].forEach((solid) => solid.delete());
  }
}
