import { describe, expect, it } from 'vitest';
import { boxSTL, textBuffer } from '../../tests/support/geometry';
import { parseSTL } from '../../src/Helpers/stl';
import renderMesh from './rasterizer';

const sizePx = 32;
const options = {
  sizePx,
  color: '#ffffff',
  background: '#102030',
  viewDirection: [1, 1, 1],
  up: [0, 0, 1],
  lightDirection: [0, 0, 1],
  marginFraction: 0.1,
};
const pixelAt = (image, x, y) => [
  ...image.subarray((y * sizePx + x) * 3, (y * sizePx + x) * 3 + 3),
];

describe('renderMesh', () => {
  const image = renderMesh(parseSTL(textBuffer(boxSTL({ x: 20, y: 20, z: 20 }))), options);

  it('devuelve RGB del tamaño pedido', () => {
    expect(image).toHaveLength(sizePx * sizePx * 3);
  });

  it('deja el fondo en las esquinas y pinta el modelo en el centro', () => {
    expect(pixelAt(image, 0, 0)).toEqual([0x10, 0x20, 0x30]);
    const [red, green, blue] = pixelAt(image, sizePx / 2, sizePx / 2);
    expect(red).toBe(green);
    expect(green).toBe(blue);
    expect(red).toBeGreaterThan(0x30);
  });

  it('sombrea más la cara que mira a la luz (arriba) que las laterales', () => {
    // En la vista isométrica de un cubo, la cara superior queda en la parte alta.
    const [top] = pixelAt(image, sizePx / 2, sizePx / 4);
    const [side] = pixelAt(image, sizePx / 2, (3 * sizePx) / 4);
    expect(top).toBeGreaterThan(side);
  });
});
