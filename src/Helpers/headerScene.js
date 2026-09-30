import { DONATION_SPRITE_PALETTE, HEADER_SCENE_COLORS } from '../config';
import { SHARK_FIN } from './pixelSprites';

/**
 * Fondo en pixel art del extremo derecho de la cabecera, detrás de la ruta de la
 * app: las olas del banner de donaciones en tonos oscuros, de arriba abajo, y la
 * aleta de tiburón entre ellas. Medidas en píxeles del dibujo (2 px en pantalla).
 */
export default {
  widthPx: 190,
  heightPx: 20,
  // Mismo periodo que el banner: comparten la animación de las olas (styles.css).
  wavePeriodPx: 20,
  waves: {
    back: { baseRow: 4, amplitudeRows: 1.5, phasePx: 4, color: HEADER_SCENE_COLORS.waveBack },
    front: { baseRow: 11, amplitudeRows: 1.5, phasePx: 13, color: HEADER_SCENE_COLORS.waveFront },
  },
  foamColor: HEADER_SCENE_COLORS.foam,
  sprites: {
    sharkFin: { rows: SHARK_FIN, x: 36, y: 6 },
  },
  palette: { ...DONATION_SPRITE_PALETTE, G: HEADER_SCENE_COLORS.sharkFin },
};
