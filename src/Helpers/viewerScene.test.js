import * as THREE from 'three';
import { describe, expect, it } from 'vitest';
import { PIECE_HOVER_EMISSIVE_COLOR } from '../config';
import { buildObjectMeshes, pickedMesh, setMeshHighlight } from './viewerScene';

// Dos cajas en fila sobre el eje X: 'near' en x = 0 y 'far' en x = -10.
const box = (x) => new THREE.BoxGeometry(2, 2, 2).translate(x, 0, 0);
const content = (objects) => {
  const group = new THREE.Group();
  buildObjectMeshes(objects).forEach((mesh) => group.add(mesh));
  return group;
};
// Rayo desde x = +10 hacia -X que atraviesa las dos cajas.
const rayThroughBoth = new THREE.Ray(new THREE.Vector3(10, 0, 0), new THREE.Vector3(-1, 0, 0));
const missingRay = new THREE.Ray(new THREE.Vector3(10, 50, 0), new THREE.Vector3(-1, 0, 0));

describe('pickedMesh', () => {
  it('elige la pieza seleccionable más cercana al rayo', () => {
    const scene = content([
      { key: 'far', geometry: box(-10), color: '#ffffff', pickKey: ['a', 1] },
      { key: 'near', geometry: box(0), color: '#ffffff', pickKey: ['a', 0] },
    ]);
    expect(pickedMesh(rayThroughBoth, scene).userData.pickKey).toEqual(['a', 0]);
    expect(pickedMesh(missingRay, scene)).toBeNull();
  });

  it('una pieza que no se puede pinchar tapa a las de detrás; las ocultas no', () => {
    const blocked = content([
      { key: 'near', geometry: box(0), color: '#ffffff' },
      { key: 'far', geometry: box(-10), color: '#ffffff', pickKey: ['a', 1] },
    ]);
    expect(pickedMesh(rayThroughBoth, blocked)).toBeNull();

    const hidden = content([
      { key: 'near', geometry: box(0), color: '#ffffff', visible: false },
      { key: 'far', geometry: box(-10), color: '#ffffff', pickKey: ['a', 1] },
    ]);
    expect(pickedMesh(rayThroughBoth, hidden).userData.pickKey).toEqual(['a', 1]);
  });

  it('el fantasma translúcido de la tabla no tapa las piezas', () => {
    const scene = content([
      { key: 'ghost', geometry: box(0), color: '#808080', opacity: 0.1 },
      { key: 'far', geometry: box(-10), color: '#ffffff', pickKey: ['b', 2] },
    ]);
    expect(pickedMesh(rayThroughBoth, scene).userData.pickKey).toEqual(['b', 2]);
  });
});

describe('setMeshHighlight', () => {
  it('tiñe la pieza y la devuelve a su color', () => {
    const [mesh] = buildObjectMeshes([{ key: 'p', geometry: box(0), color: '#ffffff' }]);
    setMeshHighlight(mesh, true);
    expect(`#${mesh.material.emissive.getHexString()}`).toBe(PIECE_HOVER_EMISSIVE_COLOR);
    setMeshHighlight(mesh, false);
    expect(mesh.material.emissive.getHex()).toBe(0);
  });
});
