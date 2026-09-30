import { describe, expect, it } from 'vitest';
import { DONATION_SPRITE_PALETTE } from '../config';
import donationScene from './donationScene';
import headerScene from './headerScene';
import { bandRects, spriteRects, waveRects } from './pixelArt';

describe('spriteRects', () => {
  it('une los píxeles seguidos del mismo color y salta los transparentes', () => {
    const palette = { A: '#aa0000', B: '#00bb00' };
    expect(spriteRects(['AAB A', ' BB  '], palette)).toEqual([
      { x: 0, y: 0, width: 2, height: 1, color: '#aa0000' },
      { x: 2, y: 0, width: 1, height: 1, color: '#00bb00' },
      { x: 4, y: 0, width: 1, height: 1, color: '#aa0000' },
      { x: 1, y: 1, width: 2, height: 1, color: '#00bb00' },
    ]);
  });

  it('avisa de un color que no está en la paleta', () => {
    expect(() => spriteRects(['AZ'], { A: '#000000' })).toThrow("Unknown pixel color 'Z'");
  });
});

describe('bandRects', () => {
  it('pinta cada franja entera y trama en damero la fila anterior a cada cambio', () => {
    const rects = bandRects({
      bands: [
        { fromRow: 0, color: 'top' },
        { fromRow: 3, color: 'bottom' },
      ],
      widthPx: 6,
      heightPx: 5,
    });
    expect(rects.slice(0, 2)).toEqual([
      { x: 0, y: 0, width: 6, height: 3, color: 'top' },
      { x: 0, y: 3, width: 6, height: 2, color: 'bottom' },
    ]);
    expect(rects.slice(2).map(({ x, y }) => [x, y])).toEqual([
      [1, 2],
      [3, 2],
      [5, 2],
    ]);
  });
});

describe('waveRects', () => {
  const wave = {
    widthPx: 30,
    heightPx: 12,
    periodPx: 10,
    baseRow: 6,
    amplitudeRows: 2,
    phasePx: 3,
  };
  const { body, crests } = waveRects(wave);
  const topAt = (x) => body.findLast((rect) => rect.x <= x).y;

  it('cubre el ancho más un periodo, en columnas que llegan hasta el fondo', () => {
    const last = body.at(-1);
    expect(body[0].x).toBe(0);
    expect(last.x + last.width).toBe(wave.widthPx + wave.periodPx);
    body.forEach((rect) => expect(rect.y + rect.height).toBe(wave.heightPx));
  });

  it('se repite exactamente cada periodo, para que el bucle no tenga costura', () => {
    Array.from({ length: wave.widthPx }, (_, x) => x).forEach((x) =>
      expect(topAt(x + wave.periodPx)).toBe(topAt(x)),
    );
  });

  it('pone espuma de un píxel solo en las crestas', () => {
    expect(crests.length).toBeGreaterThan(0);
    crests.forEach((crest) => {
      expect(crest.y).toBe(wave.baseRow - wave.amplitudeRows);
      expect(crest.height).toBe(1);
    });
  });
});

describe.each([
  { name: 'banner de donaciones', scene: donationScene },
  { name: 'cabecera', scene: headerScene },
])('escena de pixel art: $name', ({ scene }) => {
  it('cada sprite es rectangular, usa colores de la paleta y cabe en la escena', () => {
    Object.values(scene.sprites).forEach(({ rows, y }) => {
      rows.forEach((row) => expect(row).toHaveLength(rows[0].length));
      expect(() => spriteRects(rows, DONATION_SPRITE_PALETTE)).not.toThrow();
      expect(y).toBeGreaterThanOrEqual(0);
      expect(y + rows.length).toBeLessThanOrEqual(scene.heightPx);
    });
  });

  it('las olas usan el periodo de 20 px de la animación (styles.css)', () => {
    expect(scene.wavePeriodPx).toBe(20);
  });
});

describe('escena del banner de donaciones', () => {
  it('el surfista pisa la cubierta de la tabla', () => {
    const { board, surfer } = donationScene.sprites;
    const deckRow = board.rows.findIndex((row) => row.startsWith('W'));
    expect(surfer.y + surfer.rows.length).toBe(board.y + deckRow);
  });
});
