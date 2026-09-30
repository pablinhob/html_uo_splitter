import canonicalFrame from './boardFrame';
import { requireBoard } from './boardRequests';
import hollowPiece from './hollow';
import { keyId } from './pieces';

/**
 * Vaciado de una pieza del último split en el marco canónico de la tabla (Z =
 * grosor, como el thickness_axis que Python pasa aparte). Devuelve un Manifold
 * nuevo en el marco del STL; la pieza guardada no se toca.
 */
export default function hollowStoredPiece(wasm, store, key, hollowParams) {
  const { probe } = requireBoard(store, true);
  const stored = store.pieces().get(keyId(key));
  if (!stored) throw new Error(`Unknown piece ${keyId(key)}`);
  const frame = canonicalFrame(probe.axes);
  if (frame.isIdentity) return hollowPiece(wasm, stored.manifold, hollowParams);
  const canonical = stored.manifold.transform(frame.toCanonical);
  const hollowed = hollowPiece(wasm, canonical, hollowParams);
  canonical.delete();
  const world = hollowed.transform(frame.toWorld);
  hollowed.delete();
  return world;
}
