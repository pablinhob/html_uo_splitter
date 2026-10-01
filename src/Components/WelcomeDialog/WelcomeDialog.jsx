import { useEffect, useRef } from 'react';
import { BRAND } from '../../config';
import useWelcomeOnce from '../../Hooks/useWelcomeOnce';
import WelcomeScene from './WelcomeScene';

/**
 * Ventana de bienvenida con la escena animada y la carta de presentación. Sale una
 * sola vez por sesión del navegador (useWelcomeOnce); Escape también la cierra.
 */
export default function WelcomeDialog() {
  const { isOpen, close } = useWelcomeOnce();
  const dialogRef = useRef(null);

  useEffect(() => {
    const element = dialogRef.current;
    if (isOpen && !element.open) element.showModal();
    if (!isOpen && element.open) element.close();
  }, [isOpen]);

  return (
    <dialog
      className="welcome-dialog"
      ref={dialogRef}
      onClose={close}
      aria-labelledby="welcome-title"
    >
      <WelcomeScene />
      <div className="welcome-content">
        <h2 id="welcome-title" className="welcome-title">
          {`Welcome to the ${BRAND.name} Surfboard Splitter`}
        </h2>
        <p>
          Drawing on my experience building surfboards in unconventional ways, I&apos;ve decided to
          share my construction models as software, so you can use them in your own shapes.
        </p>
        <p>
          It&apos;s completely free. Make the most of it: give away or sell your own models, I
          don&apos;t mind.
        </p>
        <p>If you can, share it with other shapers, bring your ideas, or chip in a donation.</p>
        <p className="welcome-signature">Pablo</p>
        <footer>
          <button type="button" className="welcome-button" onClick={close}>
            START SHAPING
          </button>
        </footer>
      </div>
    </dialog>
  );
}
