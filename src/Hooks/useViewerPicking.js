import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { PICK_CLICK_TOLERANCE_PX } from '../config';
import { pickedMesh, setMeshHighlight } from '../Helpers/viewerScene';

// Rayo de la cámara que pasa por el puntero, en coordenadas normalizadas del lienzo.
function pointerRay(event, canvas, camera) {
  const rect = canvas.getBoundingClientRect();
  const pointer = new THREE.Vector2(
    ((event.clientX - rect.left) / rect.width) * 2 - 1,
    -((event.clientY - rect.top) / rect.height) * 2 + 1,
  );
  const raycaster = new THREE.Raycaster();
  raycaster.setFromCamera(pointer, camera);
  return raycaster.ray;
}

// Registra los listeners en el lienzo y devuelve la función que los quita.
function addListeners(canvas, listeners) {
  const entries = Object.entries(listeners);
  entries.forEach(([type, listener]) => canvas.addEventListener(type, listener));
  return () => entries.forEach(([type, listener]) => canvas.removeEventListener(type, listener));
}

/**
 * Selección de piezas pinchando en el visor. La pieza seleccionable bajo el ratón
 * se tiñe y el cursor pasa a mano; un clic sin arrastre (arrastrar gira la cámara)
 * llama a onPick({ key }) con su `pickKey`. Sin onPick no hace nada.
 * sceneRef: la de useThreeScene ({ canvas, camera, content }).
 */
export default function useViewerPicking(sceneRef, onPick) {
  const onPickRef = useRef(onPick);

  useEffect(() => {
    onPickRef.current = onPick;
  }, [onPick]);

  useEffect(() => {
    const state = sceneRef.current;
    if (!state) return undefined;
    const { canvas, camera, content } = state;
    let hovered = null;
    let pressedAt = null;
    let frame = 0;

    const meshAt = (event) => pickedMesh(pointerRay(event, canvas, camera), content);
    const setHovered = (mesh) => {
      if (mesh === hovered) return;
      if (hovered) setMeshHighlight(hovered, false);
      hovered = mesh;
      if (mesh) setMeshHighlight(mesh, true);
      canvas.style.cursor = mesh ? 'pointer' : '';
    };

    // Con el ratón pulsado se está girando la cámara: no se resalta nada.
    const onMove = (event) => {
      cancelAnimationFrame(frame);
      const isIdle = event.buttons === 0 && onPickRef.current;
      frame = requestAnimationFrame(() => setHovered(isIdle ? meshAt(event) : null));
    };
    const onDown = (event) => {
      pressedAt = { x: event.clientX, y: event.clientY };
    };
    const onUp = (event) => {
      const start = pressedAt;
      pressedAt = null;
      if (!start || !onPickRef.current) return;
      const movedPx = Math.hypot(event.clientX - start.x, event.clientY - start.y);
      const mesh = movedPx <= PICK_CLICK_TOLERANCE_PX ? meshAt(event) : null;
      if (!mesh) return;
      setHovered(null);
      onPickRef.current({ key: mesh.userData.pickKey });
    };

    const removeListeners = addListeners(canvas, {
      pointermove: onMove,
      pointerdown: onDown,
      pointerup: onUp,
      pointerleave: () => setHovered(null),
    });
    return () => {
      cancelAnimationFrame(frame);
      removeListeners();
    };
  }, [sceneRef]);
}
