import { afterEach, beforeAll, describe, expect, it } from 'vitest';
import { boxSTL, textBuffer } from '../../tests/support/geometry';
import { DEFAULT_HOLLOW, DEFAULT_PLUGS, DEFAULT_SPLIT, SUBTRACTION_MARGIN_MM } from '../config';
import loadBoard from './board';
import createGeometryService from './geometryService';
import { loadManifoldModule, toManifold } from './manifold';
import { isHollowable, keyId } from './pieces';
import { collectPlugCavities } from './plugSolids';
import { createSurfaceProbe } from './surface';

let wasm;
const services = [];
const boardSTL = () => textBuffer(boxSTL({ x: 1000, y: 300, z: 60 }));
const splitParams = { ...DEFAULT_SPLIT, shape: 'Hexagon' };

beforeAll(async () => {
  wasm = await loadManifoldModule();
});
afterEach(() => services.splice(0).forEach((service) => service.dispose()));

function splitService(plugs) {
  const service = createGeometryService(wasm);
  services.push(service);
  service.handle('loadBoard', { buffer: boardSTL() }, () => {});
  const { result } = service.handle('split', { params: splitParams, plugs }, () => {});
  return { service, pieces: result.pieces };
}

// Volumen de una malla cerrada (y libera el Manifold temporal).
function volumeOf(meshData) {
  const { manifold } = toManifold(wasm, meshData);
  const volume = manifold.volume();
  manifold.delete();
  return volume;
}

// Volumen del material de la tabla que ocupan las cavidades de los plugs.
function cavitiesInBoardMm3() {
  const loaded = loadBoard(wasm, boardSTL());
  const probe = createSurfaceProbe(loaded.meshData);
  const cavities = collectPlugCavities({ wasm, probe }, DEFAULT_PLUGS, SUBTRACTION_MARGIN_MM);
  const union = wasm.Manifold.union(cavities);
  const inside = loaded.manifold.intersect(union);
  const volume = inside.volume();
  [inside, union, loaded.manifold, ...cavities].forEach((solid) => solid.delete());
  return volume;
}

const totalVolume = (pieces) => pieces.reduce((sum, { meshData }) => sum + volumeOf(meshData), 0);

describe('split con plugs', () => {
  it('las piezas se ven con el hueco de los plugs, no con los plugs encima', () => {
    const solid = splitService(undefined).pieces;
    const drilled = splitService(DEFAULT_PLUGS).pieces;
    expect(drilled.map(({ key }) => keyId(key))).toEqual(solid.map(({ key }) => keyId(key)));

    const removedMm3 = totalVolume(solid) - totalVolume(drilled);
    const expectedMm3 = cavitiesInBoardMm3();
    expect(expectedMm3).toBeGreaterThan(0);
    expect(Math.abs(removedMm3 / expectedMm3 - 1)).toBeLessThan(1e-3);
  });

  it('guarda las piezas sin restar: la exportación sale igual', () => {
    const exportParams = { params: { hollow: DEFAULT_HOLLOW, plugs: DEFAULT_PLUGS } };
    const exported = [undefined, DEFAULT_PLUGS].map((plugs) => {
      const { service } = splitService(plugs);
      return service.handle('processExport', exportParams, () => {}).result.pieces;
    });
    expect(totalVolume(exported[1])).toBeCloseTo(totalVolume(exported[0]), 3);
  });

  it('la previsualización del vaciado deja vacía la cavidad y añade el soporte', () => {
    const { service, pieces } = splitService(DEFAULT_PLUGS);
    const solidById = new Map(
      splitService(undefined).pieces.map((piece) => [keyId(piece.key), piece]),
    );
    // Una pieza del núcleo a la que los plugs le han quitado material.
    const drilled = pieces.find(
      ({ key, meshData }) =>
        isHollowable(key) && volumeOf(meshData) < volumeOf(solidById.get(keyId(key)).meshData) - 1,
    );
    expect(drilled).toBeDefined();

    const preview = (plugs) =>
      service.handle('hollowPiece', { key: drilled.key, hollow: DEFAULT_HOLLOW, plugs }, () => {})
        .result.meshData;
    const withPlugs = toManifold(wasm, preview(DEFAULT_PLUGS)).manifold;
    const plain = toManifold(wasm, preview(undefined)).manifold;
    const probe = service.surfaceProbe();
    const cavities = collectPlugCavities({ wasm, probe }, DEFAULT_PLUGS, SUBTRACTION_MARGIN_MM);
    const union = wasm.Manifold.union(cavities);
    const inCavity = withPlugs.intersect(union);

    expect(inCavity.volume()).toBeLessThan(1);
    // El soporte rellena el vaciado alrededor del plug: hay más material que sin él.
    const plainDrilled = plain.subtract(union);
    expect(withPlugs.volume()).toBeGreaterThan(plainDrilled.volume());
    [withPlugs, plain, union, inCavity, plainDrilled, ...cavities].forEach((solid) =>
      solid.delete(),
    );
  });
});
