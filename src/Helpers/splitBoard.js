import { SPLIT_BORDER_TOLERANCE_MM, SPLIT_PLANE_TOLERANCE_MM } from '../config';
import canonicalFrame from './boardFrame';
import { detectAxes } from './boardAxes';
import {
  boundaryOutline,
  cutlapInnerPolygon,
  nearInnerRing,
  splitCutlap,
  touchesBoundary,
} from './cutlap';
import { meshDataFromManifold } from './manifold';
import { planarFaceOutline } from './meshOutline';
import splitIntoCells from './splitCells';
import { SPLIT_PATTERNS } from './splitGrid';

/**
 * split_lengthwise y split_board (mesh_ops.py). Recibe el Manifold de la tabla y
 * devuelve, en el marco del STL:
 *   pieces:      [{ key, manifold, meshData }] en el orden de Python
 *                (stringer, A interior, A cutlap, B interior, B cutlap)
 *   cutOutlines: [{ segments, borders: [key, ...] }] contornos de corte y las
 *                piezas a las que pertenecen (el visor los muestra con ellas).
 * El llamante libera los Manifold de las piezas; `board` no se toca.
 */

const widthNormal = [0, 1, 0];

function boundsOf(manifold) {
  const { min, max } = manifold.boundingBox();
  return { min, max };
}

// split_lengthwise: mitades A (y > plano +) y B (y < plano -) y el stringer entre ambas.
function splitLengthwise(board, stringerWidthMm) {
  const { min, max } = boundsOf(board);
  const centerY = (min[1] + max[1]) / 2;
  const half = stringerWidthMm / 2;
  const planeA = centerY + half;
  const planeB = centerY - half;
  const sideA = board.trimByPlane(widthNormal, planeA);
  const sideB = board.trimByPlane([0, -1, 0], -planeB);
  let stringer = null;
  if (stringerWidthMm > 0) {
    const belowA = board.trimByPlane([0, -1, 0], -planeA);
    stringer = belowA.trimByPlane(widthNormal, planeB);
    belowA.delete();
  }
  return { sideA, sideB, stringer, planeA, planeB };
}

const emptySplit = { pieces: [], outlines: [] };

/**
 * Separa el cutlap de una mitad (como split_cutlap) y trocea cada parte con la
 * rejilla. `cutlap` es null sin cutlap, { inner: null } si el contorno interior
 * desaparece (toda la mitad es cutlap) o { inner } con el contorno interior.
 */
function cutlapParts(board, side, cutlap) {
  if (!cutlap) return { interior: side, cutlap: null };
  if (!cutlap.inner) return { interior: null, cutlap: side };
  return splitCutlap(board, side, cutlap.inner);
}

function splitSide(wasm, board, side, cutlap, makeCells) {
  const parts = cutlapParts(board, side, cutlap);
  const splitPart = (part) =>
    part ? splitIntoCells(wasm, part, makeCells(boundsOf(part))) : emptySplit;
  const ring = cutlap?.inner?.ring;
  const result = {
    interior: splitPart(parts.interior),
    cutlap: splitPart(parts.cutlap),
    cutlapOutline:
      parts.cutlap && ring
        ? boundaryOutline(meshDataFromManifold(parts.cutlap), nearInnerRing(ring))
        : null,
  };
  [parts.interior, parts.cutlap].forEach((part) => {
    if (part && part !== side) part.delete();
  });
  return result;
}

const planeOutline = (side, planeY) =>
  planarFaceOutline(
    meshDataFromManifold(side),
    [0, planeY, 0],
    widthNormal,
    SPLIT_PLANE_TOLERANCE_MM,
  );

function sidePieces(half, split) {
  return [
    ...split.interior.pieces.map((piece, index) => ({ ...piece, key: [half, index] })),
    ...split.cutlap.pieces.map((piece, index) => ({ ...piece, key: [half, 'cutlap', index] })),
  ];
}

const bordersOf =
  (half, isCutlap) =>
  ([first, second]) =>
    isCutlap
      ? [
          [half, 'cutlap', first],
          [half, 'cutlap', second],
        ]
      : [
          [half, first],
          [half, second],
        ];

