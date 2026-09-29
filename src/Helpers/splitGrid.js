/**
 * Rejillas de celdas del split, en el plano canónico (x = largo, y = ancho):
 * generate_grid_centers + _hex_vertices_2d (hex_grid.py) y
 * _generate_triangle_cells (triangle_grid.py). Cada celda es
 * { key, vertices: [[x, y], ...] }; la clave es un array como la tupla de Python.
 */

const sqrt3 = Math.sqrt(3);
// Ángulos de los vértices de un hexágono con un vértice arriba (pointy top).
const hexAnglesRad = [0, 1, 2, 3, 4, 5].map((index) => ((index * 60 - 30) * Math.PI) / 180);

const range = (first, last) =>
  Array.from({ length: Math.max(0, last - first + 1) }, (_, offset) => first + offset);

// generate_grid_centers: filas desplazadas medio paso (rejilla hexagonal).
function hexCenters({ min, max }, radiusMm) {
  const horizontalSpacing = radiusMm * sqrt3;
  const verticalSpacing = radiusMm * 1.5;
  const marginMm = radiusMm;
  const rows = range(
    Math.floor((min[1] - marginMm) / verticalSpacing) - 1,
    Math.ceil((max[1] + marginMm) / verticalSpacing) + 1,
  );
  const cols = range(
    Math.floor((min[0] - marginMm) / horizontalSpacing) - 1,
    Math.ceil((max[0] + marginMm) / horizontalSpacing) + 1,
  );
  return rows.flatMap((row) => {
    // Como `row % 2` en Python: cualquier fila impar (también negativa) se desplaza.
    const offset = row % 2 === 0 ? 0 : horizontalSpacing / 2;
    return cols.map((col) => ({
      key: [row, col],
      center: [col * horizontalSpacing + offset, row * verticalSpacing],
    }));
  });
}

export function hexCells(bounds, radiusMm) {
  return hexCenters(bounds, radiusMm).map(({ key, center: [centerX, centerY] }) => ({
    key,
    vertices: hexAnglesRad.map((angle) => [
      centerX + radiusMm * Math.cos(angle),
      centerY + radiusMm * Math.sin(angle),
    ]),
  }));
}

export function triangleCells({ min, max }, radiusMm) {
  const side = radiusMm * sqrt3;
  const height = (side * sqrt3) / 2;
  const marginMm = radiusMm;
  const lattice = (column, row) => [column * side + (row * side) / 2, row * height];
  const rows = range(
    Math.floor((min[1] - marginMm) / height) - 1,
    Math.ceil((max[1] + marginMm) / height) + 1,
  );
  return rows.flatMap((row) => {
    const rowOffset = (row * side) / 2;
    const columns = range(
      Math.floor((min[0] - marginMm - rowOffset) / side) - 1,
      Math.ceil((max[0] + marginMm - rowOffset) / side) + 1,
    );
    return columns.flatMap((column) => [
      {
        key: [column, row, 'a'],
        vertices: [lattice(column, row), lattice(column + 1, row), lattice(column, row + 1)],
      },
      {
        key: [column, row, 'b'],
        vertices: [
          lattice(column + 1, row),
          lattice(column + 1, row + 1),
          lattice(column, row + 1),
        ],
      },
    ]);
  });
}

export const SPLIT_PATTERNS = { Hexagon: hexCells, Triangle: triangleCells };

// Orden de las tuplas de Python: elemento a elemento, números y luego textos.
export function compareKeys(first, second) {
  const position = first.findIndex((value, index) => value !== second[index]);
  if (position === -1) return first.length - second.length;
  const [left, right] = [first[position], second[position]];
  if (typeof left === 'number' && typeof right === 'number') return left - right;
  return String(left) < String(right) ? -1 : 1;
}

const roundedPoint = ([x, y]) => `${x.toFixed(3)},${y.toFixed(3)}`;

// edge_key: la arista sin sentido, con los extremos redondeados a 3 decimales.
export function edgeKey(start, end) {
  return [roundedPoint(start), roundedPoint(end)].sort().join('|');
}

// outward_edge_normal: normal 2D de la arista que apunta hacia fuera de la celda.
export function outwardEdgeNormal([startX, startY], [endX, endY], [centerX, centerY]) {
  const length = Math.hypot(endX - startX, endY - startY);
  const normal = [(endY - startY) / length, -(endX - startX) / length];
  const towardsCenter = normal[0] * (centerX - startX) + normal[1] * (centerY - startY);
  return towardsCenter > 0 ? normal.map((value) => -value) : normal;
}
