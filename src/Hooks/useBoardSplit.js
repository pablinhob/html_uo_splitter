import { useState } from 'react';
import logger from '../Helpers/logger';

/**
 * Split de la tabla en el Worker (on_execute de main_window.py). Al terminar bien
 * pasa el resultado a `geometries.replaceAll` y llama a onSplit(result).
 * `split(params, plugs)` devuelve true si ha ido bien; las piezas llegan ya con el
 * hueco de los plugs. `splitPlugs` son los del último split que ha ido bien, e
 * `isSplitting` indica que hay uno en marcha.
 */
export default function useBoardSplit(geometryWorker, mesh, geometries, onSplit) {
  const [isSplitting, setIsSplitting] = useState(false);
  const [splitPlugs, setSplitPlugs] = useState(null);

  const split = async (splitParams, plugs) => {
    if (!mesh) {
      logger.warning('No STL loaded, nothing to split');
      return false;
    }
    logger.info(`Splitting board lengthwise and into ${splitParams.shape.toLowerCase()} pieces...`);
    setIsSplitting(true);
    try {
      const result = await geometryWorker.request('split', { params: splitParams, plugs });
      geometries.replaceAll(result);
      setSplitPlugs(plugs);
      onSplit(result);
      logger.info(`Split complete: ${result.pieces.length} pieces`);
      return true;
    } catch (error) {
      logger.error(`Could not split mesh: ${error.message}`);
      return false;
    } finally {
      setIsSplitting(false);
    }
  };

  return { split, isSplitting, splitPlugs };
}
