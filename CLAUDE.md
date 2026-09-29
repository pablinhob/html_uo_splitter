# CLAUDE.md

Instrucciones para Claude Code en este repositorio. Son de obligado cumplimiento:
si una tarea choca con alguna norma, avisa antes de saltártela.

## Proyecto

- **UO Splitter**: migración a web (Vite + React + three.js) de la app de escritorio
  en Python `_legacy/ulaola_surfboard_splitter/` (PySide6 + PyVista + trimesh).
- `_legacy/` es **solo referencia**: nunca se edita, no se versiona y Vite no lo vigila.
- La migración va **por fases**. Haz solo la fase que se pida y no te adelantes a la
  siguiente, aunque sea evidente.
- El plan y el estado de cada paso están en [migration.md](migration.md). Actualiza
  su tabla de estado al empezar y al terminar cada paso.
- Arranque: `./com.up.sh` → http://localhost:5555 (el contenedor lanza `npm run dev`).

## Estructura de carpetas

```
src/
├── main.jsx               # punto de entrada
├── App.jsx                # ventana principal y estado de la aplicación
├── config.js              # constantes y rangos (portado de config.py)
├── styles.css
├── Components/
│   ├── Misc/              # componentes reutilizados en varias partes de la UI
│   │   ├── GroupBox.jsx
│   │   └── SpinField.jsx
│   └── LeftPanel/         # carpeta = componente padre
│       ├── LeftPanel.jsx
│       └── PlugsSetupPanel/
│           ├── PlugsSetupPanel.jsx
│           ├── LeashPlugPanel.jsx
│           └── FinPlugPanel.jsx
├── Helpers/
│   ├── logger.js
│   ├── stl.js
│   ├── stl.test.js
│   └── geometryWorker.js  # entrada del Web Worker de geometría
└── Hooks/
    └── useViewerObjects.js
tests/
├── fixtures/models/       # STL de ejemplo (copiados de _legacy/)
├── fixtures/reference/    # resultados del programa Python (JSON)
└── support/               # utilidades compartidas por los tests
tools/reference/           # script Python que genera fixtures/reference/
tools/previews/            # genera los PNG de preview de los ejemplos (npm run previews)
public/examples/           # modelos de ejemplo y sus previews (EXAMPLE_MODELS en config.js)
```

(Los nombres del ejemplo son ilustrativos.)

### `Components/`

- **Un componente por fichero**, sin excepciones. Tampoco se admiten componentes
  auxiliares pequeños junto a otro.
- El componente y su fichero se llaman igual y **empiezan por mayúscula**
  (`PascalCase`): `SpinField` → `SpinField.jsx`, exportado con `export default`.
- La carpeta se llama `Components`, con mayúscula, igual que todas sus subcarpetas.
- **Jerarquía que refleja la interfaz.** Si un componente contiene otros que solo
  usa él, se crea una carpeta con su nombre. Dentro van su fichero y los de sus
  hijos, que pueden anidarse igual. Así, para encontrar un elemento de la pantalla
  se sigue su anidamiento visual.
- El fichero del componente padre vive dentro de su carpeta y se llama como ella
  (`LeftPanel/LeftPanel.jsx`); no se usa `index.jsx`.
- **`Components/Misc/`**: los componentes que se reutilizan en varias partes de la
  interfaz (campos, grupos, acordeón, visor 3D...). Se crea solo si hace falta.
  Si un componente pasa a usarse desde más de una rama, se mueve a `Misc/`.

### `Helpers/`

- Módulos de funciones sin JSX ni componentes: lógica, geometría, utilidades.
- Un fichero **puede contener varias funciones**, agrupadas por tema, con exports
  con nombre.
- Los ficheros empiezan por **minúscula** (`camelCase`): `stl.js`, `logger.js`,
  `meshOps.js`.
- La lógica portada de `_legacy/app/core/` va aquí.

### `Hooks/`

- Hooks propios de React (`useSomething`), al mismo nivel que `Components/` y
  `Helpers/`.
- **Un hook por fichero**, que se llama igual que el hook y empieza por `use`
  (`useViewerObjects.js`), exportado con `export default`. Extensión `.js`: los
  hooks no devuelven JSX.
- Pueden importar React y `Helpers/`, pero nunca componentes.
- Se crea un hook cuando la lógica de estado o de efectos de un componente es
  reutilizable o hace que el componente supere el tamaño orientativo.

## Buenas prácticas del proyecto

