# Plan de migración

Migración de `_legacy/ulaola_surfboard_splitter/` (Python: PySide6 + PyVista + trimesh +
shapely + manifold3d + pymeshfix) a la web (Vite + React + three.js).

Cada paso termina con la app funcionando y se valida antes de pasar al siguiente.
Las normas de [CLAUDE.md](CLAUDE.md) aplican a todos los pasos.

| #   | Paso                                                             | Estado   |
| --- | ---------------------------------------------------------------- | -------- |
| 0   | Interfaz y estructura de carpetas                                | ✅ Hecho |
| 1   | Base de calidad: linter, formato, tests y adaptación del código  | ✅ Hecho |
| 2   | Motor geométrico: manifold-3d, Web Worker y reparación de mallas | ✅ Hecho |
| 3   | Ejes de la tabla y lectura de superficie                         | ✅ Hecho |
| 4   | Plugs: cavidades, soportes y marcadores                          | ✅ Hecho |
| 5   | Split: stringer, cutlap y rejilla de polígonos                   | ✅ Hecho |
| 6   | Vaciado de piezas y previsualización                             | ✅ Hecho |
| 7   | Exportación OBJ / 3MF                                            | ✅ Hecho |
| 8   | Cierre: validación con los tres modelos y limpieza               | ✅ Hecho |

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
- **Resultados de referencia.** Resuelto: `tools/reference/.venv` (no versionado)
  ejecuta el `core/` original en el contenedor con las mismas versiones de trimesh,
  shapely, manifold3d y pymeshfix que el programa de Python.

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
- **Banner de donaciones** (tras el paso 8), al pie del panel izquierdo
  (`LeftPanel/DonationBanner/`).
  - Pixel art de 110 × 32 píxeles en SVG, escalado sin suavizar. Tiene un sol con gafas
    de sol, una gaviota, tres capas de olas con espuma, un surfista haciendo
    equilibrios en su tabla y una aleta de tiburón que le sigue.
  - Las animaciones van a saltos de un píxel (`steps()`) y son lentas. Con
    `prefers-reduced-motion` no hay animación.
  - La posición de cada elemento está en `Helpers/donationScene.js`, y
    los colores en `config.js`. `Helpers/pixelArt.js` los convierte en rectángulos
    (probado en `pixelArt.test.js`).
  - El botón "ADOPT A SHAPER" enlaza a `DONATION_URL` (`config.js`).
- **Aristas vivas en el visor.** Antes, las normales se promediaban en todos los
  vértices compartidos, y las aristas de corte de las piezas se veían redondeadas con
  una sombra. Ahora `geometryFromMeshData` usa `toCreasedNormals` de three.js: el
  sombreado es suave entre caras casi coplanarias y la arista queda viva por encima
  de `SHADING_CREASE_ANGLE_DEG` (30°, igual que las aristas dibujadas). Lo comprueba
  `meshData.test.js`.
- **Cabecera con la imagen de Ula Ola** (`Components/AppHeader/AppHeader.jsx`). Es una barra de
  40 px con la misma línea que la web principal (repositorio `ulaolaweb_new`, fichero
  `index_hacker.css`): fondo azul noche en degradado (`#000814` → `#001d3d`, la variante
  de cabecera de esa hoja) y línea verde neón `#39ff14`.
  - A la izquierda van el logo "UO", una línea fina y el lema "Ula Ola – Unusual surf".
    El texto es blanco y usa una tipografía geométrica (Futura o Avenir) que acompaña
    al logo.
  - A la derecha, la ruta de la app en mono con un cursor de terminal. Detrás lleva un
    fondo de pixel art de 380 × 40 px (toda la altura, más largo que el texto): las
    olas del banner de donaciones en azules muy oscuros (`HEADER_SCENE_COLORS`) y la
    aleta de tiburón. Se funde con el fondo por la izquierda
    (`AppHeader/HeaderScene.jsx`, `Helpers/headerScene.js`).
  - El banner y la cabecera comparten los sprites (`Helpers/pixelSprites.js`) y los
    componentes `Misc/PixelSprite` y `Misc/PixelWave`.
  - Los datos están en `BRAND` (`config.js`).
  - El logo y el favicon salen de la web antigua (repositorio `ulaolaweb`):
    `img/logos/blanco_transparente_recortado.png` pasa a
    `public/brand/ulaola-logo.png` y `favicon.ico` a `public/`. Si falta el logo, se
    oculta y el log lo avisa. Un test comprueba que los dos ficheros están.
  - No se cargan fuentes externas: se usa la primera de cada lista que esté instalada.
