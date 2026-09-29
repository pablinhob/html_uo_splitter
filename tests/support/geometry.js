import { readFileSync } from 'node:fs';

// Utilidades de los tests: STL sintéticos y lectura de los modelos de ejemplo.

// Cuatro esquinas (en unidades del tamaño) de cada cara de una caja, hacia fuera.
const boxFaces = [
  [
    [0, 0, 0],
    [0, 1, 0],
    [1, 1, 0],
    [1, 0, 0],
  ],
  [
    [0, 0, 1],
    [1, 0, 1],
    [1, 1, 1],
    [0, 1, 1],
  ],
  [
    [0, 0, 0],
    [1, 0, 0],
    [1, 0, 1],
    [0, 0, 1],
  ],
  [
    [0, 1, 0],
    [0, 1, 1],
    [1, 1, 1],
    [1, 1, 0],
  ],
  [
    [0, 0, 0],
    [0, 0, 1],
    [0, 1, 1],
    [0, 1, 0],
  ],
  [
    [1, 0, 0],
    [1, 1, 0],
    [1, 1, 1],
    [1, 0, 1],
  ],
];

/**
 * STL ASCII de una caja de `sizeMm` ({ x, y, z }) con 12 triángulos.
 * - omitFace: índice de una cara que se quita (malla abierta, irreparable).
 * - gapMm: desplaza los vértices de la cara superior en x, dejando una grieta
 *   diminuta (malla abierta que Mesh.merge() puede cerrar).
 * - transform: ([x, y, z]) => [x, y, z] aplicada a cada vértice ya escalado
 *   (p. ej. para inclinar la cara superior).
 */
export function boxSTL(
  { x, y, z },
  { omitFace = -1, gapMm = 0, transform = (point) => point } = {},
) {
  const vertex = ([cx, cy, cz], faceIndex) => {
    const shift = faceIndex === 1 ? gapMm : 0;
    return `vertex ${transform([cx * x + shift, cy * y, cz * z]).join(' ')}`;
  };
  const facet = (points, faceIndex) =>
    [
      'facet normal 0 0 0',
      'outer loop',
      ...points.map((point) => vertex(point, faceIndex)),
      'endloop',
      'endfacet',
    ].join('\n');
  const facets = boxFaces
    .map((corners, faceIndex) => ({ corners, faceIndex }))
    .filter(({ faceIndex }) => faceIndex !== omitFace)
    .flatMap(({ corners: [first, second, third, fourth], faceIndex }) => [
      facet([first, second, third], faceIndex),
      facet([first, third, fourth], faceIndex),
    ]);
  return `solid box\n${facets.join('\n')}\nendsolid box\n`;
}

export const textBuffer = (text) => new TextEncoder().encode(text).buffer;

export const MODEL_NAMES = ['Mini Simmons', 'Cobra', '5_8 DRIFT OBQ'];

// ArrayBuffer de un modelo de tests/fixtures/models/.
export function readModel(name) {
  const file = readFileSync(new URL(`../fixtures/models/${name}.stl`, import.meta.url));
  return file.buffer.slice(file.byteOffset, file.byteOffset + file.byteLength);
}
