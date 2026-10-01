import { DONATION_SCENE_COLORS } from '../config';
import { GULL_WINGS_DOWN, GULL_WINGS_UP, riderOnBoard, SHARK_FIN, SUN } from './pixelSprites';
import splitterLogo from './splitterLogo';

/**
 * Escena de la ventana de bienvenida: el cielo, las olas y los personajes del banner
 * de donaciones, con el logotipo del programa flotando en el centro. Medidas en
 * píxeles del dibujo (1 unidad del viewBox).
 */
export default {
  widthPx: 160,
  heightPx: 56,
  // Mismo periodo que el banner: comparten la animación de las olas (styles.css).
  wavePeriodPx: 20,
  skyBands: DONATION_SCENE_COLORS.sky.map((color, index) => ({
    fromRow: [0, 14, 26, 36][index],
    color,
  })),
  waves: {
    back: { baseRow: 41, amplitudeRows: 1, phasePx: 3, color: DONATION_SCENE_COLORS.waveBack },
    middle: { baseRow: 46, amplitudeRows: 2, phasePx: 11, color: DONATION_SCENE_COLORS.waveMiddle },
    front: { baseRow: 51, amplitudeRows: 1, phasePx: 6, color: DONATION_SCENE_COLORS.waveFront },
  },
  foamColor: DONATION_SCENE_COLORS.foam,
  sprites: {
    sun: { rows: SUN, x: 142, y: 3 },
    ...splitterLogo({ x: 48, y: 10 }),
    ...riderOnBoard({ x: 10, y: 43 }),
    sharkFin: { rows: SHARK_FIN, x: 116, y: 47 },
    gullWingsUp: { rows: GULL_WINGS_UP, x: 162, y: 7 },
    gullWingsDown: { rows: GULL_WINGS_DOWN, x: 162, y: 7 },
  },
};
