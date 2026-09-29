import * as THREE from 'three';
import { STLLoader } from 'three/addons/loaders/STLLoader.js';
import { mergeVertices } from 'three/addons/utils/BufferGeometryUtils.js';
import { meshDataFromGeometry, meshFaceCount } from './meshData';

const componentsPerVertex = 3;
const tetrahedronVolumeFactor = 6;

// Equivalente a trimesh.load(): el STL viene como triángulos sueltos, así que se
// fusionan los vértices coincidentes para tener una malla indexada (meshData).
export function parseSTL(arrayBuffer) {
  const raw = new STLLoader().parse(arrayBuffer);
  raw.deleteAttribute('normal');
  const geometry = mergeVertices(raw);
  raw.dispose();
  const meshData = meshDataFromGeometry(geometry);
  geometry.dispose();
  if (meshFaceCount(meshData) === 0) throw new Error('the file contains no triangles');
  return meshData;
}

function readVertex(target, positions, vertex) {
  const offset = componentsPerVertex * vertex;
  return target.set(positions[offset], positions[offset + 1], positions[offset + 2]);
}

// Volumen por suma de tetraedros con signo (como mesh.volume en trimesh).
function signedVolumeMm3({ positions, index }) {
  const first = new THREE.Vector3();
  const second = new THREE.Vector3();
  const third = new THREE.Vector3();
  let volume = 0;
  // Bucle clásico: con decenas de miles de triángulos evita crear arrays intermedios.
  for (let corner = 0; corner < index.length; corner += 3) {
    readVertex(first, positions, index[corner]);
    readVertex(second, positions, index[corner + 1]);
    readVertex(third, positions, index[corner + 2]);
    volume += first.dot(second.cross(third)) / tetrahedronVolumeFactor;
  }
  return volume;
}

// Tamaño del bounding box y volumen, en milímetros (la conversión es al mostrar).
export function computeObjectStats(meshData) {
  const box = new THREE.Box3().setFromArray(meshData.positions);
  return {
    sizeMm: box.getSize(new THREE.Vector3()).toArray(),
    volumeMm3: Math.abs(signedVolumeMm3(meshData)),
  };
}
