import React, { useRef, useState } from 'react';

// ─── Types ────────────────────────────────────────────────────────────────────

export type ColumnType = 'text' | 'number' | 'select' | 'date';
export type EnterNavigation = 'column' | 'row';

export interface DependencyRule {
    min?: number;
    max?: number;
    allowedValues?: string[];
    message?: string;
}

export interface ColDef {
    key: string;
    label: string;
    type: ColumnType;
    width?: number;
    align?: 'left' | 'center' | 'right';
    required?: boolean;
    options?: string[];
    dependsOn?: string;
    dependencyOptions?: Record<string, DependencyRule>;
    computed?: boolean;
    compute?: (row: Record<string, any>) => any;
    decimalScale?: number;
    disabled?: boolean;
    placeholder?: string;
}

export interface ExcelTableProps {
    columns: ColDef[];
    initialRows?: Record<string, any>[];
    rows?: Record<string, any>[];      
    enterNavigate?: EnterNavigation;
    onSave?: (rows: Record<string, any>[]) => void;
    title?: string;
    showTotals?: boolean;
    maxVisibleRows?: number;
    accentColor?: string;
    highlightedIds?: string[];
    highlightColor?: string;
    renderRow?: (props: {
        row: Record<string, any>;
        rowIndex: number;
        columns: ColDef[];
        editMode: boolean;
        errors: Record<string, string>;
        touched: Record<string, boolean>;
        rowBg: string;
        onCellChange: (colKey: string, val: string) => void;
        onCellBlur: (colKey: string) => void;
        onCellEnter: (colKey: string) => void;
        onDeleteRow: () => void;
        inputRefs: React.MutableRefObject<Record<string, HTMLElement | null>>;
        isLastRow: boolean;
    }) => React.ReactNode;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

let _id = 0;
function uid() { return `r${++_id}`; }

function emptyRow(cols: ColDef[]): Record<string, any> {
    const row: Record<string, any> = { __id: uid() };
    cols.forEach(c => { row[c.key] = ''; });
    return row;
}

function applyComputed(row: Record<string, any>, cols: ColDef[]) {
    cols.forEach(c => {
        if (c.computed && c.compute) row[c.key] = c.compute(row);
    });
    return row;
}

function isRowFilled(row: Record<string, any>, cols: ColDef[]) {
    return cols.some(
        c => !c.computed && row[c.key] !== '' && row[c.key] !== null && row[c.key] !== undefined
    );
}

function validateRows(
    rows: Record<string, any>[],
    cols: ColDef[],
    touched: Record<string, boolean>
): Record<string, string> {
    const errors: Record<string, string> = {};
    rows.forEach((row, ri) => {
        cols.forEach(col => {
            if (col.computed || col.disabled) return;
            const errKey = `${ri}_${col.key}`;
            if (!touched[errKey]) return;
            const val = row[col.key];
            const isEmpty = val === '' || val === null || val === undefined;

            if (col.required && isEmpty) {
                errors[errKey] = `${col.label} is required`;
                return;
            }
            if (!isEmpty && col.type === 'number' && isNaN(parseFloat(String(val)))) {
                errors[errKey] = 'Must be a number';
                return;
            }
            if (!isEmpty && col.dependsOn && col.dependencyOptions) {
                const depVal = row[col.dependsOn];
                const rule = col.dependencyOptions[depVal];
                if (rule) {
                    if (rule.min !== undefined && parseFloat(String(val)) < rule.min) {
                        errors[errKey] = rule.message ?? `Min ${rule.min} for "${depVal}"`;
                        return;
                    }
                    if (rule.max !== undefined && parseFloat(String(val)) > rule.max) {
                        errors[errKey] = rule.message ?? `Max ${rule.max} for "${depVal}"`;
                        return;
                    }
                    if (rule.allowedValues && !rule.allowedValues.includes(String(val))) {
                        errors[errKey] = rule.message ?? `Not valid for "${depVal}"`;
                        return;
                    }
                }
            }
        });
    });
    return errors;
}

function formatNum(val: any, decimalScale?: number) {
    const n = parseFloat(String(val));
    if (isNaN(n)) return '';
    if (decimalScale !== undefined) return n.toFixed(decimalScale);
    return n % 1 === 0 ? String(n) : n.toFixed(2);
}

// ─── Component ────────────────────────────────────────────────────────────────

export const ExcelTable: React.FC<ExcelTableProps> = ({
    columns,
    initialRows,
    enterNavigate = 'column',
    title = 'Items',
    showTotals = true,
    maxVisibleRows = 10,
    accentColor = '#185FA5',
    highlightedIds = [],
    highlightColor = '#fff9c4',
    renderRow,
}) => {
    const editableCols = columns.filter(c => !c.computed && !c.disabled);

    function buildInitial(): Record<string, any>[] {
        if (initialRows && initialRows.length > 0) {
            const mapped = initialRows.map(r => applyComputed({ __id: uid(), ...r }, columns));
            mapped.push(emptyRow(columns));
            return mapped;
        }
        return [emptyRow(columns)];
    }

    const [rows, setRows] = useState<Record<string, any>[]>(buildInitial);
    const [editMode, setEditMode] = useState(true);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [touched, setTouched] = useState<Record<string, boolean>>({});
    const inputRefs = useRef<Record<string, HTMLElement | null>>({});

    function focusCell(ri: number, colKey: string) {
        setTimeout(() => {
            const el = inputRefs.current[`${ri}_${colKey}`];
            if (el) (el as HTMLElement).focus();
        }, 20);
    }

    function handleChange(ri: number, colKey: string, val: string) {
        setRows(prev => {
            const next = prev.map((r, i) =>
                i !== ri ? r : applyComputed({ ...r, [colKey]: val }, columns)
            );
            const newTouched = { ...touched, [`${ri}_${colKey}`]: true };
            setTouched(newTouched);
            setErrors(validateRows(next, columns, newTouched));
            return next;
        });
    }

    function handleBlur(ri: number, colKey: string) {
        const newTouched = { ...touched, [`${ri}_${colKey}`]: true };
        setTouched(newTouched);
        setErrors(validateRows(rows, columns, newTouched));
    }

    function handleEnter(ri: number, colKey: string) {
        if (enterNavigate === 'column') {
            const ci = editableCols.findIndex(c => c.key === colKey);
            if (ci < editableCols.length - 1) {
                focusCell(ri, editableCols[ci + 1].key);
            } else {
                maybeAddRow(ri, editableCols[0].key);
            }
        } else {
            maybeAddRow(ri, colKey);
        }
    }

    function maybeAddRow(ri: number, nextColKey: string) {
        if (ri === rows.length - 1 && isRowFilled(rows[ri], columns)) {
            setRows(prev => [...prev, emptyRow(columns)]);
            focusCell(ri + 1, nextColKey);
        } else if (ri < rows.length - 1) {
            focusCell(ri + 1, nextColKey);
        }
    }

    function handleAddRow() {
        setRows(prev => [...prev, emptyRow(columns)]);
        setTimeout(() => focusCell(rows.length, editableCols[0].key), 30);
    }

    function handleDeleteRow(ri: number) {
        setRows(prev => {
            const next = prev.filter((_, i) => i !== ri);
            return next.length === 0 ? [emptyRow(columns)] : next;
        });
    }

    // Totals — only over filled rows for accuracy
    const filledRows = rows.filter(r => isRowFilled(r, columns));
    const totals: Record<string, number> = {};
    columns.forEach(col => {
        if (col.type === 'number') {
            totals[col.key] = filledRows.reduce((s, r) => s + (parseFloat(String(r[col.key])) || 0), 0);
        }
    });

    const ROW_H = 32;
    const maxH = maxVisibleRows * ROW_H + 40;

    // ─── Inline styles ────────────────────────────────────────────────────────────

    const S = {
        root: { fontFamily: 'inherit', fontSize: 13 } as React.CSSProperties,
        toolbar: {
            display: 'flex', alignItems: 'center', gap: 8, padding: '7px 10px',
            background: '#f8f9fa', border: '1px solid #dee2e6',
            borderBottom: 'none', borderRadius: '6px 6px 0 0',
        } as React.CSSProperties,
        wrap: {
            border: '1px solid #dee2e6', borderTop: 'none',
            borderRadius: '0 0 6px 6px', overflow: 'hidden',
        } as React.CSSProperties,
        th: {
            position: 'sticky' as const, top: 0, zIndex: 5,
            background: '#f1f3f5', fontSize: 11, fontWeight: 600,
            color: '#495057', padding: '6px 6px',
            borderBottom: '2px solid #dee2e6', borderRight: '1px solid #e9ecef',
            textAlign: 'left' as const, whiteSpace: 'nowrap' as const, userSelect: 'none' as const,
        },
        td: {
            borderBottom: '1px solid #e9ecef', borderRight: '1px solid #e9ecef',
            padding: 0, position: 'relative' as const, verticalAlign: 'middle' as const,
        },
        statusBar: {
            padding: '4px 10px', fontSize: 11, color: '#868e96',
            background: '#f8f9fa', borderTop: '1px solid #dee2e6',
            display: 'flex', gap: 12, alignItems: 'center',
        } as React.CSSProperties,
        tfootRow: {
            background: accentColor, color: 'white',
            borderTop: `2px solid ${accentColor}`,
        } as React.CSSProperties,
        tfootTd: {
            padding: '5px 6px', fontSize: 12, fontWeight: 600,
        } as React.CSSProperties,
    };

    function btnStyle(): React.CSSProperties {
        return {
            display: 'inline-flex', alignItems: 'center', gap: 5,
            padding: '4px 10px', fontSize: 12, borderRadius: 4, cursor: 'pointer',
            fontFamily: 'inherit',
            border: '1px solid #ced4da',
            background: 'white',
            color: '#495057',
        };
    }

    function rowBg(row: Record<string, any>, ri: number): string {
        if (highlightedIds.includes(row.__id)) return highlightColor;
        if (ri === rows.length - 1 && editMode) return '#f8f9fa';
        return ri % 2 === 0 ? 'white' : '#fafafa';
    }

    // ─── Default row renderer ────────────────────────────────────────────────────

    const defaultRenderRow = ({
        row,
        rowIndex: ri,
        columns: cols,
        editMode: isEdit,
        errors: errs,
        touched: touch,
        rowBg: bg,
        onCellChange,
        onCellBlur,
        onCellEnter,
        onDeleteRow,
        inputRefs: refs,
        isLastRow,
    }: Parameters<NonNullable<ExcelTableProps['renderRow']>>[0]) => {
        return (
            <tr key={row.__id} style={{ background: bg }}>
                <td style={{ ...S.td, width: 36, textAlign: 'center', fontSize: 11, color: '#adb5bd' }}>
                    {isLastRow && isEdit
                        ? <span style={{ color: accentColor, fontWeight: 700 }}>+</span>
                        : ri + 1}
                </td>

                {cols.map((col, ci) => {
                    const errKey = `${ri}_${col.key}`;
                    const hasErr = !!errs[errKey] && !!touch[errKey];
                    const val = row[col.key] ?? '';

                    const cellStyle: React.CSSProperties = {
                        ...S.td,
                        minWidth: col.width ?? 120,
                        ...(ci === cols.length - 1 && !isEdit ? { borderRight: 'none' } : {}),
                    };

                    if (col.computed || !isEdit) {
                        return (
                            <td key={col.key} style={cellStyle}>
                                <div style={{
                                    height: 32,
                                    display: 'flex',
                                    alignItems: 'center',
                                    padding: '0 6px',
                                    fontSize: 12,
                                    textAlign: col.align || 'left',
                                    color: col.computed ? '#868e96' : 'inherit',
                                }}>
                                    {col.type === 'number' && val !== '' ? formatNum(val, col.decimalScale) : val}
                                </div>
                            </td>
                        );
                    }

                    const baseInputStyle: React.CSSProperties = {
                        width: '100%',
                        height: 32,
                        border: 'none',
                        outline: 'none',
                        background: hasErr ? '#fff5f5' : 'transparent',
                        fontSize: 12,
                        padding: '0 6px',
                        fontFamily: 'inherit',
                        color: 'inherit',
                        textAlign: col.align || 'left',
                    };

                    const commonProps = {
                        ref: (el: any) => { refs.current[errKey] = el; },
                        onKeyDown: (e: React.KeyboardEvent) => {
                            if (e.key === 'Enter' || e.key === 'Tab') {
                                e.preventDefault();
                                onCellEnter(col.key);
                            }
                        },
                        onBlur: () => onCellBlur(col.key),
                    };

                    return (
                        <td key={col.key} style={cellStyle}>
                            {col.type === 'select' ? (
                                <div style={{ position: 'relative' }}>
                                    <select
                                        {...commonProps}
                                        value={val}
                                        onChange={e => onCellChange(col.key, e.target.value)}
                                        style={{ ...baseInputStyle, cursor: 'pointer' }}
                                    >
                                        <option value="">— select —</option>
                                        {(col.options || []).map(o => <option key={o} value={o}>{o}</option>)}
                                    </select>
                                    {hasErr && (
                                        <div style={{
                                            position: 'absolute',
                                            bottom: '100%',
                                            left: 0,
                                            background: '#c0392b',
                                            color: 'white',
                                            fontSize: 10,
                                            padding: '2px 6px',
                                            borderRadius: 3,
                                            zIndex: 20,
                                            whiteSpace: 'nowrap',
                                            pointerEvents: 'none',
                                        }}>
                                            {errs[errKey]}
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div style={{ position: 'relative' }}>
                                    <input
                                        {...commonProps}
                                        value={val}
                                        placeholder={col.placeholder}
                                        disabled={col.disabled}
                                        onChange={e => onCellChange(col.key, e.target.value)}
                                        style={baseInputStyle}
                                    />
                                    {hasErr && (
                                        <div style={{
                                            position: 'absolute',
                                            bottom: '100%',
                                            left: 0,
                                            background: '#c0392b',
                                            color: 'white',
                                            fontSize: 10,
                                            padding: '2px 6px',
                                            borderRadius: 3,
                                            zIndex: 20,
                                            whiteSpace: 'nowrap',
                                            pointerEvents: 'none',
                                        }}>
                                            {errs[errKey]}
                                        </div>
                                    )}
                                </div>
                            )}
                        </td>
                    );
                })}

                {isEdit && (
                    <td style={{ ...S.td, borderRight: 'none', textAlign: 'center', padding: '0 4px' }}>
                        <button
                            style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                padding: '2px 7px',
                                fontSize: 11,
                                borderRadius: 4,
                                cursor: 'pointer',
                                fontFamily: 'inherit',
                                border: '1px solid #c0392b',
                                background: '#c0392b',
                                color: 'white',
                            }}
                            onClick={onDeleteRow}
                        >
                            ✕
                        </button>
                    </td>
                )}
            </tr>
        );
    };

    // Use custom renderRow if provided, otherwise use default
    const rowRenderer = renderRow || defaultRenderRow;

    // ─── Render ───────────────────────────────────────────────────────────────────

    return (
        <div style={S.root}>
            {/* Toolbar - No Save/Edit buttons */}
            <div style={S.toolbar}>
                <span style={{ flex: 1, fontWeight: 600, fontSize: 13 }}>{title}</span>
                <button style={btnStyle()} onClick={handleAddRow}>+ Add Row</button>
            </div>

            {/* Table wrapper */}
            <div style={S.wrap}>
                {/* Scrollable body */}
                <div style={{ overflowX: 'auto', maxHeight: maxH, overflowY: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed' }}>
                        <thead>
                            <tr>
                                <th style={{ ...S.th, width: 36, textAlign: 'center' }}>#</th>
                                {columns.map((col, ci) => (
                                    <th
                                        key={col.key}
                                        style={{
                                            ...S.th,
                                            width: col.width ?? 120,
                                            textAlign: col.align || 'left',
                                            ...(ci === columns.length - 1 && !editMode ? { borderRight: 'none' } : {}),
                                        }}
                                    >
                                        {col.label}
                                        {col.required && <span style={{ color: '#e03131', marginLeft: 2 }}>*</span>}
                                    </th>
                                ))}
                                {editMode && (
                                    <th style={{ ...S.th, width: 44, textAlign: 'center', borderRight: 'none' }}>
                                        Del
                                    </th>
                                )}
                            </tr>
                        </thead>

                        <tbody>
                            {rows.map((row, ri) =>
                                rowRenderer({
                                    row,
                                    rowIndex: ri,
                                    columns,
                                    editMode,
                                    errors,
                                    touched,
                                    rowBg: rowBg(row, ri),
                                    onCellChange: (colKey, val) => handleChange(ri, colKey, val),
                                    onCellBlur: (colKey) => handleBlur(ri, colKey),
                                    onCellEnter: (colKey) => handleEnter(ri, colKey),
                                    onDeleteRow: () => handleDeleteRow(ri),
                                    inputRefs,
                                    isLastRow: ri === rows.length - 1,
                                })
                            )}

                            {rows.length === 0 && (
                                <tr>
                                    <td
                                        colSpan={columns.length + (editMode ? 2 : 1)}
                                        style={{ padding: 20, textAlign: 'center', fontSize: 12, color: '#adb5bd' }}
                                    >
                                        No rows yet — click "+ Add Row" or press Enter to begin
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Sticky totals footer */}
                {showTotals && filledRows.length > 0 && (
                    <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed' }}>
                        <tbody>
                            <tr style={S.tfootRow}>
                                <td style={{ ...S.tfootTd, width: 36 }} />
                                {columns.map((col, ci) => (
                                    <td
                                        key={col.key}
                                        style={{
                                            ...S.tfootTd,
                                            width: col.width ?? 120,
                                            textAlign: col.align || 'left',
                                            borderRight: ci === columns.length - 1 ? 'none' : '1px solid rgba(255,255,255,0.2)',
                                        }}
                                    >
                                        {col.type === 'number' && totals[col.key] !== undefined
                                            ? formatNum(totals[col.key], col.decimalScale)
                                            : ci === 0 ? 'TOTAL' : ''}
                                    </td>
                                ))}
                                {editMode && <td style={{ width: 44 }} />}
                            </tr>
                        </tbody>
                    </table>
                )}

                {/* Status bar with row count on the right */}
                <div style={S.statusBar}>
                    <span style={{ marginLeft: 'auto' }}>
                        {filledRows.length} row{filledRows.length !== 1 ? 's' : ''}
                    </span>
                </div>
            </div>
        </div>
    );
};

export default ExcelTable;