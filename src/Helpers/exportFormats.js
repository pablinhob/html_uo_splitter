import { EXPORT_FILE_BASENAME, EXPORT_MATERIAL_AMBIENT, EXPORT_MATERIAL_SPECULAR } from '../config';
import { pieceColor, pieceName } from './pieces';
import createZip from './zip';

/**
 * Escritura de las piezas finales (on_export de export_window.py).
 * pieces: [{ key, meshData }] en mm. Cada formato devuelve { fileName, mimeType, bytes }.
 *   - OBJ: un .zip con el .obj y su .mtl. Los colores van por material con nombre
 *     (no por vértice), porque algunos CAD rechazan el OBJ con color por vértice.
 *   - 3MF: un objeto por pieza, sin colores (como trimesh en el original).
 */

const encoder = new TextEncoder();
const numberText = (value) => Number(value.toFixed(6)).toString();
const xmlEscape = (text) =>
  text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const hexToUnitRgb = (hex) =>
  [1, 3, 5].map((start) => parseInt(hex.slice(start, start + 2), 16) / 255);

function forEachVertex({ positions }, visit) {
  for (let offset = 0; offset < positions.length; offset += 3) {
    visit(positions[offset], positions[offset + 1], positions[offset + 2]);
  }
}

function forEachTriangle({ index }, visit) {
  for (let corner = 0; corner < index.length; corner += 3) {
    visit(index[corner], index[corner + 1], index[corner + 2]);
  }
}

// Un material por color distinto, en orden de aparición: material_0, material_1...
function materialsByColor(pieces) {
  const byColor = new Map();
  pieces.forEach(({ key }) => {
    const color = pieceColor(key);
    if (!byColor.has(color)) byColor.set(color, `material_${byColor.size}`);
  });
  return byColor;
}

function mtlText(materials) {
  const ambient = EXPORT_MATERIAL_AMBIENT.map(numberText).join(' ');
  const specular = EXPORT_MATERIAL_SPECULAR.map(numberText).join(' ');
  return [...materials]
    .map(([color, name]) =>
      [
        `newmtl ${name}`,
        `Ka ${ambient}`,
        `Kd ${hexToUnitRgb(color).map(numberText).join(' ')}`,
        `Ks ${specular}`,
        'Ns 1',
        '',
      ].join('\n'),
    )
    .join('\n');
}

function objText(pieces, materials, mtlName) {
  const lines = [`mtllib ${mtlName}`];
  let vertexOffset = 1;
  pieces.forEach(({ key, meshData }) => {
    lines.push(`o ${pieceName(key)}`, `usemtl ${materials.get(pieceColor(key))}`);
    forEachVertex(meshData, (x, y, z) =>
      lines.push(`v ${numberText(x)} ${numberText(y)} ${numberText(z)}`),
    );
    forEachTriangle(meshData, (first, second, third) =>
      lines.push(`f ${first + vertexOffset} ${second + vertexOffset} ${third + vertexOffset}`),
    );
    vertexOffset += meshData.positions.length / 3;
  });
  return `${lines.join('\n')}\n`;
}

export function encodeOBJ(pieces) {
  const materials = materialsByColor(pieces);
  const mtlName = `${EXPORT_FILE_BASENAME}.mtl`;
  const bytes = createZip([
    {
      name: `${EXPORT_FILE_BASENAME}.obj`,
      data: encoder.encode(objText(pieces, materials, mtlName)),
    },
    { name: mtlName, data: encoder.encode(mtlText(materials)) },
  ]);
  return { fileName: `${EXPORT_FILE_BASENAME}_obj.zip`, mimeType: 'application/zip', bytes };
}

function modelObject(id, { key, meshData }) {
  const vertices = [];
  forEachVertex(meshData, (x, y, z) =>
    vertices.push(`<vertex x="${numberText(x)}" y="${numberText(y)}" z="${numberText(z)}"/>`),
  );
  const triangles = [];
  forEachTriangle(meshData, (first, second, third) =>
    triangles.push(`<triangle v1="${first}" v2="${second}" v3="${third}"/>`),
  );
  return [
    `<object id="${id}" name="${xmlEscape(pieceName(key))}" type="model"><mesh>`,
    `<vertices>${vertices.join('')}</vertices>`,
    `<triangles>${triangles.join('')}</triangles>`,
    '</mesh></object>',
  ].join('');
}

const contentTypes =
  '<?xml version="1.0" encoding="UTF-8"?>' +
  '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">' +
  '<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>' +
  '<Default Extension="model" ContentType="application/vnd.ms-package.3dmanufacturing-3dmodel+xml"/>' +
  '</Types>';

const relationships =
  '<?xml version="1.0" encoding="UTF-8"?>' +
  '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' +
  '<Relationship Target="/3D/3dmodel.model" Id="rel0" ' +
  'Type="http://schemas.microsoft.com/3dmanufacturing/2013/01/3dmodel"/>' +
  '</Relationships>';

export function encode3MF(pieces) {
  const objects = pieces.map((piece, index) => modelObject(index + 1, piece));
  const items = pieces.map((_, index) => `<item objectid="${index + 1}"/>`);
  const model = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<model unit="millimeter" xml:lang="en-US" ',
    'xmlns="http://schemas.microsoft.com/3dmanufacturing/core/2015/02">',
    `<resources>${objects.join('')}</resources>`,
    `<build>${items.join('')}</build>`,
    '</model>',
  ].join('');
  const bytes = createZip([
    { name: '[Content_Types].xml', data: encoder.encode(contentTypes) },
    { name: '_rels/.rels', data: encoder.encode(relationships) },
    { name: '3D/3dmodel.model', data: encoder.encode(model) },
  ]);
  return { fileName: `${EXPORT_FILE_BASENAME}.3mf`, mimeType: 'model/3mf', bytes };
}

export const EXPORT_ENCODERS = { obj: encodeOBJ, '3mf': encode3MF };
