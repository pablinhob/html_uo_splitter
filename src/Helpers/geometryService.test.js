import { beforeAll, describe, expect, it, vi } from 'vitest';
import { DEFAULT_HOLLOW, DEFAULT_PLUGS, DEFAULT_SPLIT } from '../config';
import { boxSTL, textBuffer } from '../../tests/support/geometry';
import createGeometryService from './geometryService';
import { loadManifoldModule } from './manifold';
import { meshFaceCount } from './meshData';

let wasm;

beforeAll(async () => {
  wasm = await loadManifoldModule();
});

describe('createGeometryService', () => {
  it('carga la tabla, informa del progreso y transfiere la malla', () => {
    const service = createGeometryService(wasm);
    const progress = vi.fn();
    const buffer = textBuffer(boxSTL({ x: 10, y: 20, z: 30 }));

    const { result, transfer } = service.handle('loadBoard', { buffer }, progress);

    expect(progress).toHaveBeenCalledOnce();
    expect(result.repair.status).toBe('watertight');
    expect(meshFaceCount(result.meshData)).toBe(12);
    expect(transfer).toEqual([result.meshData.positions.buffer, result.meshData.index.buffer]);
    expect(service.hasBoard()).toBe(true);

    service.dispose();
    expect(service.hasBoard()).toBe(false);
    expect(service.surfaceProbe()).toBeNull();
  });

  it('prepara la sonda de superficie con su propia copia de la malla', () => {
    const service = createGeometryService(wasm);
    const buffer = textBuffer(boxSTL({ x: 30, y: 20, z: 10 }));
    const { result } = service.handle('loadBoard', { buffer }, () => {});

    // Simula la transferencia: la interfaz se queda con meshData y el Worker lo pierde.
    structuredClone(result.meshData, { transfer: [result.meshData.positions.buffer] });

    const probe = service.surfaceProbe();
    expect(probe.axes).toEqual({ lengthAxis: 0, widthAxis: 1, thicknessAxis: 2 });
    expect(probe.hitsAlongThickness([12, 5, 0])).toHaveLength(2);
    service.dispose();
  });

  it('no guarda una tabla que no se ha podido cerrar', () => {
    const service = createGeometryService(wasm);
    const buffer = textBuffer(boxSTL({ x: 10, y: 20, z: 30 }, { omitFace: 0 }));
    const { result } = service.handle('loadBoard', { buffer }, () => {});
    expect(result.repair.status).toBe('failed');
    expect(service.hasBoard()).toBe(false);
  });

  it('rechaza peticiones desconocidas', () => {
    const service = createGeometryService(wasm);
    expect(() => service.handle('explode', {}, () => {})).toThrow(
      "Unknown geometry request 'explode'",
    );
  });

  it('calcula los marcadores de los plugs de la tabla cargada', () => {
    const service = createGeometryService(wasm);
    expect(() => service.handle('plugMarkers', { plugs: DEFAULT_PLUGS }, () => {})).toThrow(
      'No board loaded',
    );

    const buffer = textBuffer(boxSTL({ x: 600, y: 120, z: 40 }));
    service.handle('loadBoard', { buffer }, () => {});
    const single = service.handle('plugMarkers', { plugs: DEFAULT_PLUGS }, () => {});
    expect(single.result.markers).toHaveLength(2);
    expect(single.transfer).toHaveLength(4);

    const twinPlugs = { ...DEFAULT_PLUGS, fin: { ...DEFAULT_PLUGS.fin, type: 'twin' } };
    const twin = service.handle('plugMarkers', { plugs: twinPlugs }, () => {});
    expect(twin.result.markers).toHaveLength(3);
    twin.result.markers.forEach((marker) => expect(meshFaceCount(marker)).toBeGreaterThan(0));
    service.dispose();
  });

  it('trocea la tabla, guarda las piezas y las libera al cargar otra', () => {
    const service = createGeometryService(wasm);
    const buffer = () => textBuffer(boxSTL({ x: 600, y: 200, z: 40 }));
    service.handle('loadBoard', { buffer: buffer() }, () => {});
    const progress = vi.fn();
    const { result, transfer } = service.handle(
      'split',
      { params: { ...DEFAULT_SPLIT, shape: 'Hexagon' } },
      progress,
    );
    expect(progress).toHaveBeenCalledOnce();
    expect(result.pieces[0].key).toEqual(['stringer']);
    expect(service.pieceCount()).toBe(result.pieces.length);
    expect(transfer).toHaveLength(2 * result.pieces.length + result.cutOutlines.length);

    service.handle('loadBoard', { buffer: buffer() }, () => {});
    expect(service.pieceCount()).toBe(0);
    service.dispose();
  });

  it('no trocea una tabla que no se ha podido cerrar', () => {
    const service = createGeometryService(wasm);
    const buffer = textBuffer(boxSTL({ x: 600, y: 200, z: 40 }, { omitFace: 0 }));
    service.handle('loadBoard', { buffer }, () => {});
    expect(() =>
      service.handle('split', { params: { ...DEFAULT_SPLIT, shape: 'Hexagon' } }, () => {}),
    ).toThrow('not watertight');
    service.dispose();
  });

  it('vacía una pieza guardada del split sin tocar la original', () => {
    const service = createGeometryService(wasm);
    service.handle(
      'loadBoard',
      { buffer: textBuffer(boxSTL({ x: 600, y: 200, z: 40 })) },
      () => {},
    );
    service.handle('split', { params: { ...DEFAULT_SPLIT, shape: 'Hexagon' } }, () => {});
    const hollow = (key) =>
      service.handle('hollowPiece', { key, hollow: DEFAULT_HOLLOW }, () => {});

    const first = hollow(['a', 0]);
    const second = hollow(['a', 0]);
    expect(first.result.key).toEqual(['a', 0]);
    // Siempre parte de la pieza original: dos vaciados iguales dan la misma malla.
    expect(meshFaceCount(second.result.meshData)).toBe(meshFaceCount(first.result.meshData));
    expect(() => hollow(['a', 999])).toThrow('Unknown piece a|999');
    service.dispose();
  });
});
