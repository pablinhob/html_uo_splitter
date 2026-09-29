import { FIN_TYPES } from '../../../../config';
import GroupBox from '../../../Misc/GroupBox';
import SingleFinFields from './SingleFinFields';
import TwinFinFields from './TwinFinFields';

export default function FinPlugPanel({ value, onChange }) {
  const set = (field) => (next) => onChange({ ...value, [field]: next });
  return (
    <GroupBox title="Fin plug configuration">
      <select value={value.type} onChange={(event) => set('type')(event.target.value)}>
        {FIN_TYPES.map((type) => (
          <option key={type.value} value={type.value}>
            {type.label}
          </option>
        ))}
      </select>
      {value.type === 'single' ? (
        <SingleFinFields value={value} set={set} />
      ) : (
        <TwinFinFields value={value} set={set} />
      )}
    </GroupBox>
  );
}
