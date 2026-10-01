import { useEffect, useRef } from 'react';
import { frameCamera, viewDirection } from '../../../Helpers/viewerCamera';
import {
  boxKey,
  buildCornerBrackets,
  buildObjectMeshes,
  disposeObject,
  framingBoxes,
} from '../../../Helpers/viewerScene';
import useThreeScene from '../../../Hooks/useThreeScene';
import useViewerPicking from '../../../Hooks/useViewerPicking';
import ViewerToolbar from './ViewerToolbar';

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
 * frame, de modo que actualizar los marcadores no mueve la vista. La barra del
 * gestor de cámara cambia de vista (encuadrando ese mismo bbox).
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
    state.visibleBox = visibleBox;
  }, [objects, sceneRef]);

  const onView = ({ viewId }) => {
    const state = sceneRef.current;
    if (!state?.visibleBox || state.visibleBox.isEmpty()) return;
    const { camera, controls, visibleBox } = state;
    frameCamera(camera, controls, visibleBox, viewDirection(viewId));
  };

  return (
    <div className="viewer" ref={containerRef}>
      <ViewerToolbar onView={onView} />
    </div>
  );
}
