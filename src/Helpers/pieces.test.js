import { describe, expect, it } from 'vitest';
import { BOARD_COLOR, CUTLAP_COLOR, STRINGER_COLOR } from '../config';
import { buildPiecesTree, classifyPiece, matchesSelection, pieceColor } from './pieces';

// Claves en el mismo orden en que las genera split_board() de mesh_ops.py.
const pieceKeys = [
  ['stringer'],
  ['a', 1],
  ['a', 0],
  ['a', 'cutlap', 1],
  ['a', 'cutlap', 0],
  ['b', 0],
];

const labels = (nodes) => nodes.map((node) => node.label);

describe('buildPiecesTree', () => {
  it('reproduce el árbol de PiecesPanel.populate()', () => {
    const tree = buildPiecesTree(pieceKeys);
    expect(labels(tree)).toEqual(['All', 'Stringer', 'Side A', 'Side B']);

    const sideA = tree[2];
    expect(labels(sideA.children)).toEqual(['Cutlap A', 'Main Split 1', 'Main Split 2']);
    expect(sideA.children[1].key).toEqual(['a', 0]);
    expect(labels(sideA.children[0].children)).toEqual(['Cutlap split 1', 'Cutlap split 2']);
    expect(sideA.children[0].children[0].key).toEqual(['a', 'cutlap', 0]);

    expect(labels(tree[3].children)).toEqual(['Main Split 1']);
  });

  it('solo muestra "All" si no hay piezas', () => {
    expect(labels(buildPiecesTree([]))).toEqual(['All']);
  });
});

describe('classifyPiece', () => {
  it.each([
    [null, 'none'],
    [['all'], 'group'],
    [['stringer'], 'stringer'],
    [['a'], 'group'],
    [['a', 'cutlap'], 'group'],
    [['a', 'cutlap', 2], 'cutlap_piece'],
    [['a', 3], 'core'],
  ])('%j → %s', (key, category) => {
    expect(classifyPiece(key)).toBe(category);
  });
});

describe('matchesSelection', () => {
  it('"All" selecciona todo y un grupo selecciona sus descendientes', () => {
    expect(matchesSelection(['all'], ['b', 0])).toBe(true);
    expect(matchesSelection(['a'], ['a', 'cutlap', 1])).toBe(true);
    expect(matchesSelection(['a', 'cutlap'], ['a', 0])).toBe(false);
    expect(matchesSelection(['b'], ['a', 0])).toBe(false);
  });
});

describe('pieceColor', () => {
  it('usa los colores de viewer.py por tipo de pieza', () => {
    expect(pieceColor(['stringer'])).toBe(STRINGER_COLOR);
    expect(pieceColor(['a', 'cutlap', 0])).toBe(CUTLAP_COLOR);
    expect(pieceColor(['a', 0])).toBe(BOARD_COLOR);
  });
});
