import { useEffect, useRef, useState } from 'react';

const disposeAll = (objects) => objects.forEach(({ geometry }) => geometry.dispose());

/**
 * Lista de objetos del visor ([{ geometry, ... }]) cuyo dueño es el componente:
 * `replace(next)` libera las geometrías anteriores, y las que quedan se liberan
 * al desmontar. Devuelve [objects, replace].
 */
export default function useViewerGeometries() {
  const [objects, setObjects] = useState([]);
  const currentRef = useRef([]);

  useEffect(() => () => disposeAll(currentRef.current), []);

  const replace = (next) => {
    disposeAll(currentRef.current);
    currentRef.current = next;
    setObjects(next);
  };

  return [objects, replace];
}
