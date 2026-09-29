import { buildPiecesTree, classifyPiece } from '../../../Helpers/pieces';
import HollowingActions from './HollowingActions';
import PiecesTree from './PiecesTree';

const hintByCategory = {
  group: 'Select a piece from the board core to enable actions.',
  stringer: 'No actions available for this piece. Select a piece from the board core.',
  cutlap_piece: 'No actions available for cutlap pieces. Select a piece from the board core.',
};

/**
 * pieces: { pieceKeys, selected, onSelect, hollow, onHollowChange, onApply,
 *           onExport, exportEnabled }
 */
export default function PiecesPanel({ pieces }) {
  const { pieceKeys, selected, onSelect } = pieces;
  const category = classifyPiece(selected);
  const hint = hintByCategory[category];

  return (
    <div className="panel">
      <div className="tree">
        {pieceKeys.length > 0 ? (
          <PiecesTree nodes={buildPiecesTree(pieceKeys)} selected={selected} onSelect={onSelect} />
        ) : (
          <p className="tree-placeholder">No pieces yet - run Execute to split the board</p>
        )}
      </div>
      {category === 'core' && <HollowingActions pieces={pieces} />}
      {category !== 'core' && hint !== undefined && <p className="hint">{hint}</p>}
    </div>
  );
}
