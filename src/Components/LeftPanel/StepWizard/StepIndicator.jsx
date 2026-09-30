// Estado visual de cada paso respecto al actual.
function stepStatus(index, currentIndex) {
  if (index === currentIndex) {
    return 'current';
  }

  return index < currentIndex ? 'done' : 'upcoming';
}

/**
 * Indicador de pasos: círculos numerados unidos por una línea. Los pasos
 * hechos muestran ✓ y todos los habilitados se pueden pulsar para saltar.
 */
export default function StepIndicator({ sections, currentIndex, isBusy, onSelect }) {
  return (
    <ol className="step-indicator">
      {sections.map((section, index) => {
        const status = stepStatus(index, currentIndex);
        return (
          <li key={section.id} className={`step-indicator-item ${status}`}>
            <button
              type="button"
              className="step-indicator-button"
              disabled={!section.enabled || isBusy}
              aria-current={status === 'current' ? 'step' : undefined}
              onClick={() => onSelect(section.id)}
            >
              <span className="step-indicator-circle" aria-hidden="true">
                {status === 'done' ? '✓' : index + 1}
              </span>
              <span className="step-indicator-label">{section.label}</span>
            </button>
          </li>
        );
      })}
    </ol>
  );
}
