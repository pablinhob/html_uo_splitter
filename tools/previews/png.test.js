import { crc32, inflateSync } from 'node:zlib';
import { describe, expect, it } from 'vitest';
import encodePNG from './png';

// Separa un PNG en sus chunks: [{ type, data, crcIsValid }].
function readChunks(png) {
  const chunks = [];
  let offset = 8;
  while (offset < png.length) {
    const length = png.readUInt32BE(offset);
    const typeAndData = png.subarray(offset + 4, offset + 8 + length);
    chunks.push({
      type: typeAndData.subarray(0, 4).toString('ascii'),
      data: typeAndData.subarray(4),
      crcIsValid: png.readUInt32BE(offset + 8 + length) === crc32(typeAndData),
    });
    offset += 12 + length;
  }
  return chunks;
}

describe('encodePNG', () => {
  const width = 2;
  const height = 2;
  const rgb = Uint8Array.from([255, 0, 0, 0, 255, 0, 0, 0, 255, 255, 255, 255]);
  const png = encodePNG(rgb, width, height);

  it('escribe la firma y los chunks IHDR, IDAT e IEND con CRC válido', () => {
    expect([...png.subarray(0, 8)]).toEqual([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
    const chunks = readChunks(png);
    expect(chunks.map((chunk) => chunk.type)).toEqual(['IHDR', 'IDAT', 'IEND']);
    expect(chunks.every((chunk) => chunk.crcIsValid)).toBe(true);
  });

  it('declara RGB de 8 bits y guarda cada fila con filtro 0', () => {
    const [header, data] = readChunks(png);
    expect(header.data.readUInt32BE(0)).toBe(width);
    expect(header.data.readUInt32BE(4)).toBe(height);
    expect([...header.data.subarray(8)]).toEqual([8, 2, 0, 0, 0]);
    expect([...inflateSync(data.data)]).toEqual([0, ...rgb.subarray(0, 6), 0, ...rgb.subarray(6)]);
  });
});
