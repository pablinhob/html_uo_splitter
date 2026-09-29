import { useMemo } from 'react';
import { BOARD_COLOR, GHOST_COLOR, GHOST_OPACITY, PLUG_MARKER_COLOR } from '../config';
import { ALL_KEY, keyId, matchesSelection, pieceColor } from '../Helpers/pieces';
import usePlugMarkers from './usePlugMarkers';

// Un contorno de corte se ve si alguna de sus piezas está seleccionada.
const outlineObjects = (outlines, selection) =>
  outlines.map(({ geometry, borders }, index) => ({
    key: `outline-${index}`,
    geometry,
    lines: true,
    visible: borders.some((key) => matchesSelection(selection, key)),
  }));

function pieceObjects(mesh, pieces, outlines, selectedPiece) {
  const selection = selectedPiece ?? ALL_KEY;
  const objects = pieces.map(({ key, geometry }) => ({
    key: keyId(key),
    geometry,
    color: pieceColor(key),
    visible: matchesSelection(selection, key),
    edges: true,
    frame: true,
  }));
  objects.push(...outlineObjects(outlines, selection));
  if (mesh && keyId(selection) !== 'all') {
    objects.push({ key: 'ghost', geometry: mesh, color: GHOST_COLOR, opacity: GHOST_OPACITY });
  }
  return objects;
}

/**
 * Objetos que muestra el visor principal (equivale a show_trimesh / show_pieces
 * + set_piece_selection + set_plug_markers de viewer.py): la tabla sola o, si ya
 * hay piezas, las piezas seleccionadas con el contorno fantasma de la tabla
 * original; encima, los marcadores de los plugs, que no mueven la cámara.
 * scene: { geometryWorker, board (useBoardFile), workflow (usePiecesWorkflow), plugs }
 */
export default function useViewerObjects(scene) {
  const { geometryWorker, board, workflow, plugs } = scene;
  const { mesh } = board;
  const { pieces, outlines, selectedPiece } = workflow;
  const markers = usePlugMarkers(geometryWorker, mesh, plugs);
  return useMemo(() => {
    const boardObjects =
      pieces.length > 0
        ? pieceObjects(mesh, pieces, outlines, selectedPiece)
        : [mesh && { key: 'board', geometry: mesh, color: BOARD_COLOR, frame: true }];
    const markerObjects = markers.map((geometry, index) => ({
      key: `plug-marker-${index}`,
      geometry,
      color: PLUG_MARKER_COLOR,
    }));
    return [...boardObjects, ...markerObjects].filter(Boolean);
  }, [mesh, pieces, outlines, selectedPiece, markers]);
}
