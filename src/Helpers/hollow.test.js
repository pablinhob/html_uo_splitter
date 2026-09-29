import { afterEach, beforeAll, describe, expect, it } from 'vitest';
import { boxSTL, MODEL_NAMES, readModel, textBuffer } from '../../tests/support/geometry';
import { readReference, REFERENCE_TOLERANCE } from '../../tests/support/reference';
import { DEFAULT_HOLLOW, DEFAULT_SPLIT, FACE_HOLE_SECTIONS } from '../config';
import loadBoard from './board';
import hollowPiece from './hollow';
import { loadManifoldModule, toManifold } from './manifold';
import { keyId } from './pieces';
import splitBoard from './splitBoard';
import { parseSTL } from './stl';

let wasm;
const owned = [];
const track = (manifold) => {
  owned.push(manifold);
  return manifold;
};
beforeAll(async () => {
  wasm = await loadManifoldModule();
});
afterEach(() => owned.splice(0).forEach((manifold) => manifold.delete()));

// Pieza de 100 x 80 x 40 mm.
const size = { x: 100, y: 80, z: 40 };
const solidVolume = size.x * size.y * size.z;
const boxPiece = () => track(toManifold(wasm, parseSTL(textBuffer(boxSTL(size)))).manifold);
const hollow = (params) => track(hollowPiece(wasm, boxPiece(), { ...DEFAULT_HOLLOW, ...params }));
// Área de un polígono regular de N lados inscrito en un círculo de radio r.
const polygonArea = (radius) =>
  (FACE_HOLE_SECTIONS / 2) * radius ** 2 * Math.sin((2 * Math.PI) / FACE_HOLE_SECTIONS);

describe('hollowPiece (caja de 100 x 80 x 40 mm)', () => {
  it('sin pieles deja un tubo abierto con paredes de wallMm', () => {
    const tube = hollow({ wallMm: 2, topMm: 0, bottomMm: 0, holePct: 0 });
    expect(tube.volume()).toBeCloseTo(solidVolume - 96 * 76 * 40, 0);
  });

  it('las pieles superior e inferior cierran la cavidad', () => {
    const shell = hollow({ wallMm: 2, topMm: 5, bottomMm: 5, holePct: 0 });
    expect(shell.volume()).toBeCloseTo(solidVolume - 96 * 76 * 30, 0);
    // Cavidad cerrada: superficie exterior + interior (χ = 4), de ahí género -1.
    expect(shell.genus()).toBe(-1);
  });

  it('reparte agujeros de holePct % de la altura en cada cara lateral', () => {
    const tube = hollow({ wallMm: 2, topMm: 0, bottomMm: 0, holePct: 0 });
    const drilled = hollow({ wallMm: 2, topMm: 0, bottomMm: 0, holePct: 50 });
    // Altura 40 → radio 10 y margen 10: caben 3 en las caras de 100 y 2 en las de 80.
    const holes = 2 * 3 + 2 * 2;
    const removedByHoles = holes * polygonArea(10) * 2;
    expect(tube.volume() - drilled.volume()).toBeCloseTo(removedByHoles, 0);
  });

  it('no toca una pieza cuando no hay nada que vaciar', () => {
    const untouched = hollow({ wallMm: 2, topMm: 20, bottomMm: 20, holePct: 0 });
    expect(untouched.volume()).toBeCloseTo(solidVolume, 3);
  });
});

describe.each(MODEL_NAMES)('vaciado de %s frente a Python', (name) => {
  it('las piezas del núcleo quedan como en hollow_piece()', () => {
    const reference = readReference(name).hollow;
    const loaded = loadBoard(wasm, readModel(name));
    track(loaded.manifold);
    const { pieces } = splitBoard(wasm, loaded.manifold, {
      ...DEFAULT_SPLIT,
      shape: reference.shape,
    });
    pieces.forEach((piece) => track(piece.manifold));
    const byId = new Map(pieces.map((piece) => [keyId(piece.key), piece.manifold]));

    const totals = reference.pieces.reduce(
      (sums, python) => {
        const piece = byId.get(keyId(python.key));
        const cavityOnly = track(hollowPiece(wasm, piece, { ...reference.params, holePct: 0 }));
        const hollowed = track(hollowPiece(wasm, piece, reference.params));
        expect(Math.abs(cavityOnly.volume() / python.cavity_only_volume_mm3 - 1)).toBeLessThan(
          REFERENCE_TOLERANCE.cavityVolumeRelative,
        );
        const removed = piece.volume() - hollowed.volume();
        const pythonRemoved = python.solid_volume_mm3 - python.volume_mm3;
        expect(Math.abs(removed / pythonRemoved - 1)).toBeLessThan(
          REFERENCE_TOLERANCE.removedVolumeRelative,
        );
        return { js: sums.js + hollowed.volume(), python: sums.python + python.volume_mm3 };
      },
      { js: 0, python: 0 },
    );
    expect(Math.abs(totals.js / totals.python - 1)).toBeLessThan(
      REFERENCE_TOLERANCE.totalHollowedRelative,
    );
  });
});
