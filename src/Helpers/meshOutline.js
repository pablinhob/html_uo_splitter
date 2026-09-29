/**
 * Contornos de corte para el visor (cap_face_outline de polygon_grid.py y
 * _boundary_outline de cutlap.py): se eligen las caras de una malla que cumplen
 * una condición y se devuelve el borde de ese conjunto, es decir, las aristas que
 * solo usa una de sus caras (lo que hace submesh(...).outline() en trimesh).
 * El resultado es un Float32Array de segmentos: (x1, y1, z1, x2, y2, z2) por arista.
 */

const componentsPerVertex = 3;
// Lado de las celdas de ringProximity: del orden de los segmentos de un contorno.
const proximityCellMm = 10;

const vertexOf = (positions, vertex) => {
  const offset = vertex * componentsPerVertex;
  return [positions[offset], positions[offset + 1], positions[offset + 2]];
};

const edgeId = (first, second) => (first < second ? `${first},${second}` : `${second},${first}`);

/**
 * `isFaceSelected(corners)` recibe los tres vértices [x, y, z] de cada triángulo.
 * Devuelve el borde del conjunto de caras elegidas (vacío si no hay ninguna).
 */
export function faceSetOutline({ positions, index }, isFaceSelected) {
  const edgeUses = new Map();
  for (let corner = 0; corner < index.length; corner += 3) {
    const triangle = [index[corner], index[corner + 1], index[corner + 2]];
    if (isFaceSelected(triangle.map((vertex) => vertexOf(positions, vertex)))) {
      triangle.forEach((vertex, position) => {
        const next = triangle[(position + 1) % 3];
        const id = edgeId(vertex, next);
        const use = edgeUses.get(id);
        edgeUses.set(
          id,
          use ? { ...use, count: use.count + 1 } : { from: vertex, to: next, count: 1 },
        );
      });
    }
  }
  const boundary = [...edgeUses.values()].filter((edge) => edge.count === 1);
  const segments = new Float32Array(boundary.length * 2 * componentsPerVertex);
  boundary.forEach(({ from, to }, edge) => {
    segments.set([...vertexOf(positions, from), ...vertexOf(positions, to)], edge * 6);
  });
  return segments;
}

const signedDistance = (point, origin, normal) =>
  normal.reduce((sum, value, axis) => sum + value * (point[axis] - origin[axis]), 0);

// Borde de las caras que están en el plano (origin, normal) con esa tolerancia.
export function planarFaceOutline(meshData, origin, normal, toleranceMm) {
  return faceSetOutline(meshData, (corners) =>
    corners.every((corner) => Math.abs(signedDistance(corner, origin, normal)) < toleranceMm),
  );
}

// Distancia de un punto 2D al segmento (start, end).
function distanceToSegment([pointX, pointY], [startX, startY], [endX, endY]) {
  const edgeX = endX - startX;
  const edgeY = endY - startY;
  const lengthSquared = edgeX * edgeX + edgeY * edgeY;
  const projection = ((pointX - startX) * edgeX + (pointY - startY) * edgeY) / lengthSquared;
  const along = lengthSquared === 0 ? 0 : Math.min(1, Math.max(0, projection));
  return Math.hypot(pointX - (startX + along * edgeX), pointY - (startY + along * edgeY));
}

/**
 * Prepara la pregunta "¿está este punto 2D a menos de toleranceMm del anillo?"
 * (boundary.distance(Point(p)) < tolerance en shapely). Los segmentos del anillo
 * cerrado se reparten en una rejilla gruesa, así cada punto solo mira los
 * segmentos de su celda y de las vecinas. La celda es mayor que la tolerancia, de
 * modo que ningún segmento cercano queda fuera de las vecinas.
 */
export function ringProximity(ring, toleranceMm) {
  const cellSizeMm = Math.max(proximityCellMm, 2 * toleranceMm);
  const cellOf = (value) => Math.floor(value / cellSizeMm);
  const buckets = new Map();
  ring.forEach((start, position) => {
    const end = ring[(position + 1) % ring.length];
    const [minX, maxX] = [Math.min(start[0], end[0]), Math.max(start[0], end[0])];
    const [minY, maxY] = [Math.min(start[1], end[1]), Math.max(start[1], end[1])];
    for (let cellX = cellOf(minX); cellX <= cellOf(maxX); cellX += 1) {
      for (let cellY = cellOf(minY); cellY <= cellOf(maxY); cellY += 1) {
        const key = `${cellX},${cellY}`;
        if (!buckets.has(key)) buckets.set(key, []);
        buckets.get(key).push([start, end]);
      }
    }
  });
  const neighbours = [-1, 0, 1];
  return (point) => {
    const [cellX, cellY] = [cellOf(point[0]), cellOf(point[1])];
    return neighbours.some((offsetX) =>
      neighbours.some((offsetY) =>
        (buckets.get(`${cellX + offsetX},${cellY + offsetY}`) ?? []).some(
          ([start, end]) => distanceToSegment(point, start, end) < toleranceMm,
        ),
      ),
    );
  };
}
