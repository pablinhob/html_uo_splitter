import {
  CUTLAP_BOUNDARY_TOLERANCE_MM,
  CUTLAP_OFFSET_SEGMENTS_PER_QUARTER,
  SPLIT_PRISM_MARGIN_MM,
} from '../config';
import { withTemporaries } from './manifold';
import { faceSetOutline, ringProximity } from './meshOutline';

/**
 * split_cutlap y touches_boundary (cutlap.py), en el marco canónico. El cutlap es
 * la franja exterior de cada mitad: lo que queda fuera de la huella de la tabla
 * encogida `cutlapWidthMm`.
 */

const offsetSegments = 4 * CUTLAP_OFFSET_SEGMENTS_PER_QUARTER;

const signedArea = (ring) =>
  ring.reduce((sum, [x, y], index) => {
    const [nextX, nextY] = ring[(index + 1) % ring.length];
    return sum + (x * nextY - nextX * y) / 2;
  }, 0);

// De un contorno (posible multipolígono) se queda con la mayor pieza, como Python.
function largestComponent(section) {
  return withTemporaries((keep) => {
    const components = section.decompose().map(keep);
    const largest = components.reduce((best, component) =>
      component.area() > best.area() ? component : best,
    );
    return largest.translate(0, 0);
  });
}

// Anillo exterior (el de mayor área) como lista de puntos [x, y].
function exteriorRing(section) {
  const rings = section.toPolygons();
  return rings.reduce((best, ring) =>
    Math.abs(signedArea(ring)) > Math.abs(signedArea(best)) ? ring : best,
  );
}

/**
 * Contorno interior del cutlap: la huella de `board` (Manifold canónico) encogida
 * cutlapWidthMm. Devuelve { section, ring } (section es un CrossSection que el
 * llamante libera) o null si el encogimiento se come toda la huella.
 */
export function cutlapInnerPolygon(board, cutlapWidthMm) {
  return withTemporaries((keep) => {
    const footprint = keep(board.project());
    const inner = keep(footprint.offset(-cutlapWidthMm, 'Round', 2, offsetSegments));
    if (inner.isEmpty()) return null;
    const section = largestComponent(inner);
    return { section, ring: exteriorRing(section) };
  });
}

// touches_boundary: ¿algún vértice de la pieza está sobre el contorno interior?
export function touchesBoundary(meshData, isNearRing) {
  const { positions } = meshData;
  for (let offset = 0; offset < positions.length; offset += 3) {
    if (isNearRing([positions[offset], positions[offset + 1]])) return true;
  }
  return false;
}

// _boundary_outline: borde de las caras del cutlap cuyo centroide está en el contorno.
export function boundaryOutline(meshData, isNearRing) {
  return faceSetOutline(meshData, (corners) => {
    const centroid = [0, 1].map(
      (axis) => corners.reduce((sum, corner) => sum + corner[axis], 0) / 3,
    );
    return isNearRing(centroid);
  });
}

export const nearInnerRing = (ring) => ringProximity(ring, CUTLAP_BOUNDARY_TOLERANCE_MM);

/**
 * split_cutlap: divide `side` (Manifold canónico de una mitad) en
 * { cutlap, interior } con el prisma del contorno interior `inner`
 * (de cutlapInnerPolygon, calculado sobre la tabla entera). Cualquiera puede ser
 * null si queda vacío. `side` no se toca; el llamante libera lo que devuelve.
 */
export function splitCutlap(board, side, inner) {
  const { min, max } = board.boundingBox();
  return withTemporaries((keep) => {
    const prism = keep(
      keep(inner.section.extrude(max[2] - min[2] + 2 * SPLIT_PRISM_MARGIN_MM)).translate(
        0,
        0,
        min[2] - SPLIT_PRISM_MARGIN_MM,
      ),
    );
    const nonEmpty = (manifold) => {
      if (!manifold.isEmpty()) return manifold;
      manifold.delete();
      return null;
    };
    return { interior: nonEmpty(side.intersect(prism)), cutlap: nonEmpty(side.subtract(prism)) };
  });
}
