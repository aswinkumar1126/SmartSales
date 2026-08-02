import React, {
    useState, useRef, useCallback, useMemo, useEffect, memo,
} from 'react';
import { SwitchInput } from '@/components/ui/SwitchInput';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ColumnDef {
    key: string;
    label: string;
    width?: number;
    align?: 'left' | 'center' | 'right';
    required?: boolean;
    decimalScale?: number;
    computed?: boolean;
    disabled?: boolean;
    sticky?: boolean;
    max?:number;
}

export interface CellCoord {
    rowIndex: number;
    colKey: string;
}

export interface RenderCellParams {
    row: Record<string, any>;
    rowIndex: number;
    col: ColumnDef;
    value: any;
    isEditing: boolean;         // this specific cell is the active edit cell
    isFocused: boolean;         // this cell is in the focused row
    isError: boolean;
    errorMessage?: string;
    isTouched: boolean;
    onChange: (value: any) => void;
    onCommit: () => void;       // confirm value + move to next cell
    onCancel: () => void;       // escape — revert + blur
    inputRef: React.RefObject<any>;
}

export interface RenderRowParams {
    row: Record<string, any>;
    rowIndex: number;
    columns: ColumnDef[];
    isActiveRow: boolean;
    activeColKey: string | null;
    renderCell: (col: ColumnDef) => React.ReactNode;
    onRowClick: () => void;
    onDeleteRow: () => void;
    onDuplicateRow?: () => void;
    rowStyle: React.CSSProperties;
}

export interface ExcelGridProps {
    // Data
    columns: ColumnDef[];
    rows: Record<string, any>[];

    // Cell rendering — parent owns all input rendering
    renderCell: (params: RenderCellParams) => React.ReactNode;

    // Row rendering — optional full row override
    renderRow?: (params: RenderRowParams) => React.ReactNode;

    // Callbacks — table has ZERO state mutation; parent owns all data
    onCellChange: (rowIndex: number, colKey: string, value: any) => void;
    onRowAdd?: () => void;
    onRowDelete?: (rowIndex: number) => void;
    onRowDuplicate?: (rowIndex: number) => void;
    onActiveChange?: (coord: CellCoord | null) => void;

    // Validation — fully external
    errors?: Record<string, string>;      // key: `${rowIndex}_${colKey}`
    touched?: Record<string, boolean>;    // key: `${rowIndex}_${colKey}`

    // Navigation
    showEnterNavigate?: boolean;

    // Display
    title?: string;
    showTotals?: boolean;
    showAddRow?: boolean;
    showDeleteRow?: boolean;
    showDuplicateRow?: boolean;
    maxVisibleRows?: number;
    accentColor?: string;
    getCellStyle?: (rowIndex: number, col: ColumnDef) => React.CSSProperties;
    getRowStyle?: (rowIndex: number, row: Record<string, any>) => React.CSSProperties;
    getHeaderStyle?: (rowIndex: number, row: Record<string, any>) => React.CSSProperties;

    // Computed column values — parent provides the formula
    computeCell?: (colKey: string, row: Record<string, any>) => any;

    // Totals — parent decides what to show
    renderTotalCell?: (col: ColumnDef, rows: Record<string, any>[]) => React.ReactNode;

    // Focus control
    initialFocusCell?: CellCoord;        // focus this cell on mount
    initialFocusCol?: string;            // colKey to focus on new row add; falls back to initialFocusCell?.colKey then first navigable col
    focusAfterModal?: { cell: CellCoord; trigger: number }; // focus after modal closes; trigger increments on each close
    disableEnterOnMount?: boolean;       // block Enter for 300ms after mount (prevents modal-open Enter bleed)

