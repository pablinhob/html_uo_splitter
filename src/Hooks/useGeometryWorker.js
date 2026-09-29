import { useEffect, useMemo, useRef } from 'react';
import createWorkerClient from '../Helpers/workerClient';

const createWorker = () =>
  new Worker(new URL('../Helpers/geometryWorker.js', import.meta.url), { type: 'module' });

/**
 * Worker de geometría de la app. Se crea en la primera petición (no durante el
 * render) y se termina al desmontar. Devuelve un objeto estable con `request`.
 */
export default function useGeometryWorker() {
  const clientRef = useRef(null);

  useEffect(
    () => () => {
      clientRef.current?.terminate();
      clientRef.current = null;
    },
    [],
  );

  return useMemo(
    () => ({
      request(type, payload, options) {
        if (!clientRef.current) clientRef.current = createWorkerClient(createWorker());
        return clientRef.current.request(type, payload, options);
      },
    }),
    [],
  );
}
