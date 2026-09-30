import { waveRects } from '../../Helpers/pixelArt';

// Ola pixelada con espuma en las crestas; `className` lleva su animación de deriva.
export default function PixelWave({ wave, scene, className }) {
  const { widthPx, heightPx, wavePeriodPx, foamColor } = scene;
  const { body, crests } = waveRects({ ...wave, widthPx, heightPx, periodPx: wavePeriodPx });
  return (
    <g className={className}>
      {body.map((rect) => (
        <rect
          key={rect.x}
          x={rect.x}
          y={rect.y}
          width={rect.width}
          height={rect.height}
          fill={wave.color}
        />
      ))}
      {crests.map((rect) => (
        <rect
          key={`crest-${rect.x}`}
          x={rect.x}
          y={rect.y}
          width={rect.width}
          height={rect.height}
          fill={foamColor}
        />
      ))}
    </g>
  );
}
