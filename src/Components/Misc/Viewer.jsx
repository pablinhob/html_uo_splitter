import { useEffect, useRef } from 'react';
import {
  boxKey,
  buildCornerBrackets,
  buildObjectMeshes,
  disposeObject,
  frameCamera,
  framingBoxes,
} from '../../Helpers/viewerScene';
import useThreeScene from '../../Hooks/useThreeScene';
import useViewerPicking from '../../Hooks/useViewerPicking';

/**
 * Visor 3D (sustituye a MeshViewer de PyVista).
 *
 * objects: [{ key, geometry, color, opacity?, visible?, edges?, frame?, lines?, pickKey? }]
 *   - lines: la geometría son segmentos de línea (contornos de corte), no una malla.
 *   - edges: dibuja las aristas de corte (feature edges) en negro.
 *   - frame: cuenta para encuadrar la cámara y para las esquinas del bbox.
 *   - pickKey: la malla se resalta bajo el ratón y un clic llama a
 *     onObjectClick({ key: pickKey }).
 * La cámara se reencuadra cuando cambia el bbox de los objetos visibles con
 * frame, de modo que actualizar los marcadores no mueve la vista.
 */
export default function Viewer({ objects = [], onObjectClick = null }) {
  const containerRef = useRef(null);
  const sceneRef = useThreeScene(containerRef);
  useViewerPicking(sceneRef, onObjectClick);

  useEffect(() => {
    const state = sceneRef.current;
    if (!state) return;
    const { content, camera, controls } = state;

    disposeObject(content);
    content.clear();
    buildObjectMeshes(objects).forEach((mesh) => content.add(mesh));

    const { allBox, visibleBox } = framingBoxes(objects);
    if (!allBox.isEmpty()) content.add(buildCornerBrackets(allBox));

    const key = boxKey(visibleBox);
    if (key !== '' && key !== state.framedBox) frameCamera(camera, controls, visibleBox);
    state.framedBox = key;
  }, [objects, sceneRef]);

  return <div className="viewer" ref={containerRef} />;
}
