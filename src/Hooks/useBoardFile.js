import { useState } from 'react';
import logger from '../Helpers/logger';
import { computeObjectStats, faceCount, loadSTL, vertexCount } from '../Helpers/stl';
import { formatSizeCm, formatVolume } from '../Helpers/units';

function logLoaded(geometry, stats) {
  logger.info(
    `STL loaded successfully: ${vertexCount(geometry)} vertices, ${faceCount(geometry)} faces`,
  );
  logger.info(
    `Bounding box: ${formatSizeCm(stats.sizeMm)}, volume: ${formatVolume(stats.volumeMm3, 'cm3')}`,
  );
}

/**
 * Tabla cargada desde un STL (on_open_stl de main_window.py): la malla, el
 * nombre del fichero y sus estadísticas. `openSTL(file)` devuelve true si la
 * carga ha ido bien. El dueño de la malla es este hook: libera la anterior.
 */
export default function useBoardFile() {
  const [mesh, setMesh] = useState(null);
  const [fileName, setFileName] = useState(null);
  const [stats, setStats] = useState(null);
  const [isBusy, setIsBusy] = useState(false);

  const openSTL = async (file) => {
    setFileName(file.name);
    logger.info(`Loading file: ${file.name}`);
    setIsBusy(true);
    try {
      const geometry = await loadSTL(file);
      const objectStats = computeObjectStats(geometry);
      mesh?.dispose();
      setMesh(geometry);
      setStats(objectStats);
      logLoaded(geometry, objectStats);
      return true;
    } catch (error) {
      logger.error(`Could not parse STL file '${file.name}': ${error.message}`);
      mesh?.dispose();
      setMesh(null);
      setStats(null);
      return false;
    } finally {
      setIsBusy(false);
    }
  };

  return { mesh, fileName, stats, isBusy, openSTL };
}
