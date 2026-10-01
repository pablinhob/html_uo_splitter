import { describe, expect, it } from 'vitest';
import { BOARD_COLOR, CUTLAP_COLOR, STRINGER_COLOR } from '../config';
import {
  ALL_KEY,
  buildPiecesSections,
  buildPiecesTree,
  classifyPiece,
  isAllSelected,
  matchesSelection,
  pieceColor,
  pieceLabel,
} from './pieces';

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

describe('buildPiecesSections', () => {
  it('separa All, stringer, cutlaps por mitad y piezas vaciables', () => {
    const sections = buildPiecesSections(pieceKeys);
    expect(sections.all.key).toEqual(ALL_KEY);
    expect(labels(sections.singles)).toEqual(['Stringer']);

    expect(labels(sections.cutlapSides)).toEqual(['Side A']);
    expect(sections.cutlapSides[0].key).toEqual(['a', 'cutlap']);
    expect(labels(sections.cutlapSides[0].children)).toEqual(['Cutlap split 1', 'Cutlap split 2']);

    expect(labels(sections.hollowableSides)).toEqual(['Side A', 'Side B']);
    expect(sections.hollowableSides[0].isSelectable).toBe(false);
    expect(labels(sections.hollowableSides[0].children)).toEqual(['Main Split 1', 'Main Split 2']);
    expect(sections.hollowableSides[1].children[0].key).toEqual(['b', 0]);
  });

  it('deja las secciones vacías si no hay piezas', () => {
    const sections = buildPiecesSections([]);
    expect(sections.singles).toEqual([]);
    expect(sections.cutlapSides).toEqual([]);
    expect(sections.hollowableSides).toEqual([]);
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

describe('isAllSelected', () => {
  it('solo es cierto con la selección "all"', () => {
    expect(isAllSelected(ALL_KEY)).toBe(true);
    expect(isAllSelected(null)).toBe(false);
    expect(isAllSelected(['a'])).toBe(false);
    expect(isAllSelected(['a', 3])).toBe(false);
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

describe('pieceLabel', () => {
  it('da la etiqueta del árbol, la misma que al pinchar en la lista', () => {
    const tree = buildPiecesTree(pieceKeys);
    const side = tree.find((node) => node.label === 'Side A');
    const [firstSplit] = side.children.filter((node) => node.children.length === 0);
    expect(pieceLabel(pieceKeys, firstSplit.key)).toBe(firstSplit.label);
    expect(pieceLabel(pieceKeys, ['stringer'])).toBe('Stringer');
    expect(pieceLabel(pieceKeys, ['z', 9])).toBe('z|9');
  });
});
