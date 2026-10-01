/**
 * Logotipo del programa en pixel art: una tabla vista desde arriba (tail a la
 * izquierda, nose a la derecha) cortada en polígonos y partida por el stringer en
 * sus dos mitades, Side A y Side B. Las letras son claves de DONATION_SPRITE_PALETTE.
 * La planta es la del fish Cobra de los ejemplos (rasterizada de Cobra.stl), con la
 * cola en swallow algo más marcada para que se lea a este tamaño.
 */

// Ancho del logo en píxeles del dibujo.
const LOGO_WIDTH_PX = 64;

// Contorno de media tabla: [primera, última] columna de cada fila, desde el canto
// exterior hasta la fila pegada al stringer. Las filas 6 y 7 son la oreja del
// swallow; desde la 8 empieza la muesca en V, que termina en el stringer.
const HALF_OUTLINE = [
  [24, 43],
  [16, 49],
  [11, 52],
  [7, 55],
  [4, 57],
  [1, 59],
  [0, 60],
  [0, 61],
  [4, 62],
];

// Columnas del stringer: empieza en el vértice de la muesca del swallow.
const STRINGER_SPAN = [8, 63];

// Separación de las líneas de corte en diagonal, que forman la rejilla de polígonos.
const CUT_SPACING_PX = 8;

const positiveModulo = (value, divisor) => ((value % divisor) + divisor) % divisor;

// La fila siguiente a la última de la media tabla es el stringer.
function isInside(row, col) {
  const span = row === HALF_OUTLINE.length ? STRINGER_SPAN : HALF_OUTLINE[row];
  return span !== undefined && col >= span[0] && col <= span[1];
}

// Píxel de media tabla: canto (R), línea de corte (F), fibra (W) o transparente.
function halfPixel(row, col) {
  if (!isInside(row, col)) {
    return ' ';
  }

  const [start, end] = HALF_OUTLINE[row];
  const isEdge = col === start || col === end || !isInside(row - 1, col) || !isInside(row + 1, col);
  if (isEdge) {
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

const stringerRow = () =>
  Array.from({ length: LOGO_WIDTH_PX }, (_, col) =>
    isInside(HALF_OUTLINE.length, col) ? 'N' : ' ',
  ).join('');

/**
 * Filas del logo colocado en (x, y): { sideA, stringer, sideB }, tres sprites para
 * que la animación pueda separar las mitades. Side B es Side A en espejo.
 */
export default function splitterLogo({ x, y }) {
  const sideA = halfRows();
  return {
    logoSideA: { rows: sideA, x, y },
    logoStringer: { rows: [stringerRow()], x, y: y + sideA.length },
    logoSideB: { rows: [...sideA].reverse(), x, y: y + sideA.length + 1 },
  };
}
