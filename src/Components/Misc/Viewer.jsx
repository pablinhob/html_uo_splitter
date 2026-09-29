import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
import {
  BOUNDING_BOX_EDGE_COLOR,
  SPLIT_EDGE_COLOR,
  VIEWER_BACKGROUND_COLOR,
} from '../../config'

const CORNER_BRACKET_FRACTION = 0.12
const FEATURE_EDGE_ANGLE_DEG = 30

// Esquinas del bounding box: tres "brazos" por esquina, como en viewer.py.
function buildCornerBrackets(box) {
  const { min, max } = box
  const arm = box.getSize(new THREE.Vector3()).multiplyScalar(CORNER_BRACKET_FRACTION)
  const points = []
  for (const [x, sx] of [[min.x, 1], [max.x, -1]]) {
    for (const [y, sy] of [[min.y, 1], [max.y, -1]]) {
      for (const [z, sz] of [[min.z, 1], [max.z, -1]]) {
        const corner = new THREE.Vector3(x, y, z)
        points.push(corner, corner.clone().add(new THREE.Vector3(sx * arm.x, 0, 0)))
        points.push(corner, corner.clone().add(new THREE.Vector3(0, sy * arm.y, 0)))
        points.push(corner, corner.clone().add(new THREE.Vector3(0, 0, sz * arm.z)))
      }
    }
  }
  return new THREE.LineSegments(
    new THREE.BufferGeometry().setFromPoints(points),
    new THREE.LineBasicMaterial({ color: BOUNDING_BOX_EDGE_COLOR }),
  )
}

function disposeObject(object) {
  object.traverse((child) => {
    // Las geometrías de las mallas pertenecen al llamante; solo se liberan las
    // que crea el visor (aristas y esquinas).
    if (child.userData.ownsGeometry) child.geometry?.dispose()
    child.material?.dispose()
  })
}

function boxKey(box) {
  return box.isEmpty() ? '' : [...box.min.toArray(), ...box.max.toArray()].join(',')
}

/**
 * Visor 3D (sustituye a MeshViewer de PyVista).
 *
 * objects: [{ key, geometry, color, opacity?, visible?, edges?, frame? }]
 *   - edges: dibuja las aristas de corte (feature edges) en negro.
 *   - frame: cuenta para encuadrar la cámara y para las esquinas del bbox.
 * La cámara se reencuadra cuando cambia el bbox de los objetos visibles con
 * frame, de modo que actualizar los marcadores no mueve la vista.
 */
export default function Viewer({ objects = [] }) {
  const containerRef = useRef(null)
  const stateRef = useRef(null)

  useEffect(() => {
    const container = containerRef.current
    const renderer = new THREE.WebGLRenderer({ antialias: true })
    renderer.setPixelRatio(window.devicePixelRatio)
    container.appendChild(renderer.domElement)

    const scene = new THREE.Scene()
    scene.background = new THREE.Color(VIEWER_BACKGROUND_COLOR)
    scene.add(new THREE.HemisphereLight(0xffffff, 0x444444, 1.2))

    const camera = new THREE.PerspectiveCamera(30, 1, 1, 100000)
    camera.up.set(0, 0, 1)
    camera.position.set(1, 1, 1)
    const headlight = new THREE.DirectionalLight(0xffffff, 1.8)
    camera.add(headlight)
    scene.add(camera)

    const controls = new OrbitControls(camera, renderer.domElement)
    controls.enableDamping = true

    const content = new THREE.Group()
    scene.add(content)

    const resize = () => {
      const { clientWidth, clientHeight } = container
      if (!clientWidth || !clientHeight) return
      renderer.setSize(clientWidth, clientHeight)
      camera.aspect = clientWidth / clientHeight
      camera.updateProjectionMatrix()
    }
    const observer = new ResizeObserver(resize)
    observer.observe(container)
    resize()

    renderer.setAnimationLoop(() => {
      controls.update()
      renderer.render(scene, camera)
    })

    stateRef.current = { scene, camera, controls, content, framedBox: '' }

    return () => {
      renderer.setAnimationLoop(null)
      observer.disconnect()
      controls.dispose()
      disposeObject(content)
      renderer.dispose()
      container.removeChild(renderer.domElement)
      stateRef.current = null
    }
  }, [])

  useEffect(() => {
    const state = stateRef.current
    if (!state) return
    const { content, camera, controls } = state

    disposeObject(content)
    content.clear()

    const allBox = new THREE.Box3()
    const visibleBox = new THREE.Box3()
    for (const object of objects) {
      const opacity = object.opacity ?? 1
      const mesh = new THREE.Mesh(
        object.geometry,
        new THREE.MeshPhongMaterial({
          color: object.color,
          transparent: opacity < 1,
          opacity,
          depthWrite: opacity >= 1,
          side: THREE.DoubleSide,
        }),
      )
      mesh.visible = object.visible ?? true
      content.add(mesh)

      if (object.edges) {
        const edges = new THREE.LineSegments(
          new THREE.EdgesGeometry(object.geometry, FEATURE_EDGE_ANGLE_DEG),
          new THREE.LineBasicMaterial({ color: SPLIT_EDGE_COLOR }),
        )
        edges.userData.ownsGeometry = true
        edges.visible = mesh.visible
        content.add(edges)
      }

      if (object.frame) {
        if (!object.geometry.boundingBox) object.geometry.computeBoundingBox()
        allBox.union(object.geometry.boundingBox)
        if (mesh.visible) visibleBox.union(object.geometry.boundingBox)
      }
    }

    if (!allBox.isEmpty()) {
      const brackets = buildCornerBrackets(allBox)
      brackets.userData.ownsGeometry = true
      content.add(brackets)
    }

    // reset_camera(): vista isométrica que encuadra los objetos visibles.
    const key = boxKey(visibleBox)
    if (key && key !== state.framedBox) {
      const center = visibleBox.getCenter(new THREE.Vector3())
      const radius = visibleBox.getBoundingSphere(new THREE.Sphere()).radius
      const distance = radius / Math.sin(THREE.MathUtils.degToRad(camera.fov / 2))
      const direction = new THREE.Vector3(1, 1, 1).normalize()
      camera.position.copy(center).addScaledVector(direction, distance)
      camera.near = distance / 100
      camera.far = distance * 100
      camera.updateProjectionMatrix()
      controls.target.copy(center)
      controls.update()
    }
    state.framedBox = key
  }, [objects])

  return <div className="viewer" ref={containerRef} />
}
