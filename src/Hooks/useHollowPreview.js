import { useState } from 'react';
import logger from '../Helpers/logger';
import { keyId } from '../Helpers/pieces';

const isCorePiece = (key) => Boolean(key) && key.length === 2 && key[1] !== 'cutlap';

function logHollowing(key, { wallMm, topMm, bottomMm, holePct }) {
  const params = `wall=${wallMm} mm, top=${topMm} mm, bottom=${bottomMm} mm, hole=${holePct}%`;
  logger.info(`Hollowing ${keyId(key)}: ${params}`);
}

/**
 * "Preview part hollowing" (on_apply_hollow de main_window.py): vacía en el Worker la
 * pieza seleccionada y sustituye su malla en el visor, con el hueco de los plugs y
 * sus soportes, como al exportar. `applyHollow(key, hollow, plugs)` devuelve true
 * si ha ido bien; `isHollowing` mientras corre.
 */
export default function useHollowPreview(geometryWorker, geometries) {
  const [isHollowing, setIsHollowing] = useState(false);

  const applyHollow = async (key, hollow, plugs) => {
    if (!isCorePiece(key)) {
      logger.warning('Select a core piece before applying');
      return false;
    }
    logHollowing(key, hollow);
    setIsHollowing(true);
    try {
      const result = await geometryWorker.request('hollowPiece', { key, hollow, plugs });
      geometries.replacePiece(result.key, result.meshData);
      logger.info(`Hollow applied to ${keyId(key)}`);
      return true;
    } catch (error) {
      logger.error(`Could not hollow piece ${keyId(key)}: ${error.message}`);
      return false;
    } finally {
      setIsHollowing(false);
    }
  };

  return { applyHollow, isHollowing };
}
