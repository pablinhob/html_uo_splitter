import { EXAMPLE_MODELS } from '../../../config';
import ExampleButton from './ExampleButton';

// Modelos de ejemplo superpuestos al visor mientras no hay tabla cargada.
export default function ExampleOverlay({ onOpen }) {
  return (
    <div className="example-overlay">
      <h2>Open example</h2>
      <div className="example-list">
        {EXAMPLE_MODELS.map((example) => (
          <ExampleButton key={example.path} example={example} onOpen={onOpen} />
        ))}
      </div>
    </div>
  );
}
