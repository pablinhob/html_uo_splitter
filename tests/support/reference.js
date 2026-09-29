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

/**
 * Resultados de Python que se sabe que están mal y no se comparan. Cada entrada
 * explica por qué; la versión web se valida para ese caso con otro test.
 */
export const KNOWN_PYTHON_DIVERGENCES = [
  {
    model: 'Cobra',
    section: 'plugs',
    set: 'supports',
    index: 0,
    reason:
      'Soporte del leash: el extremo trasero de su cruz de muestreo (x = 42,6 mm) cae ' +
      'justo en una arista de la malla que repara pymeshfix. El rayo de trimesh no toca ' +
      'la cubierta, así que toma el casco como superficie y el soporte sale inclinado. ' +
      'three-mesh-bvh sí toca la cubierta.',
  },
];

/**
 * Divergencias que afectan a una zona de la tabla, no a un sólido concreto:
 * `appliesTo(pythonSolid)` decide con el bounding box del resultado de Python.
 */
export const KNOWN_PYTHON_REGION_DIVERGENCES = [
  {
    model: 'Cobra',
    section: 'split',
    // Piezas que tocan la muesca de la cola de golondrina (la cola está en x = 0).
    appliesTo: ({ bounds_mm: [min] }) => min[0] < 90,
    reason:
      'pymeshfix ("MeshFix could not fix everything") acorta 6 mm la muesca de la cola ' +
      'de golondrina: en y = 0 la huella de la malla reparada llega a x = 28,25 mm y la ' +
      'del STL original a x = 34,46 mm. La web conserva la geometría original, así que ' +
      'el cutlap y las piezas de esa zona difieren. Otro test comprueba la muesca.',
  },
  {
    model: 'Cobra',
    section: 'export',
    // Las mismas piezas de la cola, más los fragmentos del soporte del leash (x < 90).
    appliesTo: ({ bounds_mm: [min] }) => min[0] < 90,
    reason:
      'Suma de las dos divergencias de Cobra: la muesca de la cola que acorta pymeshfix ' +
      '(section "split") y el soporte del leash que sale volcado en Python (section ' +
      '"plugs"). Ambas caen en x < 90 mm.',
  },
];

export const isKnownDivergence = (entry) =>
  KNOWN_PYTHON_DIVERGENCES.some((known) =>
    Object.entries(entry).every(([field, value]) => known[field] === value),
  );

export const isInKnownDivergentRegion = ({ model, section }, pythonSolid) =>
  KNOWN_PYTHON_REGION_DIVERGENCES.some(
    (known) => known.model === model && known.section === section && known.appliesTo(pythonSolid),
  );

// Tolerancias de comparación con Python (float32 en JS frente a float64 en numpy,
// y reparación con manifold en lugar de pymeshfix).
export const REFERENCE_TOLERANCE = {
  sizeMm: 0.01,
  volumeRelative: 1e-3,
  // Alturas y puntos de contacto leídos con rayos (surface_height / surface_frame).
  heightMm: 0.05,
  // Ángulo máximo entre la normal de JS y la de Python (0,5°).
  normalAngleRad: (0.5 * Math.PI) / 180,
  // Sólidos construidos (plugs): contornos poligonales frente a los buffer de shapely.
  solidVolumeRelative: 0.01,
  // Posición de las esquinas del bbox de un sólido colocado sobre la superficie.
  placementMm: 0.2,
  // Piezas del split: pymeshfix y manifold reparan distinto las mallas no cerradas
  // (Mini Simmons: hasta un 0,3 %); con una malla cerrada de origen es exacto.
  splitVolumeRelative: 0.005,
  splitBoundsMm: 0.05,
  // Vaciado. La cavidad sale de la huella (unión de triángulos en shapely, project()
  // en manifold): típico < 0,3 %, máximo medido 3,6 %.
  cavityVolumeRelative: 0.04,
  // Los agujeros se reparten por las caras de la sección simplificada con
  // Douglas-Peucker, que depende del vértice de inicio del anillo (distinto en
  // trimesh y en manifold): alguna cara puede llevar un agujero más o menos.
  // Máximo medido por pieza: 5,7 % del volumen retirado, en piezas diminutas.
  removedVolumeRelative: 0.07,
  // Con todas las piezas juntas se compensa: < 0,2 % medido.
  totalHollowedRelative: 0.005,
};
