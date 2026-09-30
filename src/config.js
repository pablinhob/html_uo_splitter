// Portado de _legacy/.../app/config.py
export const VIEWER_BACKGROUND_COLOR = '#1a1a1a';
export const BOUNDING_BOX_EDGE_COLOR = '#aaaaaa';
export const SPLIT_EDGE_COLOR = '#000000';
export const BOARD_COLOR = '#ffffff';
export const STRINGER_COLOR = '#deb887';
export const CUTLAP_COLOR = '#dceac2';
export const PLUG_SUPPORT_COLOR = '#bcc0c4';
export const PLUG_MARKER_COLOR = '#008000';

// Cada rango: { min, max, default }
export const PIECE_RADIUS_MM = { min: 40, max: 300, default: 100 };
export const STRINGER_WIDTH_MM = { min: 4, max: 20, default: 4 };
export const CUTLAP_WIDTH_MM = { min: 5, max: 50, default: 20 };

export const WALL_WIDTH_MM = { min: 0.1, max: 10.0, default: 0.6 };
export const TOP_WIDTH_MM = { min: 0.0, max: 10.0, default: 0.0 };
export const BOTTOM_WIDTH_MM = { min: 0.0, max: 10.0, default: 0.0 };
export const HOLE_RADIUS_PCT = { min: 0, max: 80, default: 50 };

export const LEASH_PLUG_DIAMETER_MM = { min: 5, max: 60, default: 26 };
export const LEASH_PLUG_DEPTH_MM = { min: 1, max: 100, default: 20 };
export const LEASH_PLUG_TAIL_DISTANCE_MM = { min: 0, max: 2000, default: 60 };
export const LEASH_PLUG_CENTER_MM = { min: -40, max: 40, default: 0 };

export const FIN_SINGLE_BOX_LONG_MM = { min: 5, max: 400, default: 267 };
export const FIN_SINGLE_BOX_WIDTH_MM = { min: 10, max: 30, default: 26 };
export const FIN_SINGLE_BOX_DEPTH_MM = { min: 10, max: 40, default: 26 };
export const FIN_SINGLE_TAIL_DISTANCE_MM = { min: 0, max: 1000, default: 250 };

export const FIN_TWIN_TAIL_DISTANCE_MM = { min: 0, max: 1000, default: 150 };
export const FIN_TWIN_CENTER_DISTANCE_MM = { min: 0, max: 400, default: 200 };
// Toe-in: cuánto se inclina cada quilla twin hacia la línea central (grados).
export const FIN_TWIN_ANGLE_DEG = { min: -30, max: 30, default: 4 };

// Tamaño fijo del prisma de los marcadores twin fin (sin inputs propios aún).
export const FIN_TWIN_BOX_LONG_MM = 120;
export const FIN_TWIN_BOX_WIDTH_MM = 20;

// Soporte sólido alrededor de cada cavidad de plug (material para taladrar).
export const PLUG_HOLES_SOLID_CONTOUR_MM = 4;
export const PLUG_HOLES_SOLID_BOTTOM_MM = 2;

// Opciones de los selectores
export const SPLIT_SHAPES = ['Hexagon', 'Triangle'];
export const FIN_TYPES = [
  { value: 'single', label: 'Single Fin' },
  { value: 'twin', label: 'Twin Fin' },
];

// Valores iniciales de los paneles (unidad en cada nombre: mm, grados o %)
export const DEFAULT_PLUGS = {
  leash: {
    diameterMm: LEASH_PLUG_DIAMETER_MM.default,
    depthMm: LEASH_PLUG_DEPTH_MM.default,
    tailDistanceMm: LEASH_PLUG_TAIL_DISTANCE_MM.default,
    centerMm: LEASH_PLUG_CENTER_MM.default,
  },
  fin: {
    type: 'single',
    singleBoxLongMm: FIN_SINGLE_BOX_LONG_MM.default,
    singleBoxWidthMm: FIN_SINGLE_BOX_WIDTH_MM.default,
    singleBoxDepthMm: FIN_SINGLE_BOX_DEPTH_MM.default,
    singleTailDistanceMm: FIN_SINGLE_TAIL_DISTANCE_MM.default,
    twinTailDistanceMm: FIN_TWIN_TAIL_DISTANCE_MM.default,
    twinCenterDistanceMm: FIN_TWIN_CENTER_DISTANCE_MM.default,
    twinAngleDeg: FIN_TWIN_ANGLE_DEG.default,
  },
};