### Lenguaje y herramientas

- **Nunca TypeScript.** Solo JavaScript (`.js` / `.jsx`): ni ficheros `.ts`/`.tsx`, ni
  dependencias de TypeScript, ni migraciones parciales.
- **ESLint + Prettier** comprueban las normas de estilo de este fichero. El código
  que se entrega pasa el linter sin errores ni avisos.
  - `eslint.config.js` traduce a reglas las normas de este fichero; cada bloque indica
    su sección. Son reglas propias, sin paquete de Airbnb (el oficial no admite
    ESLint 9 y la alternativa mantenida depende de TypeScript).
  - ESLint se queda en la versión 9: los plugins de React, import y accesibilidad aún
    no admiten la 10.
  - Un hook de Claude Code (`.claude/hooks/format-and-lint.sh`) pasa Prettier y
    `eslint --fix` a cada `.js`/`.jsx` editado y devuelve los problemas que queden.
- **Scripts de Node en `tools/`:** se lanzan con
  `node --import ./tools/extensionlessImports.js`, que resuelve los imports sin
  extensión igual que Vite. Así pueden reutilizar el código de `src/`.
- **Comandos:** `npm run lint`, `npm run format`, `npm test`. Antes de dar un paso por
  terminado, los tres pasan limpios y `npm run build` compila.
- **Sin dependencias nuevas sin preguntar antes.** Explica para qué se necesita y
  qué alternativas hay.

### Arquitectura

- **Lógica separada de la interfaz.** `src/Helpers/` no importa React ni
  tocan el DOM: son funciones puras que reciben datos y devuelven datos. Los
  componentes se ocupan de la presentación; la lógica de estado compleja va en
  `Hooks/`.
- **Operaciones pesadas en Web Workers** (split, vaciado, booleanas, exportación),
  para que la interfaz no se bloquee. El componente muestra el progreso y recibe
  el resultado.
  - Toda la geometría pasa por un único Worker (`Helpers/geometryWorker.js`) al que la
    interfaz llama con `useGeometryWorker().request(type, payload)`.
  - Cada operación nueva se añade como manejador en `Helpers/geometryService.js`,
    que se prueba sin Worker.
  - Las mallas viajan como `meshData` (`{ positions, index }`, arrays tipados), y se
    transfieren en lugar de copiarse.
  - El Worker conserva el `Manifold` de la tabla cargada: no se reenvía en cada
    petición.
- **Sin números mágicos.** Toda constante de configuración (rangos, valores por
  defecto, colores, tolerancias) va en `src/config.js`.

### Código

- **Unidades explícitas en los nombres**: `radiusMm`, `angleDeg`, `volumeCm3`,
  `holePct`. La unidad interna es siempre el milímetro; se convierte solo al mostrar.
- **Idioma**: identificadores y textos de la UI en inglés; comentarios en español.
- **Nunca silenciar errores.** Todo `catch` registra el error con `logger.error` (con
  contexto) o lo propaga. Prohibidos los `catch` vacíos.
- **Estado inmutable en React.** Nunca mutar el estado ni las props; actualizar con
  copias (spread) y funciones de actualización.
- **Liberar recursos de three.js.** Toda geometría, material o textura que deja de
  usarse se libera con `dispose()`; queda claro quién es su dueño.
- **Liberar memoria WASM.** Los `Manifold`, `Mesh` y `CrossSection` de manifold-3d no
  los recoge el recolector de basura: quien los crea los libera con `delete()`,
  también los intermedios de las booleanas y en los tests.
- **Tamaño orientativo**: unas 50 líneas por función y 300 por fichero. Si se superan,
  dividir.

### Tests

- **Vitest para `src/Helpers/`.** Cada función portada de `_legacy/` lleva
  tests que la comparan con resultados de referencia del programa de Python
  (volúmenes, número de piezas, bounding boxes), con tolerancias explícitas.
- Los tests van junto al fichero que prueban (`stl.js` → `stl.test.js`) y no dependen
  de `_legacy/`, que no está en el repositorio: los datos que necesiten se copian
  a una carpeta del proyecto o se generan en el propio test.
- **Datos de referencia:** `tools/reference/generate_reference.py` ejecuta el `core/`
  original y escribe `tests/fixtures/reference/<modelo>.json`.
  - Se lanza en el Mac con el venv de `_legacy/`, porque ese venv no funciona en el
    contenedor.
  - Cada paso añade su sección al script. Los tests que comparan con Python se
    saltan (`it.skipIf`) mientras no exista el JSON.
