import { useMemo } from 'react';
import { BOARD_COLOR, GHOST_COLOR, GHOST_OPACITY } from '../config';
import { ALL_KEY, keyId, matchesSelection, pieceColor } from '../Helpers/pieces';

/**
 * Objetos que muestra el visor principal (equivale a show_trimesh / show_pieces
 * + set_piece_selection de viewer.py): la tabla sola o, si ya hay piezas, las
 * piezas seleccionadas con el contorno fantasma de la tabla original.
 */
export default function useViewerObjects(mesh, pieces, selectedPiece) {
  return useMemo(() => {
    if (pieces.length > 0) {
      const selection = selectedPiece ?? ALL_KEY;
      const objects = pieces.map(({ key, geometry }) => ({
        key: keyId(key),
        geometry,
        color: pieceColor(key),
        visible: matchesSelection(selection, key),
        edges: true,
        frame: true,
      }));
      if (mesh && keyId(selection) !== 'all') {
        objects.push({ key: 'ghost', geometry: mesh, color: GHOST_COLOR, opacity: GHOST_OPACITY });
      }
      return objects;
    }
    return mesh ? [{ key: 'board', geometry: mesh, color: BOARD_COLOR, frame: true }] : [];
  }, [mesh, pieces, selectedPiece]);
}
