import { describe, expect, it } from 'vitest';
import { computeObjectStats, faceCount, loadSTL, vertexCount } from './stl';

const sizeMm = { x: 10, y: 20, z: 30 };

// STL ASCII de una caja cerrada de sizeMm con 12 triángulos orientados hacia fuera.
function boxSTL({ x, y, z }) {
  const corner = (cx, cy, cz) => `vertex ${cx * x} ${cy * y} ${cz * z}`;
  const quads = [
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
  const facet = (points) =>
    `facet normal 0 0 0\nouter loop\n${points.map((point) => corner(...point)).join('\n')}\nendloop\nendfacet`;
  const facets = quads.flatMap(([first, second, third, fourth]) => [
    facet([first, second, third]),
    facet([first, third, fourth]),
  ]);
  return `solid box\n${facets.join('\n')}\nendsolid box\n`;
}

const fileFrom = (text) => ({ arrayBuffer: async () => new TextEncoder().encode(text).buffer });

describe('loadSTL', () => {
  it('fusiona los vértices repetidos en una malla indexada', async () => {
    const geometry = await loadSTL(fileFrom(boxSTL(sizeMm)));
    expect(faceCount(geometry)).toBe(12);
    expect(vertexCount(geometry)).toBe(8);
    expect(geometry.index).not.toBeNull();
  });

  it('falla con un fichero que no es STL', async () => {
    await expect(loadSTL(fileFrom('esto no es un STL'))).rejects.toThrow();
  });
});

describe('computeObjectStats', () => {
  it('devuelve bounding box y volumen en milímetros', async () => {
    const geometry = await loadSTL(fileFrom(boxSTL(sizeMm)));
    const stats = computeObjectStats(geometry);
    expect(stats.sizeMm).toEqual([sizeMm.x, sizeMm.y, sizeMm.z]);
    expect(stats.volumeMm3).toBeCloseTo(sizeMm.x * sizeMm.y * sizeMm.z, 6);
  });
});
