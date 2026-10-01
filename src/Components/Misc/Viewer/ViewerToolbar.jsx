// Caras de un cubo isométrico (24 × 24). Con la cámara en (1, 1, 1) y Z arriba,
// la cara izquierda mira a +X y la derecha a +Y.
const cubeFaces = {
  top: 'M12 3l8 4.5-8 4.5-8-4.5z',
  left: 'M4 7.5l8 4.5v9l-8-4.5z',
  right: 'M20 7.5v9l-8 4.5v-9z',
};

// Icono de cubo con la cara de la vista rellena.
const cubeIcon = (filledFace) =>
  Object.entries(cubeFaces).map(([face, pathData]) => ({
    pathData,
    isFilled: face === filledFace,
  }));

/**
 * Botones del gestor de cámara; cada id es una vista de viewDirection
 * (viewerCamera.js). Los iconos son trazos SVG de 24 × 24.
 */
const viewButtons = [
  { id: 'x', title: 'Side view along the X axis', paths: cubeIcon('left') },
  { id: 'y', title: 'Side view along the Y axis', paths: cubeIcon('right') },
  { id: 'z', title: 'Top view along the Z axis', paths: cubeIcon('top') },
  {
    id: 'fit',
    title: 'Fit the whole board (isometric view)',
    paths: [{ pathData: 'M4 9V4h5M15 4h5v5M20 15v5h-5M9 20H4v-5', isFilled: false }],
  },
];

// Barra del gestor de cámara sobre el visor. onView({ viewId }) cambia de vista.
export default function ViewerToolbar({ onView }) {
  return (
    <div className="viewer-toolbar" role="toolbar" aria-label="Camera">
      {viewButtons.map(({ id, title, paths }) => (
        <button
          key={id}
          type="button"
          title={title}
          aria-label={title}
          onClick={() => onView({ viewId: id })}
        >
          <svg viewBox="0 0 24 24" aria-hidden="true">
            {paths.map(({ pathData, isFilled }) => (
              <path key={pathData} d={pathData} className={isFilled ? 'filled' : undefined} />
            ))}
          </svg>
        </button>
      ))}
    </div>
  );
}
