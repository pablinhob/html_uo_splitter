import { afterEach, beforeAll, describe, expect, it } from 'vitest';
import { boxSTL, MODEL_NAMES, readModel, textBuffer } from '../../tests/support/geometry';
import {
  isInKnownDivergentRegion,
  readReference,
  REFERENCE_TOLERANCE,
} from '../../tests/support/reference';
import { DEFAULT_HOLLOW, DEFAULT_PLUGS, DEFAULT_SPLIT } from '../config';
import createGeometryService from './geometryService';
import { loadManifoldModule } from './manifold';
import { meshFaceCount } from './meshData';
import { isHollowable, keyId, pieceName } from './pieces';

let wasm;
const services = [];
beforeAll(async () => {
  wasm = await loadManifoldModule();
});
afterEach(() => services.splice(0).forEach((service) => service.dispose()));

function preparedService(buffer) {
  const service = createGeometryService(wasm);
  services.push(service);
  service.handle('loadBoard', { buffer }, () => {});
  service.handle('split', { params: { ...DEFAULT_SPLIT, shape: 'Hexagon' } }, () => {});
  return service;
}

const exportParams = { hollow: DEFAULT_HOLLOW, plugs: DEFAULT_PLUGS };

describe('exportación (tabla de 1000 x 300 x 60 mm)', () => {
  it('procesa todas las piezas, añade soportes y escribe los dos formatos', () => {
    const service = preparedService(textBuffer(boxSTL({ x: 1000, y: 300, z: 60 })));
    const steps = [];
    const { result } = service.handle('processExport', { params: exportParams }, (message) =>
      steps.push(message),
    );
    const supports = result.pieces.filter(({ key }) => key[0] === 'support');
    expect(supports.length).toBeGreaterThan(0);
    expect(steps).toHaveLength(result.pieces.length - supports.length);
    expect(steps[0]).toBe(`Processing piece 1/${steps.length}: stringer...`);
    result.pieces.forEach(({ meshData }) => expect(meshFaceCount(meshData)).toBeGreaterThan(0));

    ['obj', '3mf'].forEach((fileType) => {
      const file = service.handle('exportFile', { fileType }, () => {}).result;
      expect(file.pieceCount).toBe(result.pieces.length);
      // Los dos formatos son zip: empiezan por la firma "PK".
      expect(String.fromCharCode(file.bytes[0], file.bytes[1])).toBe('PK');
    });
  });

  it('no exporta sin haber procesado antes', () => {
    const service = preparedService(textBuffer(boxSTL({ x: 1000, y: 300, z: 60 })));
    expect(() => service.handle('exportFile', { fileType: 'obj' }, () => {})).toThrow(
      'No processed pieces to export yet',
    );
  });
});

describe.each(MODEL_NAMES)('exportación de %s frente a Python', (name) => {
  it('mismas piezas finales, nombres y volúmenes', () => {
    const reference = readReference(name);
    const python = reference.export;
    const solidById = new Map(
      reference.split.Hexagon.pieces.map((piece) => [keyId(piece.key), piece.volume_mm3]),
    );
    const service = preparedService(readModel(name));
    const { result } = service.handle(
      'processExport',
      { params: { hollow: python.hollow, plugs: DEFAULT_PLUGS } },
      () => {},
    );

    expect(result.pieces.map(({ key }) => JSON.stringify(key))).toEqual(
      python.pieces.map(({ key }) => JSON.stringify(key)),
    );
    const volumeOf = ({ positions, index }) => {
      let volume = 0;
      for (let corner = 0; corner < index.length; corner += 3) {
        const [first, second, third] = [0, 1, 2].map((offset) =>
          positions.slice(index[corner + offset] * 3, index[corner + offset] * 3 + 3),
        );
        volume +=
          (first[0] * (second[1] * third[2] - second[2] * third[1]) -
            first[1] * (second[0] * third[2] - second[2] * third[0]) +
            first[2] * (second[0] * third[1] - second[1] * third[0])) /
          6;
      }
      return Math.abs(volume);
    };
    result.pieces.forEach(({ key, meshData }, index) => {
      const pythonPiece = python.pieces[index];
      expect(pieceName(key)).toBe(pythonPiece.name);
      if (isInKnownDivergentRegion({ model: name, section: 'export' }, pythonPiece)) return;
      const volume = volumeOf(meshData);
      if (isHollowable(key)) {
        // Vaciadas: se compara el volumen retirado (ver la tolerancia del vaciado).
        const solid = solidById.get(keyId(key));
        expect(Math.abs((solid - volume) / (solid - pythonPiece.volume_mm3) - 1)).toBeLessThan(
          REFERENCE_TOLERANCE.removedVolumeRelative,
        );
      } else {
        expect(Math.abs(volume / pythonPiece.volume_mm3 - 1)).toBeLessThan(
          REFERENCE_TOLERANCE.splitVolumeRelative,
        );
      }
    });
  });
});
