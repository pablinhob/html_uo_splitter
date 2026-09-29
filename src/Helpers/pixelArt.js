/**
 * Pixel art en SVG: una unidad del viewBox es un píxel del dibujo. Las funciones
 * devuelven rectángulos { x, y, width, height, color } listos para pintar.
 */

// Tramos seguidos del mismo carácter en una fila de un sprite (' ' es transparente).
function rowRuns(row) {
  const chars = Array.from(row);
  const starts = chars
    .map((char, x) => ({ char, x }))
    .filter(({ char, x }) => char !== ' ' && char !== chars[x - 1]);
  return starts.map(({ char, x }) => {
    const next = chars.findIndex((other, index) => index > x && other !== char);
    return { char, x, width: (next === -1 ? chars.length : next) - x };
  });
}

/**
 * Convierte un sprite (array de filas de caracteres) en rectángulos. Cada carácter
 * es una clave de `palette`; los píxeles seguidos del mismo color se unen.
 */
export function spriteRects(rows, palette) {
  return rows.flatMap((row, y) =>
    rowRuns(row).map(({ char, x, width }) => {
      if (!Object.hasOwn(palette, char)) {
        throw new Error(`Unknown pixel color '${char}' in sprite row ${y}`);
      }
      return { x, y, width, height: 1, color: palette[char] };
    }),
  );
}

/**
 * Cielo por franjas horizontales ({ fromRow, color }, de arriba abajo). En la
 * última fila de cada franja, un píxel de cada dos toma el color de la siguiente
 * (tramado en damero, típico del pixel art).
 */
export function bandRects({ bands, widthPx, heightPx }) {
  const solid = bands.map(({ fromRow, color }, index) => ({
    x: 0,
    y: fromRow,
    width: widthPx,
    height: (bands[index + 1]?.fromRow ?? heightPx) - fromRow,
    color,
  }));
  const dither = bands.slice(1).flatMap(({ fromRow, color }) =>
    Array.from({ length: Math.ceil(widthPx / 2) }, (_, step) => ({
      x: step * 2 + (fromRow % 2),
      y: fromRow - 1,
      width: 1,
      height: 1,
      color,
    })),
  );
  return [...solid, ...dither];
}

/**
 * Ola sinusoidal pixelada que llega hasta el fondo (heightPx). Cubre widthPx más
 * un periodo, para que al desplazarla un periodo entero el bucle no tenga costura.
 * Devuelve { body, crests }: el cuerpo en columnas y la fila de espuma de las crestas.
 */
export function waveRects({ widthPx, heightPx, periodPx, baseRow, amplitudeRows, phasePx }) {
  const tops = Array.from({ length: widthPx + periodPx }, (_, x) => {
    const angle = (2 * Math.PI * ((x + phasePx) % periodPx)) / periodPx;
    return baseRow - Math.round(amplitudeRows * Math.sin(angle));
  });
  const body = tops
    .map((top, x) => ({ top, x }))
    .filter(({ top, x }) => top !== tops[x - 1])
    .map(({ top, x }) => {
      const next = tops.findIndex((other, index) => index > x && other !== top);
      const width = (next === -1 ? tops.length : next) - x;
      return { x, y: top, width, height: heightPx - top };
    });
  const crestRow = Math.min(...tops);
  const crests = body.filter(({ y }) => y === crestRow).map((rect) => ({ ...rect, height: 1 }));
  return { body, crests };
}
