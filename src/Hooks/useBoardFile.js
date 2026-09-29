import { useState } from 'react';
import logger from '../Helpers/logger';
import { geometryFromMeshData, meshFaceCount, meshVertexCount } from '../Helpers/meshData';
import { formatSizeCm, formatVolume } from '../Helpers/units';

// Mensajes de ensure_watertight() de mesh_ops.py.
function logRepair({ status, facesBefore, facesAfter }) {
  if (status === 'repaired') {
    logger.info(
      `Input mesh was not watertight; repaired it (${facesBefore} -> ${facesAfter} faces).`,
    );
  }
  if (status === 'failed') logger.warning('Input mesh could not be fully repaired to watertight.');
}

function logLoaded({ meshData, stats }) {
  logger.info(
    `STL loaded successfully: ${meshVertexCount(meshData)} vertices, ${meshFaceCount(meshData)} faces`,
  );
  logger.info(
    `Bounding box: ${formatSizeCm(stats.sizeMm)}, volume: ${formatVolume(stats.volumeMm3, 'cm3')}`,
  );
}

/**
 * Tabla cargada desde un STL (on_open_stl de main_window.py): la malla para el
 * visor, el nombre del fichero y sus estadísticas. La lectura y la reparación se
 * hacen en el Worker, que se queda con la malla sólida para las booleanas.
 * `openSTL(file)` devuelve true si la carga ha ido bien. Este hook es dueño de
 * la geometría del visor: libera la anterior.
 */
export default function useBoardFile(geometryWorker) {
  const [mesh, setMesh] = useState(null);
  const [fileName, setFileName] = useState(null);
  const [stats, setStats] = useState(null);
  const [isBusy, setIsBusy] = useState(false);

  const replaceMesh = (next) => {
    mesh?.dispose();
    setMesh(next);
  };

  const openSTL = async (file) => {
    setFileName(file.name);
    logger.info(`Loading file: ${file.name}`);
    setIsBusy(true);
    try {
      const buffer = await file.arrayBuffer();
      const board = await geometryWorker.request('loadBoard', { buffer }, { transfer: [buffer] });
      logRepair(board.repair);
      replaceMesh(geometryFromMeshData(board.meshData));
      setStats(board.stats);
      logLoaded(board);
      return true;
    } catch (error) {
      logger.error(`Could not parse STL file '${file.name}': ${error.message}`);
      replaceMesh(null);
      setStats(null);
      return false;
    } finally {
      setIsBusy(false);
    }
  };

  return { mesh, fileName, stats, isBusy, openSTL };
}
