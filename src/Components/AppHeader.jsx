import { useState } from 'react';
import { BRAND } from '../config';
import logger from '../Helpers/logger';

/**
 * Cabecera fina con la imagen de Ula Ola: logo, nombre y lema a la izquierda, en
 * blanco y con una tipografía geométrica que acompaña al logo "UO", y la ruta de la app al estilo terminal a la derecha.
 */
export default function AppHeader() {
  const [hasLogo, setHasLogo] = useState(true);
  const hasSite = BRAND.siteURL !== '';

  const onLogoError = () => {
    logger.warning(`Brand logo not found at ${BRAND.logoPath}`);
    setHasLogo(false);
  };

  // Lema: "Ula Ola – Unusual surf", junto al logo y separado por una línea fina.
  const brand = (
    <span className="brand-logo">
      {hasLogo && <img src={BRAND.logoPath} alt="" onError={onLogoError} />}
      {hasLogo && <span className="brand-divider" aria-hidden="true" />}
      <span className="brand-name">{BRAND.name}</span>
      <span className="brand-tagline">
        <span aria-hidden="true">– </span>
        {BRAND.tagline}
      </span>
    </span>
  );

  return (
    <header className="app-header">
      <div className="brand">
        {hasSite ? (
          <a href={BRAND.siteURL} target="_blank" rel="noopener noreferrer">
            {brand}
          </a>
        ) : (
          brand
        )}
      </div>
      <span className="app-path">
        <span className="app-prompt">&gt;_</span> {BRAND.appPath}
        <span className="app-cursor" aria-hidden="true" />
      </span>
    </header>
  );
}
