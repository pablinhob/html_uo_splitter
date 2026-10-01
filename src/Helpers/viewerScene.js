import * as THREE from 'three';
import { MeshBVH } from 'three-mesh-bvh';
import {
  BOUNDING_BOX_EDGE_COLOR,
  CORNER_BRACKET_FRACTION,
  FEATURE_EDGE_ANGLE_DEG,
  PIECE_HOVER_EMISSIVE_COLOR,
  SPLIT_EDGE_COLOR,
} from '../config';

// Objetos de three.js que monta el visor (equivalen a los actores de viewer.py).
// Sin React ni DOM: reciben datos y devuelven objetos de escena.

// Cada eje del bbox: [coordenada de la cara, sentido hacia dentro].
const axisEnds = (min, max) => [
  [min, 1],
  [max, -1],
];

// Esquinas del bounding box: tres "brazos" por esquina, como en viewer.py.
export function buildCornerBrackets(box) {
  const { min, max } = box;
  const arm = box.getSize(new THREE.Vector3()).multiplyScalar(CORNER_BRACKET_FRACTION);
  const points = axisEnds(min.x, max.x).flatMap(([x, signX]) =>
    axisEnds(min.y, max.y).flatMap(([y, signY]) =>
      axisEnds(min.z, max.z).flatMap(([z, signZ]) => {
        const corner = new THREE.Vector3(x, y, z);
        return [
          corner,
          corner.clone().add(new THREE.Vector3(signX * arm.x, 0, 0)),
          corner,
          corner.clone().add(new THREE.Vector3(0, signY * arm.y, 0)),
          corner,
          corner.clone().add(new THREE.Vector3(0, 0, signZ * arm.z)),
        ];
      }),
    ),
  );
  const brackets = new THREE.LineSegments(
    new THREE.BufferGeometry().setFromPoints(points),
    new THREE.LineBasicMaterial({ color: BOUNDING_BOX_EDGE_COLOR }),
  );
  brackets.userData.ownsGeometry = true;
  return brackets;
}

function buildMesh({ geometry, color, opacity = 1, visible = true, pickKey = null }) {
  const mesh = new THREE.Mesh(
    geometry,
    new THREE.MeshPhongMaterial({
      color,
      transparent: opacity < 1,
      opacity,
      depthWrite: opacity >= 1,
      side: THREE.DoubleSide,
    }),
  );
  mesh.visible = visible;
  mesh.userData.pickKey = pickKey;
  return mesh;
}

function buildFeatureEdges({ geometry, visible = true }) {
  const edges = new THREE.LineSegments(
    new THREE.EdgesGeometry(geometry, FEATURE_EDGE_ANGLE_DEG),
    new THREE.LineBasicMaterial({ color: SPLIT_EDGE_COLOR }),
  );
  edges.userData.ownsGeometry = true;
  edges.visible = visible;
  return edges;
}

// Contorno de corte: líneas (la geometría es del llamante, como la de las mallas).
function buildLines({ geometry, visible = true }) {
  const lines = new THREE.LineSegments(
    geometry,
    new THREE.LineBasicMaterial({ color: SPLIT_EDGE_COLOR }),
  );
  lines.visible = visible;
  return lines;
}

// Objetos de three.js de cada entrada: líneas, o malla (y sus aristas si se piden).
export function buildObjectMeshes(objects) {
  return objects.flatMap((object) => {
    if (object.lines) return [buildLines(object)];
    return object.edges ? [buildMesh(object), buildFeatureEdges(object)] : [buildMesh(object)];
  });
}

const geometryBox = (geometry) =>
  new THREE.Box3().setFromBufferAttribute(geometry.getAttribute('position'));

// Bounding boxes de los objetos que cuentan para encuadrar: todos y solo visibles.
export function framingBoxes(objects) {
  const framed = objects.filter((object) => object.frame);
  const union = (list) =>
    list.reduce((box, object) => box.union(geometryBox(object.geometry)), new THREE.Box3());
  return {
    allBox: union(framed),
    visibleBox: union(framed.filter((object) => object.visible ?? true)),
  };
}

export const boxKey = (box) =>
  box.isEmpty() ? '' : [...box.min.toArray(), ...box.max.toArray()].join(',');

// Las geometrías de las mallas pertenecen al llamante; solo se liberan las que
// crea el visor (aristas y esquinas). Los materiales son siempre del visor.
export function disposeObject(object) {
  object.traverse((child) => {
    if (child.userData.ownsGeometry) child.geometry?.dispose();
    child.material?.dispose();
  });
}

// Mallas opacas visibles: las que el ratón puede tocar (el fantasma no tapa).
const solidVisibleMeshes = (content) =>
  content.children.filter((child) => child.isMesh && child.visible && child.material.opacity >= 1);

// BVH de cada geometría para el raycast, creado la primera vez que se necesita.
// `indirect` evita que MeshBVH añada un índice a la geometría, que es del llamante.
const bvhByGeometry = new WeakMap();

function bvhOf(geometry) {
  if (!bvhByGeometry.has(geometry)) {
    bvhByGeometry.set(geometry, new MeshBVH(geometry, { indirect: true }));
  }
  return bvhByGeometry.get(geometry);
}

/**
 * Malla seleccionable bajo el rayo (en coordenadas de la escena), o null. Solo
 * cuenta el primer objeto opaco que toca: si es una pieza con `pickKey`, esa es la
 * elegida. Las mallas del visor no tienen transformación propia, así que el rayo
 * vale tal cual en el espacio de cada geometría.
 */
export function pickedMesh(ray, content) {
  const hits = solidVisibleMeshes(content)
    .map((mesh) => ({ mesh, hit: bvhOf(mesh.geometry).raycastFirst(ray, THREE.DoubleSide) }))
    .filter(({ hit }) => hit);
  const nearest = hits.reduce(
    (best, candidate) => (!best || candidate.hit.distance < best.hit.distance ? candidate : best),
    null,
  );
  return nearest?.mesh.userData.pickKey ? nearest.mesh : null;
}

// Tiñe (o deja de teñir) la pieza bajo el ratón para indicar que se puede pinchar.
export function setMeshHighlight(mesh, isHighlighted) {
  mesh.material.emissive.set(isHighlighted ? PIECE_HOVER_EMISSIVE_COLOR : 0x000000);
}
