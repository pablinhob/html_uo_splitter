import FinPlugPanel from './FinPlugPanel'
import LeashPlugPanel from './LeashPlugPanel'

export default function PlugsSetupPanel({ value, onChange, onContinue }) {
  return (
    <div className="panel">
      <LeashPlugPanel value={value.leash} onChange={(leash) => onChange({ ...value, leash })} />
      <FinPlugPanel value={value.fin} onChange={(fin) => onChange({ ...value, fin })} />
      <button type="button" onClick={onContinue}>
        Continue
      </button>
    </div>
  )
}
