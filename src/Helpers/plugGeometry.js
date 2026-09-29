import {
  FUTURES_BODY_LENGTH_MM,
  FUTURES_BODY_WIDTH_MM,
  FUTURES_DEPTH_SIDE_MM,
  FUTURES_FLANGE_DEPTH_MM,
  FUTURES_FLANGE_MARGIN_MM,
  PLUG_ARC_SEGMENTS_PER_QUARTER,
  PLUG_GLUE_CLEARANCE_MM,
  PLUG_OFFSET_SEGMENTS_PER_QUARTER,
  SINGLE_FIN_CORNER_RADIUS_MM,
} from '../config';
import { withTemporaries } from './manifold';
import { plugPosition, surfacePlacement } from './plugPlacement';

/**
 * Sólidos que se restan de la tabla para cada inserto (plug_subtraction_geometries.py):
 * leash plug, caja de quilla central y caja Futures lateral, con sus soportes.
 * Cada función recibe `board` = { wasm, probe } y devuelve un Manifold ya colocado
 * sobre la superficie; el llamante lo libera con delete().
 *
 * Coordenadas locales: X a lo largo de la tabla, Y a lo ancho, Z según la normal;
 * z = 0 es la superficie, +aboveMm sobresale y -profundidad entra en la tabla.
 */

const circleSegments = 4 * PLUG_ARC_SEGMENTS_PER_QUARTER;
const offsetSegments = 4 * PLUG_OFFSET_SEGMENTS_PER_QUARTER;

// Círculos de `radius` centrados en `centers`, unidos por su cierre convexo: así
// salen el estadio (2 centros) y el rectángulo redondeado (4) de shapely.
const roundedHull = (wasm, radius, centers) =>
  withTemporaries((keep) =>
    wasm.CrossSection.hull(
      centers.map(([x, y]) =>
        keep(keep(wasm.CrossSection.circle(radius, circleSegments)).translate(x, y)),
      ),
    ),
  );

// _stadium_polygon: rectángulo con extremos semicirculares, eje largo en X.
function stadium(wasm, lengthMm, widthMm) {
  const radius = widthMm / 2;
  const halfStraight = Math.max(lengthMm / 2 - radius, 0);
  return roundedHull(wasm, radius, [
    [-halfStraight, 0],
    [halfStraight, 0],
  ]);
}

// _rounded_rectangle: esquinas redondeadas con radio limitado a medio lado.
function roundedRectangle(wasm, lengthMm, widthMm, radiusMm) {
  const radius = Math.min(radiusMm, lengthMm / 2, widthMm / 2);
  const halfX = lengthMm / 2 - radius;
  const halfY = widthMm / 2 - radius;
  return roundedHull(wasm, radius, [
    [-halfX, -halfY],
    [halfX, -halfY],
    [halfX, halfY],
    [-halfX, halfY],
  ]);
}

const circle = (wasm, radius) => wasm.CrossSection.circle(radius, circleSegments);

// _extrude_pocket: z = 0 en la superficie, arriba +aboveMm, abajo -depthMm.
const extrudePocket = (footprint, depthMm, aboveMm) =>
  withTemporaries((keep) => keep(footprint.extrude(depthMm + aboveMm)).translate(0, 0, -depthMm));

const footprintSpans = (footprint) => {
  const { min, max } = footprint.bounds();
  return { lengthSpan: max[0] - min[0], widthSpan: max[1] - min[1] };
};

// Coloca un sólido local sobre la tabla (el sólido local se libera).
function place(board, local, position, spans, toeDeg, bottom) {
  return withTemporaries((keep) =>
    keep(local).transform(surfacePlacement(board.probe, { ...position, ...spans, toeDeg, bottom })),
  );
}

/**
 * _plug_solid: ensancha el contorno base la holgura (+ lateralMm), lo extruye
 * (profundidad + holgura + deeperMm) y lo coloca. lateral/deeper convierten la
 * cavidad en su soporte sólido. `base` es un CrossSection que se libera aquí.
 */
function plugSolid(board, base, options) {
  const { depthMm, tailDistanceMm, centerOffsetMm, toeDeg, aboveMm, bottom } = options;
  const { lateralMm = 0, deeperMm = 0 } = options;
  return withTemporaries((keep) => {
    keep(base);
    const expand = PLUG_GLUE_CLEARANCE_MM + lateralMm;
    const footprint = expand > 0 ? keep(base.offset(expand, 'Round', 2, offsetSegments)) : base;
    const local = extrudePocket(footprint, depthMm + PLUG_GLUE_CLEARANCE_MM + deeperMm, aboveMm);
    const position = plugPosition(board.probe, tailDistanceMm, centerOffsetMm);
    return place(board, local, position, footprintSpans(footprint), toeDeg, bottom);
  });
}

// --- Leash plug (cara superior) ------------------------------------------------

