import { describe, expect, it } from 'vitest';
import readZip from '../../tests/support/zip';
import { BOARD_COLOR, STRINGER_COLOR } from '../config';
import { encode3MF, encodeOBJ } from './exportFormats';

// Tetraedro unidad: 4 vértices y 4 caras.
const tetrahedron = () => ({
  positions: new Float32Array([0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1]),
  index: new Uint32Array([0, 2, 1, 0, 1, 3, 0, 3, 2, 1, 2, 3]),
});
const pieces = [
  { key: ['stringer'], meshData: tetrahedron() },
  { key: ['a', 0], meshData: tetrahedron() },
];
const text = (data) => new TextDecoder().decode(data);
const toUnit = (hex) =>
  [1, 3, 5].map((start) => Number((parseInt(hex.slice(start, start + 2), 16) / 255).toFixed(6)));

describe('encodeOBJ', () => {
  const file = encodeOBJ(pieces);
  const [obj, mtl] = readZip(file.bytes);

  it('descarga un zip con el .obj y su .mtl', () => {
    expect(file.fileName).toBe('surfboard_pieces_obj.zip');
    expect([obj.name, mtl.name]).toEqual(['surfboard_pieces.obj', 'surfboard_pieces.mtl']);
  });

  it('escribe un objeto por pieza con su material y los índices globales', () => {
    const lines = text(obj.data).trim().split('\n');
    expect(lines[0]).toBe('mtllib surfboard_pieces.mtl');
    expect(lines.filter((line) => line.startsWith('o '))).toEqual([
      'o Stringer',
      'o Side A - Split 1',
    ]);
    expect(lines.filter((line) => line.startsWith('usemtl '))).toEqual([
      'usemtl material_0',
      'usemtl material_1',
    ]);
    expect(lines.filter((line) => line.startsWith('v '))).toHaveLength(8);
    const faces = lines.filter((line) => line.startsWith('f '));
    expect(faces).toHaveLength(8);
    // La segunda pieza empieza en el vértice 5 (índices 1-based y acumulados).
    expect(faces[4]).toBe('f 5 7 6');
  });

  it('define un material por color de pieza', () => {
    const kd = text(mtl.data)
      .split('\n')
      .filter((line) => line.startsWith('Kd '))
      .map((line) => line.slice(3).split(' ').map(Number));
    expect(kd).toEqual([toUnit(STRINGER_COLOR), toUnit(BOARD_COLOR)]);
  });
});

describe('encode3MF', () => {
  const file = encode3MF(pieces);
  const entries = readZip(file.bytes);

  it('empaqueta el modelo con sus relaciones y tipos de contenido', () => {
    expect(file.fileName).toBe('surfboard_pieces.3mf');
    expect(entries.map((entry) => entry.name)).toEqual([
      '[Content_Types].xml',
      '_rels/.rels',
      '3D/3dmodel.model',
    ]);
  });

  it('escribe un objeto con nombre por pieza y lo añade al build', () => {
    const model = text(entries[2].data);
    expect(model).toContain('unit="millimeter"');
    expect(model.match(/<object /g)).toHaveLength(2);
    expect(model).toContain('name="Side A - Split 1"');
    expect(model.match(/<vertex /g)).toHaveLength(8);
    expect(model.match(/<triangle /g)).toHaveLength(8);
    expect(model).toContain('<build><item objectid="1"/><item objectid="2"/></build>');
  });
});
