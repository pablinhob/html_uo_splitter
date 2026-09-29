import { useState } from 'react';
import { DEFAULT_HOLLOW, NOT_MIGRATED_MESSAGE } from '../config';
import logger from '../Helpers/logger';
import { keyId } from '../Helpers/pieces';

const isCorePiece = (key) => Boolean(key) && key.length === 2 && key[1] !== 'cutlap';

function logHollowing(key, { wallMm, topMm, bottomMm, holePct }) {
  const params = `wall=${wallMm} mm, top=${topMm} mm, bottom=${bottomMm} mm, hole=${holePct}%`;
  logger.info(`Hollowing ${keyId(key)}: ${params}`);
}

/**
 * Pasos 2 y 3 de la interfaz: piezas del split, pieza seleccionada y vaciado
 * (on_execute / on_piece_selection_changed / on_apply_hollow de main_window.py).
 * pieces: [{ key, geometry }] con la clave como array, p. ej. ['a', 'cutlap', 2].
 * `panel` son las props de PiecesPanel salvo onExport, que aporta App.
 */
export default function usePiecesWorkflow(mesh) {
  const [pieces, setPieces] = useState([]);
  const [selectedPiece, setSelectedPiece] = useState(null);
  const [hollow, setHollow] = useState(DEFAULT_HOLLOW);
  const [isExportEnabled, setIsExportEnabled] = useState(false);

  const reset = () => {
    setPieces([]);
    setSelectedPiece(null);
    setIsExportEnabled(false);
  };

  const split = (splitParams) => {
    if (!mesh) {
      logger.warning('No STL loaded, nothing to split');
      return;
    }
    logger.info(`Splitting board lengthwise and into ${splitParams.shape.toLowerCase()} pieces...`);
    logger.warning(`Split: ${NOT_MIGRATED_MESSAGE}`);
  };

  const panel = {
    pieceKeys: pieces.map((piece) => piece.key),
    selected: selectedPiece,
    hollow,
    exportEnabled: isExportEnabled,
    onSelect: (key, label) => {
      setSelectedPiece(key);
      setIsExportEnabled(false);
      logger.info(`Showing: ${label}`);
    },
    onHollowChange: (next) => {
      setHollow(next);
      setIsExportEnabled(false);
    },
    onApply: () => {
      if (!isCorePiece(selectedPiece)) {
        logger.warning('Select a core piece before applying');
        return;
      }
      logHollowing(selectedPiece, hollow);
      logger.warning(`Preview hollowing: ${NOT_MIGRATED_MESSAGE}`);
    },
  };

  return { pieces, selectedPiece, reset, split, panel };
}
