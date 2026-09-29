import { describe, expect, it } from 'vitest';
import { boxSTL, textBuffer } from '../../tests/support/geometry';
import { meshFaceCount, meshVertexCount } from './meshData';
import { computeObjectStats, parseSTL } from './stl';

const sizeMm = { x: 10, y: 20, z: 30 };

describe('parseSTL', () => {
  it('fusiona los vértices repetidos en una malla indexada', () => {
    const meshData = parseSTL(textBuffer(boxSTL(sizeMm)));
    expect(meshFaceCount(meshData)).toBe(12);
    expect(meshVertexCount(meshData)).toBe(8);
  });

  it('falla con un fichero que no es STL', () => {
    expect(() => parseSTL(textBuffer('esto no es un STL'))).toThrow();
  });
});

describe('computeObjectStats', () => {
  it('devuelve bounding box y volumen en milímetros', () => {
    const stats = computeObjectStats(parseSTL(textBuffer(boxSTL(sizeMm))));
    expect(stats.sizeMm).toEqual([sizeMm.x, sizeMm.y, sizeMm.z]);
    expect(stats.volumeMm3).toBeCloseTo(sizeMm.x * sizeMm.y * sizeMm.z, 6);
  });
});
