/**
 * Estado del Worker de geometría entre peticiones: lo que no conviene reenviar.
 *   board:        { manifold, probe } de la tabla cargada. El Manifold es null si la
 *                 malla no se ha podido cerrar; la sonda existe siempre que haya tabla.
 *   pieces:       Map keyId → { key, manifold } con las piezas del último split, tal
 *                 como salieron del corte (sin vaciar), para vaciado y exportación.
 *   exportPieces: [{ key, manifold }] piezas finales de la última exportación
 *                 procesada (vaciadas, con plugs y soportes), listas para escribir.
 * Es dueño de todos esos objetos WASM: los libera al sustituirlos. Un cambio de
 * tabla invalida las piezas, y un split nuevo invalida la exportación.
 */
export default function createGeometryStore() {
  let board = { manifold: null, probe: null };
  let pieces = new Map();
  let exportPieces = [];

  const releaseExport = () => {
    exportPieces.forEach(({ manifold }) => manifold.delete());
    exportPieces = [];
  };
  const releasePieces = () => {
    releaseExport();
    pieces.forEach(({ manifold }) => manifold.delete());
    pieces = new Map();
  };
  const releaseBoard = () => {
    releasePieces();
    board.manifold?.delete();
    board.probe?.dispose();
    board = { manifold: null, probe: null };
  };

  return {
    board: () => board,
    setBoard(next) {
      releaseBoard();
      board = next;
    },
    pieces: () => pieces,
    setPieces(next) {
      releasePieces();
      pieces = next;
    },
    exportPieces: () => exportPieces,
    setExportPieces(next) {
      releaseExport();
      exportPieces = next;
    },
    dispose: releaseBoard,
  };
}
