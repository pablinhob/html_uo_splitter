import { meshDataFromManifold, toManifold } from './manifold';
import { meshFaceCount } from './meshData';
import { computeObjectStats, parseSTL } from './stl';

/**
 * load_stl() de mesh_ops.py: lee el STL, lo repara si no es cerrado y calcula
 * sus estadísticas. Devuelve { meshData, manifold, stats, repair }, donde
 * repair = { status, facesBefore, facesAfter } y manifold es null si la malla no
 * se ha podido cerrar (se puede ver, pero no usar en booleanas).
 * El llamante es dueño de `manifold` y debe liberarlo con delete().
 */
export default function loadBoard(wasm, arrayBuffer) {
  const parsed = parseSTL(arrayBuffer);
  const { manifold, status } = toManifold(wasm, parsed);
  const meshData = manifold ? meshDataFromManifold(manifold) : parsed;
  return {
    meshData,
    manifold,
    stats: computeObjectStats(meshData),
    repair: { status, facesBefore: meshFaceCount(parsed), facesAfter: meshFaceCount(meshData) },
  };
}