export const DEFAULT_SPLIT = {
  shape: SPLIT_SHAPES[0],
  pieceRadiusMm: PIECE_RADIUS_MM.default,
  stringerWidthMm: STRINGER_WIDTH_MM.default,
  cutlapWidthMm: CUTLAP_WIDTH_MM.default,
};

export const DEFAULT_HOLLOW = {
  wallMm: WALL_WIDTH_MM.default,
  topMm: TOP_WIDTH_MM.default,
  bottomMm: BOTTOM_WIDTH_MM.default,
  holePct: HOLE_RADIUS_PCT.default,
};

// Conversión de unidades (la unidad interna es el milímetro)
export const MM_PER_CM = 10;
export const CM3_PER_LITER = 1000;

// Visor 3D
export const GHOST_COLOR = '#808080';
export const GHOST_OPACITY = 0.1;
export const CORNER_BRACKET_FRACTION = 0.12;
export const FEATURE_EDGE_ANGLE_DEG = 30;
// Sombreado: las caras que se encuentran con más ángulo que este se ven con arista
// viva (normales separadas); por debajo se suavizan. Igual que las aristas dibujadas.
export const SHADING_CREASE_ANGLE_DEG = FEATURE_EDGE_ANGLE_DEG;
export const VIEWER_FOV_DEG = 30;
export const VIEWER_SKY_LIGHT = { skyColor: 0xffffff, groundColor: 0x444444, intensity: 1.2 };
export const VIEWER_HEADLIGHT_INTENSITY = 1.8;
// Planos de recorte de la cámara, relativos a la distancia al objeto encuadrado.
export const VIEWER_NEAR_FACTOR = 0.01;
export const VIEWER_FAR_FACTOR = 100;

// Formatos de exportación, en orden de aparición; OBJ primero para que sea el de por
// defecto. En la web el OBJ se descarga en un .zip junto con su .mtl de colores.
export const EXPORT_FORMATS = [
  { label: 'OBJ + MTL (zip)', fileType: 'obj' },
  { label: '3MF', fileType: '3mf' },
];

// Reparación de mallas no cerradas: distancia máxima (mm) a la que se fusionan
// vértices de aristas abiertas si la tolerancia por defecto de manifold no basta.
export const MESH_REPAIR_TOLERANCE_MM = 0.01;

// Modelos de ejemplo para probar la app sin un STL propio. Viven en public/, así
// que se descargan por HTTP del propio proyecto (rutas relativas a la base de Vite).
// Los previews se generan con `npm run previews` (tools/previews/renderPreviews.js).
export const EXAMPLE_MODELS = [
  {
    label: 'Cobra',
    fileName: 'Cobra.stl',
    path: 'examples/Cobra.stl',
    previewPath: 'examples/CobraPreview.png',
  },
  {
    label: 'Mini Simmons',
    fileName: 'MiniSimmons.stl',
    path: 'examples/MiniSimmons.stl',
    previewPath: 'examples/MiniSimmonsPreview.png',
  },
];

// Previews de los ejemplos: PNG cuadrado de este lado (px).
export const EXAMPLE_PREVIEW_SIZE_PX = 256;

// Cabecera con la imagen de Ula Ola (misma línea que la web principal). El logo "UO"
// es img/logos/blanco_transparente_recortado.png de la web antigua
// (github.com/pablinhob/ulaolaweb): blanco sobre transparente, para fondo oscuro.
// TODO: poner la URL de la web principal; sin ella, la marca no es un enlace.
export const BRAND = {
  name: 'Ula Ola',
  tagline: 'Unusual surf',
  logoPath: 'brand/ulaola-logo.png',
  siteURL: '',
  appPath: '~/software/uo-splitter',
};

// Banner de donaciones al pie del panel izquierdo.
// TODO: poner el enlace real de la página de donaciones.
export const DONATION_URL = '';

// Colores del pixel art del banner. Cada letra es un píxel en los sprites de
// Helpers/donationScene.js.
export const DONATION_SPRITE_PALETTE = {
  W: '#fff8e7', // tabla
  R: '#ff3d7f', // canto de la tabla
  F: '#1d1d3b', // quillas
  H: '#ffe03d', // pelo
  S: '#f4a261', // piel
  K: '#111111', // gafas de sol
  L: '#ffffff', // brillo de las gafas
  T: '#8338ec', // camiseta
  B: '#06d6a0', // bañador
  Y: '#ffd23f', // sol
  O: '#f77f00', // mejillas y sonrisa del sol
  G: '#5c677d', // aleta del tiburón
  D: '#2b2d42', // gaviota
};

