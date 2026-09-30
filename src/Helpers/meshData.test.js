import { describe, expect, it } from 'vitest';
import { boxSTL, textBuffer } from '../../tests/support/geometry';
import { geometryFromMeshData } from './meshData';
import { parseSTL } from './stl';

describe('geometryFromMeshData', () => {
  it('mantiene vivas las aristas: en un cubo cada vértice lleva la normal de su cara', () => {
    const meshData = parseSTL(textBuffer(boxSTL({ x: 10, y: 20, z: 30 })));
    const geometry = geometryFromMeshData(meshData);
    const normals = geometry.getAttribute('normal');
    const axisNormals = Array.from({ length: normals.count }, (_, vertex) =>
      [normals.getX(vertex), normals.getY(vertex), normals.getZ(vertex)]
        .map((component) => Math.abs(component))
        .sort((first, second) => second - first),
    );
    // Normal suavizada en la esquina: (0,577, 0,577, 0,577). Viva: (1, 0, 0).
    axisNormals.forEach(([largest, ...others]) => {
      expect(largest).toBeCloseTo(1, 6);
      others.forEach((component) => expect(component).toBeCloseTo(0, 6));
    });
    expect(geometry.boundingBox.max.z - geometry.boundingBox.min.z).toBeCloseTo(30, 6);
    geometry.dispose();
  });
});
