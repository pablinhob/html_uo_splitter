/**
 * Sprites de pixel art compartidos por el banner de donaciones y la cabecera. Cada
 * sprite es un array de filas; las letras son claves de DONATION_SPRITE_PALETTE
 * (config.js) y el espacio es transparente.
 */

// Tabla de perfil: nose con rocker a la derecha, tail a la izquierda con quillas.
export const SURFBOARD = [
  '                          WW',
  '                       WWWRR',
  'WWWWWWWWWWWWWWWWWWWWWWWWRR  ',
  ' RRRRRRRRRRRRRRRRRRRRRRR    ',
  '  FFF  F                    ',
  '  F                         ',
];

// Surfista con los brazos abiertos para no caerse, y gafas de sol, claro.
export const SURFER = [
  '    HHH    ',
  '   HHHHH   ',
  '   HSKKK   ',
  '   SSSSS   ',
  '    SSS    ',
  'S  TTTTT  S',
  ' SSTTTTTSS ',
  '   TTTTT   ',
  '   BBBBB   ',
  '   BB BB   ',
  '  SS   SS  ',
  ' SS     SS ',
];

// Sol con gafas de sol ("deal with it").
export const SUN = [
  '    YYYY    ',
  '  YYYYYYYY  ',
  ' YYYYYYYYYY ',
  ' YYYYYYYYYY ',
  'YKKKKKKKKKKY',
  'YKLKKYYKLKKY',
  'YYKKYYYYKKYY',
  'YYYYYYYYYYYY',
  ' YOYYYYYYOY ',
  ' YYOOOOOOYY ',
  '  YYYYYYYY  ',
  '    YYYY    ',
];

// Aleta de tiburón que nada hacia la tabla (la punta mira atrás).
// prettier-ignore
export const SHARK_FIN = [
  'G     ',
  ' GG   ',
  ' GGG  ',
  ' GGGG ',
  'GGGGGG',
];

// Gaviota en dos fotogramas: alas arriba y alas abajo.
// prettier-ignore
export const GULL_WINGS_UP = [
  'D   D',
  ' D D ',
  '  D  ',
];

// prettier-ignore
export const GULL_WINGS_DOWN = [
  '     ',
  ' DDD ',
  'D   D',
];

// Fila de la tabla sobre la que se apoyan los pies del surfista (la cubierta).
const SURFBOARD_DECK_ROW = 2;

// Desplazamiento del surfista sobre la tabla: de pie hacia el centro, no en el tail.
const SURFER_OFFSET_ON_BOARD_PX = 9;

/**
 * Tabla colocada en (x, y) y el surfista de pie sobre su cubierta. Devuelve los dos
 * sprites ya posicionados: { board, surfer }.
 */
export function riderOnBoard({ x, y }) {
  return {
    board: { rows: SURFBOARD, x, y },
    surfer: {
      rows: SURFER,
      x: x + SURFER_OFFSET_ON_BOARD_PX,
      y: y + SURFBOARD_DECK_ROW - SURFER.length,
    },
  };
}
