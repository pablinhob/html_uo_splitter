import { beforeAll, describe, expect, it, vi } from 'vitest';
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
});
