import { afterAll, describe, expect, it } from 'vitest';
import { boxSTL, MODEL_NAMES, readModel, textBuffer } from '../../tests/support/geometry';
import { readReference, REFERENCE_TOLERANCE } from '../../tests/support/reference';
import { parseSTL } from './stl';
import { createSurfaceProbe, surfaceFrame, surfaceHeight, surfaceHit } from './surface';

const sizeMm = { x: 200, y: 50, z: 10 };
// Cara superior inclinada: z = 10 + slope * x (sube hacia +x).
const slope = 0.1;
const tilted = ([x, y, z]) => [x, y, z > 0 ? z + slope * x : z];

const probes = [];
const probeFor = (stl) => {
  const probe = createSurfaceProbe(parseSTL(textBuffer(stl)));
  probes.push(probe);
  return probe;
};

afterAll(() => probes.forEach((probe) => probe.dispose()));

const expectVectorClose = (actual, expected, digits = 6) =>
  expected.forEach((value, axis) => expect(actual[axis]).toBeCloseTo(value, digits));

describe('surfaceHeight', () => {
  const flat = probeFor(boxSTL(sizeMm));

  it('devuelve la cara superior dentro de la huella', () => {
    expect(surfaceHeight(flat, [100, 25, 0])).toBeCloseTo(10, 6);
  });

  it('devuelve la mitad del grosor fuera de la huella', () => {
    expect(surfaceHeight(flat, [500, 25, 0])).toBeCloseTo(5, 6);
  });

  it('sigue una cara superior inclinada', () => {
    expect(
      surfaceHeight(probeFor(boxSTL(sizeMm, { transform: tilted })), [100, 25, 0]),
    ).toBeCloseTo(20, 5);
  });
});

describe('surfaceHit', () => {
  const flat = probeFor(boxSTL(sizeMm));

  it('toca la cara superior o la inferior según `bottom`', () => {
    expectVectorClose(surfaceHit(flat, 50, 10), [50, 10, 10]);
    expectVectorClose(surfaceHit(flat, 50, 10, true), [50, 10, 0]);
  });

  it('devuelve null si el rayo no toca la tabla', () => {
    expect(surfaceHit(flat, 50, 80)).toBeNull();
  });
});

describe('surfaceFrame', () => {
  const flat = probeFor(boxSTL(sizeMm));
  const sloped = probeFor(boxSTL(sizeMm, { transform: tilted }));
  const slopedNormal = [-slope, 0, 1].map((value) => value / Math.hypot(slope, 1));

  it('en una cara plana, la normal es el eje de grosor hacia fuera', () => {
    const top = surfaceFrame(flat, 100, 25, 40, 20);
    expectVectorClose(top.point, [100, 25, 10]);
    expectVectorClose(top.normal, [0, 0, 1]);

    const bottom = surfaceFrame(flat, 100, 25, 40, 20, true);
    expectVectorClose(bottom.point, [100, 25, 0]);
    expectVectorClose(bottom.normal, [0, 0, -1]);
  });

  it('sigue la inclinación de la zona (rocker)', () => {
    const { point, normal } = surfaceFrame(sloped, 100, 25, 40, 20);
    expectVectorClose(point, [100, 25, 20], 5);
    expectVectorClose(normal, slopedNormal, 5);
  });

  it('usa el centro cuando un extremo de la cruz cae fuera de la tabla', () => {
    const { normal } = surfaceFrame(sloped, 195, 25, 40, 20);
    expectVectorClose(normal, slopedNormal, 5);
  });

  it('fuera de la tabla devuelve la mitad del grosor y la normal del eje', () => {
    expect(surfaceFrame(flat, 500, 25, 40, 20, true)).toEqual({
      point: [500, 25, 5],
      normal: [0, 0, -1],
    });
  });
});

describe.each(MODEL_NAMES)('superficie de %s', (name) => {
  const probe = createSurfaceProbe(parseSTL(readModel(name)));
  probes.push(probe);
  const { min, max } = probe.bounds;
  const center = [(min[0] + max[0]) / 2, (min[1] + max[1]) / 2, 0];

  it('en el centro, la cara superior queda por encima de la inferior y dentro del bbox', () => {
    const top = surfaceHit(probe, center[0], center[1]);
    const bottom = surfaceHit(probe, center[0], center[1], true);
    expect(top[2]).toBeGreaterThan(bottom[2]);
    expect(top[2]).toBeLessThanOrEqual(max[2]);
    expect(bottom[2]).toBeGreaterThanOrEqual(min[2]);
  });

  const reference = readReference(name)?.surface;

  it.skipIf(!reference)('surface_height coincide con Python', () => {
    reference.heights.forEach(({ point, height }) => {
      expect(Math.abs(surfaceHeight(probe, point) - height)).toBeLessThan(
        REFERENCE_TOLERANCE.heightMm,
      );
    });
  });

  it.skipIf(!reference)('surface_frame coincide con Python', () => {
    reference.frames.forEach((sample) => {
      const { point, normal } = surfaceFrame(
        probe,
        sample.length_pos,
        sample.width_pos,
        sample.length_span,
        sample.width_span,
        sample.bottom,
      );
      point.forEach((value, axis) => {
        expect(Math.abs(value - sample.point[axis])).toBeLessThan(REFERENCE_TOLERANCE.heightMm);
      });
      const cosine = normal.reduce((sum, value, axis) => sum + value * sample.normal[axis], 0);
      expect(cosine).toBeGreaterThan(Math.cos(REFERENCE_TOLERANCE.normalAngleRad));
    });
  });
});
