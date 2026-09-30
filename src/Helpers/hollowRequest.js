import { buildPreviewPiece } from './exportPieces';
import hollowStoredPiece from './hollowStoredPiece';
import { meshDataFromManifold } from './manifold';
import { meshTransferables } from './meshData';
import { keyId } from './pieces';

/**
 * Petición `hollowPiece` (on_apply_hollow de main_window.py): vacía la pieza
 * original (no la ya vaciada que muestre el visor) y devuelve { key, meshData }.
 * hollow: { wallMm, topMm, bottomMm, holePct }. Con `plugs` (como DEFAULT_PLUGS) la
 * previsualización es la pieza final de la exportación: con las cavidades de los
 * plugs restadas y sus soportes.
 */
export default function hollowRequest({ key, hollow, plugs }, { wasm, store, progress }) {
  progress(`Hollowing ${keyId(key)}`);
  const hollowed = plugs
    ? buildPreviewPiece(wasm, store, key, { hollow, plugs })
    : hollowStoredPiece(wasm, store, key, hollow);
  const meshData = meshDataFromManifold(hollowed);
  hollowed.delete();
  return { result: { key, meshData }, transfer: meshTransferables(meshData) };
}
