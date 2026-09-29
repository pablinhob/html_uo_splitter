import { loadBoardRequest, plugMarkersRequest } from './boardRequests';
import { exportFileRequest, processExportRequest } from './exportRequests';
import createGeometryStore from './geometryStore';
import hollowRequest from './hollowRequest';
import splitRequest from './splitRequest';

/**
 * Operaciones que atiende el Worker de geometría. `handle(type, payload, progress)`
 * devuelve { result, transfer }: `transfer` son los buffers que se envían sin copiar.
 * Cada petición vive en su módulo y recibe (payload, { wasm, store, progress }); la
 * tienda (geometryStore.js) guarda la tabla y las piezas entre peticiones.
 */
const requests = {
  loadBoard: loadBoardRequest,
  plugMarkers: plugMarkersRequest,
  split: splitRequest,
  hollowPiece: hollowRequest,
  processExport: processExportRequest,
  exportFile: exportFileRequest,
};

export default function createGeometryService(wasm) {
  const store = createGeometryStore();

  return {
    handle(type, payload, progress) {
      const request = requests[type];
      if (!request) throw new Error(`Unknown geometry request '${type}'`);
      return request(payload, { wasm, store, progress });
    },
    hasBoard: () => store.board().manifold !== null,
    surfaceProbe: () => store.board().probe,
    pieceCount: () => store.pieces().size,
    dispose: () => store.dispose(),
  };
}
