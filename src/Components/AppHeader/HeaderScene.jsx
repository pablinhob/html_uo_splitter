import scene from '../../Helpers/headerScene';
import PixelSprite from '../Misc/PixelSprite';
import PixelWave from '../Misc/PixelWave';

/**
 * Fondo de pixel art del extremo derecho de la cabecera: dos olas oscuras que la
 * llenan de arriba abajo y la aleta de tiburón entre ellas. Se funde con el negro
 * por la izquierda (styles.css).
 */
export default function HeaderScene() {
  const { widthPx, heightPx, waves, sprites } = scene;
  return (
    <svg
      className="pixel-art header-scene"
      viewBox={`0 0 ${widthPx} ${heightPx}`}
      shapeRendering="crispEdges"
      aria-hidden="true"
    >
      <PixelWave wave={waves.back} scene={scene} className="wave wave-back" />
      <g className="shark">
        <PixelSprite sprite={sprites.sharkFin} palette={scene.palette} />
      </g>
      <PixelWave wave={waves.front} scene={scene} className="wave wave-front" />
    </svg>
  );
}
