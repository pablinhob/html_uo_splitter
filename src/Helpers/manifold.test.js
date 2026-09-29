import { afterEach, beforeAll, describe, expect, it } from 'vitest';
import { boxSTL, textBuffer } from '../../tests/support/geometry';
import { loadManifoldModule, meshDataFromManifold, toManifold } from './manifold';
import { meshFaceCount } from './meshData';
import { parseSTL } from './stl';

const sizeMm = { x: 10, y: 20, z: 30 };
const volumeMm3 = sizeMm.x * sizeMm.y * sizeMm.z;

let wasm;
const created = [];
const track = (result) => {
  if (result.manifold) created.push(result.manifold);
  return result;
};

beforeAll(async () => {
  wasm = await loadManifoldModule();
});

afterEach(() => {
  created.splice(0).forEach((manifold) => manifold.delete());
});

describe('toManifold', () => {
  it('acepta una malla cerrada sin tocarla', () => {
    const { manifold, status } = track(toManifold(wasm, parseSTL(textBuffer(boxSTL(sizeMm)))));
    expect(status).toBe('watertight');
    expect(manifold.volume()).toBeCloseTo(volumeMm3, 3);
    expect(manifold.genus()).toBe(0);
  });

  it('cierra una grieta diminuta fusionando vértices', () => {
    const cracked = parseSTL(textBuffer(boxSTL(sizeMm, { gapMm: 1e-3 })));
    const { manifold, status } = track(toManifold(wasm, cracked));
    expect(status).toBe('repaired');
    expect(manifold.volume()).toBeCloseTo(volumeMm3, 1);
  });

  it('marca como fallida una malla a la que le falta una cara', () => {
    const open = parseSTL(textBuffer(boxSTL(sizeMm, { omitFace: 0 })));
    expect(toManifold(wasm, open)).toEqual({ manifold: null, status: 'failed' });
  });
});

describe('meshDataFromManifold', () => {
  it('devuelve la malla del Manifold como meshData', () => {
    const { manifold } = track(toManifold(wasm, parseSTL(textBuffer(boxSTL(sizeMm)))));
    const meshData = meshDataFromManifold(manifold);
    expect(meshData.positions).toBeInstanceOf(Float32Array);
    expect(meshData.index).toBeInstanceOf(Uint32Array);
    expect(meshFaceCount(meshData)).toBe(12);
  });
});
