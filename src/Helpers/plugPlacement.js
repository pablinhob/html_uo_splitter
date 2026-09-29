import { surfaceFrame } from './surface';

/**
 * Colocación de los plugs sobre la tabla (_plug_position y _place_on_surface de
 * plug_subtraction_geometries.py). Las matrices son Mat4 de manifold-3d:
 * 16 números en column-major.
 */

const degenerateLength = 1e-9;

const dot = (first, second) => first.reduce((sum, value, axis) => sum + value * second[axis], 0);
const scale = (vector, factor) => vector.map((value) => value * factor);
const subtract = (first, second) => first.map((value, axis) => value - second[axis]);
const cross = ([ax, ay, az], [bx, by, bz]) => [
  ay * bz - az * by,
  az * bx - ax * bz,
  ax * by - ay * bx,
];
const unitVector = (axis) => [0, 1, 2].map((index) => (index === axis ? 1 : 0));

// Proyección de `vector` sobre el plano perpendicular a `normal` (sin normalizar).
const alongSurface = (vector, normal) => subtract(vector, scale(normal, dot(vector, normal)));

// Rotación de `vector` un ángulo alrededor del eje unitario `axis` (Rodrigues).
function rotateAround(vector, axis, angleRad) {
  const cosine = Math.cos(angleRad);
  const sine = Math.sin(angleRad);
  const parallel = scale(axis, dot(axis, vector) * (1 - cosine));
  const perpendicular = scale(vector, cosine);
  const turned = scale(cross(axis, vector), sine);
  return perpendicular.map((value, index) => value + turned[index] + parallel[index]);
}

/**
 * Centro del plug en el plano de la tabla: `tailDistanceMm` desde la cola (el
 * mínimo del eje largo) y `centerOffsetMm` desde la línea central.
 */
export function plugPosition({ bounds, axes }, tailDistanceMm, centerOffsetMm) {
  const { lengthAxis, widthAxis } = axes;
  return {
    lengthPos: bounds.min[lengthAxis] + tailDistanceMm,
    widthPos: (bounds.min[widthAxis] + bounds.max[widthAxis]) / 2 + centerOffsetMm,
  };
}

/**
 * Matriz que apoya un sólido local sobre la superficie en (lengthPos, widthPos):
 * su +Z sigue la normal (promediada en lengthSpan x widthSpan, para seguir el
 * rocker), su +X el largo de la tabla proyectado sobre la superficie, girado
 * `toeDeg` alrededor de la normal, y z = 0 cae en el punto de contacto.
 * `bottom` elige la cara inferior (quillas) frente a la superior (leash).
 */
export function surfacePlacement(probe, placement) {
  const { lengthPos, widthPos, lengthSpan, widthSpan, toeDeg, bottom } = placement;
  const { lengthAxis, widthAxis } = probe.axes;
  const { point, normal } = surfaceFrame(probe, lengthPos, widthPos, lengthSpan, widthSpan, bottom);

  let longDirection = alongSurface(unitVector(lengthAxis), normal);
  if (Math.hypot(...longDirection) < degenerateLength) {
    longDirection = alongSurface(unitVector(widthAxis), normal);
  }
  longDirection = scale(longDirection, 1 / Math.hypot(...longDirection));
  const widthDirection = cross(normal, longDirection);

  const toeRad = (toeDeg * Math.PI) / 180;
  const columns = [longDirection, widthDirection, normal].map((column) =>
    rotateAround(column, normal, toeRad),
  );
  return [...columns.flatMap((column) => [...column, 0]), ...point, 1];
}
