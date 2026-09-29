import wasmUrl from 'manifold-3d/manifold.wasm?url';
import createGeometryService from './geometryService';
import { loadManifoldModule } from './manifold';

/**
 * Entrada del Web Worker de geometría. Protocolo (ver workerClient.js):
 *   entrada: { id, type, payload }
 *   salida:  { id, kind: 'progress', message } | { id, kind: 'result', result }
 *            | { id, kind: 'error', message }
 */
const servicePromise = loadManifoldModule(wasmUrl).then(createGeometryService);

self.addEventListener('message', async ({ data }) => {
  const { id, type, payload } = data;
  const progress = (message) => self.postMessage({ id, kind: 'progress', message });
  try {
    const service = await servicePromise;
    const { result, transfer } = service.handle(type, payload, progress);
    self.postMessage({ id, kind: 'result', result }, transfer);
  } catch (error) {
    self.postMessage({ id, kind: 'error', message: error?.message ?? String(error) });
  }
});
