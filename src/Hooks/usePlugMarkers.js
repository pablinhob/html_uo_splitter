import { useEffect, useRef, useState } from 'react';
import logger from '../Helpers/logger';
import { geometryFromMeshData } from '../Helpers/meshData';

const disposeAll = (geometries) => geometries.forEach((geometry) => geometry.dispose());

/**
 * Marcadores verdes de los plugs (_draw_plug_markers de main_window.py): se
 * recalculan en el Worker cada vez que cambian la tabla o los parámetros del
 * paso 1. Las respuestas que llegan tarde (el usuario ya cambió otro valor) se
 * descartan. Devuelve las BufferGeometry de los marcadores (vacío sin tabla);
 * el hook es su dueño y libera las que sustituye.
 */
export default function usePlugMarkers(geometryWorker, mesh, plugs) {
  const [markers, setMarkers] = useState([]);
  const currentRef = useRef([]);

  useEffect(() => {
    if (!mesh) return undefined;
    let isLatest = true;
    geometryWorker
      .request('plugMarkers', { plugs })
      .then((result) => {
        const geometries = result.markers.map(geometryFromMeshData);
        if (!isLatest) {
          disposeAll(geometries);
          return;
        }
        disposeAll(currentRef.current);
        currentRef.current = geometries;
        setMarkers(geometries);
      })
      .catch((error) => {
        if (isLatest) logger.error(`Could not place plug markers: ${error.message}`);
      });
    return () => {
      isLatest = false;
    };
  }, [geometryWorker, mesh, plugs]);

  useEffect(() => () => disposeAll(currentRef.current), []);

  return mesh ? markers : [];
}
