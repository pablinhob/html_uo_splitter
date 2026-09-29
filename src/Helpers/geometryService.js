import loadBoard from './board';
import { meshTransferables } from './meshData';

/**
 * Operaciones que atiende el Worker de geometría. `handle(type, payload, progress)`
 * devuelve { result, transfer }: `transfer` son los buffers que se envían sin copiar.
 *
 * El servicio guarda entre peticiones lo que no conviene reenviar: el Manifold de
 * la tabla cargada, que usarán el split, los plugs y el vaciado.
 */
export default function createGeometryService(wasm) {
  let boardManifold = null;

  const replaceBoard = (manifold) => {
    boardManifold?.delete();
    boardManifold = manifold;
  };

  const handlers = {
    loadBoard({ buffer }, progress) {
      progress('Parsing and repairing STL');
      const { meshData, manifold, stats, repair } = loadBoard(wasm, buffer);
      replaceBoard(manifold);
      return { result: { meshData, stats, repair }, transfer: meshTransferables(meshData) };
    },
  };

  return {
    handle(type, payload, progress) {
      const handler = handlers[type];
      if (!handler) throw new Error(`Unknown geometry request '${type}'`);
      return handler(payload, progress);
    },
    hasBoard: () => boardManifold !== null,
    dispose: () => replaceBoard(null),
  };
}
