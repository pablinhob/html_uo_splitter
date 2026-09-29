import * as THREE from 'three'
import { STLLoader } from 'three/addons/loaders/STLLoader.js'
import { mergeVertices } from 'three/addons/utils/BufferGeometryUtils.js'

const MM_PER_CM = 10
const CM3_PER_LITER = 1000

// Equivalente a trimesh.load(): el STL viene como triángulos sueltos, así que se
// fusionan los vértices coincidentes para tener una malla indexada.
export async function loadStl(file) {
  const buffer = await file.arrayBuffer()
  const raw = new STLLoader().parse(buffer)
  raw.deleteAttribute('normal')
  const geometry = mergeVertices(raw)
  raw.dispose()
  geometry.computeVertexNormals()
  geometry.computeBoundingBox()
  return geometry
}

export function vertexCount(geometry) {
  return geometry.getAttribute('position').count
}

export function faceCount(geometry) {
  return geometry.index ? geometry.index.count / 3 : geometry.getAttribute('position').count / 3
}

// Volumen por suma de tetraedros con signo (como mesh.volume en trimesh).
function signedVolume(geometry) {
  const position = geometry.getAttribute('position')
  const index = geometry.index
  const a = new THREE.Vector3()
  const b = new THREE.Vector3()
  const c = new THREE.Vector3()
  let volume = 0
  const triangles = faceCount(geometry)
  for (let i = 0; i < triangles; i++) {
    const [ia, ib, ic] = index
      ? [index.getX(3 * i), index.getX(3 * i + 1), index.getX(3 * i + 2)]
      : [3 * i, 3 * i + 1, 3 * i + 2]
    a.fromBufferAttribute(position, ia)
    b.fromBufferAttribute(position, ib)
    c.fromBufferAttribute(position, ic)
    volume += a.dot(b.cross(c)) / 6
  }
  return volume
}

export function computeObjectStats(geometry) {
  if (!geometry.boundingBox) geometry.computeBoundingBox()
  const size = geometry.boundingBox.getSize(new THREE.Vector3())
  const volumeCm3 = Math.abs(signedVolume(geometry)) / MM_PER_CM ** 3
  return {
    sizeCm: [size.x / MM_PER_CM, size.y / MM_PER_CM, size.z / MM_PER_CM],
    volumeCm3,
    volumeLiters: volumeCm3 / CM3_PER_LITER,
  }
}