- **Plugs restados en el split.** En Python las cavidades de los plugs solo se restaban
  al exportar, así que tras el split los marcadores seguían encima como una pieza más.
  - La petición `split` recibe los plugs y devuelve las piezas con el hueco de las
    cavidades, con el mismo margen que la exportación (`SUBTRACTION_MARGIN_MM`).
  - La tienda del Worker guarda las piezas sin restar: el vaciado y la exportación
    no cambian, y siguen validados frente a Python.
  - La previsualización del vaciado (`hollowPiece` con `plugs`) es la pieza final de
    la exportación: vaciada, con las cavidades restadas y unida a sus soportes
    (`buildPreviewPiece` en `exportPieces.js`).
  - Tras el split se ocultan los marcadores. Si se cambian los plugs, vuelven a verse
    hasta el siguiente Execute.
  - La resta compartida está en `plugSolids.js` (`subtractPlugCavities`), y
    `hollowStoredPiece` pasa a su propio módulo. Lo comprueba `splitRequest.test.js`.
- **Seleccionar piezas pinchando en el visor.**
  - Con las piezas visibles, la que está bajo el ratón y se puede seleccionar se tiñe
    de azul (`PIECE_HOVER_EMISSIVE_COLOR`) y el cursor pasa a mano.
  - Un clic sin arrastre hace lo mismo que pinchar la pieza en la lista, y abre el
    paso 3. Si el puntero se mueve más de `PICK_CLICK_TOLERANCE_PX`, cuenta como un
    giro de cámara.
  - `Hooks/useViewerPicking.js` gestiona los eventos. `pickedMesh` (en
    `viewerScene.js`) lanza el rayo con three-mesh-bvh; el fantasma translúcido no
    tapa las piezas. Lo comprueba `viewerScene.test.js`.
  - Exportar se habilita mientras la última previsualización sea la de la pieza y los
    parámetros actuales (estado derivado en `usePiecesWorkflow`).
- **Consola de log** a la mitad de alto (75 px).
- **Asistente de pasos en lugar del acordeón** (`LeftPanel/StepWizard/`). Con el
  acordeón se podían cerrar todos los pasos y no se veía en cuál estabas.
  - Arriba, un indicador con los tres pasos unidos por una línea: hecho (✓), actual
    (resaltado) o bloqueado. Los pasos habilitados se pueden pulsar para saltar.
  - Solo se ve el paso actual, con "Step N of 3" y su título. Sin tabla cargada no
    hay paso actual y se muestra un aviso.
  - Abajo, "← anterior" y "siguiente →" con el nombre del paso de destino. En el
    paso 2 el botón es "Split →": lanza el split, que al terminar abre el paso 3.
    Sustituye a "Continue" y a "Split base polygons".
  - En el paso 3, el último "siguiente" es "Export hollowing →", en lugar del botón
    que había junto a "Preview part hollowing". Se habilita en el mismo caso que antes.
  - "Polygon hollowing actions" se ve siempre en el paso 3, deshabilitado (el
    `fieldset` con `disabled`) hasta seleccionar una pieza del núcleo. Bajo "Preview part
    hollowing" se explica por qué, también si no hay nada seleccionado. Con el stringer
    o un cutlap, el mensaje es una alerta discreta en naranja (`.hint.warning`).
  - Con "all" seleccionado (`isAllSelected` en `pieces.js`) se pueden ajustar los
    sliders y exportar sin previsualizar, porque la exportación vacía todas las
    piezas. "Preview part hollowing" sigue necesitando una pieza del núcleo.
  - Mientras hay una operación en curso, la navegación se deshabilita.
  - El visor sigue al paso: en los pasos 1 y 2 muestra la tabla sin cortar con los
    marcadores de los plugs, y en el 3 las piezas (`useViewerObjects` recibe
    `currentStep`). Las piezas se conservan al volver atrás.
  - La lista de piezas del paso 3 se divide en secciones (`buildPiecesSections` en
    `pieces.js`, a partir del mismo árbol de `buildPiecesTree`):
    - Botones "All" y "Stringer".
    - "Main parts", con la etiqueta "Hollowable parts" en azul: un desplegable con
      un grupo por mitad. Side A y Side B son solo encabezados, porque seleccionar la
      mitad entera también mostraría sus cutlaps.
    - "Cutlaps", con la etiqueta "Not hollowable" en naranja (`--warning`): otro
      desplegable por mitades, con "All in Side A/B" para ver los cutlaps de una
      mitad.
    - Si la selección es de otra sección, el desplegable muestra su texto de ayuda.
