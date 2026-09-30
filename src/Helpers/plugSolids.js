import { PLUG_HOLES_SOLID_BOTTOM_MM, PLUG_HOLES_SOLID_CONTOUR_MM } from '../config';
import {
  futuresFinCavitySide,
  futuresFinSupportSide,
  leashPlugCavity,
  leashPlugSupport,
  singleFinCavity,
  singleFinSupport,
} from './plugGeometry';

/**
 * Cavidades y soportes de todos los plugs a partir de los parámetros del paso 1
 * de la interfaz (plug_position.py y _collect_plug_solids / _collect_plug_supports
 * de main_window.py). `plugs` tiene la forma de DEFAULT_PLUGS (config.js).
 * Devuelven arrays de Manifold que el llamante libera con delete().
 */

const supportMargins = {
  contourMm: PLUG_HOLES_SOLID_CONTOUR_MM,
  bottomMm: PLUG_HOLES_SOLID_BOTTOM_MM,
};

const leashParams = ({ tailDistanceMm, centerMm, diameterMm, depthMm }) => ({
  tailDistanceMm,
  centerOffsetMm: centerMm,
  diameterMm,
  depthMm,
});

const singleFinParams = (fin) => ({
  tailDistanceMm: fin.singleTailDistanceMm,
  boxLongMm: fin.singleBoxLongMm,
  boxWidthMm: fin.singleBoxWidthMm,
  boxDepthMm: fin.singleBoxDepthMm,
});

// Twin fin: dos cajas Futures a ±la mitad de la distancia entre centros.
const twinFinParams = (fin) =>
  [-1, 1].map((side) => ({
    tailDistanceMm: fin.twinTailDistanceMm,
    centerOffsetMm: (side * fin.twinCenterDistanceMm) / 2,
    angleDeg: fin.twinAngleDeg,
  }));

// Construye una lista de sólidos; si uno falla, libera los ya creados.
function buildAll(builders) {
  const solids = [];
  try {
    builders.forEach((build) => solids.push(build()));
    return solids;
  } catch (error) {
    solids.forEach((solid) => solid.delete());
    throw error;
  }
}

/**
 * Cavidades de leash y quillas. `aboveMm` es lo que sobresalen de la superficie:
 * MARKER_PROTRUSION_MM para los marcadores y SUBTRACTION_MARGIN_MM para restar.
 */
export function collectPlugCavities(board, plugs, aboveMm) {
  const { leash, fin } = plugs;
  const finBuilders =
    fin.type === 'single'
      ? [() => singleFinCavity(board, singleFinParams(fin), aboveMm)]
      : twinFinParams(fin).map((params) => () => futuresFinCavitySide(board, params, aboveMm));
  return buildAll([() => leashPlugCavity(board, leashParams(leash), aboveMm), ...finBuilders]);
}

// Soportes sólidos (material donde taladrar) alrededor de cada cavidad.
export function collectPlugSupports(board, plugs) {
  const { leash, fin } = plugs;
  const finBuilders =
    fin.type === 'single'
      ? [() => singleFinSupport(board, singleFinParams(fin), supportMargins)]
      : twinFinParams(fin).map(
          (params) => () => futuresFinSupportSide(board, params, supportMargins),
        );
  return buildAll([
    () => leashPlugSupport(board, leashParams(leash), supportMargins),
    ...finBuilders,
  ]);
}

function boundsOverlap(first, second) {
  const firstBox = first.boundingBox();
  const secondBox = second.boundingBox();
  return [0, 1, 2].every(
    (axis) =>
      firstBox.min[axis] <= secondBox.max[axis] && secondBox.min[axis] <= firstBox.max[axis],
  );
}

// Cavidades cuyo bounding box toca el de la pieza (las únicas que hay que restar).
export const overlappingCavities = (piece, cavities) =>
  cavities.filter((cavity) => boundsOverlap(piece, cavity));

/**
 * _subtract_plugs de export_window.py: resta a la pieza las cavidades que la tocan.
 * Consume la pieza: devuelve la misma si no toca ninguna o una nueva (y libera la
 * original) si hay resta.
 */
export function subtractPlugCavities(wasm, piece, cavities) {
  const overlapping = overlappingCavities(piece, cavities);
  if (overlapping.length === 0) return piece;
  const result = wasm.Manifold.difference([piece, ...overlapping]);
  piece.delete();
  return result;
}
