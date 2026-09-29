import { useEffect, useRef, useState } from 'react';
import logger from '../../Helpers/logger';

export default function LogConsole() {
  const [lines, setLines] = useState([]);
  const ref = useRef(null);

  useEffect(() => logger.subscribe((all) => setLines([...all])), []);

  useEffect(() => {
    const element = ref.current;
    if (element) element.scrollTop = element.scrollHeight;
  }, [lines]);

  return (
    <pre className="log-console" ref={ref}>
      {lines.join('\n')}
    </pre>
  );
}
