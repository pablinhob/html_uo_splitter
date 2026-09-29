/**
 * Marco canónico de la tabla: X = largo, Y = ancho, Z = grosor. El split trabaja
 * siempre en este marco (como el código Python, que remapea los prismas a los ejes
 * de la tabla) y devuelve los resultados al marco del STL. Es una permutación de
 * ejes; manifold-3d admite también las que invierten la orientación.
 */

const axisOrder = ({ lengthAxis, widthAxis, thicknessAxis }) => [
  lengthAxis,
  widthAxis,
  thicknessAxis,
];

// Mat4 column-major que lleva la coordenada `from[row]` del origen a la fila `row`.
function permutationMatrix(order) {
  const matrix = new Array(16).fill(0);
  order.forEach((sourceAxis, row) => {
    matrix[sourceAxis * 4 + row] = 1;
  });
  matrix[15] = 1;
  return matrix;
}

const inverseOrder = (order) =>
  [0, 1, 2].map((worldAxis) => order.findIndex((axis) => axis === worldAxis));

/**
 * { toCanonical, toWorld, isIdentity, pointsToWorld(Float32Array) } para los ejes
 * de la tabla. pointsToWorld reordena un array plano de puntos (x, y, z, ...).
 */
export default function canonicalFrame(axes) {
  const order = axisOrder(axes);
  const isIdentity = order.every((axis, index) => axis === index);
  const back = inverseOrder(order);
  return {
    isIdentity,
    toCanonical: permutationMatrix(order),
    toWorld: permutationMatrix(back),
    pointsToWorld(points) {
      if (isIdentity) return points;
      const world = new Float32Array(points.length);
      for (let offset = 0; offset < points.length; offset += 3) {
        order.forEach((worldAxis, canonicalAxis) => {
          world[offset + worldAxis] = points[offset + canonicalAxis];
        });
      }
      return world;
    },
  };
}