export const DONATION_SCENE_COLORS = {
  sky: ['#2f6fdf', '#4b93f2', '#7cbcff', '#bfe3ff'],
  waveBack: '#35d0e0',
  waveMiddle: '#1497d6',
  waveFront: '#0a5aa8',
  foam: '#ffffff',
};

// --- Plugs (plug_subtraction_geometries.py / plug_position.py) ---------------

// Holgura añadida alrededor de cada cavidad para el inserto y el pegamento.
export const PLUG_GLUE_CLEARANCE_MM = 0.2;
// Segmentos por cuarto de arco en los contornos redondeados (resolution de shapely).
export const PLUG_ARC_SEGMENTS_PER_QUARTER = 24;
// Segmentos por cuarto de arco al ensanchar un contorno (buffer por defecto de shapely).
export const PLUG_OFFSET_SEGMENTS_PER_QUARTER = 16;

// Caja Futures: medidas APROXIMADAS de fresado (verificar con la plantilla oficial
// antes de cortar tablas reales). Dos niveles con forma de estadio: una pestaña
// poco profunda algo más ancha y larga, y debajo el cuerpo hasta el fondo.
export const FUTURES_BODY_LENGTH_MM = 122.0;
export const FUTURES_BODY_WIDTH_MM = 11.0;
export const FUTURES_FLANGE_MARGIN_MM = 2.0;
export const FUTURES_FLANGE_DEPTH_MM = 4.0;
export const FUTURES_DEPTH_SIDE_MM = 16.0;

// Caja de quilla central: aristas verticales redondeadas con este radio.
export const SINGLE_FIN_CORNER_RADIUS_MM = 6.0;

// Los marcadores sobresalen esto de la superficie para que se vea la zona a fresar.
export const MARKER_PROTRUSION_MM = 0.1;
// Al restar las cavidades de verdad, sobresalen esto para que la booleana corte limpio.
export const SUBTRACTION_MARGIN_MM = 1.0;

// --- Split (mesh_ops.py, polygon_grid.py, cutlap.py) --------------------------

// Los prismas de corte sobresalen esto por arriba y por abajo del grosor de la tabla.
export const SPLIT_PRISM_MARGIN_MM = 1.0;
// Distancia máxima a un plano de corte para considerar una cara parte de su tapa.
// Python usa 1e-4 con float64; aquí los vértices llegan en float32, de ahí el margen.
export const SPLIT_PLANE_TOLERANCE_MM = 1e-3;
// Distancia máxima al contorno interior del cutlap (touches_boundary / _boundary_outline).
export const CUTLAP_BOUNDARY_TOLERANCE_MM = 1e-2;
// Distancia al borde de cada mitad para decidir qué piezas tocan el corte central.
export const SPLIT_BORDER_TOLERANCE_MM = 1e-3;
// Segmentos por cuarto de arco al encoger la huella para el cutlap (buffer de shapely).
export const CUTLAP_OFFSET_SEGMENTS_PER_QUARTER = 16;

// --- Vaciado (hollow.py) -------------------------------------------------------

// Segmentos del contorno de los agujeros laterales.
export const FACE_HOLE_SECTIONS = 48;
// El cilindro del agujero sobresale esto por fuera de la pared y entra esto dentro.
export const DRILL_OUTER_MARGIN_MM = 1.0;
export const DRILL_INNER_MARGIN_MM = 5.0;
// Simplificación de la sección de la pieza antes de repartir agujeros por cara.
export const COLLINEAR_TOLERANCE_MM = 0.1;
// La altura local se mide este tanto hacia dentro de la cara.
export const HEIGHT_SAMPLE_INSET_MM = 1.0;
// Simplificación de la huella encogida antes de extruir la cavidad.
export const FOOTPRINT_SIMPLIFY_MM = 0.1;
// Segmentos por cuarto de arco al encoger la huella (buffer de shapely).
export const HOLLOW_OFFSET_SEGMENTS_PER_QUARTER = 16;

// --- Exportación (export_window.py) ---------------------------------------------

// Nombre base de los ficheros exportados (como el "surfboard_pieces" del original).
export const EXPORT_FILE_BASENAME = 'surfboard_pieces';
// Componentes ambiente y especular de los materiales del .mtl (los de trimesh).
export const EXPORT_MATERIAL_AMBIENT = [0.4, 0.4, 0.4];
export const EXPORT_MATERIAL_SPECULAR = [0.4, 0.4, 0.4];
