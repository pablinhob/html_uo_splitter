import { DONATION_SPRITE_PALETTE } from '../../config';
import { spriteRects } from '../../Helpers/pixelArt';

/**
 * Sprite de pixel art colocado en (x, y) del dibujo. El `transform` del grupo lo
 * posiciona, así que `className` solo admite animaciones que no muevan (opacidad);
 * para moverlo, se anima un grupo que lo envuelva. `palette` permite recolorear el
 * sprite (por defecto, la paleta del banner de donaciones).
 */
export default function PixelSprite({ sprite, className, palette = DONATION_SPRITE_PALETTE }) {
  const { rows, x, y } = sprite;
  return (
    <g className={className} transform={`translate(${x} ${y})`}>
      {spriteRects(rows, palette).map((rect) => (
        <rect
          key={`${rect.x}-${rect.y}`}
          x={rect.x}
          y={rect.y}
          width={rect.width}
          height={rect.height}
          fill={rect.color}
        />
      ))}
    </g>
  );
}
