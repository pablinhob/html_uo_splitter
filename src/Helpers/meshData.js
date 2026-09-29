import * as THREE from 'three';

/**
 * Formato de malla que viaja entre el Worker y la interfaz:
 *   { positions: Float32Array (x, y, z por vértice), index: Uint32Array (3 por triángulo) }
 * Son arrays tipados para poder transferirlos sin copiarlos (postMessage).
 */

const componentsPerVertex = 3;
const verticesPerTriangle = 3;

export const meshVertexCount = (meshData) => meshData.positions.length / componentsPerVertex;

export const meshFaceCount = (meshData) => meshData.index.length / verticesPerTriangle;

// Buffers que postMessage puede transferir en lugar de copiar.
export const meshTransferables = (meshData) => [meshData.positions.buffer, meshData.index.buffer];

export function meshDataFromGeometry(geometry) {
  return {
    positions: new Float32Array(geometry.getAttribute('position').array),
    index: new Uint32Array(geometry.index.array),
  };
}

// BufferGeometry lista para el visor (con normales y bounding box).
export function geometryFromMeshData(meshData) {
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute(
    'position',
    new THREE.BufferAttribute(meshData.positions, componentsPerVertex),
  );
  geometry.setIndex(new THREE.BufferAttribute(meshData.index, 1));
  geometry.computeVertexNormals();
  geometry.computeBoundingBox();
  return geometry;
}

// Geometría de líneas para el visor a partir de segmentos (x1, y1, z1, x2, y2, z2, ...).
export function lineGeometryFromSegments(segments) {
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(segments, componentsPerVertex));
  return geometry;
}
