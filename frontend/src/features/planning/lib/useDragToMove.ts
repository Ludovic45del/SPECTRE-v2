/**
 * useDragToMove — generic drag-to-move hook for planning bar rows.
 *
 * Handles mousedown on a cell containing an item, tracks column movement via
 * document-level mousemove/mouseup, and invokes `onMove` with the day offset.
 */
import { useCallback, useEffect, useRef } from 'react';
import type { TimelineColumn } from './planning.utils';

export interface DragToMoveOptions<T> {
    /** Columns array (latest reference kept internally). */
    columns: TimelineColumn[];
    /** Return the item that occupies `col`, or undefined if empty. */
    findItemAtColumn: (col: TimelineColumn) => T | undefined;
    /** Called when the user drops an item on a different column. */
    onMove: (item: T, dayOffset: number) => void;
    /** When true the hook is completely disabled (e.g. edit mode). */
    disabled?: boolean;
}

export interface DragToMoveResult {
    /** Attach to `onMouseDown` of each cell `<td>`. */
    handleCellMouseDown: (e: React.MouseEvent<HTMLTableCellElement>, col: TimelineColumn, colIdx: number) => void;
    /** Ref that is `true` for one click cycle after a drag so the click handler can bail out. */
    skipNextClick: React.MutableRefObject<boolean>;
}

export function useDragToMove<T>({
    columns,
    findItemAtColumn,
    onMove,
    disabled = false,
}: DragToMoveOptions<T>): DragToMoveResult {
    const columnsRef = useRef(columns);
    columnsRef.current = columns;

    const skipNextClick = useRef(false);
    const cleanupRef = useRef<(() => void) | null>(null);

    // Cancel any active drag on unmount or when disabled becomes true
    useEffect(() => {
        if (disabled) {
            cleanupRef.current?.();
        }
        return () => {
            cleanupRef.current?.();
        };
    }, [disabled]);

    const handleCellMouseDown = useCallback(
        (e: React.MouseEvent<HTMLTableCellElement>, col: TimelineColumn, colIdx: number) => {
            if (disabled || e.button !== 0) return;
            const match = findItemAtColumn(col);
            if (!match) return;

            e.preventDefault();
            const originColIdx = colIdx;

            const handleDocMove = (me: MouseEvent) => {
                const td = (me.target as HTMLElement).closest('td[data-col-index]') as HTMLElement | null;
                if (!td) return;
                const ci = parseInt(td.dataset.colIndex ?? '', 10);
                if (isNaN(ci)) return;
                document.body.style.cursor = 'grabbing';
            };

            let finalColIdx = originColIdx;
            const handleDocUp = (me: MouseEvent) => {
                cleanup();
                const td = (me.target as HTMLElement).closest('td[data-col-index]') as HTMLElement | null;
                if (td) {
                    const ci = parseInt(td.dataset.colIndex ?? '', 10);
                    if (!isNaN(ci)) finalColIdx = ci;
                }

                if (finalColIdx === originColIdx) return;

                skipNextClick.current = true;

                const cols = columnsRef.current;
                const originCol = cols[originColIdx];
                const targetCol = cols[finalColIdx];
                if (!originCol || !targetCol) return;

                const dayOffset = targetCol.start.diff(originCol.start, 'day');
                if (dayOffset === 0) return;

                onMove(match, dayOffset);
            };

            const cleanup = () => {
                document.removeEventListener('mousemove', handleDocMove);
                document.removeEventListener('mouseup', handleDocUp);
                document.body.style.cursor = '';
                cleanupRef.current = null;
            };

            document.body.style.cursor = 'grabbing';
            document.addEventListener('mousemove', handleDocMove);
            document.addEventListener('mouseup', handleDocUp);
            cleanupRef.current = cleanup;
        },
        [disabled, findItemAtColumn, onMove],
    );

    return { handleCellMouseDown, skipNextClick };
}
