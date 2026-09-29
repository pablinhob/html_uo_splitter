import logger from '../Helpers/logger';

/**
 * Formas de abrir una tabla: un STL del equipo (evento del <input type="file">) o
 * uno de los modelos de ejemplo. Antes de cargar llama a onStart (reiniciar piezas y
 * pasos) y, si la carga va bien, a onLoaded.
 */
export default function useBoardOpening(board, { onStart, onLoaded }) {
  const openBoard = async (load) => {
    onStart();
    if (await load()) onLoaded();
  };

  const onFileInput = (event) => {
    const [file] = event.target.files;
    event.target.value = '';
    if (!file) {
      logger.info('STL loading cancelled');
      return;
    }
    openBoard(() => board.openSTL(file));
  };

  const openExample = (example) => openBoard(() => board.openExample(example));

  return { onFileInput, openExample };
}
