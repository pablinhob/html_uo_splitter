import { useState } from 'react';
import { WELCOME_SEEN_STORAGE_KEY } from '../config';
import logger from '../Helpers/logger';

// sessionStorage puede fallar (navegación privada estricta, almacenamiento bloqueado).
function hasSeenWelcome() {
  try {
    return window.sessionStorage.getItem(WELCOME_SEEN_STORAGE_KEY) === 'true';
  } catch (error) {
    logger.error(`Could not read the welcome flag from sessionStorage: ${error.message}`);
    return false;
  }
}

function markWelcomeSeen() {
  try {
    window.sessionStorage.setItem(WELCOME_SEEN_STORAGE_KEY, 'true');
  } catch (error) {
    logger.error(`Could not save the welcome flag to sessionStorage: ${error.message}`);
  }
}

/**
 * Ventana de bienvenida, una vez por sesión del navegador: se marca como vista al
 * cerrarla, y vuelve a salir al abrir el programa en otra pestaña o ventana.
 * Devuelve { isOpen, close }.
 */
export default function useWelcomeOnce() {
  const [isOpen, setIsOpen] = useState(() => !hasSeenWelcome());

  const close = () => {
    markWelcomeSeen();
    setIsOpen(false);
  };

  return { isOpen, close };
}
