import * as THREE from 'three';
import { toCreasedNormals } from 'three/addons/utils/BufferGeometryUtils.js';
import { SHADING_CREASE_ANGLE_DEG } from '../config';

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

/**
 * BufferGeometry lista para el visor (con normales y bounding box). Las normales
 * se suavizan solo entre caras casi coplanarias: en las aristas de corte (más de
 * SHADING_CREASE_ANGLE_DEG) cada cara lleva la suya, para que la arista se vea viva
 * y no redondeada. Por eso la geometría sale sin índice.
 */
export function geometryFromMeshData(meshData) {
  const indexed = new THREE.BufferGeometry();
  indexed.setAttribute(
    'position',
    new THREE.BufferAttribute(meshData.positions, componentsPerVertex),
  );
  indexed.setIndex(new THREE.BufferAttribute(meshData.index, 1));
  const geometry = toCreasedNormals(indexed, THREE.MathUtils.degToRad(SHADING_CREASE_ANGLE_DEG));
  indexed.dispose();
  geometry.computeBoundingBox();
  return geometry;
}

// Geometría de líneas para el visor a partir de segmentos (x1, y1, z1, x2, y2, z2, ...).
export function lineGeometryFromSegments(segments) {
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(segments, componentsPerVertex));
  return geometry;
}
