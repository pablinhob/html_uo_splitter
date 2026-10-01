import { buildPiecesSections, classifyPiece, isAllSelected } from '../../../Helpers/pieces';
import HollowingActions from './HollowingActions';
import PiecesSelect from './PiecesSelect';
import PiecesShortcuts from './PiecesShortcuts';

// Explicación bajo "Preview part hollowing"; isWarning para piezas que no se vacían.
const hintByCategory = {
  none: { text: 'Select a part to enable preview.', isWarning: false },
  group: { text: 'Select a part to enable preview.', isWarning: false },
  stringer: {
    text: 'No actions available for this piece. Select a piece from the board core.',
    isWarning: true,
  },
  cutlap_piece: {
    text: 'No actions available for cutlap pieces. Select a piece from the board core.',
    isWarning: true,
  },
};

/**
 * pieces: { pieceKeys, selected, onSelect, hollow, onHollowChange, onApply,
 *           onExport, exportEnabled }
 */
export default function PiecesPanel({ pieces }) {
  const { pieceKeys, selected, onSelect } = pieces;
  const category = classifyPiece(selected);
  const hint = hintByCategory[category] ?? null;
  const isCore = category === 'core';
  const sections = buildPiecesSections(pieceKeys);

  return (
    <div className="panel pieces-panel">
      {pieceKeys.length > 0 ? (
        <>
          <PiecesShortcuts
            nodes={[sections.all, ...sections.singles]}
            selected={selected}
            onSelect={onSelect}
          />
          <PiecesSelect
            title="Main parts"
            tag="Hollowable parts"
            tagTone="accent"
            placeholder="Select a main part..."
            nodes={sections.hollowableSides}
            selected={selected}
            onSelect={onSelect}
          />
          {sections.cutlapSides.length > 0 && (
            <PiecesSelect
              title="Cutlaps"
              tag="Not hollowable"
              tagTone="warning"
              placeholder="Select a cutlap..."
              nodes={sections.cutlapSides}
              selected={selected}
              onSelect={onSelect}
            />
          )}
        </>
      ) : (
        <p className="tree-placeholder">No pieces yet - run Split in step 2</p>
      )}
      <HollowingActions
        pieces={pieces}
        isDisabled={!isCore && !isAllSelected(selected)}
        isPreviewDisabled={!isCore}
        hint={hint}
      />
    </div>
  );
}
