import { MARKER_PROTRUSION_MM } from '../config';
import loadBoard from './board';
import { meshDataFromManifold } from './manifold';
import { meshTransferables } from './meshData';
import { collectPlugCavities } from './plugSolids';
import { createSurfaceProbe } from './surface';

/**
 * Peticiones del Worker sobre la tabla: cargarla y colocar los marcadores de los
 * plugs. Cada una recibe (payload, { wasm, store, progress }) y devuelve
 * { result, transfer } (ver geometryService.js).
 */

const copyMeshData = ({ positions, index }) => ({
  positions: positions.slice(),
  index: index.slice(),
});

// Convierte los Manifold en meshData (y los libera) listos para transferir.
export function toTransferableMeshes(manifolds) {
  const meshes = manifolds.map((manifold) => {
    const meshData = meshDataFromManifold(manifold);
    manifold.delete();
    return meshData;
  });
  return { meshes, transfer: meshes.flatMap(meshTransferables) };
}

// El board de la tienda, exigiendo que exista (y que sea sólido si `needsSolid`).
export function requireBoard(store, needsSolid = false) {
  const board = store.board();
  if (!board.probe) throw new Error('No board loaded');
  if (needsSolid && !board.manifold) {
    throw new Error('The board mesh is not watertight, so it cannot be cut');
  }
  return board;
}

export function loadBoardRequest({ buffer }, { wasm, store, progress }) {
  progress('Parsing and repairing STL');
  const { meshData, manifold, stats, repair } = loadBoard(wasm, buffer);
  // La sonda usa su propia copia: meshData se transfiere a la interfaz.
  store.setBoard({ manifold, probe: createSurfaceProbe(copyMeshData(meshData)) });
  return { result: { meshData, stats, repair }, transfer: meshTransferables(meshData) };
}

// _draw_plug_markers de main_window.py: cavidades que sobresalen un pelo.
export function plugMarkersRequest({ plugs }, { wasm, store }) {
  const { probe } = requireBoard(store);
  const cavities = collectPlugCavities({ wasm, probe }, plugs, MARKER_PROTRUSION_MM);
  const { meshes, transfer } = toTransferableMeshes(cavities);
  return { result: { markers: meshes }, transfer };
}
