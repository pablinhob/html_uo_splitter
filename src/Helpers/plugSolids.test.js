import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { MODEL_NAMES, readModel } from '../../tests/support/geometry';
import {
  isKnownDivergence,
  readReference,
  REFERENCE_TOLERANCE,
} from '../../tests/support/reference';
import { DEFAULT_PLUGS, MARKER_PROTRUSION_MM, SUBTRACTION_MARGIN_MM } from '../config';
import loadBoard from './board';
import { loadManifoldModule } from './manifold';
import { collectPlugCavities, collectPlugSupports } from './plugSolids';
import { createSurfaceProbe } from './surface';

const withFin = (type) => ({ ...DEFAULT_PLUGS, fin: { ...DEFAULT_PLUGS.fin, type } });

// Resumen de cada sólido (y lo libera): volumen, bbox y si es cerrado.
const summarize = (solids) =>
  solids.map((solid) => {
    const { min, max } = solid.boundingBox();
    const summary = { volumeMm3: solid.volume(), min, max, genus: solid.genus() };
    solid.delete();
    return summary;
  });

function expectMatchesPython(solids, pythonSolids, where) {
  expect(solids).toHaveLength(pythonSolids.length);
  solids.forEach((solid, index) => {
    const python = pythonSolids[index];
    if (isKnownDivergence({ ...where, index })) return;
    expect(python.is_watertight).toBe(true);
    expect(solid.genus).toBe(0);
    expect(Math.abs(solid.volumeMm3 / python.volume_mm3 - 1)).toBeLessThan(
      REFERENCE_TOLERANCE.solidVolumeRelative,
    );
    [solid.min, solid.max].forEach((corner, cornerIndex) => {
      corner.forEach((value, axis) => {
        expect(Math.abs(value - python.bounds_mm[cornerIndex][axis])).toBeLessThan(
          REFERENCE_TOLERANCE.placementMm,
        );
      });
    });
  });
}

let wasm;
beforeAll(async () => {
  wasm = await loadManifoldModule();
});

describe.each(MODEL_NAMES)('plugs de %s', (name) => {
  const reference = readReference(name)?.plugs;
  let board;
  let loaded;

  beforeAll(() => {
    loaded = loadBoard(wasm, readModel(name));
    board = { wasm, probe: createSurfaceProbe(loaded.meshData) };
  });
  afterAll(() => {
    loaded.manifold?.delete();
    board.probe.dispose();
  });

  it('los parámetros por defecto coinciden con los de config.py', () => {
    expect(reference).toBeTruthy();
    expect(DEFAULT_PLUGS.leash).toEqual(reference.plugs.leash);
    const { type, ...fin } = DEFAULT_PLUGS.fin;
    expect(type).toBe('single');
    expect(fin).toEqual(reference.plugs.fin);
  });

  it.each(['single', 'twin'])('%s fin: cavidades y soportes como en Python', (finType) => {
    const plugs = withFin(finType);
    const python = reference[finType];
    const where = (set) => ({ model: name, section: 'plugs', set });
    expectMatchesPython(
      summarize(collectPlugCavities(board, plugs, MARKER_PROTRUSION_MM)),
      python.markers,
      where('markers'),
    );
    expectMatchesPython(
      summarize(collectPlugCavities(board, plugs, SUBTRACTION_MARGIN_MM)),
      python.cavities,
      where('cavities'),
    );
    expectMatchesPython(
      summarize(collectPlugSupports(board, plugs)),
      python.supports,
      where('supports'),
    );
  });
});

describe('divergencia conocida: soporte del leash de Cobra', () => {
  it('queda apoyado en la cubierta, alineado con su cavidad', () => {
    const loaded = loadBoard(wasm, readModel('Cobra'));
    const board = { wasm, probe: createSurfaceProbe(loaded.meshData) };
    const [cavity] = summarize(collectPlugCavities(board, DEFAULT_PLUGS, 0));
    const [support] = summarize(collectPlugSupports(board, DEFAULT_PLUGS));
    loaded.manifold.delete();
    board.probe.dispose();
    // El soporte envuelve la cavidad: su bbox la contiene con margen de pared.
    [0, 1, 2].forEach((axis) => {
      expect(support.min[axis]).toBeLessThanOrEqual(cavity.min[axis] + 0.5);
      expect(support.max[axis]).toBeGreaterThanOrEqual(cavity.max[axis] - 0.5);
    });
    // Y no está volcado: su extensión a lo largo es la del diámetro + holguras + pared.
    expect(support.max[0] - support.min[0]).toBeLessThan(40);
  });
});
