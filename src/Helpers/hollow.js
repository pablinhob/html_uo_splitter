import {
  COLLINEAR_TOLERANCE_MM,
  DRILL_INNER_MARGIN_MM,
  DRILL_OUTER_MARGIN_MM,
  FACE_HOLE_SECTIONS,
  FOOTPRINT_SIMPLIFY_MM,
  HEIGHT_SAMPLE_INSET_MM,
  HOLLOW_OFFSET_SEGMENTS_PER_QUARTER,
} from '../config';
import { meshDataFromManifold, withTemporaries } from './manifold';
import { ringContains, signedRingArea, simplifyRing } from './polygon2d';
import { createSurfaceProbe } from './surface';

/**
 * hollow_piece (hollow.py), en el marco canónico (Z = grosor de la tabla). Vacía
 * una pieza dejando paredes de wallMm, piel superior de topMm e inferior de
 * bottomMm (0 deja esa cara abierta), y taladra en cada cara lateral agujeros de
 * diámetro holePct % de la altura local de la pieza.
 * Devuelve un Manifold nuevo; la pieza original no se toca.
 */

const canonicalAxes = { lengthAxis: 0, widthAxis: 1, thicknessAxis: 2 };
const offsetSegments = 4 * HOLLOW_OFFSET_SEGMENTS_PER_QUARTER;
const insideProbeMm = 1e-6;

const largestRing = (rings) =>
  rings.reduce((best, ring) =>
    Math.abs(signedRingArea(ring)) > Math.abs(signedRingArea(best)) ? ring : best,
  );

// _build_cavity: la huella encogida wallMm, extruida entre las dos pieles.
function cavityTools(wasm, piece, { wallMm, topMm, bottomMm }, [zMin, zMax]) {
  const cavityBottom = zMin + bottomMm;
  const spanMm = zMax - topMm - cavityBottom;
  if (spanMm <= 0) return [];
  return withTemporaries((keep) => {
    const footprint = keep(piece.project());
    if (footprint.isEmpty()) return [];
    const inner = keep(footprint.offset(-wallMm, 'Round', 2, offsetSegments));
    return inner
      .decompose()
      .map(keep)
      .map((component) => keep(component.simplify(FOOTPRINT_SIMPLIFY_MM)))
      .filter((component) => !component.isEmpty())
      .map((component) => keep(component.extrude(spanMm)).translate(0, 0, cavityBottom));
  });
}

// _local_height: (arriba, abajo) de la pieza en la vertical de un punto, o null.
function localHeight(probe, [x, y]) {
  const heights = probe.hitsAlongThickness([x, y, 0]).map((hit) => hit[2]);
  if (heights.length < 2) return null;
  const top = Math.max(...heights);
  const bottom = Math.min(...heights);
  return top - bottom > 0 ? { top, bottom } : null;
}

// Rotación mínima que lleva +Z a `direction` (unitario y horizontal), en columnas.
function alignZTo([dx, dy, dz]) {
  const [cx, cy] = [-dy, dx]; // z × d (componente z nula para d horizontal)
  const factor = 1 / (1 + dz);
  // R = I + [c]x + [c]x² / (1 + dz), con c = z × d; la columna Z es el propio d.
  return [
    [1 - cy * cy * factor, cx * cy * factor, -cy],
    [cx * cy * factor, 1 - cx * cx * factor, cx],
    [cy, -cx, dz],
  ];
}

// _hole_cylinder: cilindro que atraviesa la pared en `point` siguiendo la altura local.
function holeCylinder(wasm, context, point, radiusMm) {
  const { probe, inward, fraction, wallMm } = context;
  const inset = [
    point[0] + inward[0] * HEIGHT_SAMPLE_INSET_MM,
    point[1] + inward[1] * HEIGHT_SAMPLE_INSET_MM,
  ];
  const span = localHeight(probe, inset);
  if (!span) return null;
  // Donde la pieza es más baja el agujero se encoge en vez de salirse.
  const localRadius = Math.min(radiusMm, (fraction * (span.top - span.bottom)) / 2);
  if (localRadius <= 0) return null;
  const heightMm = wallMm + DRILL_OUTER_MARGIN_MM + DRILL_INNER_MARGIN_MM;
  const axisOffset = (DRILL_INNER_MARGIN_MM - DRILL_OUTER_MARGIN_MM) / 2;
  const center = [
    point[0] + inward[0] * axisOffset,
    point[1] + inward[1] * axisOffset,
    (span.top + span.bottom) / 2,
  ];
  const columns = alignZTo([inward[0], inward[1], 0]);
  return withTemporaries((keep) =>
    keep(
      wasm.Manifold.cylinder(heightMm, localRadius, localRadius, FACE_HOLE_SECTIONS, true),
    ).transform([...columns.flatMap((column) => [...column, 0]), ...center, 1]),
  );
}

