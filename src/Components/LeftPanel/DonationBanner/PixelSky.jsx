import { bandRects } from '../../../Helpers/pixelArt';

// Cielo por franjas con tramado entre ellas.
export default function PixelSky({ scene }) {
  const { skyBands, widthPx, heightPx } = scene;
  return (
    <g>
      {bandRects({ bands: skyBands, widthPx, heightPx }).map((rect) => (
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
