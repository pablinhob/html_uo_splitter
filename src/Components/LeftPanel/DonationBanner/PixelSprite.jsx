import { DONATION_SPRITE_PALETTE } from '../../../config';
import { spriteRects } from '../../../Helpers/pixelArt';

/**
 * Sprite de pixel art colocado en (x, y) del dibujo. El `transform` del grupo lo
 * posiciona, así que `className` solo admite animaciones que no muevan (opacidad);
 * para moverlo, se anima un grupo que lo envuelva.
 */
export default function PixelSprite({ sprite, className }) {
  const { rows, x, y } = sprite;
  return (
    <g className={className} transform={`translate(${x} ${y})`}>
      {spriteRects(rows, DONATION_SPRITE_PALETTE).map((rect) => (
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
