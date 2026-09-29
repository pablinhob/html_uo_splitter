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
export const VIEWER_FOV_DEG = 30;
export const VIEWER_SKY_LIGHT = { skyColor: 0xffffff, groundColor: 0x444444, intensity: 1.2 };
export const VIEWER_HEADLIGHT_INTENSITY = 1.8;
// Planos de recorte de la cámara, relativos a la distancia al objeto encuadrado.
export const VIEWER_NEAR_FACTOR = 0.01;
export const VIEWER_FAR_FACTOR = 100;

// Aviso de las acciones cuya lógica geométrica (core/) aún no está migrada.
export const NOT_MIGRATED_MESSAGE = 'not migrated yet (core geometry pending)';

// Formatos de exportación, en orden de aparición; OBJ primero para que sea el de por defecto.
export const EXPORT_FORMATS = [
  { label: 'OBJ', fileType: 'obj', suffix: '.obj', colors: true },
  { label: '3MF', fileType: '3mf', suffix: '.3mf', colors: false },
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
