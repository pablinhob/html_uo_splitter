import { inflateRawSync } from 'node:zlib';
import { expect } from 'vitest';

// Lee las entradas de un zip a partir de su directorio central.
export default function readZip(bytes) {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const endOffset = bytes.length - 22;
  expect(view.getUint32(endOffset, true)).toBe(0x06054b50);
  const count = view.getUint16(endOffset + 10, true);
  let offset = view.getUint32(endOffset + 16, true);
  return Array.from({ length: count }, () => {
    expect(view.getUint32(offset, true)).toBe(0x02014b50);
    const method = view.getUint16(offset + 10, true);
    const crc = view.getUint32(offset + 16, true);
    const size = view.getUint32(offset + 24, true);
    const nameLength = view.getUint16(offset + 28, true);
    const localOffset = view.getUint32(offset + 42, true);
    const name = new TextDecoder().decode(bytes.subarray(offset + 46, offset + 46 + nameLength));
    const localNameLength = view.getUint16(localOffset + 26, true);
    const dataStart = localOffset + 30 + localNameLength;
    offset += 46 + nameLength;
    const stored = bytes.subarray(dataStart, dataStart + size);
    return { name, crc, data: method === 0 ? stored : inflateRawSync(stored) };
  });
}
