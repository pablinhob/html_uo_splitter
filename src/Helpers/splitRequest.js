import { requireBoard } from './boardRequests';
import { meshTransferables } from './meshData';
import { keyId } from './pieces';
import splitBoard from './splitBoard';

/**
 * Petición `split` del Worker (on_execute de main_window.py). params:
 * { shape, pieceRadiusMm, stringerWidthMm, cutlapWidthMm }. Guarda los Manifold de
 * las piezas en la tienda y devuelve { pieces: [{ key, meshData }], cutOutlines }.
 */
export default function splitRequest({ params }, { wasm, store, progress }) {
  const { manifold } = requireBoard(store, true);
  progress(`Splitting board into ${params.shape.toLowerCase()} pieces`);
  const { pieces, cutOutlines } = splitBoard(wasm, manifold, params);
  store.setPieces(new Map(pieces.map((piece) => [keyId(piece.key), piece])));
  return {
    result: {
      pieces: pieces.map(({ key, meshData }) => ({ key, meshData })),
      cutOutlines,
    },
    transfer: [
      ...pieces.flatMap(({ meshData }) => meshTransferables(meshData)),
      ...cutOutlines.map(({ segments }) => segments.buffer),
    ],
  };
}
