import { DONATION_URL } from '../../../config';
import scene from '../../../Helpers/donationScene';
import PixelSky from '../../Misc/PixelSky';
import PixelSprite from '../../Misc/PixelSprite';
import PixelWave from '../../Misc/PixelWave';

/**
 * Banner de donaciones en pixel art: sol con gafas, gaviota, un surfista que hace
 * equilibrios en su tabla y una aleta de tiburón que le sigue. Las animaciones van
 * a saltos de un píxel (styles.css).
 */
export default function DonationBanner() {
  const { widthPx, heightPx, waves, sprites } = scene;
  return (
    <section className="donation-banner" aria-label="Support UO Splitter">
      <svg
        className="pixel-art donation-art"
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
      <div className="donation-content">
        <p className="donation-text">Donations = wax, pizza &amp; shark insurance.</p>
        <a
          className="donation-button"
          href={DONATION_URL !== '' ? DONATION_URL : undefined}
          target="_blank"
          rel="noopener noreferrer"
        >
          ADOPT A SHAPER
        </a>
      </div>
    </section>
  );
}
