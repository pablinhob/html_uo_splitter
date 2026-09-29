/**
 * Ejes de la tabla (_detect_axes / board_axes / detect_thickness_axis de
 * mesh_ops.py). Los ejes son índices 0 (x), 1 (y), 2 (z), ordenados por la
 * extensión del bounding box: largo (mayor), grosor (menor) y ancho (el otro).
 */

const componentsPerVertex = 3;
const axisIndices = [0, 1, 2];

// Bounding box de meshData: { min: [x, y, z], max: [x, y, z] }.
export function meshBounds({ positions }) {
  const min = [Infinity, Infinity, Infinity];
  const max = [-Infinity, -Infinity, -Infinity];
  for (let offset = 0; offset < positions.length; offset += componentsPerVertex) {
    axisIndices.forEach((axis) => {
      const value = positions[offset + axis];
      if (value < min[axis]) min[axis] = value;
      if (value > max[axis]) max[axis] = value;
    });
  }
  return { min, max };
}

// Como np.argmax / np.argmin: en caso de empate gana el primer eje.
const argBy = (values, isBetter) =>
  values.reduce((best, value, axis) => (isBetter(value, values[best]) ? axis : best), 0);

/**
 * { lengthAxis, widthAxis, thicknessAxis } a partir del bounding box.
 */
export function detectAxes({ min, max }) {
  const sizes = axisIndices.map((axis) => max[axis] - min[axis]);
  const lengthAxis = argBy(sizes, (value, best) => value > best);
  const thicknessAxis = argBy(sizes, (value, best) => value < best);
  return { lengthAxis, widthAxis: 3 - lengthAxis - thicknessAxis, thicknessAxis };
}
