import { useState } from 'react';
import { DEFAULT_HOLLOW } from '../config';
import logger from '../Helpers/logger';
import { ALL_KEY, isAllSelected, pieceLabel } from '../Helpers/pieces';
import useBoardSplit from './useBoardSplit';
import useHollowPreview from './useHollowPreview';
import usePieceGeometries from './usePieceGeometries';

/**
 * Pasos 2 y 3 de la interfaz: split, pieza seleccionada y vaciado (on_execute /
 * on_piece_selection_changed / on_apply_hollow de main_window.py). El corte se
 * hace en el Worker, que conserva las piezas originales para el vaciado.
 * - `split(params, plugs)` devuelve true si ha ido bien; `splitPlugs` son los
 *   plugs con los que se hizo (los del hueco de las piezas y del vaciado).
 * - `pickPiece({ key })` hace lo mismo que pinchar la pieza en la lista (se usa al
 *   pincharla en el visor).
 * - onShowPieces() se llama tras un split o al pinchar una pieza, para abrir el paso 3.
 * `panel` son las props de PiecesPanel salvo onExport, que aporta App.
 */
export default function usePiecesWorkflow(geometryWorker, mesh, onShowPieces) {
  const geometries = usePieceGeometries();
  const [selectedPiece, setSelectedPiece] = useState(null);
  const [hollow, setHollow] = useState(DEFAULT_HOLLOW);
  // Última previsualización aplicada: exportar exige que sea la de la pieza y los
  // parámetros actuales (cualquier cambio de selección o de vaciado la deja vieja).
  // Con "all" seleccionado se exporta sin previsualizar.
  const [appliedPreview, setAppliedPreview] = useState(null);
  const { split, isSplitting, splitPlugs } = useBoardSplit(geometryWorker, mesh, geometries, () => {
    setSelectedPiece(ALL_KEY);
    onShowPieces();
  });

  const { applyHollow, isHollowing } = useHollowPreview(geometryWorker, geometries);

  const reset = () => {
    geometries.clear();
    setSelectedPiece(null);
  };

  const panel = {
    pieceKeys: geometries.pieces.map((piece) => piece.key),
    selected: selectedPiece,
    hollow,
    exportEnabled:
      isAllSelected(selectedPiece) ||
      (appliedPreview?.key === selectedPiece && appliedPreview?.hollow === hollow),
    onSelect: (key, label) => {
      setSelectedPiece(key);
      logger.info(`Showing: ${label}`);
    },
    onHollowChange: setHollow,
    onApply: async () => {
      const key = selectedPiece;
      if (await applyHollow(key, hollow, splitPlugs)) setAppliedPreview({ key, hollow });
    },
  };

  const pickPiece = ({ key }) => {
    panel.onSelect(key, pieceLabel(panel.pieceKeys, key));
    onShowPieces();
  };

  return {
    pieces: geometries.pieces,
    outlines: geometries.outlines,
    selectedPiece,
    splitPlugs,
    hollow,
    isBusy: isSplitting || isHollowing,
    reset,
    split,
    pickPiece,
    panel,
  };
}
