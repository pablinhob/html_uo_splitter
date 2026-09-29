import { useState } from 'react';
import { DEFAULT_HOLLOW } from '../config';
import logger from '../Helpers/logger';
import { ALL_KEY } from '../Helpers/pieces';
import useBoardSplit from './useBoardSplit';
import useHollowPreview from './useHollowPreview';
import usePieceGeometries from './usePieceGeometries';

/**
 * Pasos 2 y 3 de la interfaz: split, pieza seleccionada y vaciado (on_execute /
 * on_piece_selection_changed / on_apply_hollow de main_window.py). El corte se
 * hace en el Worker, que conserva las piezas originales para el vaciado.
 * `split(params)` devuelve true si ha ido bien. `panel` son las props de
 * PiecesPanel salvo onExport, que aporta App.
 */
export default function usePiecesWorkflow(geometryWorker, mesh) {
  const geometries = usePieceGeometries();
  const [selectedPiece, setSelectedPiece] = useState(null);
  const [hollow, setHollow] = useState(DEFAULT_HOLLOW);
  const [isExportEnabled, setIsExportEnabled] = useState(false);
  const { split, isSplitting } = useBoardSplit(geometryWorker, mesh, geometries, () => {
    setSelectedPiece(ALL_KEY);
    setIsExportEnabled(false);
  });

  const { applyHollow, isHollowing } = useHollowPreview(geometryWorker, geometries);

  const reset = () => {
    geometries.clear();
    setSelectedPiece(null);
    setIsExportEnabled(false);
  };

  const panel = {
    pieceKeys: geometries.pieces.map((piece) => piece.key),
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
    // Con una previsualización fresca ya se puede exportar.
    onApply: async () => {
      if (await applyHollow(selectedPiece, hollow)) setIsExportEnabled(true);
    },
  };

  return {
    pieces: geometries.pieces,
    outlines: geometries.outlines,
    selectedPiece,
    hollow,
    isBusy: isSplitting || isHollowing,
    reset,
    split,
    panel,
  };
}
