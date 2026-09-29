import Module from 'manifold-3d';
import { MESH_REPAIR_TOLERANCE_MM } from '../config';

/**
 * Puente con manifold-3d (WASM), que sustituye a las booleanas de trimesh y a la
 * reparación de pymeshfix. Los objetos Manifold/Mesh viven en la memoria WASM y
 * no los recoge el recolector de basura: quien los crea los libera con delete().
 */

let modulePromise = null;

/**
 * Carga (una sola vez) el módulo WASM. `wasmUrl` es la URL del .wasm en el
 * navegador; en Node se omite y el módulo lo encuentra junto a su .js.
 */
export function loadManifoldModule(wasmUrl) {
  if (!modulePromise) {
    const config = wasmUrl ? { locateFile: () => wasmUrl } : undefined;
    modulePromise = Module(config).then((wasm) => {
      wasm.setup();
      return wasm;
    });
  }
  return modulePromise;
}

// tolerance 0 deja la de manifold por defecto (relativa al tamaño del modelo).
const newMesh = (wasm, { positions, index }, tolerance = 0) =>
  new wasm.Mesh({ numProp: 3, vertProperties: positions, triVerts: index, tolerance });

function tryManifold(wasm, mesh) {
  try {
    return new wasm.Manifold(mesh);
  } catch (error) {
    // Solo se espera el error de malla no cerrada; cualquier otro se propaga.
    if (!/manifold/i.test(error.message ?? String(error))) throw error;
    return null;
  }
}

// Fusiona vértices de aristas abiertas (Mesh.merge) y vuelve a intentarlo.
function tryMerged(wasm, meshData, tolerance) {
  const mesh = newMesh(wasm, meshData, tolerance);
  return mesh.merge() ? tryManifold(wasm, mesh) : null;
}

/**
 * ensure_watertight() de mesh_ops.py: construye el Manifold de la malla y, si no
 * es cerrada, la repara fusionando vértices de aristas abiertas: primero con la
 * tolerancia por defecto y, si no basta, con MESH_REPAIR_TOLERANCE_MM.
 * Devuelve { manifold, status } con status 'watertight' | 'repaired' | 'failed';
 * con 'failed', manifold es null y la malla original sigue siendo válida para ver.
 */
export function toManifold(wasm, meshData) {
  const direct = tryManifold(wasm, newMesh(wasm, meshData));
  if (direct) return { manifold: direct, status: 'watertight' };

  const repaired =
    tryMerged(wasm, meshData, 0) ?? tryMerged(wasm, meshData, MESH_REPAIR_TOLERANCE_MM);
  return repaired
    ? { manifold: repaired, status: 'repaired' }
    : { manifold: null, status: 'failed' };
}

export function meshDataFromManifold(manifold) {
  const mesh = manifold.getMesh();
  if (mesh.numProp !== 3) throw new Error(`Unexpected mesh with ${mesh.numProp} properties`);
  return {
    positions: new Float32Array(mesh.vertProperties),
    index: new Uint32Array(mesh.triVerts),
  };
}

/**
 * Ejecuta `build(keep)` y libera al terminar todo lo que se haya pasado a
 * `keep`: sirve para los CrossSection/Manifold intermedios de una construcción.
 * Lo que devuelve `build` no se libera (salvo que también se haya pasado a keep).
 */
export function withTemporaries(build) {
  const temporaries = [];
  const keep = (object) => {
    temporaries.push(object);
    return object;
  };
  try {
    return build(keep);
  } finally {
    temporaries.forEach((object) => object.delete());
  }
}
