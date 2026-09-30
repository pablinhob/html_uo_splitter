import FinPlugPanel from './FinPlugPanel/FinPlugPanel';
import LeashPlugPanel from './LeashPlugPanel';

export default function PlugsSetupPanel({ value, onChange }) {
  return (
    <div className="panel">
      <LeashPlugPanel value={value.leash} onChange={(leash) => onChange({ ...value, leash })} />
      <FinPlugPanel value={value.fin} onChange={(fin) => onChange({ ...value, fin })} />
    </div>
  );
}
