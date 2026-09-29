# Plan de migración

Migración de `_legacy/ulaola_surfboard_splitter/` (Python: PySide6 + PyVista + trimesh +
shapely + manifold3d + pymeshfix) a la web (Vite + React + three.js).

Cada paso termina con la app funcionando y se valida antes de pasar al siguiente.
Las normas de [CLAUDE.md](CLAUDE.md) aplican a todos los pasos.

| #   | Paso                                                             | Estado                        |
| --- | ---------------------------------------------------------------- | ----------------------------- |
| 0   | Interfaz y estructura de carpetas                                | ✅ Hecho                      |
| 1   | Base de calidad: linter, formato, tests y adaptación del código  | ✅ Hecho                      |
| 2   | Motor geométrico: manifold-3d, Web Worker y reparación de mallas | ⏳ Falta la referencia Python |
| 3   | Ejes de la tabla y lectura de superficie                         | ⏳ Falta la referencia Python |
| 4   | Plugs: cavidades, soportes y marcadores                          | Pendiente                     |
| 5   | Split: stringer, cutlap y rejilla de polígonos                   | Pendiente                     |
| 6   | Vaciado de piezas y previsualización                             | Pendiente                     |
| 7   | Exportación OBJ / 3MF                                            | Pendiente                     |
| 8   | Cierre: validación con los tres modelos y limpieza               | Pendiente                     |

## Equivalencias de librerías

| Python                             | Web                                                                      | Uso                                               |
| ---------------------------------- | ------------------------------------------------------------------------ | ------------------------------------------------- |
| PySide6                            | React                                                                    | Interfaz                                          |
| PyVista / VTK                      | three.js                                                                 | Visor 3D                                          |
| trimesh (booleanas vía manifold3d) | `manifold-3d` (WASM)                                                     | Unión, diferencia, intersección y corte por plano |
| shapely (buffer, union, simplify)  | `CrossSection` de `manifold-3d`                                          | Offset de contornos, uniones 2D, extrusión        |
| `trimesh.ray`                      | `three-mesh-bvh`                                                         | Rayos verticales para leer la superficie          |
| pymeshfix                          | `Mesh.merge()` de `manifold-3d` (fusión de vértices de aristas abiertas) | Cerrar mallas no watertight                       |
| `scene.export`                     | Escritor propio de OBJ + MTL; 3MF con `fflate` (zip)                     | Exportación                                       |

Las dependencias de cada paso se piden antes de instalarlas, según CLAUDE.md.

## Riesgos conocidos

- **Mallas no cerradas.** Dos de los tres modelos de ejemplo no son watertight
  (Mini Simmons: 8 aristas abiertas y 1 no manifold; Cobra: 14 no manifold, que resultaron
  ser triángulos degenerados). Las
  booleanas lo necesitan, y pymeshfix no existe en JS. Resuelto en el paso 2 con
  `Mesh.merge()` de manifold; queda vigilar STL más dañados que los de ejemplo.
- **Rendimiento.** El split hace una intersección por celda y el vaciado une miles
  de triángulos en 2D. Todo va en un Web Worker desde el paso 2 y se mide en el 8.
- **Resultados de referencia.** El venv de `_legacy/` es de macOS y no funciona en
  el contenedor. Hay que preparar un entorno Python aparte para generar los datos
  con los que comparar los tests (paso 2).

## Añadidos fuera del plan

- **Modelos de ejemplo** (entre los pasos 3 y 4). Mientras no hay tabla cargada, el
  visor muestra "Open example" con un botón por modelo: su preview y su nombre
  (Cobra y Mini Simmons).
  - Cada botón descarga el STL de `public/examples/` por HTTP del propio proyecto y lo
    carga como un fichero propio. Es para quien quiere probar la app sin tener un STL.
  - El aviso desaparece al cargar cualquier tabla.
  - Los ejemplos se definen en `EXAMPLE_MODELS` (`config.js`).
  - Los previews (PNG de 256 × 256) se generan con `npm run previews`: un renderizador
    por software con la vista isométrica y los colores del visor, porque en el
    contenedor no hay navegador para hacer capturas.
  - Un test comprueba que cada ejemplo tiene su STL y su preview del tamaño correcto.

---

## Paso 0 · Interfaz y estructura ✅

- Interfaz de `app/gui/` portada a React: paneles, acordeón, árbol de piezas, visor
  three.js, consola de log y ventana de exportación.
