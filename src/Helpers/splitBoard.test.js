import { afterEach, beforeAll, describe, expect, it } from 'vitest';
import { boxSTL, MODEL_NAMES, readModel, textBuffer } from '../../tests/support/geometry';
import {
  isInKnownDivergentRegion,
  readReference,
  REFERENCE_TOLERANCE,
} from '../../tests/support/reference';
import { DEFAULT_SPLIT } from '../config';
import loadBoard from './board';
import { cutlapInnerPolygon } from './cutlap';
import { loadManifoldModule, toManifold } from './manifold';
import { buildPiecesTree } from './pieces';
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

const boxBoard = (size, transform) =>
  track(toManifold(wasm, parseSTL(textBuffer(boxSTL(size, { transform })))).manifold);

function split(board, params) {
  const result = splitBoard(wasm, board, { ...DEFAULT_SPLIT, ...params });
  result.pieces.forEach((piece) => track(piece.manifold));
  return result;
}

const totalVolume = (pieces) => pieces.reduce((sum, piece) => sum + piece.manifold.volume(), 0);

describe('splitBoard (caja de 600 x 200 x 40 mm)', () => {
  const size = { x: 600, y: 200, z: 40 };
  const volumeMm3 = size.x * size.y * size.z;

  it('reparte todo el volumen en piezas cerradas, con el stringer primero', () => {
    const { pieces } = split(boxBoard(size), { shape: 'Hexagon' });
    expect(pieces[0].key).toEqual(['stringer']);
    expect(pieces[0].manifold.volume()).toBeCloseTo(size.x * 4 * size.z, 0);
    expect(totalVolume(pieces)).toBeCloseTo(volumeMm3, 0);
    pieces.forEach((piece) => expect(piece.manifold.genus()).toBe(0));
  });

  it('las claves construyen el árbol de piezas de la interfaz', () => {
    const { pieces } = split(boxBoard(size), { shape: 'Triangle' });
    const tree = buildPiecesTree(pieces.map((piece) => piece.key));
    expect(tree.map((node) => node.label)).toEqual(['All', 'Stringer', 'Side A', 'Side B']);
    expect(tree[2].children[0].label).toBe('Cutlap A');
  });

  it('sin cutlap ni stringer solo hay dos mitades troceadas', () => {
    const { pieces, cutOutlines } = split(boxBoard(size), {
      shape: 'Hexagon',
      cutlapWidthMm: 0,
      stringerWidthMm: 0,
    });
    expect(pieces.every((piece) => piece.key.length === 2)).toBe(true);
    expect(totalVolume(pieces)).toBeCloseTo(volumeMm3, 0);
    // El primer contorno es el corte central, compartido por las dos mitades.
    const halves = new Set(cutOutlines[0].borders.map(([half]) => half));
    expect([...halves].sort()).toEqual(['a', 'b']);
  });

  it('cada contorno de corte es una lista de segmentos 3D', () => {
    const { cutOutlines } = split(boxBoard(size), { shape: 'Hexagon' });
    expect(cutOutlines.length).toBeGreaterThan(0);
    cutOutlines.forEach(({ segments, borders }) => {
      expect(segments.length % 6).toBe(0);
      expect(borders.length).toBeGreaterThan(0);
    });
  });

  it('da el mismo resultado con la tabla orientada a lo largo del eje Y', () => {
    const upright = split(boxBoard(size), { shape: 'Hexagon' });
    const rotated = split(boxBoard({ x: size.y, y: size.x, z: size.z }), { shape: 'Hexagon' });
    expect(rotated.pieces.map((piece) => piece.key)).toEqual(
      upright.pieces.map((piece) => piece.key),
    );
    expect(totalVolume(rotated.pieces)).toBeCloseTo(volumeMm3, 0);
    const { min, max } = rotated.pieces[0].manifold.boundingBox();
    // El stringer va a lo largo del eje largo (Y) y tiene 4 mm de ancho en X.
    expect(max[0] - min[0]).toBeCloseTo(4, 3);
    expect(max[1] - min[1]).toBeCloseTo(size.x, 3);
  });

  it('rechaza un patrón desconocido', () => {
    expect(() => split(boxBoard(size), { shape: 'Octagon' })).toThrow(
      "Split pattern 'Octagon' is not implemented yet",
    );
  });
});

describe('Cobra: la muesca de la cola de golondrina se conserva', () => {
  it('la huella cruza y = 0 donde el STL original (x = 34,46 mm, medido con trimesh)', () => {
    const loaded = loadBoard(wasm, readModel('Cobra'));
    track(loaded.manifold);
    const footprint = loaded.manifold.project();
    const crossings = footprint.toPolygons().flatMap((ring) =>
      ring.flatMap(([startX, startY], index) => {
        const [endX, endY] = ring[(index + 1) % ring.length];
        if (startY <= 0 === endY <= 0) return [];
        return [startX + ((0 - startY) * (endX - startX)) / (endY - startY)];
      }),
    );
    footprint.delete();
    expect(Math.min(...crossings)).toBeCloseTo(34.46, 1);
    const inner = cutlapInnerPolygon(loaded.manifold, DEFAULT_SPLIT.cutlapWidthMm);
    inner.section.delete();
  });
});

const sortedBorders = (outlines) =>
  outlines
    .map(({ borders }) =>
      borders
        .map((key) => JSON.stringify(key))
        .sort()
        .join(';'),
    )
    .sort();

describe.each(MODEL_NAMES)('split de %s frente a Python', (name) => {
  const reference = readReference(name)?.split;

  it.each(['Hexagon', 'Triangle'])('%s: mismas piezas, volúmenes y contornos', (shape) => {
    const python = reference[shape];
    const loaded = loadBoard(wasm, readModel(name));
    track(loaded.manifold);
    const { pieces, cutOutlines } = split(loaded.manifold, { ...reference.params, shape });

    expect(pieces.map((piece) => piece.key)).toEqual(python.pieces.map((piece) => piece.key));
    pieces.forEach((piece, index) => {
      const pythonPiece = python.pieces[index];
      // Una celda puede abarcar zonas separadas (las dos puntas de una cola de golondrina):
      // la pieza tiene entonces varias partes, igual que en Python.
      expect(piece.manifold.volume()).toBeGreaterThan(0);
      if (isInKnownDivergentRegion({ model: name, section: 'split' }, pythonPiece)) return;
      const volumeError = Math.abs(piece.manifold.volume() / pythonPiece.volume_mm3 - 1);
      expect(volumeError).toBeLessThan(REFERENCE_TOLERANCE.splitVolumeRelative);
      const { min, max } = piece.manifold.boundingBox();
      [min, max].forEach((corner, cornerIndex) =>
        corner.forEach((value, axis) =>
          expect(Math.abs(value - pythonPiece.bounds_mm[cornerIndex][axis])).toBeLessThan(
            REFERENCE_TOLERANCE.splitBoundsMm,
          ),
        ),
      );
    });
    // Python también guarda entradas sin contorno (outline None), que el visor ignora.
    expect(sortedBorders(cutOutlines)).toEqual(
      sortedBorders(python.cut_outlines.filter((outline) => outline.has_outline)),
    );
  });
});
