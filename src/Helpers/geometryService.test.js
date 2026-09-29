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
});
