import { DONATION_SCENE_COLORS } from '../config';

/**
 * Escena en pixel art del banner de donaciones. Las medidas van en píxeles del
 * dibujo (1 unidad del viewBox); las letras de los sprites son claves de
 * DONATION_SPRITE_PALETTE (config.js) y el espacio es transparente.
 */

// Tabla de perfil: nose con rocker a la derecha, tail a la izquierda con quillas.
const SURFBOARD = [
  '                          WW',
  '                       WWWRR',
  'WWWWWWWWWWWWWWWWWWWWWWWWRR  ',
  ' RRRRRRRRRRRRRRRRRRRRRRR    ',
  '  FFF  F                    ',
  '  F                         ',
];

// Surfista con los brazos abiertos para no caerse, y gafas de sol, claro.
const SURFER = [
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
const SUN = [
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
const SHARK_FIN = [
  'G     ',
  ' GG   ',
  ' GGG  ',
  ' GGGG ',
  'GGGGGG',
];

// Gaviota en dos fotogramas: alas arriba y alas abajo.
// prettier-ignore
const GULL_WINGS_UP = [
  'D   D',
  ' D D ',
  '  D  ',
];

// prettier-ignore
const GULL_WINGS_DOWN = [
  '     ',
  ' DDD ',
  'D   D',
];

const BOARD_POSITION = { x: 66, y: 20 };

// El surfista pisa la cubierta (fila 2 de la tabla).
const SURFER_POSITION = {
  x: BOARD_POSITION.x + 9,
  y: BOARD_POSITION.y + 2 - SURFER.length,
};

export default {
  widthPx: 110,
  heightPx: 32,
  // Periodo común de las olas: la animación las desplaza exactamente esto (styles.css).
  wavePeriodPx: 20,
  skyBands: DONATION_SCENE_COLORS.sky.map((color, index) => ({
    fromRow: [0, 7, 13, 18][index],
    color,
  })),
  waves: {
    back: { baseRow: 20, amplitudeRows: 1, phasePx: 0, color: DONATION_SCENE_COLORS.waveBack },
    middle: { baseRow: 24, amplitudeRows: 2, phasePx: 7, color: DONATION_SCENE_COLORS.waveMiddle },
    front: { baseRow: 28, amplitudeRows: 1, phasePx: 13, color: DONATION_SCENE_COLORS.waveFront },
  },
  foamColor: DONATION_SCENE_COLORS.foam,
  sprites: {
    sun: { rows: SUN, x: 95, y: 2 },
    board: { rows: SURFBOARD, ...BOARD_POSITION },
    surfer: { rows: SURFER, ...SURFER_POSITION },
    sharkFin: { rows: SHARK_FIN, x: 44, y: 23 },
    gullWingsUp: { rows: GULL_WINGS_UP, x: 112, y: 6 },
    gullWingsDown: { rows: GULL_WINGS_DOWN, x: 112, y: 6 },
  },
};
