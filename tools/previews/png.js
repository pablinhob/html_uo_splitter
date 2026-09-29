import { crc32, deflateSync } from 'node:zlib';

// Codificador PNG mínimo: RGB de 8 bits, sin entrelazado, filtro 0 en cada fila.

const signature = Uint8Array.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
const bytesPerPixel = 3;
const colorTypeRgb = 2;
const bitDepth = 8;

function chunk(type, data) {
  const typeAndData = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length);
  const checksum = Buffer.alloc(4);
  checksum.writeUInt32BE(crc32(typeAndData));
  return Buffer.concat([length, typeAndData, checksum]);
}

export default function encodePNG(rgb, width, height) {
  const header = Buffer.alloc(13);
  header.writeUInt32BE(width, 0);
  header.writeUInt32BE(height, 4);
  header.set([bitDepth, colorTypeRgb, 0, 0, 0], 8);

  const rowLength = width * bytesPerPixel;
  const raw = Buffer.alloc((rowLength + 1) * height);
  for (let row = 0; row < height; row += 1) {
    // El primer byte de cada fila es el tipo de filtro (0 = ninguno).
    raw.set(rgb.subarray(row * rowLength, (row + 1) * rowLength), row * (rowLength + 1) + 1);
  }

  return Buffer.concat([
    signature,
    chunk('IHDR', header),
    chunk('IDAT', deflateSync(raw)),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}
