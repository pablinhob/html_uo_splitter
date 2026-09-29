import { buildPiecesTree, classifyPiece } from '../../../Helpers/pieces'
import HollowingActions from './HollowingActions'
import PiecesTree from './PiecesTree'

const GROUP_HINT = 'Select a piece from the board core to enable actions.'
const STRINGER_HINT = 'No actions available for this piece. Select a piece from the board core.'
const CUTLAP_HINT = 'No actions available for cutlap pieces. Select a piece from the board core.'

export default function PiecesPanel({
  pieceKeys,
  selected,
  onSelect,
  hollow,
  onHollowChange,
  onApply,
  onExport,
  exportEnabled,
}) {
  const category = classifyPiece(selected)
  const hint = { group: GROUP_HINT, stringer: STRINGER_HINT, cutlap_piece: CUTLAP_HINT }[category]

  return (
    <div className="panel">
      <div className="tree">
        {pieceKeys.length ? (
          <PiecesTree nodes={buildPiecesTree(pieceKeys)} selected={selected} onSelect={onSelect} />
        ) : (
          <p className="tree-placeholder">No pieces yet - run Execute to split the board</p>
        )}
      </div>

      {category === 'core' ? (
        <HollowingActions
          hollow={hollow}
          onChange={onHollowChange}
          onApply={onApply}
          onExport={onExport}
          exportEnabled={exportEnabled}
        />
      ) : (
        hint && <p className="hint">{hint}</p>
      )}
    </div>
  )
}
