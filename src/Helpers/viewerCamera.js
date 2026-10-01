import * as THREE from 'three';
import { VIEWER_ALONG_Z_TILT, VIEWER_FAR_FACTOR, VIEWER_NEAR_FACTOR } from '../config';

/**
 * Cámara del visor: encuadre de la tabla y vistas predefinidas (gestor de cámara).
 * Sin React ni DOM: mueven la cámara y los OrbitControls que reciben.
 */

const isometricDirection = new THREE.Vector3(1, 1, 1).normalize();

// Dirección desde el centro hacia la cámara al mirar a lo largo de un eje.
function axisDirection(axis) {
  const direction = new THREE.Vector3().setComponent(axis, 1);
  if (axis === 2) direction.y = -VIEWER_ALONG_Z_TILT;
  return direction.normalize();
}

// Dirección de la cámara para una vista: 'fit' (la isométrica de reset_camera()),
// 'x', 'y' o 'z'.
export function viewDirection(viewId) {
  const axis = ['x', 'y', 'z'].indexOf(viewId);
  return axis === -1 ? isometricDirection.clone() : axisDirection(axis);
}

// Coloca la cámara en la dirección dada a la distancia que encuadra el bbox entero.
export function frameCamera(camera, controls, box, direction = isometricDirection) {
  const center = box.getCenter(new THREE.Vector3());
  const { radius } = box.getBoundingSphere(new THREE.Sphere());
  const distance = radius / Math.sin(THREE.MathUtils.degToRad(camera.fov / 2));
  camera.position.copy(center).addScaledVector(direction, distance);
  camera.near = distance * VIEWER_NEAR_FACTOR;
  camera.far = distance * VIEWER_FAR_FACTOR;
  camera.updateProjectionMatrix();
  controls.target.copy(center);
  controls.update();
}
