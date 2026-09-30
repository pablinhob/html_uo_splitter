/**
 * Barra inferior del asistente: "← anterior" a la izquierda y "siguiente →" a
 * la derecha. Cada acción es { label, onClick, isDisabled? } o null si no hay.
 */
export default function StepNavigation({ back, next, isBusy }) {
  return (
    <nav className="step-navigation" aria-label="Step navigation">
      {back !== null && (
        <button type="button" className="step-back" disabled={isBusy} onClick={back.onClick}>
          {`← ${back.label}`}
        </button>
      )}
      {next !== null && (
        <button
          type="button"
          className="step-next"
          disabled={isBusy || next.isDisabled === true}
          onClick={next.onClick}
        >
          {`${next.label} →`}
        </button>
      )}
    </nav>
  );
}
