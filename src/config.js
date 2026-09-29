// Portado de _legacy/.../app/config.py
export const VIEWER_BACKGROUND_COLOR = '#1a1a1a'
export const BOUNDING_BOX_EDGE_COLOR = '#aaaaaa'
export const SPLIT_EDGE_COLOR = '#000000'
export const BOARD_COLOR = '#ffffff'
export const STRINGER_COLOR = '#deb887'
export const CUTLAP_COLOR = '#dceac2'
export const PLUG_SUPPORT_COLOR = '#bcc0c4'
export const PLUG_MARKER_COLOR = '#008000'

// Cada rango: { min, max, default }
export const PIECE_RADIUS_MM = { min: 40, max: 300, default: 100 }
export const STRINGER_WIDTH_MM = { min: 4, max: 20, default: 4 }
export const CUTLAP_WIDTH_MM = { min: 5, max: 50, default: 20 }

export const WALL_WIDTH_MM = { min: 0.1, max: 10.0, default: 0.6 }
export const TOP_WIDTH_MM = { min: 0.0, max: 10.0, default: 0.0 }
export const BOTTOM_WIDTH_MM = { min: 0.0, max: 10.0, default: 0.0 }
export const HOLE_RADIUS_PCT = { min: 0, max: 80, default: 50 }

export const LEASH_PLUG_DIAMETER_MM = { min: 5, max: 60, default: 26 }
export const LEASH_PLUG_DEPTH_MM = { min: 1, max: 100, default: 20 }
export const LEASH_PLUG_TAIL_DISTANCE_MM = { min: 0, max: 2000, default: 60 }
export const LEASH_PLUG_CENTER_MM = { min: -40, max: 40, default: 0 }

export const FIN_SINGLE_BOX_LONG_MM = { min: 5, max: 400, default: 267 }
export const FIN_SINGLE_BOX_WIDTH_MM = { min: 10, max: 30, default: 26 }
export const FIN_SINGLE_BOX_DEPTH_MM = { min: 10, max: 40, default: 26 }
export const FIN_SINGLE_TAIL_DISTANCE_MM = { min: 0, max: 1000, default: 250 }

export const FIN_TWIN_TAIL_DISTANCE_MM = { min: 0, max: 1000, default: 150 }
export const FIN_TWIN_CENTER_DISTANCE_MM = { min: 0, max: 400, default: 200 }
// Toe-in: cuánto se inclina cada quilla twin hacia la línea central (grados).
export const FIN_TWIN_ANGLE_DEG = { min: -30, max: 30, default: 4 }

// Tamaño fijo del prisma de los marcadores twin fin (sin inputs propios aún).
export const FIN_TWIN_BOX_LONG_MM = 120
export const FIN_TWIN_BOX_WIDTH_MM = 20

// Soporte sólido alrededor de cada cavidad de plug (material para taladrar).
export const PLUG_HOLES_SOLID_CONTOUR_MM = 4
export const PLUG_HOLES_SOLID_BOTTOM_MM = 2
