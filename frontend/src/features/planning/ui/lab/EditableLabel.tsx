/**
 * EditableLabel — Inline editable cell for salle/machine labels.
 * Double-click to rename, Enter to commit, Escape to cancel.
 */
import { useCallback, useRef, useState } from 'react';
import { Box } from '@mui/material';
import { usePlanningColors } from '../../lib/planning.hooks';
import { StickyLabelCell } from '../PlanningCell';
import { GRID_LABEL_WIDTH, GRID_SUB_LABEL_WIDTH } from '../../lib/planning.constants';

export function EditableLabel({
    value,
    onCommit,
    bold,
    isSubLabel,
    rowSpan,
    extraContent,
}: {
    value: string;
    onCommit: (newValue: string) => void;
    bold?: boolean;
    isSubLabel?: boolean;
    rowSpan?: number;
    extraContent?: React.ReactNode;
}) {
    const colors = usePlanningColors();
    const [editing, setEditing] = useState(false);
    const [draft, setDraft] = useState(value);
    const inputRef = useRef<HTMLInputElement>(null);

    const startEdit = useCallback(() => {
        setDraft(value);
        setEditing(true);
        setTimeout(() => inputRef.current?.focus(), 0);
    }, [value]);

    const commit = useCallback(() => {
        setEditing(false);
        const trimmed = draft.trim();
        if (trimmed && trimmed !== value) {
            onCommit(trimmed);
        }
    }, [draft, value, onCommit]);

    const handleKeyDown = useCallback(
        (e: React.KeyboardEvent) => {
            if (e.key === 'Enter') commit();
            if (e.key === 'Escape') setEditing(false);
        },
        [commit],
    );

    if (editing) {
        return (
            <td
                rowSpan={rowSpan}
                style={{
                    position: 'sticky',
                    left: isSubLabel ? GRID_LABEL_WIDTH : 0,
                    zIndex: 2,
                    width: isSubLabel ? GRID_SUB_LABEL_WIDTH : GRID_LABEL_WIDTH,
                    minWidth: isSubLabel ? GRID_SUB_LABEL_WIDTH : GRID_LABEL_WIDTH,
                    maxWidth: isSubLabel ? GRID_SUB_LABEL_WIDTH : GRID_LABEL_WIDTH,
                    backgroundColor: colors.white,
                    borderRight: `2px solid ${colors.borderStrong}`,
                    border: `1px solid ${colors.blue}`,
                    padding: '2px 4px',
                }}
            >
                <input
                    ref={inputRef}
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    onBlur={commit}
                    onKeyDown={handleKeyDown}
                    style={{
                        width: '100%',
                        border: 'none',
                        outline: 'none',
                        fontSize: 13,
                        fontWeight: bold ? 600 : 500,
                        color: colors.accent,
                        background: 'transparent',
                        padding: 0,
                    }}
                />
            </td>
        );
    }

    return (
        <StickyLabelCell bold={bold} isSubLabel={isSubLabel} rowSpan={rowSpan} onDoubleClick={startEdit}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span>{value}</span>
                {extraContent}
            </Box>
        </StickyLabelCell>
    );
}
