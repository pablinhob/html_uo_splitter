import { describe, expect, it } from 'vitest';
import { DONATION_SPRITE_PALETTE } from '../config';
import { spriteRects } from './pixelArt';
import splitterLogo from './splitterLogo';

describe('splitterLogo', () => {
  const logo = splitterLogo({ x: 10, y: 4 });

  it('apila Side A, el stringer y Side B sin huecos', () => {
    const { logoSideA, logoStringer, logoSideB } = logo;
    expect(logoStringer.y).toBe(logoSideA.y + logoSideA.rows.length);
    expect(logoSideB.y).toBe(logoStringer.y + 1);
    expect(logoSideB.x).toBe(logoSideA.x);
  });

  it('Side B es Side A en espejo y todas las filas miden lo mismo', () => {
    const { logoSideA, logoStringer, logoSideB } = logo;
    expect(logoSideB.rows).toEqual([...logoSideA.rows].reverse());
    const widths = [...logoSideA.rows, ...logoStringer.rows].map((row) => row.length);
    expect(new Set(widths).size).toBe(1);
  });

  it('tiene canto, fibra y líneas de corte con colores de la paleta', () => {
    const pixels = logo.logoSideA.rows.join('');
    ['R', 'W', 'F'].forEach((char) => expect(pixels).toContain(char));
    Object.values(logo).forEach(({ rows }) => {
      expect(() => spriteRects(rows, DONATION_SPRITE_PALETTE)).not.toThrow();
    });
  });
});
