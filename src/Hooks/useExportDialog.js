import { useState } from 'react';
import logger from '../Helpers/logger';
import { geometryFromMeshData } from '../Helpers/meshData';
import { keyId, pieceColor } from '../Helpers/pieces';
import useViewerGeometries from './useViewerGeometries';

const processingStatus = 'Processing hollowing for every piece, this may take a while...';

// Descarga unos bytes como fichero (enlace temporal; el DOM solo se toca aquí).
function downloadFile({ fileName, mimeType, bytes }) {
  const url = URL.createObjectURL(new Blob([bytes], { type: mimeType }));
  const link = Object.assign(document.createElement('a'), { href: url, download: fileName });
  link.click();
  URL.revokeObjectURL(url);
}

const toViewerObjects = (pieces) =>
  pieces.map(({ key, meshData }) => ({
    key: keyId(key),
    geometry: geometryFromMeshData(meshData),
    color: pieceColor(key),
    edges: true,
    frame: true,
  }));

/**
 * Ventana "Export hollowing" (on_export_hollow de main_window.py y
 * export_window.py). Al abrirse, el Worker vacía todas las piezas, resta los plugs
 * y añade los soportes; después `exportFile(format)` descarga el fichero.
 * params: { hollow, plugs }. Devuelve el objeto que recibe ExportDialog:
 * { isOpen, status, objects, isReady, open, exportFile(format), close }.
 */
export default function useExportDialog(geometryWorker, pieces, params) {
  const [isOpen, setIsOpen] = useState(false);
  const [status, setStatus] = useState(processingStatus);
  const [objects, replaceObjects] = useViewerGeometries();

  const open = async () => {
    if (pieces.length === 0) {
      logger.warning('Nothing to export, run a preview first');
      return;
    }
    logger.info('Exporting hollowing for all pieces...');
    replaceObjects([]);
    setStatus(processingStatus);
    setIsOpen(true);
    try {
      const result = await geometryWorker.request(
        'processExport',
        { params },
        { onProgress: setStatus },
      );
      result.warnings.forEach((warning) => logger.error(warning));
      replaceObjects(toViewerObjects(result.pieces));
      setStatus(`Done: ${pieces.length} pieces, hollowing applied where allowed.`);
      logger.info(`Export hollowing complete: ${pieces.length} pieces`);
    } catch (error) {
      setStatus('Processing failed, see log for details.');
      logger.error(`Could not process the export: ${error.message}`);
    }
  };

  const exportFile = async ({ label, fileType }) => {
    try {
      const file = await geometryWorker.request('exportFile', { fileType });
      downloadFile(file);
      setStatus(`Exported ${file.pieceCount} pieces to ${file.fileName}`);
      logger.info(`Exported ${label}: ${file.fileName}`);
    } catch (error) {
      setStatus('Export failed, see log for details.');
      logger.error(`Could not export ${label} file: ${error.message}`);
    }
  };

  const close = () => {
    setIsOpen(false);
    replaceObjects([]);
  };

  return { isOpen, status, objects, isReady: objects.length > 0, open, exportFile, close };
}
