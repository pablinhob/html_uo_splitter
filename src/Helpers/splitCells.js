import { SPLIT_PLANE_TOLERANCE_MM, SPLIT_PRISM_MARGIN_MM } from '../config';
import { meshDataFromManifold } from './manifold';
import { planarFaceOutline } from './meshOutline';
import { keyId } from './pieces';
import { compareKeys, edgeKey, outwardEdgeNormal } from './splitGrid';

/**
 * split_into_cells (polygon_grid.py), en el marco canónico: interseca `source`
 * (Manifold) con el prisma vertical de cada celda y devuelve
 *   { pieces: [{ key, manifold, meshData }], outlines: [{ segments, borders: [i, j] }] }
 * con las piezas ordenadas por clave como sorted() de Python. `outlines` son las
 * tapas de corte entre dos celdas vecinas con pieza; borders son sus índices.
 * El llamante libera los Manifold de las piezas. `source` no se toca.
 */

const mean = (points) =>
  [0, 1].map((axis) => points.reduce((sum, point) => sum + point[axis], 0) / points.length);

// ¿Se solapan la huella de la celda y la de la malla? Si no, la intersección sería vacía.
function overlapsFootprint(vertices, { min, max }) {
  const xs = vertices.map(([x]) => x);
  const ys = vertices.map(([, y]) => y);
  return (
    Math.max(...xs) >= min[0] &&
    Math.min(...xs) <= max[0] &&
    Math.max(...ys) >= min[1] &&
    Math.min(...ys) <= max[1]
  );
}

function cellPrism(wasm, vertices, { min, max }) {
  const bottom = min[2] - SPLIT_PRISM_MARGIN_MM;
  const height = max[2] - min[2] + 2 * SPLIT_PRISM_MARGIN_MM;
  const section = wasm.CrossSection.ofPolygons([vertices]);
  const prism = section.extrude(height);
  section.delete();
  const placed = prism.translate(0, 0, bottom);
  prism.delete();
  return placed;
}

function cutPieces(wasm, source, cells) {
  const bounds = source.boundingBox();
  return cells
    .filter(({ vertices }) => overlapsFootprint(vertices, bounds))
    .flatMap(({ key, vertices }) => {
      const prism = cellPrism(wasm, vertices, bounds);
      const manifold = source.intersect(prism);
      prism.delete();
      if (manifold.isEmpty()) {
        manifold.delete();
        return [];
      }
      return [{ key, manifold, meshData: meshDataFromManifold(manifold), center: mean(vertices) }];
    })
    .sort((first, second) => compareKeys(first.key, second.key));
}

// Aristas compartidas por exactamente dos celdas: { key, start, end } por dueño.
function sharedEdges(cells) {
  const owners = new Map();
  cells.forEach(({ key, vertices }) => {
    vertices.forEach((start, position) => {
      const end = vertices[(position + 1) % vertices.length];
      const id = edgeKey(start, end);
      if (!owners.has(id)) owners.set(id, []);
      owners.get(id).push({ key, start, end });
    });
  });
  return [...owners.values()].filter((edgeOwners) => edgeOwners.length === 2);
}

export default function splitIntoCells(wasm, source, cells) {
  const pieces = cutPieces(wasm, source, cells);
  const indexById = new Map(pieces.map((piece, index) => [keyId(piece.key), index]));
  const outlines = sharedEdges(cells)
    .filter(
      ([first, second]) => indexById.has(keyId(first.key)) && indexById.has(keyId(second.key)),
    )
    .map(([first, second]) => {
      const owner = pieces[indexById.get(keyId(first.key))];
      const [normalX, normalY] = outwardEdgeNormal(first.start, first.end, owner.center);
      const origin = [first.start[0], first.start[1], 0];
      return {
        segments: planarFaceOutline(
          owner.meshData,
          origin,
          [normalX, normalY, 0],
          SPLIT_PLANE_TOLERANCE_MM,
        ),
        borders: [indexById.get(keyId(first.key)), indexById.get(keyId(second.key))],
      };
    });
  return {
    pieces: pieces.map(({ key, manifold, meshData }) => ({ key, manifold, meshData })),
    outlines,
  };
}
