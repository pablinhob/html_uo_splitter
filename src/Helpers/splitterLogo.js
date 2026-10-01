/**
 * Logotipo del programa en pixel art: una tabla vista desde arriba (tail a la
 * izquierda, nose a la derecha) cortada en polígonos y partida por el stringer en
 * sus dos mitades, Side A y Side B. Las letras son claves de DONATION_SPRITE_PALETTE.
 */

// Ancho del logo en píxeles del dibujo.
const LOGO_WIDTH_PX = 64;

// Contorno de media tabla: [primera, última] columna de cada fila, desde el canto
// exterior hasta la fila pegada al stringer.
const HALF_OUTLINE = [
  [12, 34],
  [6, 44],
  [3, 50],
  [2, 54],
  [1, 58],
  [0, 61],
  [0, 63],
  [0, 63],
];

// Separación de las líneas de corte en diagonal, que forman la rejilla de polígonos.
const CUT_SPACING_PX = 8;

const positiveModulo = (value, divisor) => ((value % divisor) + divisor) % divisor;

function isInside(row, col) {
  const span = HALF_OUTLINE[row];
  return span !== undefined && col >= span[0] && col <= span[1];
}

// Píxel de media tabla: canto (R), línea de corte (F), fibra (W) o transparente.
function halfPixel(row, col) {
  if (!isInside(row, col)) {
    return ' ';
  }

  const [start, end] = HALF_OUTLINE[row];
  if (col === start || col === end || !isInside(row - 1, col)) {
    return 'R';
  }

  const isCut =
    positiveModulo(col + row, CUT_SPACING_PX) === 0 ||
    positiveModulo(col - row, CUT_SPACING_PX) === 0;
  return isCut ? 'F' : 'W';
}

const halfRows = () =>
  HALF_OUTLINE.map((_, row) =>
    Array.from({ length: LOGO_WIDTH_PX }, (__, col) => halfPixel(row, col)).join(''),
  );

/**
 * Filas del logo colocado en (x, y): { sideA, stringer, sideB }, tres sprites para
 * que la animación pueda separar las mitades. Side B es Side A en espejo.
 */
export default function splitterLogo({ x, y }) {
  const sideA = halfRows();
  return {
    logoSideA: { rows: sideA, x, y },
    logoStringer: { rows: ['N'.repeat(LOGO_WIDTH_PX)], x, y: y + sideA.length },
    logoSideB: { rows: [...sideA].reverse(), x, y: y + sideA.length + 1 },
  };
}
