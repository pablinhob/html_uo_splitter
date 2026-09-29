import { afterEach, beforeAll, describe, expect, it } from 'vitest';
import { MODEL_NAMES, readModel } from '../../tests/support/geometry';
import { readReference, REFERENCE_TOLERANCE } from '../../tests/support/reference';
import loadBoard from './board';
import { loadManifoldModule } from './manifold';

// Estado de cada modelo de ejemplo al cargarlo (medido en el paso 2 de migration.md).
const expected = {
  'Mini Simmons': { status: 'repaired', liters: 36.6 },
  Cobra: { status: 'watertight', liters: 33.65 },
  '5_8 DRIFT OBQ': { status: 'watertight', liters: 30.97 },
};

let wasm;
const loaded = [];
const load = (name) => {
  const board = loadBoard(wasm, readModel(name));
  loaded.push(board);
  return board;
};

beforeAll(async () => {
  wasm = await loadManifoldModule();
});

afterEach(() => {
  loaded.splice(0).forEach((board) => board.manifold?.delete());
});

describe.each(MODEL_NAMES)('loadBoard(%s)', (name) => {
  it('queda cerrada, con el volumen esperado', () => {
    const { manifold, repair, stats } = load(name);
    expect(repair.status).toBe(expected[name].status);
    expect(manifold.genus()).toBe(0);
    expect(stats.volumeMm3 / 1e6).toBeCloseTo(expected[name].liters, 2);
  });

  const reference = readReference(name);
  it.skipIf(!reference)('coincide con el programa Python (load_stl)', () => {
    const { repair, stats } = load(name);
    const { load: pythonLoad } = reference;
    expect(pythonLoad.repaired.is_watertight).toBe(true);
    expect(repair.status === 'watertight').toBe(pythonLoad.input.is_watertight);
    stats.sizeMm.forEach((sizeMm, axis) => {
      expect(Math.abs(sizeMm - pythonLoad.size_mm[axis])).toBeLessThan(REFERENCE_TOLERANCE.sizeMm);
    });
    const relativeError = Math.abs(stats.volumeMm3 / pythonLoad.volume_mm3 - 1);
    expect(relativeError).toBeLessThan(REFERENCE_TOLERANCE.volumeRelative);
  });
});
