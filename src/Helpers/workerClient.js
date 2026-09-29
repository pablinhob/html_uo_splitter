/**
 * Cliente del Worker de geometría: convierte el protocolo de mensajes de
 * geometryWorker.js en promesas. `request(type, payload, { transfer, onProgress })`
 * se resuelve con el resultado o se rechaza con un Error con el mensaje del Worker.
 */
export default function createWorkerClient(worker) {
  const pending = new Map();
  let nextId = 0;

  const settle = (id, settleWith) => {
    const entry = pending.get(id);
    if (!entry) return;
    pending.delete(id);
    settleWith(entry);
  };

  const onMessage = ({ data }) => {
    const { id, kind } = data;
    if (kind === 'progress') {
      pending.get(id)?.onProgress?.(data.message);
      return;
    }
    if (kind === 'result') settle(id, (entry) => entry.resolve(data.result));
    if (kind === 'error') settle(id, (entry) => entry.reject(new Error(data.message)));
  };

  // Un fallo del propio Worker (p. ej. al cargar el WASM) rechaza todo lo pendiente.
  const onError = (event) => {
    const error = new Error(`Geometry worker failed: ${event.message ?? 'unknown error'}`);
    pending.forEach((entry) => entry.reject(error));
    pending.clear();
  };

  worker.addEventListener('message', onMessage);
  worker.addEventListener('error', onError);

  return {
    request(type, payload, { transfer = [], onProgress } = {}) {
      nextId += 1;
      const id = nextId;
      return new Promise((resolve, reject) => {
        pending.set(id, { resolve, reject, onProgress });
        worker.postMessage({ id, type, payload }, transfer);
      });
    },
    terminate() {
      worker.removeEventListener('message', onMessage);
      worker.removeEventListener('error', onError);
      worker.terminate();
      onError({ message: 'terminated' });
    },
  };
}
