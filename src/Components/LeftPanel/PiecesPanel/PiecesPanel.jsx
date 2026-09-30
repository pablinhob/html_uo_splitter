import { buildPiecesTree, classifyPiece, isAllSelected } from '../../../Helpers/pieces';
import HollowingActions from './HollowingActions';
import PiecesTree from './PiecesTree';

const hintByCategory = {
  none: 'Select a part to enable preview.',
  group: 'Select a part to enable preview.',
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
  const isCore = category === 'core';

  return (
    <div className="panel">
      <div className="tree">
        {pieceKeys.length > 0 ? (
          <PiecesTree nodes={buildPiecesTree(pieceKeys)} selected={selected} onSelect={onSelect} />
        ) : (
          <p className="tree-placeholder">No pieces yet - run Split in step 2</p>
        )}
      </div>
      {hint !== undefined && <p className="hint">{hint}</p>}
      <HollowingActions
        pieces={pieces}
        isDisabled={!isCore && !isAllSelected(selected)}
        isPreviewDisabled={!isCore}
      />
    </div>
  );
}
