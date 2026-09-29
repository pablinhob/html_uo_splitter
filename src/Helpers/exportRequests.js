import buildExportPieces from './exportPieces';
import { EXPORT_ENCODERS } from './exportFormats';
import { meshDataFromManifold } from './manifold';
import { meshTransferables } from './meshData';

/**
 * Peticiones de exportación del Worker (export_window.py). Cada una recibe
 * (payload, { wasm, store, progress }) y devuelve { result, transfer }.
 */

/**
 * `processExport` (process_and_show): prepara las piezas finales a partir de las
 * del último split y las guarda en la tienda para exportFile. Devuelve
 * { pieces: [{ key, meshData }], warnings } para mostrarlas en la ventana.
 * params: { hollow, plugs }
 */
export function processExportRequest({ params }, { wasm, store, progress }) {
  if (store.pieces().size === 0) throw new Error('Nothing to export, run a split first');
  const { pieces, warnings } = buildExportPieces(wasm, store, params, progress);
  store.setExportPieces(pieces);
  const meshes = pieces.map(({ key, manifold }) => ({
    key,
    meshData: meshDataFromManifold(manifold),
  }));
  return {
    result: { pieces: meshes, warnings },
    transfer: meshes.flatMap(({ meshData }) => meshTransferables(meshData)),
  };
}

/**
 * `exportFile` (on_export): escribe las piezas procesadas en el formato pedido
 * (fileType de EXPORT_FORMATS) y devuelve { fileName, mimeType, bytes, pieceCount }.
 */
export function exportFileRequest({ fileType }, { store, progress }) {
  const encode = EXPORT_ENCODERS[fileType];
  if (!encode) throw new Error(`Unknown export format '${fileType}'`);
  const pieces = store.exportPieces();
  if (pieces.length === 0) throw new Error('No processed pieces to export yet');
  progress(`Writing ${fileType.toUpperCase()} file`);
  const file = encode(
    pieces.map(({ key, manifold }) => ({ key, meshData: meshDataFromManifold(manifold) })),
  );
  return { result: { ...file, pieceCount: pieces.length }, transfer: [file.bytes.buffer] };
}