- Carga de STL con estadísticas (bounding box y volumen).
- Estructura `Components/`, `Helpers/` y `Hooks/` según CLAUDE.md.
- Las acciones que dependen de `core/` solo registran un aviso.

## Paso 1 · Base de calidad ✅

**Objetivo:** que las normas de CLAUDE.md se comprueben solas y que el código actual
las cumpla antes de portar lógica.

**Hecho:**

- ESLint 9 + Prettier + Vitest (dependencias solo de desarrollo; sin TypeScript en
  `node_modules`).
  - Las reglas Airbnb están escritas a mano en `eslint.config.js`, porque los paquetes
    de Airbnb o no admiten ESLint 9 o arrastran TypeScript.
  - Prettier va alineado con Airbnb: punto y coma, comillas simples, 100 columnas y
    comas finales.
- Scripts `lint`, `lint:fix`, `format`, `format:check`, `test` y `test:watch`.
- Hook de Claude Code (`.claude/settings.json`) que formatea y pasa el linter a cada
  `.js`/`.jsx` editado.
- Código adaptado:
  - Formato, sin `for...of` ni `++`, sin ternarios anidados.
  - Unidades en los nombres del estado (`diameterMm`, `twinAngleDeg`, `wallMm`...).
  - Estadísticas en mm, convertidas solo al mostrar (`Helpers/units.js`).
  - Constantes en `config.js`.
- Divisiones por tamaño:
  - `App` se reparte en los hooks `useBoardFile`, `usePiecesWorkflow` y
    `useExportDialog`.
  - `Viewer` pasa a `Helpers/viewerScene.js` y al hook `useThreeScene`.
  - `FinPlugPanel` se divide en sus variantes single y twin.
- 16 tests en `Helpers/` (`stl`, `pieces`, `units`) con geometría sintética.
- Validado: lint y formato sin avisos, tests en verde, build correcta y las mismas
  estadísticas que antes en los modelos de ejemplo (Mini Simmons: 36,60 L; Cobra:
  33,65 L).

## Paso 2 · Motor geométrico ⏳

**Objetivo:** tener la infraestructura con la que se portará toda la geometría.

**Hecho:**

- `manifold-3d` (WASM) instalado. `three-mesh-bvh` se instala en el paso 3, que es el
  primero que lanza rayos.
- `Helpers/manifold.js`: carga del módulo WASM y conversión `meshData` ⇄ `Manifold`.
- Reparación (`ensure_watertight`): primero se construye el `Manifold`; si la malla
  no es cerrada, se fusionan vértices de aristas abiertas con `Mesh.merge()`.
  - El primer intento usa la tolerancia por defecto de manifold; el segundo,
    `MESH_REPAIR_TOLERANCE_MM` (0,01 mm).
  - Si no queda cerrada, se avisa en la consola, como hacía Python.
  - Con los tres modelos no hace falta un sustituto de pymeshfix: Mini Simmons se
    repara (39 534 → 39 532 caras) y los otros dos ya eran cerrados. Los tres quedan
    con género 0.
- Web Worker único (`Helpers/geometryWorker.js`) con protocolo de petición, progreso,
  resultado y error.
  - `Helpers/workerClient.js` lo convierte en promesas y `Hooks/useGeometryWorker.js`
    lo crea en la primera petición.
  - `Helpers/geometryService.js` contiene las operaciones y se prueba sin Worker.
- La carga del STL (lectura, reparación y estadísticas) va en el Worker, que conserva
  el `Manifold` de la tabla para los pasos siguientes.
- Fixtures: los tres STL de ejemplo, en `tests/fixtures/models/`.
- `tools/reference/generate_reference.py` con la sección `load`: `load_stl`,
  `ensure_watertight` y las estadísticas.
- 33 tests: 30 en verde; los 3 de comparación con Python se saltan hasta que exista
  el JSON.
- Build de producción: el Worker y el `.wasm` van en paquetes propios (162 KB + 541 KB).

**Pendiente para cerrarlo:**

1. Generar las referencias en el Mac, desde la raíz del proyecto:
   `_legacy/ulaola_surfboard_splitter/venv/bin/python tools/reference/generate_reference.py`
2. `npm test`: los 3 tests de comparación deben pasar.
3. Probar en el navegador que cargar los tres STL funciona igual que antes (y que
   Mini Simmons muestra en la consola el mensaje de reparación).

