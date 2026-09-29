import { describe, expect, it } from 'vitest';
import { MODEL_NAMES, readModel } from '../../tests/support/geometry';
import { readReference } from '../../tests/support/reference';
import { detectAxes, meshBounds } from './boardAxes';
import { parseSTL } from './stl';

const boundsOfSize = ([x, y, z]) => ({ min: [0, 0, 0], max: [x, y, z] });

describe('detectAxes', () => {
  it.each([
    [[2000, 500, 80], { lengthAxis: 0, widthAxis: 1, thicknessAxis: 2 }],
    [[80, 2000, 500], { lengthAxis: 1, widthAxis: 2, thicknessAxis: 0 }],
    [[500, 80, 2000], { lengthAxis: 2, widthAxis: 0, thicknessAxis: 1 }],
  ])('tamaño %j → %j', (size, axes) => {
    expect(detectAxes(boundsOfSize(size))).toEqual(axes);
  });

  it('en caso de empate elige el primer eje, como np.argmax/argmin', () => {
    expect(detectAxes(boundsOfSize([100, 100, 10]))).toEqual({
      lengthAxis: 0,
      widthAxis: 1,
      thicknessAxis: 2,
    });
  });
});

describe('meshBounds', () => {
  it('devuelve el mínimo y el máximo de cada eje', () => {
    const positions = new Float32Array([1, -2, 3, -4, 5, -6, 0, 0, 10]);
    expect(meshBounds({ positions })).toEqual({ min: [-4, -2, -6], max: [1, 5, 10] });
  });
});

describe.each(MODEL_NAMES)('ejes de %s', (name) => {
  const meshData = parseSTL(readModel(name));

  it('largo en x, ancho en y y grosor en z (orientación de los ejemplos)', () => {
    expect(detectAxes(meshBounds(meshData))).toEqual({
      lengthAxis: 0,
      widthAxis: 1,
      thicknessAxis: 2,
    });
  });

  const reference = readReference(name);
  it.skipIf(!reference?.surface)('coincide con board_axes() de Python', () => {
    const [lengthAxis, widthAxis, thicknessAxis] = reference.surface.axes;
    expect(detectAxes(meshBounds(meshData))).toEqual({ lengthAxis, widthAxis, thicknessAxis });
  });
});
