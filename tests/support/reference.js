import { existsSync, readFileSync } from 'node:fs';

/**
 * Datos de referencia generados con el programa Python original
 * (tools/reference/generate_reference.py) en tests/fixtures/reference/<modelo>.json.
 * Devuelve null si aún no se han generado, para que el test se salte.
 */
export function readReference(modelName) {
  const url = new URL(`../fixtures/reference/${modelName}.json`, import.meta.url);
  return existsSync(url) ? JSON.parse(readFileSync(url, 'utf8')) : null;
}

// Tolerancias de comparación con Python (float32 en JS frente a float64 en numpy,
// y reparación con manifold en lugar de pymeshfix).
export const REFERENCE_TOLERANCE = {
  sizeMm: 0.01,
  volumeRelative: 1e-3,
  // Alturas y puntos de contacto leídos con rayos (surface_height / surface_frame).
  heightMm: 0.05,
  // Ángulo máximo entre la normal de JS y la de Python (0,5°).
  normalAngleRad: (0.5 * Math.PI) / 180,
};
