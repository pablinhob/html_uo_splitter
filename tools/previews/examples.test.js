import { existsSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { EXAMPLE_MODELS, EXAMPLE_PREVIEW_SIZE_PX } from '../../src/config';
import { meshFaceCount } from '../../src/Helpers/meshData';
import { parseSTL } from '../../src/Helpers/stl';

// Cada ejemplo de config.js debe existir en public/ con su preview ya generado
// (si falta o no cuadra el tamaño: npm run previews).
const publicFile = (path) => new URL(`../../public/${path}`, import.meta.url);

describe.each(EXAMPLE_MODELS)('ejemplo $label', ({ path, previewPath }) => {
  it('tiene un STL legible en public/', () => {
    const file = readFileSync(publicFile(path));
    const meshData = parseSTL(
      file.buffer.slice(file.byteOffset, file.byteOffset + file.byteLength),
    );
    expect(meshFaceCount(meshData)).toBeGreaterThan(0);
  });

  it('tiene su preview PNG cuadrado del tamaño configurado', () => {
    expect(existsSync(publicFile(previewPath))).toBe(true);
    const png = readFileSync(publicFile(previewPath));
    // Ancho y alto están en el chunk IHDR, justo después de la firma.
    expect(png.readUInt32BE(16)).toBe(EXAMPLE_PREVIEW_SIZE_PX);
    expect(png.readUInt32BE(20)).toBe(EXAMPLE_PREVIEW_SIZE_PX);
  });
});
