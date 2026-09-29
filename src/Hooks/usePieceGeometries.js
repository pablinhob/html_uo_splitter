import { useEffect, useRef, useState } from 'react';
import { geometryFromMeshData, lineGeometryFromSegments } from '../Helpers/meshData';
import { keyId } from '../Helpers/pieces';

/**
 * Geometrías del visor para las piezas del split y sus contornos de corte.
 *   pieces:   [{ key, geometry }]
 *   outlines: [{ geometry, borders: [key, ...] }]
 * El hook es su dueño: libera las que sustituye y las que quedan al desmontar.
 */

const disposeAll = ({ pieces, outlines }) => {
  pieces.forEach(({ geometry }) => geometry.dispose());
  outlines.forEach(({ geometry }) => geometry.dispose());
};

const empty = { pieces: [], outlines: [] };

export default function usePieceGeometries() {
  const [state, setState] = useState(empty);
  const currentRef = useRef(empty);

  const commit = (next) => {
    currentRef.current = next;
    setState(next);
  };

  useEffect(() => () => disposeAll(currentRef.current), []);

  return {
    pieces: state.pieces,
    outlines: state.outlines,
    // Resultado de la petición `split` del Worker (meshData y segmentos).
    replaceAll({ pieces, cutOutlines }) {
      disposeAll(currentRef.current);
      commit({
        pieces: pieces.map(({ key, meshData }) => ({
          key,
          geometry: geometryFromMeshData(meshData),
        })),
        outlines: cutOutlines.map(({ segments, borders }) => ({
          geometry: lineGeometryFromSegments(segments),
          borders,
        })),
      });
    },
    // Sustituye la malla de una pieza (p. ej. por su versión vaciada).
    replacePiece(key, meshData) {
      const id = keyId(key);
      const { current } = currentRef;
      commit({
        ...current,
        pieces: current.pieces.map((piece) => {
          if (keyId(piece.key) !== id) return piece;
          piece.geometry.dispose();
          return { key: piece.key, geometry: geometryFromMeshData(meshData) };
        }),
      });
    },
    clear() {
      disposeAll(currentRef.current);
      commit(empty);
    },
  };
}