**Terminado cuando:** los tres modelos se cargan y quedan cerrados, y existen los
datos de referencia.

## Paso 3 · Ejes y superficie ⏳

**Portar de `mesh_ops.py`:** `_detect_axes`, `board_axes`, `detect_thickness_axis`,
`surface_height`, `_surface_hit` y `surface_frame`.

**Hecho:**

- `three-mesh-bvh` instalado (rayos contra la malla, equivalente a `trimesh.ray`).
- `Helpers/boardAxes.js`: `meshBounds` y `detectAxes`, que devuelve
  `{ lengthAxis, widthAxis, thicknessAxis }`. Los empates se resuelven como
  `np.argmax` / `np.argmin`: gana el primer eje.
- `Helpers/surface.js`:
  - `createSurfaceProbe(meshData)` crea la BVH y lanza rayos verticales que
    devuelven todos los cortes.
  - `surfaceHeight`, `surfaceHit` y `surfaceFrame` replican la lógica de Python,
    incluidos los casos límite: fuera de la tabla, extremos de la cruz que no tocan
    y normal degenerada.
- El servicio del Worker guarda la sonda de superficie junto al `Manifold` de la
  tabla, lista para colocar los plugs en el paso 4. Trabaja sobre su propia copia de
  la malla, porque la `meshData` se transfiere a la interfaz.
- Tests con geometría de resultado exacto (caja plana y caja con la cara superior
  inclinada, que simula el rocker) y comprobaciones básicas sobre los tres modelos.
  En total, 63 tests: 51 en verde y 12 que comparan con Python, saltados hasta que
  exista el JSON (3 del paso 2 y 9 de este).
- `tools/reference/generate_reference.py`: sección `surface`, con los ejes, 15 alturas
  y 16 marcos por modelo en puntos derivados del bounding box. El JSON guarda los
  puntos, así que el test de JS usa exactamente los mismos.

**Pendiente para cerrarlo:** generar las referencias en el Mac (el mismo comando del
paso 2, que ya incluye esta sección) y pasar `npm test`.

**Terminado cuando:** los tests coinciden con Python (ejes, alturas y normales, con
tolerancias explícitas: 0,05 mm y 0,5°).

## Paso 4 · Plugs

**Portar:** `plug_subtraction_geometries.py` y `plug_position.py`: leash plug,
single fin, twin fin (Futures) y sus soportes.

- Marcadores verdes en el visor que se actualizan al cambiar los parámetros del
  paso 1 de la interfaz, como en el original.

**Terminado cuando:** los marcadores se ven bien colocados en los tres modelos y los
volúmenes y bounding boxes coinciden con Python.

## Paso 5 · Split

**Portar:** `split_lengthwise` y `split_board` (`mesh_ops.py`), `cutlap.py`,
`polygon_grid.py`, `hex_grid.py` y `triangle_grid.py`.

- Botón "Split base polygons" funcional, árbol de piezas relleno, colores por tipo
  de pieza, contornos de corte y selección con el modelo fantasma.

**Terminado cuando:** el número de piezas y sus volúmenes coinciden con Python para
hexágonos y triángulos.

## Paso 6 · Vaciado

**Portar:** `hollow.py`: huella de la pieza, cavidad con paredes y agujeros laterales.

- Botón "Preview hollowing" funcional sobre la pieza seleccionada.

**Terminado cuando:** el volumen de las piezas vaciadas coincide con Python.

## Paso 7 · Exportación

**Portar:** `export_window.py`: vaciar todas las piezas, restar las cavidades de los
plugs y añadir los soportes; después, exportar.

- Proceso en el worker con progreso en la ventana de exportación.
- OBJ con materiales (`.mtl`) y 3MF, descargados desde el navegador.
- Posible dependencia nueva: `fflate` (zip para el 3MF).

**Terminado cuando:** los ficheros se abren en un slicer o CAD y contienen las mismas
piezas que la exportación de Python.

## Paso 8 · Cierre

- Validación completa con los tres modelos de ejemplo frente a Python.
- Medición de tiempos y optimización si hace falta.
- Quitar los avisos de "not migrated yet" y actualizar CLAUDE.md.
- Fuera de alcance, porque tampoco existían en el original: Open Project, Save
  Project y Save As.
