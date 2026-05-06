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
    showEnterNavigate = true,
    title,
    showTotals = false,
    showAddRow = true,
    showDeleteRow = true,
    showDuplicateRow = false,
    maxVisibleRows = 12,
    accentColor = '#185FA5',
    getCellStyle,
    getRowStyle,
    getHeaderStyle,
    computeCell,
    renderTotalCell,

}) => {


    // ── Active cell state (table owns this, not values) ───────────────────────
    const [activeCell, setActiveCell] = useState<CellCoord | null>(null);



    const [enterNavigation, setEnterNavigation] = useState<"column" | "row">("column");

    // const handleEnterNavigation = () => {
    //     setEnterNavigation(prev => prev === "column" ? "row" : "column");
    // }


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

    // ── Focus a cell ──────────────────────────────────────────────────────────
    const focusCell = useCallback((ri: number, colKey: string, delay = 20) => {
        const coord: CellCoord = { rowIndex: ri, colKey };
        setActiveCell(coord);
        onActiveChange?.(coord);
        setTimeout(() => {
            const ref = inputRefs.current[errKey(ri, colKey)];
            ref?.current?.focus?.();
            ref?.current?.select?.();
        }, delay);
    }, [onActiveChange]);

    // ── Navigate: Enter / Tab ─────────────────────────────────────────────────
    const moveNext = useCallback((ri: number, colKey: string) => {
        const ci = navigableCols.findIndex(c => c.key === colKey);

        console.log(ci, ri, enterNavigation,rows, 'stoneMaster');

        if (enterNavigation === 'column') {
            // COLUMN MODE: Find next focusable column to the right
            let nextColIdx = ci + 1;

            // Skip disabled columns
            while (nextColIdx < navigableCols.length && navigableCols[nextColIdx].disabled === true) {
                console.log(`Skipping disabled column at index ${nextColIdx}:`, navigableCols[nextColIdx].key);
                nextColIdx++;
            }

            if (nextColIdx < navigableCols.length) {
                // Found a focusable column in current row
                console.log(`Moving to column ${nextColIdx}:`, navigableCols[nextColIdx].key);
                focusCell(ri, navigableCols[nextColIdx].key);
            } else if (ri < rows.length - 1) {
                // Move to next row, find first focusable column
                let firstFocusableIdx = 0;
                while (firstFocusableIdx < navigableCols.length && navigableCols[firstFocusableIdx].disabled === true) {
                    firstFocusableIdx++;
                }

                if (firstFocusableIdx < navigableCols.length) {
                    console.log(`Moving to next row ${ri + 1}, first focusable column:`, navigableCols[firstFocusableIdx].key);
                    focusCell(ri + 1, navigableCols[firstFocusableIdx].key);
                } else {
                    // All columns are disabled - add new row
                    console.log('All columns disabled, adding new row');
                  
                    onRowAdd?.();
                    setTimeout(() => focusCell(rows.length, navigableCols[0].key), 20);
                }
            } else {
                // Last row - add new row
                console.log('Last row, adding new row');
                onRowAdd?.();
                setTimeout(() => {
                    let firstFocusableIdx = 0;
                    while (firstFocusableIdx < navigableCols.length && navigableCols[firstFocusableIdx].disabled === true) {
                        firstFocusableIdx++;
                    }
                    focusCell(rows.length, navigableCols[firstFocusableIdx]?.key || navigableCols[0].key);
                }, 20);
            }
        } else {
            // ROW MODE: Move down within column
            let nextRowIdx = ri + 1;

            // Check if current column in next rows is disabled
            while (nextRowIdx < rows.length && navigableCols[ci]?.disabled === true) {
                console.log(`Skipping disabled column at row ${nextRowIdx}, col:`, colKey);
                nextRowIdx++;
            }

            if (nextRowIdx < rows.length && !navigableCols[ci]?.disabled) {
                // Found focusable cell in same column, next row
                console.log(`Moving down to row ${nextRowIdx}, same column`);
                focusCell(nextRowIdx, colKey);
            } else {
                // Find next focusable column
                let nextColIdx = ci + 1;
                while (nextColIdx < navigableCols.length && navigableCols[nextColIdx].disabled === true) {
                    nextColIdx++;
                }

                if (nextColIdx < navigableCols.length) {
                    console.log(`Moving to next column:`, navigableCols[nextColIdx].key);
                    focusCell(0, navigableCols[nextColIdx].key);
                } else {
                    // No more focusable columns
                    console.log('No more focusable columns, adding new row');
                    onRowAdd?.();
                    setTimeout(() => focusCell(rows.length, colKey), 20);
                }
            }
        }
    }, [navigableCols, enterNavigation, rows.length, focusCell, onRowAdd]);

    const movePrev = useCallback((ri: number, colKey: string) => {
        const ci = navigableCols.findIndex(c => c.key === colKey);
        if (ci > 0) {
            focusCell(ri, navigableCols[ci - 1].key);
        } else if (ri > 0) {
            focusCell(ri - 1, navigableCols[navigableCols.length - 1].key);
        }
    }, [navigableCols, focusCell]);

    // Arrow key navigation
    const moveArrow = useCallback((ri: number, colKey: string, dir: 'up' | 'down' | 'left' | 'right') => {
        const ci = columns.findIndex(c => c.key === colKey);
        if (dir === 'up' && ri > 0) focusCell(ri - 1, colKey);
        if (dir === 'down' && ri < rows.length - 1) focusCell(ri + 1, colKey);
        if (dir === 'left' && ci > 0) focusCell(ri, columns[ci - 1].key);
        if (dir === 'right' && ci < columns.length - 1) focusCell(ri, columns[ci + 1].key);
    }, [columns, rows.length, focusCell]);

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

        // Is it any kind of input we should be careful with
        const isNumberInput = tagName === 'INPUT' && inputType === 'number';
        const isTextInput = tagName === 'INPUT' && (inputType === 'text' || inputType === '');
        const isComboboxInput = isTextInput && target.getAttribute('role') === 'combobox';
        const isSelect = tagName === 'SELECT';
        const isTextArea = tagName === 'TEXTAREA';

        // For ArrowUp/Down:
        // - Number input: browser uses arrows to increment/decrement — don't hijack
        // - Combobox input: browser uses arrows to navigate dropdown — don't hijack  
        // - Select: browser uses arrows to navigate options — don't hijack
        // - Plain text input: arrows move cursor left/right only, so Up/Down is safe to hijack
        const shouldBlockArrowUpDown = isNumberInput || isComboboxInput || isSelect;

        switch (e.key) {
            case 'Enter':
                e.preventDefault();
                moveNext(ri, colKey);
                break;

            case 'Tab':
                e.preventDefault();
                e.shiftKey ? movePrev(ri, colKey) : moveNext(ri, colKey);
                break;

            case 'Escape':
                e.preventDefault();
                cancelEdit();
                break;

            case 'ArrowUp':
                if (!shouldBlockArrowUpDown) {
                    e.preventDefault();
                    moveArrow(ri, colKey, 'up');
                }
                // else: let number input increment / combobox navigate dropdown
                break;

            case 'ArrowDown':
                if (!shouldBlockArrowUpDown) {
                    e.preventDefault();
                    moveArrow(ri, colKey, 'down');
                }
                break;

            case 'ArrowLeft': {
                if (!isTextInput && !isTextArea && !isComboboxInput) {
                    e.preventDefault();
                    moveArrow(ri, colKey, 'left');
                } else if (isTextInput || isTextArea) {
                    // Only navigate left if cursor is at position 0
                    const atStart = target.selectionStart === 0 && target.selectionEnd === 0;
                    if (atStart) {
                        e.preventDefault();
                        moveArrow(ri, colKey, 'left');
                    }
                }
                break;
            }

            case 'ArrowRight': {
                if (!isTextInput && !isTextArea && !isComboboxInput) {
                    e.preventDefault();
                    moveArrow(ri, colKey, 'right');
                } else if (isTextInput || isTextArea) {
                    // Only navigate right if cursor is at end
                    const atEnd = target.selectionStart === target.value.length
                        && target.selectionEnd === target.value.length;
                    if (atEnd) {
                        e.preventDefault();
                        moveArrow(ri, colKey, 'right');
                    }
                }
                break;
            }
        }
    }, [moveNext, movePrev, cancelEdit, moveArrow]);

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
        
            position: 'sticky' as const, top: 0, zIndex: 4,
            // background: '#f1f3f5',
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

        // Resolve computed value
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
            // Computed / disabled: parent still renders, just can't edit
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
                        zIndex: 20, whiteSpace: 'nowrap', pointerEvents: 'none',
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
                        <thead>
                            <tr >
                                <th style={{ ...S.th, width: 10, textAlign: 'center' }}>#</th>
                                {columns.map(col => (
                                    <th key={col.key} style={{
                                        ...S.th,
                                        width: col.width ?? 100,
                                        textAlign:'center',
                                        
                                    }}>
                                        {col.label}
                                        {col.required && <span style={{ color: '#e03131', marginLeft: 2 }}>*</span>}
                                        {/* {col.computed && <span style={{ color: '#adb5bd', marginLeft: 3, fontSize: 9 }}>fx</span>} */}
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
                            {rows.map((row, ri) => (
                                <GridRow
                                    key={row.__id ?? row.__rowId ?? ri}
                                    renderRowContent={() => renderRowContent(row, ri)}
                                />
                            ))}

                            {rows.length === 0 && (
                                <tr>
                                    <td
                                        colSpan={columns.length + 2}
                                        style={{ padding: 20, textAlign: 'center', fontSize: 11, color: '#adb5bd' }}
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
                                {/* <td style={{ ...S.tfootTd, width: 30 }} >TOTAL </td> */}
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