- Cada bug corregido añade un test que lo reproduce.

### Git

- **Commits pequeños**, uno por fase o cambio lógico, con formato Conventional
  Commits (`feat:`, `fix:`, `refactor:`, `test:`, `docs:`, `chore:`).
- Solo se hace commit cuando el usuario lo pide.

## Estilo JavaScript: Airbnb JavaScript Style Guide

Se sigue la guía de Airbnb (https://github.com/airbnb/javascript) y su guía de
React/JSX. Abajo está la lista de normas. Si alguna no aparece aquí, manda la guía
original.

### 1. Referencias y variables

- **1.1.** Usa `const` para todas las referencias. Usa `let` solo si hay reasignación.
  Nunca uses `var`.
- **1.2.** Una declaración `const`/`let` por variable. Agrupa primero los `const` y luego
  los `let`.
- **1.3.** Declara las variables donde se necesitan, no todas al principio.
- **1.4.** No encadenes asignaciones (`a = b = c`).
- **1.5.** No uses `++` ni `--`; usa `+= 1` y `-= 1`.
- **1.6.** Sin saltos de línea antes ni después de `=` en una asignación.
- **1.7.** No dejes variables sin usar.
- **1.8.** No uses variables ni funciones antes de definirlas.
- **1.9.** No crees globales implícitas.

### 2. Objetos

- **2.1.** Crea objetos con literal (`{}`), nunca con `new Object()`.
- **2.2.** Usa nombres de propiedad calculados (`[key]: value`) al crear objetos con
  claves dinámicas.
- **2.3.** Usa la forma abreviada de métodos (`method() {}`) y de propiedades
  (`{ name }`), y agrupa las abreviadas al principio del objeto.
- **2.4.** Pon comillas solo en las claves que no son identificadores válidos.
- **2.5.** No llames directamente a métodos de `Object.prototype` en la instancia; usa
  `Object.hasOwn(obj, key)`.
- **2.6.** Para copias superficiales usa spread (`{ ...obj }`) en vez de `Object.assign`.
  Para omitir propiedades usa rest (`const { a, ...rest } = obj`).

### 3. Arrays

- **3.1.** Crea arrays con literal (`[]`), nunca con `new Array()`.
- **3.2.** Añade elementos con `push`, no por asignación de índice.
- **3.3.** Copia arrays con spread (`[...items]`).
- **3.4.** Convierte iterables con spread y array-likes con `Array.from`.
- **3.5.** Para mapear un iterable usa `Array.from(iterable, fn)` en vez de spread + `map`.
- **3.6.** Los callbacks de métodos de array (`map`, `filter`, `reduce`...) siempre
  devuelven un valor.
- **3.7.** Si un array ocupa varias líneas, salta de línea tras `[` y antes de `]`.

### 4. Desestructuración

- **4.1.** Desestructura objetos cuando uses varias de sus propiedades.
- **4.2.** Usa desestructuración de arrays cuando proceda.
- **4.3.** Para devolver varios valores, devuelve un objeto, no un array.

### 5. Strings

- **5.1.** Usa comillas simples `'...'` (en atributos JSX, dobles; ver 18.7).
- **5.2.** No partas strings largos concatenando líneas.
- **5.3.** Construye strings con template literals, no concatenando con `+`.
- **5.4.** Nunca uses `eval()`.
- **5.5.** No escapes caracteres innecesariamente.

### 6. Funciones

- **6.1.** La guía recomienda expresiones de función con nombre en vez de declaraciones.
  En este proyecto, los componentes y las funciones de módulo se escriben como
  declaraciones (`function Name() {}`), y los callbacks como funciones flecha.
- **6.2.** Envuelve las IIFE entre paréntesis.
- **6.3.** No declares funciones dentro de bloques que no sean funciones (`if`, `while`...).
- **6.4.** Nunca llames `arguments` a un parámetro ni uses el objeto `arguments`: usa
  rest (`...args`).
- **6.5.** Usa parámetros por defecto en vez de mutar argumentos. No metas efectos
  secundarios en ellos y ponlos siempre al final.
- **6.6.** Nunca uses el constructor `Function`.
- **6.7.** Nunca mutes ni reasignes parámetros.
- **6.8.** Usa spread (`fn(...args)`) en vez de `apply`.
- **6.9.** En firmas o llamadas multilínea, pon cada argumento en su línea con coma final.
- **6.10.** Espaciado: `function name() {` (sin espacio antes de `(`, con espacio antes de `{`).

### 7. Funciones flecha

- **7.1.** Usa funciones flecha para las funciones anónimas (callbacks).
- **7.2.** Si el cuerpo es una sola expresión sin efectos secundarios, omite las llaves
  y usa retorno implícito. Si no, usa llaves y `return`.
- **7.3.** Si la expresión ocupa varias líneas, envuélvela entre paréntesis.
- **7.4.** Pon siempre paréntesis en los argumentos: `(x) => x * 2`.
- **7.5.** No confundas `=>` con comparaciones (`<=`, `>=`); usa paréntesis para aclarar.
- **7.6.** El cuerpo de retorno implícito va en la misma línea que la flecha o entre
  paréntesis.

### 8. Clases

- **8.1.** Usa `class`, nunca manipules `prototype` directamente.
- **8.2.** Hereda con `extends`.
- **8.3.** Los métodos pueden devolver `this` para encadenar llamadas.
- **8.4.** No escribas constructores vacíos o que solo llamen a `super`.
- **8.5.** No dupliques miembros de clase.
- **8.6.** Los métodos de clase deben usar `this`; si no, conviértelos en `static` o en
  funciones sueltas.

### 9. Módulos

- **9.1.** Usa siempre `import`/`export` de ES modules.
- **9.2.** No uses imports comodín (`import * as`) salvo en librerías que lo requieren
  (p. ej. `three`).
- **9.3.** No reexportes directamente desde un import (`export { x } from`).
- **9.4.** Importa cada ruta una sola vez.
- **9.5.** No exportes bindings mutables (`export let`).
- **9.6.** Si un módulo exporta una sola cosa, usa `export default`.
- **9.7.** Todos los `import` van al principio del fichero.
- **9.8.** Los imports multilínea se indentan como un objeto, un nombre por línea.
- **9.9.** No uses sintaxis de loaders de webpack en los imports.
- **9.10.** No pongas extensión `.js`/`.jsx` en los imports de ficheros propios.

### 10. Iteradores y generadores

- **10.1.** Prefiere funciones de orden superior (`map`, `filter`, `reduce`, `some`,
  `find`, `Object.keys/values/entries`...) a bucles `for...in` y `for...of`.
- **10.2.** No uses generadores.

### 11. Propiedades

- **11.1.** Accede a propiedades con punto (`obj.name`).
- **11.2.** Usa corchetes solo con claves variables (`obj[key]`).
- **11.3.** Usa `**` en vez de `Math.pow`.

### 12. Comparaciones e igualdad

- **12.1.** Usa siempre `===` y `!==`.
- **12.2.** Usa atajos solo con booleanos (`if (isValid)`). Con strings y números compara
  explícitamente (`if (name !== '')`, `if (items.length > 0)`).
- **12.3.** En `case`/`default` con declaraciones léxicas, usa llaves.
- **12.4.** No anides ternarios y mantenlos en una línea.
- **12.5.** Evita ternarios innecesarios (`x ? true : false` → `Boolean(x)`,
  `a ? a : b` → `a || b`).
- **12.6.** Si mezclas operadores de distinta precedencia, pon paréntesis.
- **12.7.** Usa `??` solo para distinguir `null`/`undefined` de otros valores falsy.

### 13. Bloques y control de flujo

- **13.1.** Usa llaves en todos los bloques multilínea.
- **13.2.** `else` en la misma línea que la llave de cierre del `if`.
- **13.3.** Si un `if` siempre hace `return`, no pongas `else`.
- **13.4.** En condiciones largas, cada grupo va en su línea y el operador al principio
  de la línea.
- **13.5.** No uses `&&`/`||` como sustituto de un `if` (`isReady && run()`).

### 14. Comentarios

- **14.1.** Usa `/** ... */` para comentarios multilínea.
- **14.2.** Usa `//` para comentarios de una línea, encima de lo que comentan, con una
  línea en blanco antes (salvo si es lo primero del bloque).
- **14.3.** Deja un espacio tras `//` y tras `/**`.
- **14.4.** Marca los problemas con `// FIXME:` y lo pendiente con `// TODO:`.

### 15. Espacios y formato

- **15.1.** Indenta con 2 espacios.
- **15.2.** Pon un espacio antes de `{` en bloques y declaraciones.
- **15.3.** Pon un espacio antes de `(` en `if`, `while`, `for`... No pongas espacio
  entre el nombre de una función y `(` al declararla o llamarla.
- **15.4.** Pon espacios alrededor de los operadores.
- **15.5.** Termina cada fichero con un único salto de línea.
- **15.6.** En cadenas de más de 2 llamadas, pon una por línea con el `.` delante.
- **15.7.** Deja una línea en blanco tras un bloque y antes de la siguiente sentencia.
- **15.8.** No rellenes bloques con líneas en blanco al principio o al final.
- **15.9.** No dejes varias líneas en blanco seguidas.
- **15.10.** Sin espacios dentro de paréntesis ni de corchetes; con espacios dentro de
  llaves (`{ a }`).
- **15.11.** Longitud máxima de línea: **100 caracteres**.
- **15.12.** Sin espacio antes de coma y con espacio después.
- **15.13.** `clave: valor` con un espacio tras los dos puntos y ninguno antes.
- **15.14.** No dejes espacios al final de línea.

### 16. Comas y punto y coma

- **16.1.** Nada de comas al principio de línea.
- **16.2.** Coma final en todo literal, lista de parámetros o import multilínea.
- **16.3.** **Pon siempre punto y coma** al final de las sentencias.

### 17. Conversión de tipos y nombres

- **17.1.** Conversiones explícitas: `String(x)`, `Number(x)`, `parseInt(x, 10)` (siempre
  con base), `Boolean(x)`.
- **17.2.** Usa `Number.isNaN` y `Number.isFinite` en vez de los globales `isNaN` e
  `isFinite`.
- **17.3.** Nombres descriptivos: evita variables de una sola letra.
- **17.4.** `camelCase` para variables, funciones e instancias. `PascalCase` para clases
  y componentes.
- **17.5.** Sin guiones bajos al principio ni al final de los nombres.
- **17.6.** No guardes referencias a `this` (`const self = this`); usa funciones flecha.
- **17.7.** El nombre del fichero coincide con su export por defecto.
- **17.8.** Las siglas van enteras en mayúsculas o enteras en minúsculas (`loadSTL` o
  `stl`, nunca `Stl` a medias).
- **17.9.** `UPPER_SNAKE_CASE` solo para constantes exportadas que no se mutan.
- **17.10.** Booleanos con prefijo `is`/`has` (`isVisible`, `hasPieces`).
- **17.11.** No uses getters/setters de JS (`get x()`); si hacen falta, usa métodos
  `getX()`/`setX()`.
- **17.12.** Los eventos llevan como payload un objeto, no un valor suelto.

### 18. React / JSX

- **18.1.** Un componente por fichero, sin excepciones. Airbnb admite varios componentes
  sin estado por fichero; en este proyecto no (ver "Estructura de carpetas").
- **18.2.** Usa siempre JSX, no `React.createElement`.
- **18.3.** Usa componentes de función con hooks. La guía original, anterior a los hooks,
  habla de clases; aquí no se usan clases.
- **18.4.** No uses mixins.
- **18.5.** Los ficheros de componentes llevan extensión `.jsx` y se nombran en
  `PascalCase`, igual que el componente. El componente raíz de una carpeta se
  llama como ella, no `index.jsx`.
- **18.6.** Las props van en `camelCase` y no reutilizan nombres de atributos DOM para
  otra cosa (`style`, `className`...).
- **18.7.** En atributos JSX, comillas dobles; en el resto de JS, simples.
- **18.8.** Un espacio antes del cierre de las etiquetas autocerradas (`<Viewer />`) y
  ninguno dentro de las llaves (`{value}`).
- **18.9.** Si una prop es `true`, omite el valor (`<input hidden />`).
- **18.10.** Autocierra las etiquetas sin hijos.
- **18.11.** Si un elemento lleva props en varias líneas, pon una prop por línea y alinea
  el cierre con la etiqueta de apertura.
- **18.12.** Envuelve el JSX multilínea entre paréntesis.
- **18.13.** No uses el índice del array como `key`.
- **18.14.** Usa el spread de props con moderación.
- **18.15.** Accesibilidad: `alt` en toda `<img>` (sin las palabras "image" o "photo"),
  roles ARIA válidos y nada de `accessKey`.
- **18.16.** Para las props opcionales, usa valores por defecto en la desestructuración
  (sustituye a `defaultProps`).
- **18.17.** Usa `useRef` para las refs; nunca refs de string.
