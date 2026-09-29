import * as THREE from 'three';
import { MeshBVH } from 'three-mesh-bvh';
import { detectAxes, meshBounds } from './boardAxes';

/**
 * Lectura de la superficie de la tabla con rayos verticales (surface_height,
 * _surface_hit y surface_frame de mesh_ops.py). Los puntos y vectores son
 * arrays [x, y, z] en mm.
 */

// El rayo sale este tanto por debajo del bounding box (como el "- 1.0" de Python).
const rayStartBelowMm = 1;
// Por debajo de este módulo, el producto vectorial se considera nulo.
const degenerateNormalLength = 1e-9;

// [0, 0, 0] con `sign` en el eje indicado.
const unitVector = (axis, sign = 1) => [0, 1, 2].map((index) => (index === axis ? sign : 0));

/**
 * Prepara la malla para lanzar rayos. Se queda con los arrays de meshData (la
 * BVH reordena el índice), así que el llamante debe pasar una copia si los
 * necesita intactos. Devuelve { bounds, axes, hitsAlongThickness(point) }.
 * `axes` se deduce del bounding box salvo que se pase: una pieza del split puede
 * ser más alta que ancha, así que para ellas se usan los ejes de la tabla.
 */
export function createSurfaceProbe(meshData, knownAxes = null) {
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(meshData.positions, 3));
  geometry.setIndex(new THREE.BufferAttribute(meshData.index, 1));
  const bvh = new MeshBVH(geometry);
  const bounds = meshBounds(meshData);
  const axes = knownAxes ?? detectAxes(bounds);
  const { thicknessAxis } = axes;

  // Todos los cortes de un rayo en +grosor que pasa por `point` (en el plano).
  const hitsAlongThickness = (point) => {
    const origin = [...point];
    origin[thicknessAxis] = bounds.min[thicknessAxis] - rayStartBelowMm;
    const ray = new THREE.Ray(
      new THREE.Vector3(...origin),
      new THREE.Vector3(...unitVector(thicknessAxis)),
    );
    return bvh.raycast(ray, THREE.DoubleSide).map((hit) => hit.point.toArray());
  };

  return { bounds, axes, hitsAlongThickness, dispose: () => geometry.dispose() };
}

const midThickness = ({ bounds, axes }) =>
  (bounds.min[axes.thicknessAxis] + bounds.max[axes.thicknessAxis]) / 2;

/**
 * surface_height(): coordenada de la cara superior (en el eje de grosor) en
 * `point`. Si el rayo no toca la tabla, devuelve la mitad del grosor.
 */
export function surfaceHeight(probe, point) {
  const { thicknessAxis } = probe.axes;
  const heights = probe.hitsAlongThickness(point).map((hit) => hit[thicknessAxis]);
  return heights.length > 0 ? Math.max(...heights) : midThickness(probe);
}

function planePoint(probe, lengthPos, widthPos, thicknessPos = 0) {
  const { lengthAxis, widthAxis, thicknessAxis } = probe.axes;
  const point = [0, 0, 0];
  point[lengthAxis] = lengthPos;
  point[widthAxis] = widthPos;
  point[thicknessAxis] = thicknessPos;
  return point;
}

/**
 * _surface_hit(): punto donde un rayo vertical en (lengthPos, widthPos) toca la
 * cara superior (o la inferior si `bottom`), o null si no toca la tabla.
 */
export function surfaceHit(probe, lengthPos, widthPos, bottom = false) {
  const { thicknessAxis } = probe.axes;
  const hits = probe.hitsAlongThickness(planePoint(probe, lengthPos, widthPos));
  if (hits.length === 0) return null;
  const isBetter = bottom
    ? (hit, best) => hit[thicknessAxis] < best[thicknessAxis]
    : (hit, best) => hit[thicknessAxis] > best[thicknessAxis];
  return hits.reduce((best, hit) => (isBetter(hit, best) ? hit : best));
}

const subtract = (first, second) => first.map((value, axis) => value - second[axis]);

function cross([ax, ay, az], [bx, by, bz]) {
  return [ay * bz - az * by, az * bx - ax * bz, ax * by - ay * bx];
}

/**
 * surface_frame(): punto de contacto y normal hacia fuera de la cara superior
 * (o inferior si `bottom`) en (lengthPos, widthPos). La inclinación se estima
 * con las alturas en los extremos de una cruz de lengthSpan x widthSpan, para
 * seguir el rocker de la zona y no un triángulo suelto. Devuelve { point, normal }.
 */
export function surfaceFrame(probe, lengthPos, widthPos, lengthSpan, widthSpan, bottom = false) {
  const { thicknessAxis } = probe.axes;
  const hit = (length, width) => surfaceHit(probe, length, width, bottom);
  const center = hit(lengthPos, widthPos);
  if (!center) {
    return {
      point: planePoint(probe, lengthPos, widthPos, midThickness(probe)),
      normal: unitVector(thicknessAxis, bottom ? -1 : 1),
    };
  }

  const halfLength = lengthSpan / 2;
  const halfWidth = widthSpan / 2;
  const orCenter = (point) => point ?? center;
  const front = orCenter(hit(lengthPos + halfLength, widthPos));
  const back = orCenter(hit(lengthPos - halfLength, widthPos));
  const right = orCenter(hit(lengthPos, widthPos + halfWidth));
  const left = orCenter(hit(lengthPos, widthPos - halfWidth));

  const raw = cross(subtract(front, back), subtract(right, left));
  const magnitude = Math.hypot(...raw);
  const normal =
    magnitude < degenerateNormalLength
      ? unitVector(thicknessAxis)
      : raw.map((value) => value / magnitude);
  // Hacia fuera de la cara elegida: arriba para la superior, abajo para la inferior.
  const pointsUp = normal[thicknessAxis] > 0;
  return { point: center, normal: pointsUp === bottom ? normal.map((value) => -value) : normal };
}