- **Confirmar antes de cambiar de tabla.** Con una tabla cargada, "Add STL shape"
  abre antes un diálogo (`ActionBar/ConfirmDialog.jsx`, un `<dialog>` modal): "Discard
  and open" abre el selector de ficheros y "Cancel" o Escape no hacen nada. Si luego se
  cancela el selector, la tabla actual se conserva.
- **Ventana de bienvenida** (`Components/WelcomeDialog/`). Sale al abrir el programa,
  una vez por sesión del navegador. Se marca como vista al cerrarla, en
  `sessionStorage` con la clave `WELCOME_SEEN_STORAGE_KEY` (`Hooks/useWelcomeOnce.js`).
  Si el almacenamiento falla, se registra el error y la ventana sale igualmente.
  - Arriba, una escena animada con el estilo del banner de donaciones
    (`Helpers/welcomeScene.js`): cielo, olas, sol, gaviota, surfista, tiburón y, en
    el centro, el logotipo del programa.
  - El logotipo (`Helpers/splitterLogo.js`, probado en `splitterLogo.test.js`) es
    una tabla vista desde arriba con la rejilla de cortes y el stringer de madera
    (color `N` de la paleta). Flota, y sus dos mitades se separan por el stringer y
    vuelven a juntarse.
  - Debajo, la carta de presentación firmada por Pablo y el botón "START SHAPING".
  - `PixelSky` pasa a `Misc/`, porque lo usan el banner y la bienvenida.
- **Gestor de cámara del visor** (`Misc/Viewer/ViewerToolbar.jsx`). Es una barra
  de iconos grandes (60 × 56 px) flotante en la esquina superior derecha del visor,
  también en el de exportación. El zoom se hace con la rueda del ratón.
  - X, Y y Z (cubo isométrico con la cara correspondiente rellena): miran a lo largo
    de cada eje de la escena; Z es la vista superior. Al mirar a lo largo de Z, la
    cámara se inclina un poco (`VIEWER_ALONG_Z_TILT`) para que +Y quede hacia arriba
    en pantalla.
  - Encuadre (cuatro esquinas, el último botón): vuelve a la vista isométrica que encuadra la tabla,
    igual que al cargarla.
  - Las vistas encuadran los objetos visibles. La cámara está en
    `Helpers/viewerCamera.js` (`frameCamera` sale de `viewerScene.js`), probada en
    `viewerCamera.test.js`. El visor pasa a su carpeta `Misc/Viewer/`.
- **Object info sobre el visor** (`RightPanel/ObjectStatsPanel.jsx`). La caja y el
  volumen del modelo salen del panel izquierdo y pasan a una tarjeta translúcida
  abajo a la derecha del visor. Solo se ve con una tabla cargada y no bloquea el
  ratón.

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

