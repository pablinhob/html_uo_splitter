import { describe, expect, it } from 'vitest';
import { formatSizeCm, formatVolume, mm3ToCm3, mm3ToLiters, mmToCm } from './units';

describe('conversiones', () => {
  it('pasa de mm a cm, cm³ y litros', () => {
    expect(mmToCm(1473)).toBeCloseTo(147.3);
    expect(mm3ToCm3(1_000_000)).toBe(1000);
    expect(mm3ToLiters(36_600_000)).toBeCloseTo(36.6);
  });
});

describe('formatos del panel "Object info"', () => {
  it('coinciden con los textos de la versión Python', () => {
    expect(formatSizeCm([1473, 559, 78])).toBe('147.3 x 55.9 x 7.8 cm');
    expect(formatVolume(36_600_000)).toBe('36600.0 cm³ (36.60 L)');
    expect(formatVolume(36_600_000, 'cm3')).toBe('36600.0 cm3 (36.60 L)');
  });
});
