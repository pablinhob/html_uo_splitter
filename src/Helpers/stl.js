import * as THREE from 'three';
import { STLLoader } from 'three/addons/loaders/STLLoader.js';
import { mergeVertices } from 'three/addons/utils/BufferGeometryUtils.js';

const verticesPerTriangle = 3;
const tetrahedronVolumeFactor = 6;

// Equivalente a trimesh.load(): el STL viene como triángulos sueltos, así que se
// fusionan los vértices coincidentes para tener una malla indexada.
export async function loadSTL(file) {
  const buffer = await file.arrayBuffer();
  const raw = new STLLoader().parse(buffer);
  raw.deleteAttribute('normal');
  const geometry = mergeVertices(raw);
  raw.dispose();
  geometry.computeVertexNormals();
  geometry.computeBoundingBox();
  return geometry;
}

export function vertexCount(geometry) {
  return geometry.getAttribute('position').count;
}

export function faceCount(geometry) {
  const { index } = geometry;
  const count = index ? index.count : geometry.getAttribute('position').count;
  return count / verticesPerTriangle;
}

function triangleVertexIndex(index, triangle, corner) {
  const slot = verticesPerTriangle * triangle + corner;
  return index ? index.getX(slot) : slot;
}

// Volumen por suma de tetraedros con signo (como mesh.volume en trimesh).
function signedVolumeMm3(geometry) {
  const position = geometry.getAttribute('position');
  const { index } = geometry;
  const triangles = faceCount(geometry);
  const first = new THREE.Vector3();
  const second = new THREE.Vector3();
  const third = new THREE.Vector3();
  let volume = 0;
  // Bucle clásico: con decenas de miles de triángulos evita crear arrays intermedios.
  for (let triangle = 0; triangle < triangles; triangle += 1) {
    first.fromBufferAttribute(position, triangleVertexIndex(index, triangle, 0));
    second.fromBufferAttribute(position, triangleVertexIndex(index, triangle, 1));
    third.fromBufferAttribute(position, triangleVertexIndex(index, triangle, 2));
    volume += first.dot(second.cross(third)) / tetrahedronVolumeFactor;
  }
  return volume;
}

// Tamaño del bounding box y volumen, en milímetros (la conversión es al mostrar).
export function computeObjectStats(geometry) {
  const box = new THREE.Box3().setFromBufferAttribute(geometry.getAttribute('position'));
  const size = box.getSize(new THREE.Vector3());
  return {
    sizeMm: size.toArray(),
    volumeMm3: Math.abs(signedVolumeMm3(geometry)),
  };
}
