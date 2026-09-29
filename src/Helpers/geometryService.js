import loadBoard from './board';
import { meshTransferables } from './meshData';
import { createSurfaceProbe } from './surface';

const copyMeshData = ({ positions, index }) => ({
  positions: positions.slice(),
  index: index.slice(),
});

/**
 * Operaciones que atiende el Worker de geometría. `handle(type, payload, progress)`
 * devuelve { result, transfer }: `transfer` son los buffers que se envían sin copiar.
 *
 * El servicio guarda entre peticiones lo que no conviene reenviar de la tabla
 * cargada: su Manifold (booleanas: split, plugs, vaciado) y su sonda de
 * superficie (rayos: colocación de los plugs). El Manifold es null si la malla
 * no se ha podido cerrar; la sonda existe siempre que haya tabla.
 */
export default function createGeometryService(wasm) {
  let board = { manifold: null, probe: null };

  const replaceBoard = (next) => {
    board.manifold?.delete();
    board.probe?.dispose();
    board = next;
  };

  const handlers = {
    loadBoard({ buffer }, progress) {
      progress('Parsing and repairing STL');
      const { meshData, manifold, stats, repair } = loadBoard(wasm, buffer);
      // La sonda usa su propia copia: meshData se transfiere a la interfaz.
      replaceBoard({ manifold, probe: createSurfaceProbe(copyMeshData(meshData)) });
      return { result: { meshData, stats, repair }, transfer: meshTransferables(meshData) };
    },
  };

  return {
    handle(type, payload, progress) {
      const handler = handlers[type];
      if (!handler) throw new Error(`Unknown geometry request '${type}'`);
      return handler(payload, progress);
    },
    hasBoard: () => board.manifold !== null,
    surfaceProbe: () => board.probe,
    dispose: () => replaceBoard({ manifold: null, probe: null }),
  };
}
