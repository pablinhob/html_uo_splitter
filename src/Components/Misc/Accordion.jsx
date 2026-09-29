export default function Accordion({ title, expanded, enabled, onToggle, children }) {
  return (
    <section className={`accordion${expanded ? ' expanded' : ''}`}>
      <button
        type="button"
        className="accordion-header"
        disabled={!enabled}
        aria-expanded={expanded}
        onClick={onToggle}
      >
        <span className="arrow" aria-hidden="true">
          {expanded ? '▼' : '▶'}
        </span>
        {title}
      </button>
      {expanded && <div className="accordion-body">{children}</div>}
    </section>
  );
}
