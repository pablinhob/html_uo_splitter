/**
 * Zip mínimo sin compresión (método "stored"), suficiente para el 3MF y para el
 * paquete OBJ + MTL. files: [{ name, data: Uint8Array }] → Uint8Array.
 * Formato: cabecera local + datos por fichero, directorio central y fin de directorio.
 */

const localHeaderSignature = 0x04034b50;
const centralHeaderSignature = 0x02014b50;
const endOfDirectorySignature = 0x06054b50;
const zipVersion = 20;
// Bit 11: nombres de fichero en UTF-8.
const utf8Flag = 0x0800;
// Fecha fija (1 de enero de 1980, 00:00) para que el resultado sea reproducible.
const dosDate = 0x21;

const crcTable = Array.from({ length: 256 }, (_, byte) => {
  let crc = byte;
  for (let bit = 0; bit < 8; bit += 1) {
    // Polinomio CRC-32 invertido (0xEDB88320).
    crc = crc & 1 ? 0xedb88320 ^ (crc >>> 1) : crc >>> 1;
  }
  return crc >>> 0;
});

export function crc32(data) {
  let crc = 0xffffffff;
  for (let index = 0; index < data.length; index += 1) {
    crc = crcTable[(crc ^ data[index]) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function header(signature, entry, isCentral) {
  const size = isCentral ? 46 : 30;
  const view = new DataView(new ArrayBuffer(size + entry.nameBytes.length));
  view.setUint32(0, signature, true);
  let offset = 4;
  const write16 = (value) => {
    view.setUint16(offset, value, true);
    offset += 2;
  };
  const write32 = (value) => {
    view.setUint32(offset, value, true);
    offset += 4;
  };
  if (isCentral) write16(zipVersion);
  [zipVersion, utf8Flag, 0, 0, dosDate].forEach(write16);
  [entry.crc, entry.data.length, entry.data.length].forEach(write32);
  write16(entry.nameBytes.length);
  write16(0);
  if (isCentral) {
    [0, 0, 0].forEach(write16);
    [0, entry.offset].forEach(write32);
  }
  new Uint8Array(view.buffer).set(entry.nameBytes, size);
  return new Uint8Array(view.buffer);
}

function endOfDirectory(count, directorySize, directoryOffset) {
  const view = new DataView(new ArrayBuffer(22));
  view.setUint32(0, endOfDirectorySignature, true);
  view.setUint16(8, count, true);
  view.setUint16(10, count, true);
  view.setUint32(12, directorySize, true);
  view.setUint32(16, directoryOffset, true);
  return new Uint8Array(view.buffer);
}

const concat = (chunks) => {
  const result = new Uint8Array(chunks.reduce((sum, chunk) => sum + chunk.length, 0));
  chunks.reduce((offset, chunk) => {
    result.set(chunk, offset);
    return offset + chunk.length;
  }, 0);
  return result;
};

export default function createZip(files) {
  const encoder = new TextEncoder();
  let offset = 0;
  const entries = files.map(({ name, data }) => {
    const entry = { nameBytes: encoder.encode(name), data, crc: crc32(data), offset };
    offset += 30 + entry.nameBytes.length + data.length;
    return entry;
  });
  const local = entries.flatMap((entry) => [
    header(localHeaderSignature, entry, false),
    entry.data,
  ]);
  const central = entries.map((entry) => header(centralHeaderSignature, entry, true));
  const directorySize = central.reduce((sum, chunk) => sum + chunk.length, 0);
  return concat([...local, ...central, endOfDirectory(entries.length, directorySize, offset)]);
}
