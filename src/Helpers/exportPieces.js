import { SUBTRACTION_MARGIN_MM } from '../config';
import hollowStoredPiece from './hollowStoredPiece';
import { isHollowable, keyId } from './pieces';
import {
  collectPlugCavities,
  collectPlugSupports,
  overlappingCavities,
  subtractPlugCavities,
} from './plugSolids';

/**
 * Piezas finales de la exportación (process_and_show de export_window.py):
 *   1. se vacía cada pieza del núcleo (el resto se copia),
 *   2. se le restan las cavidades de los plugs que la tocan,
 *   3. se le añaden, como piezas aparte, los soportes recortados a su celda
 *      original (sin vaciar), a los que también se restan las cavidades.
 * Devuelve { pieces: [{ key, manifold }], warnings: [texto] }; el llamante libera
 * los Manifold. Los errores de una pieza no paran el resto (como en Python).
 */

// Cavidades (con el margen de resta) y soportes de los plugs; se liberan con release.
function createPlugContext(wasm, store, { hollow, plugs }) {
  const { probe } = store.board();
  const board = { wasm, probe };
  const context = {
    hollow,
    cavities: collectPlugCavities(board, plugs, SUBTRACTION_MARGIN_MM),
    supports: [],
    warnings: [],
  };
  try {
    context.supports = collectPlugSupports(board, plugs);
  } catch (error) {
    context.cavities.forEach((cavity) => cavity.delete());
    throw error;
  }
  return context;
}

const releasePlugContext = ({ cavities, supports }) =>
  [...cavities, ...supports].forEach((solid) => solid.delete());

// _support_fragments: cada soporte recortado a la celda y taladrado.
function supportFragments(wasm, key, cell, context) {
  return context.supports.flatMap((support, index) => {
    if (overlappingCavities(cell, [support]).length === 0) return [];
    const fragment = cell.intersect(support);
    if (fragment.isEmpty()) {
      fragment.delete();
      return [];
    }
    return [
      {
        key: ['support', index, key],
        manifold: subtractPlugCavities(wasm, fragment, context.cavities),
      },
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
    { key, manifold: subtractPlugCavities(wasm, piece, context.cavities) },
    ...supportFragments(wasm, key, manifold, context),
  ];
}

// params: { hollow, plugs }. progress(texto) informa de cada pieza.
export default function buildExportPieces(wasm, store, params, progress) {
  const context = createPlugContext(wasm, store, params);
  try {
    const stored = [...store.pieces().values()];
    const pieces = stored.flatMap((piece, index) => {
      progress(`Processing piece ${index + 1}/${stored.length}: ${keyId(piece.key)}...`);
      return finalPiece(wasm, store, piece, context);
    });
    return { pieces, warnings: context.warnings };
  } finally {
    releasePlugContext(context);
  }
}

/**
 * Previsualización del vaciado de una pieza: la misma pieza final que exportaría
 * (vaciada, con las cavidades restadas) unida a sus soportes, en un solo Manifold
 * que libera el llamante. Si el vaciado falla, lanza el error en vez de avisar.
 */
export function buildPreviewPiece(wasm, store, key, params) {
  const stored = store.pieces().get(keyId(key));
  if (!stored) throw new Error(`Unknown piece ${keyId(key)}`);
  const context = createPlugContext(wasm, store, params);
  try {
    const parts = finalPiece(wasm, store, stored, context).map((part) => part.manifold);
    if (parts.length === 1 && context.warnings.length === 0) return parts[0];
    const union = context.warnings.length === 0 ? wasm.Manifold.union(parts) : null;
    parts.forEach((part) => part.delete());
    if (!union) throw new Error(context.warnings[0]);
    return union;
  } finally {
    releasePlugContext(context);
  }
}