function leashSolid(board, params, { aboveMm, lateralMm, deeperMm }) {
  const { tailDistanceMm, centerOffsetMm, diameterMm, depthMm } = params;
  return plugSolid(board, circle(board.wasm, diameterMm / 2), {
    depthMm,
    tailDistanceMm,
    centerOffsetMm,
    toeDeg: 0,
    aboveMm,
    bottom: false,
    lateralMm,
    deeperMm,
  });
}

// params: { tailDistanceMm, centerOffsetMm, diameterMm, depthMm }
export const leashPlugCavity = (board, params, aboveMm = 1) =>
  leashSolid(board, params, { aboveMm, lateralMm: 0, deeperMm: 0 });

export const leashPlugSupport = (board, params, { contourMm, bottomMm }) =>
  leashSolid(board, params, { aboveMm: 0, lateralMm: contourMm, deeperMm: bottomMm });

// --- Caja de quilla central (cara inferior) ------------------------------------

function singleFinSolid(board, params, { aboveMm, lateralMm, deeperMm }) {
  const { tailDistanceMm, boxLongMm, boxWidthMm, boxDepthMm } = params;
  const base = roundedRectangle(board.wasm, boxLongMm, boxWidthMm, SINGLE_FIN_CORNER_RADIUS_MM);
  return plugSolid(board, base, {
    depthMm: boxDepthMm,
    tailDistanceMm,
    centerOffsetMm: 0,
    toeDeg: 0,
    aboveMm,
    bottom: true,
    lateralMm,
    deeperMm,
  });
}

// params: { tailDistanceMm, boxLongMm, boxWidthMm, boxDepthMm }
export const singleFinCavity = (board, params, aboveMm = 1) =>
  singleFinSolid(board, params, { aboveMm, lateralMm: 0, deeperMm: 0 });

export const singleFinSupport = (board, params, { contourMm, bottomMm }) =>
  singleFinSolid(board, params, { aboveMm: 0, lateralMm: contourMm, deeperMm: bottomMm });

// --- Caja Futures lateral (cara inferior) --------------------------------------

// Estadio Futures ensanchado `expandMm` por cada lado.
const futuresStadium = (wasm, expandMm) =>
  stadium(wasm, FUTURES_BODY_LENGTH_MM + 2 * expandMm, FUTURES_BODY_WIDTH_MM + 2 * expandMm);

// El toe-in apunta siempre hacia la línea central.
const towardsCenter = (centerOffsetMm, angleDeg) => (centerOffsetMm >= 0 ? 1 : -1) * angleDeg;

/**
 * _futures_cavity: pestaña ancha y poco profunda sobre un cuerpo más estrecho.
 * params: { tailDistanceMm, centerOffsetMm, angleDeg }
 */
export function futuresFinCavitySide(board, params, aboveMm = 1) {
  const { wasm } = board;
  const { tailDistanceMm, centerOffsetMm, angleDeg } = params;
  const clearance = PLUG_GLUE_CLEARANCE_MM;
  const flangeExpand = clearance + FUTURES_FLANGE_MARGIN_MM;
  return withTemporaries((keep) => {
    const body = keep(
      extrudePocket(
        keep(futuresStadium(wasm, clearance)),
        FUTURES_DEPTH_SIDE_MM + clearance,
        aboveMm,
      ),
    );
    const flangeFootprint = keep(futuresStadium(wasm, flangeExpand));
    const flange = keep(
      extrudePocket(flangeFootprint, FUTURES_FLANGE_DEPTH_MM + clearance, aboveMm),
    );
    const local = wasm.Manifold.union(body, flange);
    const position = plugPosition(board.probe, tailDistanceMm, centerOffsetMm);
    const toeDeg = towardsCenter(centerOffsetMm, angleDeg);
    return place(board, local, position, footprintSpans(flangeFootprint), toeDeg, true);
  });
}

/**
 * _futures_support: soporte sólido que envuelve la pestaña con una pared de contourMm.
 */
export function futuresFinSupportSide(board, params, { contourMm, bottomMm }) {
  const { tailDistanceMm, centerOffsetMm, angleDeg } = params;
  const expand = PLUG_GLUE_CLEARANCE_MM + FUTURES_FLANGE_MARGIN_MM + contourMm;
  return withTemporaries((keep) => {
    const footprint = keep(futuresStadium(board.wasm, expand));
    const depthMm = FUTURES_DEPTH_SIDE_MM + PLUG_GLUE_CLEARANCE_MM + bottomMm;
    const local = extrudePocket(footprint, depthMm, 0);
    const position = plugPosition(board.probe, tailDistanceMm, centerOffsetMm);
    const toeDeg = towardsCenter(centerOffsetMm, angleDeg);
    return place(board, local, position, footprintSpans(footprint), toeDeg, true);
  });
}
