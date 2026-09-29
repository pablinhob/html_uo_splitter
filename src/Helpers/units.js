import { CM3_PER_LITER, MM_PER_CM } from '../config';

// Conversiones de la unidad interna (mm) a las unidades que se muestran.

export const mmToCm = (valueMm) => valueMm / MM_PER_CM;

export const mm3ToCm3 = (valueMm3) => valueMm3 / MM_PER_CM ** 3;

export const mm3ToLiters = (valueMm3) => mm3ToCm3(valueMm3) / CM3_PER_LITER;

// "147.3 x 55.9 x 7.8 cm", como en el panel "Object info" original.
export const formatSizeCm = (sizeMm) =>
  `${sizeMm.map((sideMm) => mmToCm(sideMm).toFixed(1)).join(' x ')} cm`;

// "36600.1 cm³ (36.60 L)"
export const formatVolume = (volumeMm3, cubicUnit = 'cm³') =>
  `${mm3ToCm3(volumeMm3).toFixed(1)} ${cubicUnit} (${mm3ToLiters(volumeMm3).toFixed(2)} L)`;
