import { describe, expect, it } from 'vitest';
import readZip from '../../tests/support/zip';
import createZip, { crc32 } from './zip';

describe('crc32', () => {
  it('da el valor de referencia del estándar', () => {
    expect(crc32(new TextEncoder().encode('123456789'))).toBe(0xcbf43926);
  });
});

describe('createZip', () => {
  it('guarda cada fichero con su nombre, su CRC y su contenido intactos', () => {
    const files = [
      { name: '3D/3dmodel.model', data: new TextEncoder().encode('<model/>') },
      { name: 'ñandú.txt', data: Uint8Array.from([0, 1, 2, 255]) },
    ];
    const entries = readZip(createZip(files));
    expect(entries.map((entry) => entry.name)).toEqual(files.map((file) => file.name));
    entries.forEach((entry, index) => {
      expect([...entry.data]).toEqual([...files[index].data]);
      expect(entry.crc).toBe(crc32(files[index].data));
    });
  });
});
