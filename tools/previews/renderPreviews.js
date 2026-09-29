import { readFileSync, writeFileSync } from 'node:fs';
import {
  BOARD_COLOR,
  EXAMPLE_MODELS,
  EXAMPLE_PREVIEW_SIZE_PX,
  VIEWER_BACKGROUND_COLOR,
} from '../../src/config';
import { parseSTL } from '../../src/Helpers/stl';
import encodePNG from './png';
import renderMesh from './rasterizer';

/**
 * Genera el preview PNG de cada modelo de EXAMPLE_MODELS (public/examples/) con
 * los colores y la vista isométrica del visor. Uso: npm run previews
 */

const publicDir = new URL('../../public/', import.meta.url);

const renderOptions = {
  sizePx: EXAMPLE_PREVIEW_SIZE_PX,
  color: BOARD_COLOR,
  background: VIEWER_BACKGROUND_COLOR,
  // Misma dirección de cámara que frameCamera() del visor, con Z arriba.
  viewDirection: [1, 1, 1],
  up: [0, 0, 1],
  // Luz desde arriba y algo de lado, para que la cubierta y los cantos se distingan.
  lightDirection: [0.4, 1, 1.6],
  marginFraction: 0.08,
};

EXAMPLE_MODELS.forEach(({ label, path, previewPath }) => {
  const file = readFileSync(new URL(path, publicDir));
  const meshData = parseSTL(file.buffer.slice(file.byteOffset, file.byteOffset + file.byteLength));
  const rgb = renderMesh(meshData, renderOptions);
  const size = renderOptions.sizePx;
  writeFileSync(new URL(previewPath, publicDir), encodePNG(rgb, size, size));
  process.stdout.write(`${label}: public/${previewPath} (${size}x${size})\n`);
});