    // Editing state
    // tranEditing: true  → a transaction row is selected/being viewed (rows loaded from API)
    // isModifying: true  → user is actively editing an existing transaction
    //
    // Auto-focus on mount is ONLY triggered when BOTH are false (i.e. fresh/new transaction).
    // Enter → moveNext and Tab navigation ALWAYS work regardless of these flags.
    tranEditing: boolean;
    isModifying?: boolean;
    manualEntry?:boolean;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function errKey(ri: number, colKey: string) { return `${ri}_${colKey}`; }

// ─── Sub-components ───────────────────────────────────────────────────────────

// Thin wrapper: memoises each row so only the changed row re-renders
const GridRow = memo(function GridRow({
    renderRowContent,
}: {
    renderRowContent: () => React.ReactNode;
}) {
    return <>{renderRowContent()}</>;
});

// ─── Main Component ───────────────────────────────────────────────────────────

export const ExcelGrid: React.FC<ExcelGridProps> = ({
    columns,
    rows,
    renderCell,
    renderRow,
    onCellChange,
    onRowAdd,
    onRowDelete,
    onRowDuplicate,
    onActiveChange,
    errors = {},
    touched = {},
    showEnterNavigate = false,
    title,
    showTotals = false,
    showAddRow = true,
    showDeleteRow = true,
    showDuplicateRow = false,
    maxVisibleRows = 10,
    accentColor = '#185FA5',
    getCellStyle,
    getRowStyle,
    getHeaderStyle,
    computeCell,
    renderTotalCell,
    initialFocusCell,
    initialFocusCol,
    focusAfterModal,
    disableEnterOnMount = false,
    tranEditing,
    isModifying = false,
    manualEntry =true,
}) => {

    const [activeCell, setActiveCell] = useState<CellCoord | null>(null);
    const [enterNavigation, setEnterNavigation] = useState<"column" | "row">("column");

    // ── Block Enter briefly after mount (modal open Enter bleed-through) ──────
    const enterBlockedRef = useRef(false);
    const enterLockRef = useRef(false);

    useEffect(() => {
        if (!disableEnterOnMount) return;
        enterBlockedRef.current = true;
        const t = setTimeout(() => { enterBlockedRef.current = false; }, 300);
        return () => clearTimeout(t);
    }, [disableEnterOnMount]);

    // inputRefs keyed by `${rowIndex}_${colKey}` — stable across renders
    const inputRefs = useRef<Record<string, React.RefObject<any>>>({});
    function getInputRef(ri: number, colKey: string) {
        const k = errKey(ri, colKey);
        if (!inputRefs.current[k]) inputRefs.current[k] = React.createRef();
        return inputRefs.current[k];
    }

    // Navigable (editable) columns only
    const navigableCols = useMemo(
        () => columns.filter(c => !c.computed && !c.disabled),
        [columns]
    );

    // ── Resolve which col to focus on new row ─────────────────────────────────
    // Priority: initialFocusCol → initialFocusCell.colKey → first navigable col
    const newRowFocusCol = useMemo(() => {
        if (initialFocusCol) return initialFocusCol;
        if (initialFocusCell?.colKey) return initialFocusCell.colKey;
        return navigableCols.find(c => !c.disabled)?.key ?? navigableCols[0]?.key;
    }, [initialFocusCol, initialFocusCell, navigableCols]);

    // ── Focus a cell ──────────────────────────────────────────────────────────
    const focusCell = useCallback(
        (ri: number, colKey: string, delay = 20, shouldFocus = true) => {
            const coord: CellCoord = { rowIndex: ri, colKey };

            setActiveCell(coord);
            onActiveChange?.(coord);

            // only DOM focus is blocked, NOT navigation/state
            if (!shouldFocus) return;

            setTimeout(() => {
                const ref = inputRefs.current[errKey(ri, colKey)];
                ref?.current?.focus?.();
                ref?.current?.select?.();
            }, delay);
        },
        [onActiveChange]
    );

    const hasAutoFocused = useRef(false);

    useEffect(() => {
        hasAutoFocused.current = false;
    }, [tranEditing]);

    useEffect(() => {
        if (tranEditing && !isModifying) return;

        if (hasAutoFocused.current) return;

        hasAutoFocused.current = true;
        focusCell(0, initialFocusCell?.colKey ?? "ITEM", 50, true);

    }, [tranEditing, isModifying]);

    // ── Initial focus on mount (only for new transactions) ───────────────────
    useEffect(() => {

        if (!initialFocusCell) return;
        if (tranEditing && !isModifying) return;

        const t = setTimeout(() => {
            focusCell(initialFocusCell.rowIndex, initialFocusCell.colKey);
        }, 100);
        return () => clearTimeout(t);
    }, []); 

    // ── Focus cell after modal closes ─────────────────────────────────────────
    useEffect(() => {
        if (!focusAfterModal) return;
        if(tranEditing && !isModifying) return ;
        
        const t = setTimeout(() => {
            focusCell(focusAfterModal.cell.rowIndex, focusAfterModal.cell.colKey);
        }, 150);
        return () => clearTimeout(t);
    }, [focusAfterModal?.trigger]);


    const prevRowCountRef = useRef(rows.length);
    const rowAddedByNavigationRef = useRef(false);

    useEffect(() => {
        const prev = prevRowCountRef.current;
        const curr = rows.length;
        prevRowCountRef.current = curr;

        if (curr <= prev) return; // not a new row addition

        // moveNext already handled focus — skip
        if (rowAddedByNavigationRef.current) {
            rowAddedByNavigationRef.current = false;
            return;
        }

        // External add: toolbar "+ Add Row" or programmatic parent add.
        // This is always a user-initiated action so focus regardless of isModifying.

        // if (newRowFocusCol && !tranEditing && isModifying) {
        //     focusCell(curr - 1, newRowFocusCol);
        // }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [rows.length]);

    // ── Navigate: Enter / Tab ─────────────────────────────────────────────────
    // NOTE: moveNext has NO awareness of tranEditing / isModifying.
    // It must always work freely — those flags only control initial auto-focus.
    const moveNext = useCallback((ri: number, colKey: string) => {
        const ci = navigableCols.findIndex(c => c.key === colKey);

        if (enterNavigation === 'column') {
            // COLUMN MODE: Find next focusable column to the right
            let nextColIdx = ci + 1;
            while (nextColIdx < navigableCols.length && navigableCols[nextColIdx].disabled === true) {
                nextColIdx++;
            }

            if (nextColIdx < navigableCols.length) {
                // Found a focusable column in current row
                focusCell(ri, navigableCols[nextColIdx].key);
            } else if (ri < rows.length - 1) {
                // Move to next row, first focusable column
                focusCell(ri + 1, newRowFocusCol ?? navigableCols[0].key);
            } else {
                // Last row — add new row, moveNext owns the focus
                rowAddedByNavigationRef.current = true;
                onRowAdd?.();
                setTimeout(() => {
                    focusCell(rows.length, newRowFocusCol ?? navigableCols[0].key);
                }, 20);
            }
        } else {
            // ROW MODE: Move down within column
            if (ri < rows.length - 1 && !navigableCols[ci]?.disabled) {
                focusCell(ri + 1, colKey);
            } else {
                // Find next focusable column
                let nextColIdx = ci + 1;
                while (nextColIdx < navigableCols.length && navigableCols[nextColIdx].disabled === true) {
                    nextColIdx++;
                }

                if (nextColIdx < navigableCols.length) {
                    focusCell(0, navigableCols[nextColIdx].key);
                } else {
                    // No more — add new row, moveNext owns the focus
                    rowAddedByNavigationRef.current = true;
                    onRowAdd?.();
                    setTimeout(() => focusCell(rows.length, newRowFocusCol ?? colKey), 20);
                }
            }
        }
    }, [navigableCols, enterNavigation, rows.length, focusCell, onRowAdd, newRowFocusCol]);

    const movePrev = useCallback((ri: number, colKey: string) => {
        const ci = navigableCols.findIndex(c => c.key === colKey);
        if (ci > 0) {
            focusCell(ri, navigableCols[ci - 1].key);
        } else if (ri > 0) {
            focusCell(ri - 1, navigableCols[navigableCols.length - 1].key);
        }
    }, [navigableCols, focusCell]);

    // ── Cancel / blur ─────────────────────────────────────────────────────────
    const cancelEdit = useCallback(() => {
        setActiveCell(null);
        onActiveChange?.(null);
    }, [onActiveChange]);

    // ── Global keyboard handler (table-level) ─────────────────────────────────
    const handleTableKeyDown = useCallback((
        e: React.KeyboardEvent,
        ri: number,
        colKey: string,
    ) => {
        const target = e.target as HTMLInputElement;
        const tagName = target.tagName;
        const inputType = target.type?.toLowerCase() ?? "";

        const isNumberInput = tagName === 'INPUT' && inputType === 'number';
        const isTextInput = tagName === 'INPUT' && (inputType === 'text' || inputType === '');
        const isComboboxInput = isTextInput && target.getAttribute('role') === 'combobox';
        const isSelect = tagName === 'SELECT';
        const isTextArea = tagName === 'TEXTAREA';

        const shouldBlockArrowUpDown = isNumberInput || isComboboxInput || isSelect;

        switch (e.key) {
            case 'Enter':

                if (enterBlockedRef.current) {
                    e.preventDefault();
                    break;
                }

                // prevent double enter firing
                if (enterLockRef.current) {
                    e.preventDefault();
                    break;
                }

                enterLockRef.current = true;
                e.preventDefault();
                moveNext(ri, colKey);

                setTimeout(() => {
                    enterLockRef.current = false;
                }, 50);

                break;

            case 'Tab':
                e.preventDefault();
                e.shiftKey ? movePrev(ri, colKey) : moveNext(ri, colKey);
                break;

            case 'Escape':
                e.preventDefault();
                cancelEdit();
                break;
        }
    }, [moveNext, movePrev, cancelEdit]);



    const visibleRows = useMemo(() => {
        if (manualEntry) return rows;

        // hide initial empty row when manual entry is false
        return rows.filter((row, index) => {
            // keep rows that have some value
            const hasValue = row.ITEMID && row.__rowId ;
            console.log(hasValue, 'hasValue');

            return hasValue;
        });
    }, [rows, manualEntry]);
    console.log(visibleRows,'visibleRows')

    // ── Styles ────────────────────────────────────────────────────────────────
    const ROW_H = 30;
    const maxH = maxVisibleRows * ROW_H + 38;

    const S = useMemo(() => ({
        root: { fontFamily: 'inherit', fontSize: 12 } as React.CSSProperties,
        toolbar: {
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '6px 10px',
            background: '#f8f9fa',
            border: '1px solid #dee2e6',
            borderBottom: 'none',
            borderRadius: '6px 6px 0 0',
        } as React.CSSProperties,
        wrap: {
            border: '1px solid #dee2e6',
            borderTop: 'none',
            borderRadius: '0 0 6px 6px',
            overflow: 'hidden',
        } as React.CSSProperties,
        scrollArea: {
            overflowX: 'auto' as const,
            overflowY: 'auto' as const,
            maxHeight: maxH,
        },
        table: {
            width: '100%',
            borderCollapse: 'collapse' as const,
            tableLayout: 'fixed' as const,
        },
        th: {
            position: 'sticky' as const, top: 0, zIndex: 10,
            background: '#f7e0d1',
            fontSize: 11, fontWeight: 600, color: '#495057',
            padding: '5px 5px',
            borderBottom: '2px solid #dee2e6',
            borderRight: '1px solid #e9ecef',
            textAlign: 'left' as const,
            whiteSpace: 'nowrap' as const,
            userSelect: 'none' as const,
        },
        td: {
            borderBottom: '1px solid #e9ecef',
            borderRight: '1px solid #e9ecef',
            padding: 0,
            position: 'relative' as const,
            verticalAlign: 'middle' as const,
            height: ROW_H,
        },
        statusBar: {
            padding: '3px 10px', fontSize: 10, color: '#868e96',
            background: '#f8f9fa', borderTop: '1px solid #dee2e6',
            display: 'flex', alignItems: 'center',
        } as React.CSSProperties,
        tfootTd: {
            padding: '4px 5px', fontSize: 11, fontWeight: 600,
            background: accentColor, color: 'white',
            borderRight: '1px solid rgba(255,255,255,0.2)',
        } as React.CSSProperties,
        addBtn: {
            display: 'inline-flex', alignItems: 'center', gap: 4,
            padding: '3px 10px', fontSize: 11, borderRadius: 4,
            cursor: 'pointer', fontFamily: 'inherit',
            border: '1px solid #ced4da',
            background: 'white', color: '#495057',
        } as React.CSSProperties,
    }), [accentColor, maxH]);

    // ── Cell renderer (wraps parent renderCell with table interaction) ────────
    const renderCellWrapper = useCallback((
        row: Record<string, any>,
        ri: number,
        col: ColumnDef,
    ) => {
        const k = errKey(ri, col.key);
        const isEditing = activeCell?.rowIndex === ri && activeCell?.colKey === col.key;
        const isFocused = activeCell?.rowIndex === ri;
        const isError = !!errors[k] && !!touched[k];
        const inputRef = getInputRef(ri, col.key);

        const value = col.computed && computeCell
            ? computeCell(col.key, row)
            : row[col.key] ?? '';

        const cellStyle: React.CSSProperties = {
            ...S.td,
            width: col.width ?? 100,
            minWidth: col.width ?? 100,
            outline: isEditing ? `2px solid ${accentColor}` : 'none',
            outlineOffset: '-2px',
            background: isError ? '#fff5f5' : undefined,
            ...getCellStyle?.(ri, col),
        };

        const content = col.computed || col.disabled
            ? (
                <div style={{ height: ROW_H, display: 'flex', alignItems: 'center', padding: '0 5px' }}>
                    {renderCell({
                        row, rowIndex: ri, col, value,
                        isEditing: false, isFocused,
                        isError, errorMessage: errors[k],
                        isTouched: !!touched[k],
                        onChange: () => { },
                        onCommit: () => { },
                        onCancel: cancelEdit,
                        inputRef,
                    })}
                </div>
            )
            : (
                <div
                    style={{ height: ROW_H, display: 'flex', alignItems: 'center' }}
                    onKeyDown={(e) => handleTableKeyDown(e, ri, col.key)}
                    onClick={() => !isEditing && focusCell(ri, col.key)}
                >
                    {renderCell({
                        row, rowIndex: ri, col, value,
                        isEditing, isFocused,
                        isError, errorMessage: errors[k],
                        isTouched: !!touched[k],
                        onChange: (val) => onCellChange(ri, col.key, val),
                        onCommit: () => moveNext(ri, col.key),
                        onCancel: cancelEdit,
                        inputRef,
                    })}
                </div>
            );

        return (
            <td key={col.key} style={cellStyle}>
                {content}
                {isError && (
                    <div style={{
                        position: 'absolute', bottom: '100%', left: 0,
                        background: '#c0392b', color: 'white',
                        fontSize: 10, padding: '2px 6px', borderRadius: 3,
                        zIndex: 10, whiteSpace: 'nowrap', pointerEvents: 'none',
                    }}>
                        {errors[k]}
                    </div>
                )}
            </td>
        );
    }, [
        activeCell, errors, touched, accentColor, getCellStyle, S.td,
        computeCell, renderCell, cancelEdit, handleTableKeyDown,
        focusCell, onCellChange, moveNext,
    ]);

    // ── Row renderer ──────────────────────────────────────────────────────────
    const renderRowContent = useCallback((row: Record<string, any>, ri: number) => {
        const isActiveRow = activeCell?.rowIndex === ri;
        const baseRowStyle: React.CSSProperties = {
            background: ri % 2 === 0 ? 'white' : '#fafafa',
            ...getRowStyle?.(ri, row),
        };

        const cells = () => (
            <>
                {/* Row number */}
                <td style={{ ...S.td, width: 28, textAlign: 'center', fontSize: 10, color: '#adb5bd' }}>
                    {ri + 1}
                </td>

                {/* Data cells */}
                {columns.map(col => renderCellWrapper(row, ri, col))}

                {/* Action cells */}
                {(showDeleteRow || showDuplicateRow) && (
                    <td style={{ ...S.td, width: showDuplicateRow ? 56 : 34, borderRight: 'none', textAlign: 'center', padding: '0 3px' }}>
                        <div style={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
                            {showDuplicateRow && (
                                <button
                                    onClick={() => onRowDuplicate?.(ri)}
                                    title="Duplicate row"
                                    style={{ padding: '1px 5px', fontSize: 10, borderRadius: 3, cursor: 'pointer', border: '1px solid #ced4da', background: 'white', color: '#495057' }}
                                >⧉</button>
                            )}
                            {showDeleteRow && (
                                <button
                                    onClick={() => onRowDelete?.(ri)}
                                    title="Delete row"
                                    style={{ padding: '1px 5px', fontSize: 10, borderRadius: 3, cursor: 'pointer', border: '1px solid #c0392b', background: '#c0392b', color: 'white' }}
                                >✕</button>
                            )}
                        </div>
                    </td>
                )}
            </>
        );

        if (renderRow) {
            return renderRow({
                row, rowIndex: ri, columns,
                isActiveRow,
                activeColKey: isActiveRow ? (activeCell?.colKey ?? null) : null,
                renderCell: (col) => renderCellWrapper(row, ri, col),
                onRowClick: () => focusCell(ri, navigableCols[0]?.key ?? columns[0].key),
                onDeleteRow: () => onRowDelete?.(ri),
                onDuplicateRow: onRowDuplicate ? () => onRowDuplicate(ri) : undefined,
                rowStyle: baseRowStyle,
            });
        }

        return (
            <tr key={row.__id ?? ri} style={baseRowStyle}>
                {cells()}
            </tr>
        );
    }, [
        activeCell, columns, S.td, renderCellWrapper, renderRow,
        showDeleteRow, showDuplicateRow, getRowStyle,
        onRowDelete, onRowDuplicate, focusCell, navigableCols,
    ]);

    // ── Action column width ───────────────────────────────────────────────────
    const actionColWidth = showDuplicateRow ? 30 : 15;

    // ── Render ────────────────────────────────────────────────────────────────
    return (
        <div style={S.root}>
            {/* Toolbar */}
            {(title || showAddRow) && (
                <div style={S.toolbar}>
                    {title && (
                        <span style={{ flex: 1, fontWeight: 600, fontSize: 13 }}>{title}</span>
                    )}
                    {showAddRow && (
                        <button style={S.addBtn} onClick={onRowAdd}>
                            + Add Row
                        </button>
                    )}
                    {showEnterNavigate && (
                        <SwitchInput
                            value={enterNavigation}
                            onChange={(val) => setEnterNavigation(val)}
                            trueValue="column"
                            falseValue="row"
                            size="xs"
                            labels={{ on: 'COLUMN', off: 'ROW' }}
                            labelFontSize='xs'
                        />
                    )}
                </div>
            )}

            <div style={S.wrap}>
                <div style={S.scrollArea}>
                    <table style={S.table}>
                        <thead style={{ ...S.th, textAlign: 'center' }}>
                            <tr>
                                <th style={{ ...S.th, width: 10, textAlign: 'center' }}>#</th>
                                {columns.map(col => (
                                    <th key={col.key} style={{
                                        ...S.th,
                                        width: col.width ?? 100,
                                        textAlign: 'center',
                                    }}>
                                        {col.label}
                                        {col.required && <span style={{ color: '#e03131', marginLeft: 2 }}>*</span>}
                                    </th>
                                ))}
                                {(showDeleteRow || showDuplicateRow) && (
                                    <th style={{ ...S.th, width: actionColWidth, textAlign: 'center', borderRight: 'none' }}>
                                        DEL
                                    </th>
                                )}
                            </tr>
                        </thead>

                        <tbody>
                            {visibleRows.map((row, ri) => (
                                <GridRow
                                    key={row.__id ?? row.__rowId ?? ri}
                                    renderRowContent={() => renderRowContent(row, ri)}
                                />
                            ))}

                            {visibleRows.length === 0 && (
                                <tr>
                                    <td
                                        colSpan={columns.length + 2}
                                        style={{
                                            padding: 20,
                                            textAlign: 'center',
                                            fontSize: 11,
                                            color: '#adb5bd'
                                        }}
                                    >
                                        No rows yet — click "+ Add Row" to begin
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Totals footer */}
                {showTotals && rows.length > 0 && renderTotalCell && (
                    <table style={{ ...S.table, borderTop: `2px solid ${accentColor}` }}>
                        <tbody>
                            <tr>
                                <td style={{ ...S.tfootTd, width: 10 }} />
                                {columns.map((col, ci) => (
                                    <td key={col.key} style={{
                                        ...S.tfootTd,
                                        width: col.width ?? 100,
                                        textAlign: col.align ?? 'left',
                                        ...(ci === columns.length - 1 ? { borderRight: 'none' } : {}),
                                    }}>
                                        {renderTotalCell(col, rows)}
                                    </td>
                                ))}
                                {(showDeleteRow || showDuplicateRow) && (
                                    <td style={{ ...S.tfootTd, width: actionColWidth, borderRight: 'none' }} />
                                )}
                            </tr>
                        </tbody>
                    </table>
                )}

                {/* Status bar */}
                <div style={S.statusBar}>
                    <span style={{ marginLeft: 'auto' }}>
                        {rows.length} row{rows.length !== 1 ? 's' : ''}
                    </span>
                </div>
            </div>
        </div>
    );
};

export default ExcelGrid;