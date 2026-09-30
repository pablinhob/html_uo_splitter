import StepIndicator from './StepIndicator';
import StepNavigation from './StepNavigation';

// Acción de ir a otro paso, o null si no existe o aún no está habilitado.
function goToAction(section, onStepChange) {
  if (section === undefined || !section.enabled) {
    return null;
  }

  return { label: section.label, onClick: () => onStepChange(section.id) };
}

/**
 * Asistente de pasos: indicador arriba, solo el paso actual visible y la
 * navegación anterior / siguiente abajo. Un paso puede sustituir el
 * "siguiente" por su propia acción (nextAction), como el split.
 *
 * - sections: [{ id, label, title, enabled, content, nextAction? }]
 * - nextAction: { label, onClick, isDisabled? }
 * - currentStep: id del paso actual, o null si aún no hay tabla
 */
export default function StepWizard({ sections, currentStep, onStepChange, isBusy }) {
  const currentIndex = sections.findIndex((section) => section.id === currentStep);
  const current = sections[currentIndex];
  const isActive = current !== undefined && current.enabled;

  return (
    <section className="step-wizard">
      <StepIndicator
        sections={sections}
        currentIndex={currentIndex}
        isBusy={isBusy}
        onSelect={onStepChange}
      />
      {isActive ? (
        <>
          <h2 className="step-title">
            <span className="step-count">{`Step ${currentIndex + 1} of ${sections.length}`}</span>
            {current.title}
          </h2>
          <div className="step-body">{current.content}</div>
          <StepNavigation
            back={goToAction(sections[currentIndex - 1], onStepChange)}
            next={current.nextAction ?? goToAction(sections[currentIndex + 1], onStepChange)}
            isBusy={isBusy}
          />
        </>
      ) : (
        <p className="step-placeholder">Open an STL file to start.</p>
      )}
    </section>
  );
}