## Paso 2 · Motor geométrico ✅

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

- Referencias generadas en el contenedor y comparadas. pymeshfix repara de otra
  manera (Cobra: 10 448 → 10 338 caras; manifold, 10 428), pero volúmenes y bounding
  boxes coinciden. trimesh considera abierta la malla de Cobra, que manifold ya acepta
  tal cual, así que el test solo exige la implicación en cada sentido.

**Terminado cuando:** los tres modelos se cargan y quedan cerrados, y existen los
datos de referencia.

## Paso 3 · Ejes y superficie ✅

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

- Comparado con Python: ejes, alturas (< 0,05 mm) y normales (< 0,5°) coinciden en los
  tres modelos.

**Terminado cuando:** los tests coinciden con Python (ejes, alturas y normales, con
tolerancias explícitas: 0,05 mm y 0,5°).

## Paso 4 · Plugs ✅

**Portar:** `plug_subtraction_geometries.py` y `plug_position.py`: leash plug,
single fin, twin fin (Futures) y sus soportes.

**Hecho:**

- `Helpers/plugPlacement.js`: posición del plug (desde la cola y la línea central) y
  la matriz que lo apoya sobre la superficie siguiendo el rocker y el toe-in.
- `Helpers/plugGeometry.js`: cavidades y soportes de leash, caja de quilla central y
  caja Futures de dos niveles.
  - Los `buffer` de shapely son aquí cierres convexos de círculos de 96 lados
    (estadio, rectángulo redondeado) y `offset` redondeados de `CrossSection`.
  - Todos los intermedios WASM se liberan con `withTemporaries`.
- `Helpers/plugSolids.js`: traduce los parámetros del paso 1 de la interfaz a la
  lista de cavidades o soportes (`_collect_plug_solids` / `_collect_plug_supports`).
- Worker: petición `plugMarkers`. `Hooks/usePlugMarkers.js` la lanza al cambiar la
  tabla o cualquier parámetro, descarta las respuestas atrasadas y libera las
  geometrías que sustituye. Los marcadores verdes no mueven la cámara.
