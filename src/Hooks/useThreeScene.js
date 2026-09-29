import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import {
  VIEWER_BACKGROUND_COLOR,
  VIEWER_FOV_DEG,
  VIEWER_HEADLIGHT_INTENSITY,
  VIEWER_SKY_LIGHT,
} from '../config';
import { disposeObject } from '../Helpers/viewerScene';

function createScene() {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(VIEWER_BACKGROUND_COLOR);
  const { skyColor, groundColor, intensity } = VIEWER_SKY_LIGHT;
  scene.add(new THREE.HemisphereLight(skyColor, groundColor, intensity));

  // Z arriba, como en PyVista. La luz va pegada a la cámara.
  const camera = new THREE.PerspectiveCamera(VIEWER_FOV_DEG);
  camera.up.set(0, 0, 1);
  camera.add(new THREE.DirectionalLight(0xffffff, VIEWER_HEADLIGHT_INTENSITY));
  scene.add(camera);

  const content = new THREE.Group();
  scene.add(content);
  return { scene, camera, content };
}

/**
 * Crea el renderer de three.js dentro del contenedor y lo mantiene vivo mientras
 * el componente esté montado. Devuelve una ref con { camera, controls, content }:
 * `content` es el grupo donde el visor coloca sus objetos.
 */
export default function useThreeScene(containerRef) {
  const sceneRef = useRef(null);

  useEffect(() => {
    const container = containerRef.current;
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    container.appendChild(renderer.domElement);

    const { scene, camera, content } = createScene();
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;

    const resize = () => {
      const { clientWidth, clientHeight } = container;
      if (clientWidth === 0 || clientHeight === 0) return;
      renderer.setSize(clientWidth, clientHeight);
      camera.aspect = clientWidth / clientHeight;
      camera.updateProjectionMatrix();
    };
    const observer = new ResizeObserver(resize);
    observer.observe(container);
    resize();

    renderer.setAnimationLoop(() => {
      controls.update();
      renderer.render(scene, camera);
    });
    sceneRef.current = { camera, controls, content, framedBox: '' };

    return () => {
      renderer.setAnimationLoop(null);
      observer.disconnect();
      controls.dispose();
      disposeObject(content);
      renderer.dispose();
      container.removeChild(renderer.domElement);
      sceneRef.current = null;
    };
  }, [containerRef]);

  return sceneRef;
}
