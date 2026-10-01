import scene from '../../Helpers/welcomeScene';
import PixelSky from '../Misc/PixelSky';
import PixelSprite from '../Misc/PixelSprite';
import PixelWave from '../Misc/PixelWave';

/**
 * Escena animada de la bienvenida: el logotipo (una tabla cortada en polígonos que
 * se abre por el stringer) flota sobre el mar del banner de donaciones.
 */
export default function WelcomeScene() {
  const { widthPx, heightPx, waves, sprites } = scene;
  return (
    <svg
      className="pixel-art welcome-art"
      viewBox={`0 0 ${widthPx} ${heightPx}`}
      shapeRendering="crispEdges"
      aria-hidden="true"
    >
      <PixelSky scene={scene} />
      <PixelSprite sprite={sprites.sun} />
      <g className="gull">
        <PixelSprite sprite={sprites.gullWingsUp} className="gull-wings-up" />
        <PixelSprite sprite={sprites.gullWingsDown} className="gull-wings-down" />
      </g>
      <g className="logo">
        <g className="logo-side-a">
          <PixelSprite sprite={sprites.logoSideA} />
        </g>
        <PixelSprite sprite={sprites.logoStringer} />
        <g className="logo-side-b">
          <PixelSprite sprite={sprites.logoSideB} />
        </g>
      </g>
      <PixelWave wave={waves.back} scene={scene} className="wave wave-back" />
      <PixelWave wave={waves.middle} scene={scene} className="wave wave-middle" />
      <g className="shark">
        <PixelSprite sprite={sprites.sharkFin} />
      </g>
      <g className="rider">
        <PixelSprite sprite={sprites.board} />
        <PixelSprite sprite={sprites.surfer} />
      </g>
      <PixelWave wave={waves.front} scene={scene} className="wave wave-front" />
    </svg>
  );
}