- Los marcadores se ocultan tras el split, como en Python, que los borraba al mostrar
  las piezas y los volvía a pintar al tocar un parámetro (ver "Plugs restados en el
  split" en "Añadidos fuera del plan").
- Constantes (holguras, medidas Futures, protrusiones) en `config.js`.
- Comparado con Python en los tres modelos, con single y twin fin: volúmenes (< 1 %)
  y bounding boxes (< 0,2 mm) de marcadores, cavidades a restar y soportes.
- Divergencia conocida (`tests/support/reference.js`): el soporte del leash de Cobra
  sale volcado en Python.
  - Su cruz de muestreo cae justo en una arista de la malla reparada por pymeshfix,
    el rayo de trimesh no toca la cubierta y toma el casco como superficie.
  - En la web queda bien apoyado, y un test propio lo comprueba.

## Paso 5 · Split ✅

**Portar:** `split_lengthwise` y `split_board` (`mesh_ops.py`), `cutlap.py`,
`polygon_grid.py`, `hex_grid.py` y `triangle_grid.py`.

**Hecho:**

- Todo el corte trabaja en un marco canónico (X largo, Y ancho, Z grosor;
  `Helpers/boardFrame.js`), igual que Python remapea sus prismas a los ejes de la
  tabla. Las piezas vuelven al marco del STL, así que funciona con la tabla orientada
  en cualquier eje.
- `Helpers/splitBoard.js`:
  - Mitades A y B y stringer con `trimByPlane` (como `slice_mesh_plane`).
  - Cutlap (`Helpers/cutlap.js`): huella con `Manifold.project()`, `offset` negativo,
    y la mayor pieza si queda partida.
  - Cada parte se trocea con la rejilla (`Helpers/splitGrid.js` y
    `Helpers/splitCells.js`).
  - Los contornos de corte se asocian a sus piezas con las mismas reglas que
    `split_board`.
- Contornos (`Helpers/meshOutline.js`): el borde de las caras de una tapa de corte,
  como `submesh().outline()`. El del cutlap usa una rejilla espacial para no comparar
  cada cara con todo el contorno.
- Ordenación de piezas como `sorted()` de Python, para que "Main Split N" coincida.
- Worker: petición `split`. La tienda del Worker (`Helpers/geometryStore.js`) guarda
  las piezas originales para el vaciado y la exportación, y las peticiones pasan a
  módulos propios (`boardRequests.js`, `splitRequest.js`).
- Interfaz: el botón "Split base polygons" funciona y rellena el árbol.
  - Cada tipo de pieza tiene su color, con sus aristas.
  - Los contornos de corte se ven con las piezas seleccionadas, sobre el fantasma de
    la tabla.
  - Al terminar se abre el paso 3, como en el original.
- Rendimiento: 90-120 piezas en menos de 0,5 s en los modelos de ejemplo (Python
  tarda varios segundos por modelo).
- Comparado con Python en los tres modelos, con hexágonos y triángulos:
  - Claves y número de piezas idénticos, y los contornos se asocian a las mismas piezas.
  - 5_8 DRIFT OBQ, cerrado de origen: volúmenes exactos.
  - Mini Simmons: < 0,3 %, porque pymeshfix y manifold reparan distinto.
- Divergencia conocida (`KNOWN_PYTHON_REGION_DIVERGENCES`): pymeshfix acorta 6 mm la
  muesca de la cola de golondrina de Cobra.
  - La huella llega a x = 28,25 mm en lugar de los 34,46 mm del STL.
  - Las cuatro piezas de esa zona difieren hasta un 4,6 %. La web conserva la
    geometría original, y un test lo comprueba.

## Paso 6 · Vaciado ✅

**Portar:** `hollow.py`: huella de la pieza, cavidad con paredes y agujeros laterales.

**Hecho:**

- `Helpers/hollow.js`, en el marco canónico (Z = grosor, que Python pasaba aparte
  como `thickness_axis`):
  - Cavidad: huella con `project()`, encogida la pared y extruida entre las pieles.
  - Agujeros: en cada cara lateral de la sección a media altura, con diámetro
    `holePct` % de la altura local, repartidos igual que en Python y con la altura
    local medida por rayos sobre la propia pieza.
- `Helpers/polygon2d.js`: Douglas-Peucker (`simplify` de shapely) y punto en polígono.
- `createSurfaceProbe` acepta ejes explícitos: una pieza puede ser más alta que ancha y
  sus medidas no dicen cuál es el grosor.
- Worker: petición `hollowPiece`. Siempre vacía la pieza original guardada, como
  `original_pieces` en Python.
- Interfaz: "Preview hollowing" vacía la pieza seleccionada y la muestra; después se
  habilita "Export Hollowing".
- Comparado con Python en los tres modelos, en todas las piezas del núcleo:
  - Volumen vaciado total: < 0,2 %.
  - Cavidad por pieza: típico < 0,3 %, máximo 3,6 %. Sale de la huella: unión de
    triángulos en shapely, `project()` en manifold.
  - Volumen retirado por pieza: hasta un 5,7 % en piezas diminutas. Los agujeros se
    reparten por las caras de la sección simplificada, y Douglas-Peucker depende del
    vértice por el que empieza el anillo, que trimesh y manifold eligen distinto.
    Algunas caras llevan un agujero más o menos; ambos resultados son válidos.

## Paso 7 · Exportación ✅

**Portar:** `export_window.py`: vaciar todas las piezas, restar las cavidades de los
plugs, añadir los soportes y exportar.

**Hecho:**

- `Helpers/exportPieces.js` (`process_and_show`): vacía cada pieza del núcleo, le
  resta las cavidades de los plugs que la tocan (`_subtract_plugs`) y añade, como
  piezas aparte, los soportes recortados a su celda y taladrados
  (`_support_fragments`). Un fallo en una pieza no para el resto; se avisa en la
  consola.
- Formatos (`Helpers/exportFormats.js`):
  - OBJ con colores por material. Se descarga como `surfboard_pieces_obj.zip` con el
    `.obj` y su `.mtl`, porque el navegador no puede escribir dos ficheros juntos en
    una carpeta, como hacía el original.
  - 3MF sin colores, igual que el original.
  - Nombres de objeto como `_piece_name` ("Side A - Split 3", "Support 1 - Stringer"...).
- `Helpers/zip.js`: zip mínimo sin compresión (con CRC-32) para el 3MF y el paquete
  OBJ. No hace falta `fflate`.
- Worker: peticiones `processExport` (con el progreso pieza a pieza) y `exportFile`.
  La tienda guarda las piezas finales hasta el siguiente split.
- Interfaz: la ventana "Export hollowing" procesa al abrirse, muestra el progreso y
  las piezas finales, y "Export file" descarga el formato elegido.
- Validado:
  - Python produce las mismas piezas finales: mismas claves y nombres, y 10 soportes
    en Cobra, 8 en los otros dos. La referencia ejecuta los métodos reales de
    `export_window.py`, con PySide6 y PyVista sustituidos por esqueletos vacíos.
  - Volúmenes dentro de las tolerancias del split y del vaciado.
  - trimesh abre los ficheros exportados (zip válido, 103 objetos con sus nombres y
    cuatro materiales de color).
  - Con `process=False` los 103 objetos son estancos. Con el procesado por defecto de
    trimesh, dos dejan de serlo: esa fusión de vértices pega dos superficies que
    manifold deja tocándose en un punto.

## Paso 8 · Cierre ✅

- Validación frente a Python de los tres modelos, en todos los pasos (`npm test`, 128
  tests): carga, superficie, plugs, split (hexágonos y triángulos), vaciado y
  exportación. Las divergencias conocidas están explicadas en
  `tests/support/reference.js`, y todas se deben a pymeshfix o a un caso límite de los
  rayos de trimesh, no a la migración.
- Tiempos en Node (el navegador es similar). Valores por defecto; ms, con piezas o
  tamaño entre paréntesis:

| Modelo        | Rejilla  | Carga | Marcadores | Split     | Vaciar 1 | Procesar export | OBJ (zip)    | 3MF           |
| ------------- | -------- | ----- | ---------- | --------- | -------- | --------------- | ------------ | ------------- |
| Mini Simmons  | Hexagon  | 167   | 12         | 491 (83)  | 20       | 1014 (91)       | 114 (5,7 MB) | 124 (10,1 MB) |
| Mini Simmons  | Triangle | 97    | 1          | 502 (113) | 30       | 1669 (127)      | 108 (7,5 MB) | 144 (13,3 MB) |
| Cobra         | Hexagon  | 22    | 1          | 151 (93)  | 9        | 853 (103)       | 69 (4,5 MB)  | 80 (8,0 MB)   |
| Cobra         | Triangle | 19    | 1          | 167 (119) | 20       | 1284 (135)      | 83 (5,9 MB)  | 113 (10,4 MB) |
| 5_8 DRIFT OBQ | Hexagon  | 108   | 1          | 543 (89)  | 14       | 1164 (97)       | 129 (7,0 MB) | 153 (12,5 MB) |
| 5_8 DRIFT OBQ | Triangle | 113   | 1          | 653 (117) | 29       | 1588 (131)      | 124 (8,6 MB) | 161 (15,2 MB) |

- Retirados los avisos de "not migrated yet": todas las acciones funcionan.
- Fuera de alcance, porque tampoco existían en el original: Open Project, Save
  Project y Save As.
- Pendiente de hacer a mano: la prueba de la interfaz en un navegador. En el
  contenedor no hay navegador; la lógica está probada con tests y el servidor sirve
  todos los módulos.
