import * as THREE from 'three';
import {
  BOUNDING_BOX_EDGE_COLOR,
  CORNER_BRACKET_FRACTION,
  FEATURE_EDGE_ANGLE_DEG,
  SPLIT_EDGE_COLOR,
  VIEWER_FAR_FACTOR,
  VIEWER_NEAR_FACTOR,
} from '../config';

// Objetos de three.js que monta el visor (equivalen a los actores de viewer.py).
// Sin React ni DOM: reciben datos y devuelven objetos de escena.

const isometricDirection = new THREE.Vector3(1, 1, 1).normalize();

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

function buildMesh({ geometry, color, opacity = 1, visible = true }) {
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

// Mallas (y aristas si se piden) de cada objeto de la lista del visor.
export const buildObjectMeshes = (objects) =>
  objects.flatMap((object) =>
    object.edges ? [buildMesh(object), buildFeatureEdges(object)] : [buildMesh(object)],
  );

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

// reset_camera(): vista isométrica que encuadra el bbox.
export function frameCamera(camera, controls, box) {
  const center = box.getCenter(new THREE.Vector3());
  const { radius } = box.getBoundingSphere(new THREE.Sphere());
  const distance = radius / Math.sin(THREE.MathUtils.degToRad(camera.fov / 2));
  camera.position.copy(center).addScaledVector(isometricDirection, distance);
  camera.near = distance * VIEWER_NEAR_FACTOR;
  camera.far = distance * VIEWER_FAR_FACTOR;
  camera.updateProjectionMatrix();
  controls.target.copy(center);
  controls.update();
}

// Las geometrías de las mallas pertenecen al llamante; solo se liberan las que
// crea el visor (aristas y esquinas). Los materiales son siempre del visor.
export function disposeObject(object) {
  object.traverse((child) => {
    if (child.userData.ownsGeometry) child.geometry?.dispose();
    child.material?.dispose();
  });
}
