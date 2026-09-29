/**
 * Utilidades de polígonos 2D que en Python daba shapely. Los anillos son listas de
 * puntos [x, y] sin repetir el primero al final (como toPolygons() de manifold).
 */

function distanceToSegment([pointX, pointY], [startX, startY], [endX, endY]) {
  const edgeX = endX - startX;
  const edgeY = endY - startY;
  const lengthSquared = edgeX * edgeX + edgeY * edgeY;
  if (lengthSquared === 0) return Math.hypot(pointX - startX, pointY - startY);
  const projection = ((pointX - startX) * edgeX + (pointY - startY) * edgeY) / lengthSquared;
  const along = Math.min(1, Math.max(0, projection));
  return Math.hypot(pointX - (startX + along * edgeX), pointY - (startY + along * edgeY));
}

// Douglas-Peucker sobre la polilínea points[first..last]: marca los vértices que se quedan.
function markKept(points, first, last, toleranceMm, kept) {
  if (last <= first + 1) return;
  let farthest = -1;
  let farthestDistance = -1;
  for (let index = first + 1; index < last; index += 1) {
    const distance = distanceToSegment(points[index], points[first], points[last]);
    if (distance > farthestDistance) {
      farthest = index;
      farthestDistance = distance;
    }
  }
  if (farthestDistance <= toleranceMm) return;
  kept.add(farthest);
  markKept(points, first, farthest, toleranceMm, kept);
  markKept(points, farthest, last, toleranceMm, kept);
}

/**
 * polygon.simplify(tolerance) de shapely sobre un anillo: Douglas-Peucker con el
 * anillo abierto en su primer vértice, como GEOS. Si quedaría un anillo
 * degenerado (menos de 3 vértices), se devuelve el original.
 */
export function simplifyRing(ring, toleranceMm) {
  const closed = [...ring, ring[0]];
  const kept = new Set([0, closed.length - 1]);
  markKept(closed, 0, closed.length - 1, toleranceMm, kept);
  const simplified = [...kept]
    .sort((first, second) => first - second)
    .slice(0, -1)
    .map((index) => closed[index]);
  return simplified.length >= 3 ? simplified : ring;
}

// ¿Está el punto dentro del anillo? (regla par-impar, como Polygon.contains).
export function ringContains(ring, [pointX, pointY]) {
  return ring.reduce((inside, [startX, startY], index) => {
    const [endX, endY] = ring[(index + 1) % ring.length];
    const crosses =
      startY > pointY !== endY > pointY &&
      pointX < ((endX - startX) * (pointY - startY)) / (endY - startY) + startX;
    return crosses ? !inside : inside;
  }, false);
}

export function signedRingArea(ring) {
  return ring.reduce((sum, [x, y], index) => {
    const [nextX, nextY] = ring[(index + 1) % ring.length];
    return sum + (x * nextY - nextX * y) / 2;
  }, 0);
}
