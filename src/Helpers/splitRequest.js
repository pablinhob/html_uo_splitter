import { SUBTRACTION_MARGIN_MM } from '../config';
import { requireBoard } from './boardRequests';
import { meshDataFromManifold } from './manifold';
import { meshTransferables } from './meshData';
import { keyId } from './pieces';
import { collectPlugCavities, overlappingCavities } from './plugSolids';
import splitBoard from './splitBoard';

// Malla de la pieza para el visor, con el hueco de las cavidades que la tocan.
function drilledMeshData(wasm, { manifold, meshData }, cavities) {
  const overlapping = overlappingCavities(manifold, cavities);
  if (overlapping.length === 0) return meshData;
  const drilled = wasm.Manifold.difference([manifold, ...overlapping]);
  const drilledMesh = meshDataFromManifold(drilled);
  drilled.delete();
  return drilledMesh;
}

// Las piezas tal como se ven: con los plugs restados si se pasan `plugs`.
function displayedPieces(wasm, probe, pieces, plugs) {
  if (!plugs) return pieces.map(({ key, meshData }) => ({ key, meshData }));
  const cavities = collectPlugCavities({ wasm, probe }, plugs, SUBTRACTION_MARGIN_MM);
  try {
    return pieces.map((piece) => ({
      key: piece.key,
      meshData: drilledMeshData(wasm, piece, cavities),
    }));
  } finally {
    cavities.forEach((cavity) => cavity.delete());
  }
}

/**
 * Petición `split` del Worker (on_execute de main_window.py). params:
 * { shape, pieceRadiusMm, stringerWidthMm, cutlapWidthMm }. Con `plugs` (como
 * DEFAULT_PLUGS), las mallas devueltas llevan ya el hueco de los plugs, igual que
 * al exportar. La tienda guarda las piezas sin restar, que son las que usan el
 * vaciado y la exportación. Devuelve { pieces: [{ key, meshData }], cutOutlines }.
 */
export default function splitRequest({ params, plugs }, { wasm, store, progress }) {
  const { manifold, probe } = requireBoard(store, true);
  progress(`Splitting board into ${params.shape.toLowerCase()} pieces`);
  const { pieces, cutOutlines } = splitBoard(wasm, manifold, params);
  store.setPieces(new Map(pieces.map((piece) => [keyId(piece.key), piece])));
  const shown = displayedPieces(wasm, probe, pieces, plugs);
  return {
    result: { pieces: shown, cutOutlines },
    transfer: [
      ...shown.flatMap(({ meshData }) => meshTransferables(meshData)),
      ...cutOutlines.map(({ segments }) => segments.buffer),
    ],
  };
}
