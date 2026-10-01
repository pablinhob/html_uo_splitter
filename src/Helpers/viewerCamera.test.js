import * as THREE from 'three';
import { describe, expect, it } from 'vitest';
import { frameCamera, viewDirection } from './viewerCamera';

// Tabla tumbada: 200 de largo en X, 50 de ancho en Y y 6 de grosor en Z.
const flatBoard = new THREE.Box3(new THREE.Vector3(0, -25, 0), new THREE.Vector3(200, 25, 6));

const fakeControls = () => ({ target: new THREE.Vector3(), update: () => {} });

describe('viewDirection', () => {
  it('las vistas X, Y y Z miran a lo largo de su eje', () => {
    expect(viewDirection('x').toArray()).toEqual([1, 0, 0]);
    expect(viewDirection('y').toArray()).toEqual([0, 1, 0]);
    const alongZ = viewDirection('z');
    expect(alongZ.z).toBeCloseTo(1, 5);
    expect(alongZ.y).toBeLessThan(0);
  });

  it("'fit' es la vista isométrica", () => {
    const direction = viewDirection('fit');
    expect(direction.x).toBeCloseTo(direction.y, 10);
    expect(direction.y).toBeCloseTo(direction.z, 10);
  });
});

describe('frameCamera', () => {
  it('encuadra el bbox en la dirección pedida', () => {
    const camera = new THREE.PerspectiveCamera(30);
    const controls = fakeControls();
    frameCamera(camera, controls, flatBoard, viewDirection('x'));

    const center = flatBoard.getCenter(new THREE.Vector3());
    expect(controls.target.toArray()).toEqual(center.toArray());
    expect(camera.position.y).toBeCloseTo(center.y, 10);
    expect(camera.position.x).toBeGreaterThan(flatBoard.max.x);
  });
});