// Contornos de corte de split_board(), con las piezas que tocan cada uno.
function cutOutlines({ sides, stringer, planes, ring }) {
  const borderPieces = (half, axisValue, pick) =>
    sides[half].interior.pieces
      .map((piece, index) => ({ piece, index }))
      .filter(
        ({ piece }) =>
          Math.abs(pick(boundsOf(piece.manifold)) - axisValue) < SPLIT_BORDER_TOLERANCE_MM,
      )
      .map(({ index }) => [half, index]);
  const aBorder = borderPieces('a', planes.a.min, (bounds) => bounds.min[1]);
  const bBorder = borderPieces('b', planes.b.max, (bounds) => bounds.max[1]);
  const outlines = [
    { segments: planes.a.outline, borders: [...aBorder, ...(stringer ? [['stringer']] : bBorder)] },
  ];
  if (stringer) outlines.push({ segments: planes.b.outline, borders: [['stringer'], ...bBorder] });

  ['a', 'b'].forEach((half) => {
    const split = sides[half];
    if (!split.cutlapOutline) return;
    const isNear = nearInnerRing(ring);
    const touching = (pieces, toKey) =>
      pieces.flatMap((piece, index) =>
        touchesBoundary(piece.meshData, isNear) ? [toKey(index)] : [],
      );
    outlines.push({
      segments: split.cutlapOutline,
      borders: [
        ...touching(split.interior.pieces, (index) => [half, index]),
        ...touching(split.cutlap.pieces, (index) => [half, 'cutlap', index]),
      ],
    });
  });
  ['a', 'b'].forEach((half) => {
    const toOutline = (isCutlap) => (entry) => ({
      segments: entry.segments,
      borders: bordersOf(half, isCutlap)(entry.borders),
    });
    outlines.push(...sides[half].interior.outlines.map(toOutline(false)));
    outlines.push(...sides[half].cutlap.outlines.map(toOutline(true)));
  });
  return outlines.filter((outline) => outline.segments.length > 0);
}

// Lleva piezas y contornos del marco canónico al del STL.
function toWorld(wasm, frame, pieces, outlines) {
  if (frame.isIdentity) return { pieces, cutOutlines: outlines };
  const worldPieces = pieces.map(({ key, manifold }) => {
    const world = manifold.transform(frame.toWorld);
    manifold.delete();
    return { key, manifold: world, meshData: meshDataFromManifold(world) };
  });
  const worldOutlines = outlines.map((outline) => ({
    ...outline,
    segments: frame.pointsToWorld(outline.segments),
  }));
  return { pieces: worldPieces, cutOutlines: worldOutlines };
}

/**
 * params: { shape: 'Hexagon' | 'Triangle', pieceRadiusMm, stringerWidthMm, cutlapWidthMm }
 */
export default function splitBoard(wasm, board, params) {
  const { shape, pieceRadiusMm, stringerWidthMm, cutlapWidthMm } = params;
  const makeGrid = SPLIT_PATTERNS[shape];
  if (!makeGrid) throw new Error(`Split pattern '${shape}' is not implemented yet`);
  const frame = canonicalFrame(detectAxes(boundsOf(board)));
  const canonical = frame.isIdentity ? board : board.transform(frame.toCanonical);
  const makeCells = (bounds) => makeGrid(bounds, pieceRadiusMm);

  const { sideA, sideB, stringer, planeA, planeB } = splitLengthwise(canonical, stringerWidthMm);
  const cutlap = cutlapWidthMm > 0 ? { inner: cutlapInnerPolygon(canonical, cutlapWidthMm) } : null;
  const sides = {
    a: splitSide(wasm, canonical, sideA, cutlap, makeCells),
    b: splitSide(wasm, canonical, sideB, cutlap, makeCells),
  };
  const planes = {
    a: { min: boundsOf(sideA).min[1], outline: planeOutline(sideA, planeA) },
    b: { max: boundsOf(sideB).max[1], outline: planeOutline(sideB, planeB) },
  };
  const outlines = cutOutlines({ sides, stringer, planes, ring: cutlap?.inner?.ring });

  const pieces = [
    ...(stringer
      ? [{ key: ['stringer'], manifold: stringer, meshData: meshDataFromManifold(stringer) }]
      : []),
    ...sidePieces('a', sides.a),
    ...sidePieces('b', sides.b),
  ];
  sideA.delete();
  sideB.delete();
  cutlap?.inner?.section.delete();
  if (canonical !== board) canonical.delete();
  return toWorld(wasm, frame, pieces, outlines);
}