// Agujeros repartidos a lo largo de una cara lateral (arista de la sección).
function edgeHoles(wasm, context, start, end) {
  const { probe, polygon, fraction } = context;
  const edge = [end[0] - start[0], end[1] - start[1]];
  const edgeLength = Math.hypot(...edge);
  if (edgeLength === 0) return [];
  const midpoint = [(start[0] + end[0]) / 2, (start[1] + end[1]) / 2];
  let inward = [-edge[1] / edgeLength, edge[0] / edgeLength];
  const probePoint = [
    midpoint[0] + inward[0] * insideProbeMm,
    midpoint[1] + inward[1] * insideProbeMm,
  ];
  if (!ringContains(polygon, probePoint)) inward = inward.map((value) => -value);

  // La altura en el centro de la cara fija un tamaño de agujero uniforme.
  const span = localHeight(probe, [
    midpoint[0] + inward[0] * HEIGHT_SAMPLE_INSET_MM,
    midpoint[1] + inward[1] * HEIGHT_SAMPLE_INSET_MM,
  ]);
  if (!span) return [];
  const height = span.top - span.bottom;
  const radiusMm = (fraction * height) / 2;
  // Separación entre agujeros y hasta cubierta/casco: el mismo margen.
  const marginMm = ((1 - fraction) * height) / 2;
  if (radiusMm <= 0 || edgeLength < 2 * radiusMm) return [];

  const count = Math.max(1, Math.floor((edgeLength - marginMm) / (2 * radiusMm + marginMm)));
  const spanUsed = count * 2 * radiusMm + (count - 1) * marginMm;
  const endMargin = (edgeLength - spanUsed) / 2;
  return Array.from({ length: count }, (_, hole) => {
    const distance = endMargin + radiusMm + hole * (2 * radiusMm + marginMm);
    const point = [
      start[0] + (distance / edgeLength) * edge[0],
      start[1] + (distance / edgeLength) * edge[1],
    ];
    return holeCylinder(wasm, { ...context, inward }, point, radiusMm);
  }).filter(Boolean);
}

// _build_face_holes: agujeros en cada cara lateral de la sección a media altura.
function faceHoleTools(wasm, piece, params, zMid) {
  const probe = createSurfaceProbe(meshDataFromManifold(piece), canonicalAxes);
  const fraction = params.holePct / 100;
  try {
    return withTemporaries((keep) => {
      const section = keep(piece.slice(zMid));
      return section
        .decompose()
        .map(keep)
        .flatMap((component) => {
          const polygon = simplifyRing(largestRing(component.toPolygons()), COLLINEAR_TOLERANCE_MM);
          const context = { probe, polygon, fraction, wallMm: params.wallMm };
          return polygon.flatMap((start, index) =>
            edgeHoles(wasm, context, start, polygon[(index + 1) % polygon.length]),
          );
        });
    });
  } finally {
    probe.dispose();
  }
}

// params: { wallMm, topMm, bottomMm, holePct }
export default function hollowPiece(wasm, piece, params) {
  const { min, max } = piece.boundingBox();
  const zMid = (min[2] + max[2]) / 2;
  return withTemporaries((keep) => {
    const section = keep(piece.slice(zMid));
    if (section.isEmpty()) return piece.translate(0, 0, 0);
    const tools = [
      ...cavityTools(wasm, piece, params, [min[2], max[2]]),
      ...(params.holePct > 0 ? faceHoleTools(wasm, piece, params, zMid) : []),
    ].map(keep);
    if (tools.length === 0) return piece.translate(0, 0, 0);
    return wasm.Manifold.difference([piece, ...tools]);
  });
}
