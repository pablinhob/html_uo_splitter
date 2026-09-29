import { useState } from 'react';
import logger from '../Helpers/logger';

// Apertura de la ventana "Export hollowing" (on_export_hollow de main_window.py).
export default function useExportDialog(pieces) {
  const [isOpen, setIsOpen] = useState(false);

  const open = () => {
    if (pieces.length === 0) {
      logger.warning('Nothing to export, run a preview first');
      return;
    }
    logger.info('Exporting hollowing for all pieces...');
    setIsOpen(true);
  };

  return { isOpen, open, close: () => setIsOpen(false) };
}
