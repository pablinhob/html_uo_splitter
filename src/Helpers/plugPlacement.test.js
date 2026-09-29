import { afterAll, describe, expect, it } from 'vitest';
import { boxSTL, textBuffer } from '../../tests/support/geometry';
import { plugPosition, surfacePlacement } from './plugPlacement';
import { parseSTL } from './stl';
import { createSurfaceProbe } from './surface';

const probe = createSurfaceProbe(parseSTL(textBuffer(boxSTL({ x: 400, y: 100, z: 20 }))));
afterAll(() => probe.dispose());

// Columnas de un Mat4 column-major: [eje X local, eje Y local, eje Z local, traslación].
const columns = (matrix) => [0, 1, 2, 3].map((column) => matrix.slice(column * 4, column * 4 + 3));
const expectClose = (actual, expected) =>
  expected.forEach((value, index) => expect(actual[index]).toBeCloseTo(value, 6));

describe('plugPosition', () => {
  it('mide desde la cola y desde la línea central', () => {
    expect(plugPosition(probe, 60, 5)).toEqual({ lengthPos: 60, widthPos: 55 });
  });
});

describe('surfacePlacement', () => {
  const at = { lengthPos: 100, widthPos: 50, lengthSpan: 30, widthSpan: 30, toeDeg: 0 };

  it('apoya el sólido en la cara superior con X a lo largo y Z hacia arriba', () => {
    const [xAxis, yAxis, zAxis, origin] = columns(
      surfacePlacement(probe, { ...at, bottom: false }),
    );
    expectClose(xAxis, [1, 0, 0]);
    expectClose(yAxis, [0, 1, 0]);
    expectClose(zAxis, [0, 0, 1]);
    expectClose(origin, [100, 50, 20]);
  });

  it('en la cara inferior, Z apunta hacia fuera (abajo)', () => {
    const [xAxis, yAxis, zAxis, origin] = columns(surfacePlacement(probe, { ...at, bottom: true }));
    expectClose(xAxis, [1, 0, 0]);
    expectClose(yAxis, [0, -1, 0]);
    expectClose(zAxis, [0, 0, -1]);
    expectClose(origin, [100, 50, 0]);
  });

  it('el toe-in gira el sólido alrededor de la normal', () => {
    const [xAxis, yAxis] = columns(surfacePlacement(probe, { ...at, bottom: false, toeDeg: 90 }));
    expectClose(xAxis, [0, 1, 0]);
    expectClose(yAxis, [-1, 0, 0]);
  });
});
