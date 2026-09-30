import { DONATION_SCENE_COLORS } from '../config';
import { GULL_WINGS_DOWN, GULL_WINGS_UP, riderOnBoard, SHARK_FIN, SUN } from './pixelSprites';

/**
 * Escena en pixel art del banner de donaciones. Las medidas van en píxeles del
 * dibujo (1 unidad del viewBox). Los sprites están en pixelSprites.js.
 */

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
    ...riderOnBoard({ x: 66, y: 20 }),
    sharkFin: { rows: SHARK_FIN, x: 44, y: 23 },
    gullWingsUp: { rows: GULL_WINGS_UP, x: 112, y: 6 },
    gullWingsDown: { rows: GULL_WINGS_DOWN, x: 112, y: 6 },
  },
};
