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
  // Se puede pinchar cualquier pieza visible salvo la que ya está seleccionada.
  const objects = pieces.map(({ key, geometry }) => {
    const visible = matchesSelection(selection, key);
    return {
      key: keyId(key),
      geometry,
      color: pieceColor(key),
      visible,
      edges: true,
      frame: true,
      pickKey: visible && keyId(key) !== keyId(selection) ? key : null,
    };
  });
  objects.push(...outlineObjects(outlines, selection));
  if (mesh && keyId(selection) !== 'all') {
    objects.push({ key: 'ghost', geometry: mesh, color: GHOST_COLOR, opacity: GHOST_OPACITY });
  }
  return objects;
}

/**
 * Objetos que muestra el visor principal (equivale a show_trimesh / show_pieces
 * + set_piece_selection + set_plug_markers de viewer.py): la tabla sola o, si ya
 * hay piezas y estamos en el paso 3, las piezas seleccionadas con el contorno
 * fantasma de la tabla original; encima, los marcadores de los plugs, que no
 * mueven la cámara.
 * - Al volver a los pasos 1 o 2 se ve otra vez la tabla sin cortar con sus
 *   marcadores. Las piezas se conservan y reaparecen al volver al paso 3.
 * - Tras el split, las piezas ya llevan el hueco de los plugs y los marcadores se
 *   ocultan; vuelven si se cambian los plugs, hasta el siguiente split.
 * scene: { geometryWorker, board (useBoardFile), workflow (usePiecesWorkflow), plugs,
 *          currentStep (paso del asistente) }
 */
export default function useViewerObjects(scene) {
  const { geometryWorker, board, workflow, plugs, currentStep } = scene;
  const { mesh } = board;
  const { pieces, outlines, selectedPiece, splitPlugs } = workflow;
  const markers = usePlugMarkers(geometryWorker, mesh, plugs);
  const arePiecesShown = currentStep === 'pieces' && pieces.length > 0;
  const areMarkersShown = !arePiecesShown || splitPlugs !== plugs;
  return useMemo(() => {
    const boardObjects = arePiecesShown
      ? pieceObjects(mesh, pieces, outlines, selectedPiece)
      : [mesh && { key: 'board', geometry: mesh, color: BOARD_COLOR, frame: true }];
    const markerObjects = (areMarkersShown ? markers : []).map((geometry, index) => ({
      key: `plug-marker-${index}`,
      geometry,
      color: PLUG_MARKER_COLOR,
    }));
    return [...boardObjects, ...markerObjects].filter(Boolean);
  }, [mesh, pieces, outlines, selectedPiece, markers, arePiecesShown, areMarkersShown]);
}
