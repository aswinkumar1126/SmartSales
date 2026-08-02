"use client";

import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { Edit2, Trash2, Save, X, Plus } from 'lucide-react';
import EditableCell from './EditableCell';
import { Button, Box } from '@chakra-ui/react';
import { formatToFixed } from '@/utils/format/numberFormat';

export interface TableColumn {
    key: string;
    label: string;
    align?: 'left' | 'center' | 'right';
    width?: string;
    sortable?: boolean;
    responsive?: 'always' | 'xs' | 'sm' | 'md' | 'lg' | 'xl';
    render?: (value: any, row: any, index: number) => React.ReactNode;
    headalign?: 'left' | 'center' | 'right';
    editable?: boolean;
    type?: 'text' | 'number' | 'date' | 'select' | 'combobox' | 'password' | 'numbers';
    options?: any[];
    collection?: any;
    getLabelByValue?: (collection: any, value: any) => string;
    sum?: number | boolean;
    onClassUse?: boolean;
    decimalScale?: number;
}

export interface TableProps {
    columns: TableColumn[];
    data: any[];
    onView?: (row: any) => void;
    onEdit?: (row: any) => void;
    onDelete?: (row: any) => void;
    onAddressClick?: (row: any) => void;
    onRowClick?: (row: any) => void;
    onUpdateRow?: (rowIndex: number, updatedRow: any) => void;
    onAddNew?: () => void;
    onSaveRow?: (row: any, isNew: boolean) => void;
    onCancelEdit?: (rowId?: any) => void;
    editingRowId?: any;
    striped?: boolean;
    hoverable?: boolean;
    compact?: boolean | 'auto';
    className?: string;
    headerClassName?: string;
    bodyClassName?: string;
    showActions?: boolean | 'responsive';
    actionsHeader?: string;
    emptyMessage?: string;
    loading?: boolean;
    showSmithFeatures?: boolean;
    onSmithDetailsClick?: (row: any) => void;
    defaultSortKey?: string;
    defaultSortDirection?: 'asc' | 'desc';
    fixedHeight?: string;
    showRows?: number;
    renderFooter?: () => React.ReactElement;
    showAddButton?: boolean;
    addButtonText?: string;
    enableInlineEditing?: boolean;
    isEditing?: boolean;
    transactionType?: string;
}

type FocusableElement = HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement | null;
type CellRefMap = Record<number, Record<string, FocusableElement>>;

const EditableTable: React.FC<TableProps> = ({
    columns,
    data,
    onDelete,
    onRowClick,
    onUpdateRow,
    onAddNew,
    onSaveRow,
    onCancelEdit,
    editingRowId,
    striped = true,
    hoverable = true,
    className = '',
    headerClassName = '',
    bodyClassName = '',
    showActions = 'responsive',
    actionsHeader = 'Actions',
    emptyMessage = 'No data available',
    loading = false,
    defaultSortKey,
    defaultSortDirection = 'asc',
    fixedHeight,
    showRows = 0,
    renderFooter,
    showAddButton = false,
    addButtonText = 'Add New',
    enableInlineEditing = true,
    isEditing = false,
    transactionType,
}) => {
    const [windowWidth, setWindowWidth] = useState(
        typeof window !== "undefined" ? window.innerWidth : 1024
    );
    const cellRefs = useRef<CellRefMap>({});

    useEffect(() => {
        const handleResize = () => setWindowWidth(window.innerWidth);
        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, []);

    const isMobile = windowWidth < 640;

    const getTableStyles = (type?: string) => {
        const typeColorMap: Record<string, any> = {
            PU: { headerBg: "bg-[#2F855A]", stripedBg: "bg-blue-50", hoverBg: "hover:bg-blue-100", bodyBg: "bg-[#E6FFFA]" },
            PR: { headerBg: "bg-[#C53030]", bodyBg: "bg-[#FFEAEA]" },
            ISP: { headerBg: "bg-[#DD6B20]", stripedBg: "bg-red-50", hoverBg: "hover:bg-red-100", bodyBg: "bg-[#FFF4E5]" },
            REC: { headerBg: "bg-[#c729ba]", stripedBg: "bg-green-50", hoverBg: "hover:bg-green-100", bodyBg: "bg-[#ffe8fd]" },
        };
        const colors = typeColorMap[type || ""] ?? { headerBg: "bg-gray-600", stripedBg: "bg-gray-50", hoverBg: "hover:bg-gray-100" };
        return { border: "border-[#555]", headerText: "text-white", bodyBg: "bg-white", bodyText: "text-gray-800", ...colors };
    };

    const tableStyles = getTableStyles(transactionType);

    const [sortKey, setSortKey] = useState(defaultSortKey);
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>(defaultSortDirection);
    const [localEditingRowId, setLocalEditingRowId] = useState<any>(null);
    const [isNewRow, setIsNewRow] = useState(false);

    const getResponsiveWidth = (width?: string) => {
        if (!width) return undefined;
        if (isMobile && width.endsWith("px")) return `${Math.max(60, parseInt(width) * 0.25)}px`;
        return width;
    };

    const visibleColumns = useMemo(() => {
        return columns.filter((col) => {
            if (!col.responsive || col.responsive === "always") return true;
            if (col.responsive === "xs") return windowWidth >= 768;
            if (col.responsive === "sm") return windowWidth >= 1024;
            if (col.responsive === "md") return windowWidth >= 1280;
            return true;
        });
    }, [columns, windowWidth]);

    const shouldShowActions = showActions === "responsive" ? !isMobile : showActions;

    const getAlignmentClass = (alignment: 'left' | 'center' | 'right' = 'left') => {
        switch (alignment) {
            case 'center': return 'text-center';
            case 'right': return 'text-right';
            default: return 'text-left';
        }
    };

    const getHeadAlignmentClass = (alignment: 'left' | 'center' | 'right' = 'left') => {
        switch (alignment) {
            case 'center': return 'text-center';
            case 'right': return 'text-right';
            default: return 'text-left';
        }
    };

    const getPaddingClass = () => isMobile ? "px-2 py-1" : "px-2 py-2";
    const getTextSizeClass = () => "text-sm";
    const getHeadTextSizeClass = () => "text-sm";

    const sortedData = useMemo(() => {
        if (!sortKey) return data;
        return [...data].sort((a, b) => {
            let valA = a[sortKey];
            let valB = b[sortKey];
            if (typeof valA === 'string') valA = valA.toLowerCase();
            if (typeof valB === 'string') valB = valB.toLowerCase();
            if (valA < valB) return sortDirection === 'asc' ? -1 : 1;
            if (valA > valB) return sortDirection === 'asc' ? 1 : -1;
            return 0;
        });
    }, [data, sortKey, sortDirection]);

    const displayData = useMemo(() => {
        if (showRows > 0) {
            const emptyRows = Array(Math.max(0, showRows - data.length)).fill({});
            return [...sortedData, ...emptyRows];
        }
        return sortedData;
    }, [sortedData, showRows, data.length]);

    const isEmptyRow = useCallback((row: any, index: number) => {
        return index >= data.length && showRows > 0;
    }, [data.length, showRows]);

    const isRowEditing = useCallback((row: any) => {
        const rowId = row.__rowId ?? row.SNO ?? row.id ?? row._id;
        return editingRowId === rowId || localEditingRowId === rowId;
    }, [editingRowId, localEditingRowId]);

    /* ------------------------------------------------------------------ */
    /* FOCUS NEXT CELL                                                       */
    /* ------------------------------------------------------------------ */
    const focusNextCell = useCallback((rowIndex: number, colIndex: number) => {
        // Get editable columns only (excluding actions, SNO, calculated fields)
        const editableCols = finalColumns.filter(c =>
            c.key !== "actions" &&
            c.editable !== false
        );

        let nextColIndex = colIndex + 1;
        let nextRowIndex = rowIndex;

        if (nextColIndex >= editableCols.length) {
            nextColIndex = 0;
            nextRowIndex = rowIndex + 1;
        }

        if (nextRowIndex >= data.length) {
            nextRowIndex = 0;
        }

        const nextKey = editableCols[nextColIndex]?.key;
        if (!nextKey) return;

        const nextRowData = data[nextRowIndex];
        if (!nextRowData) return;

        const attemptFocus = () => {
            const el = cellRefs.current?.[nextRowIndex]?.[nextKey];
            if (el) {
                el.focus();
                try { if ("select" in el) el.select(); } catch { }
                return true;
            }
            return false;
        };

        // If next cell is in a different row, trigger row click first
        if (nextRowIndex !== rowIndex && onRowClick && editingRowId !== nextRowData.__rowId) {
            onRowClick(nextRowData);
        }

        // Try immediately, then retry
        if (attemptFocus()) return;

        let attempts = 0;
        const tryFocus = () => {
            if (attemptFocus()) return;
            attempts++;
            if (attempts < 10) setTimeout(tryFocus, 50);
        };
        setTimeout(tryFocus, 50);
    }, [data, editingRowId, onRowClick]);

    /* ------------------------------------------------------------------ */

    const setCellRef = useCallback((rowIndex: number, colKey: string, el: FocusableElement) => {
        if (!el) return;
        if (!cellRefs.current[rowIndex]) cellRefs.current[rowIndex] = {};
        if (cellRefs.current[rowIndex][colKey] !== el) {
            cellRefs.current[rowIndex][colKey] = el;
        }
    }, []);

    const handleAddNew = () => {
        if (onAddNew) {
            onAddNew();
        } else {
            const newRow: any = {};
            columns.forEach(col => { if (col.key !== 'actions') newRow[col.key] = ''; });
            newRow.SNO = `new-${Date.now()}`;
            setLocalEditingRowId(newRow.SNO);
            setIsNewRow(true);
        }
    };

    const handleRowClick = (row: any) => {
        if (!enableInlineEditing || isEmptyRow(row, data.length)) return;
        const rowId = row.__rowId ?? row.SNO ?? row.id ?? row._id;
        if (onRowClick) {
            onRowClick(row);
        } else if (!isRowEditing(row)) {
            setLocalEditingRowId(rowId);
            setIsNewRow(false);
        }
    };

    const handleSave = (row: any) => {
        if (onSaveRow) onSaveRow(row, isNewRow);
        setLocalEditingRowId(null);
        setIsNewRow(false);
    };

    const handleCancel = () => {
        if (onCancelEdit) onCancelEdit(localEditingRowId);
        setLocalEditingRowId(null);
        setIsNewRow(false);
    };

    const getDisplayValue = (column: TableColumn, value: any) => {
        if (value == null || value === "") return "-";
        if (column.type === 'combobox' && column.collection && column.getLabelByValue) {
            return column.getLabelByValue(column.collection, value);
        }
        if (column.type === 'select' && column.options) {
            const option = column.options.find(opt => opt.value === value);
            return option?.label || value;
        }
        if ((column.type === "numbers" || column.type === "number") && Number(column.decimalScale) > 1) {
            return formatToFixed(value, column.decimalScale);
        }
        if (column.type === 'date') return new Date(value).toLocaleDateString("en-GB");
        return value;
    };

    // Build finalColumns here so focusNextCell can use it
    const finalColumns = useMemo(() => {
        return shouldShowActions
            ? [...visibleColumns, {
                key: 'actions',
                label: actionsHeader,
                align: 'center' as const,
                width: '25px',
                headalign: 'center' as const,
                editable: false,
                render: (_: any, row: any, index: any) => renderActions(row, index),
            }]
            : visibleColumns;
    }, [visibleColumns, shouldShowActions, actionsHeader]);

    // Get editable columns for focus navigation (mirrors what focusNextCell uses)
    const editableColKeys = useMemo(() =>
        finalColumns.filter(c => c.key !== "actions" && c.editable !== false).map(c => c.key),
        [finalColumns]
    );

    const renderCell = useCallback((column: TableColumn, row: any, rowIndex: number, colIndex: number) => {
        if (isEmptyRow(row, rowIndex)) return <span className="opacity-0">--</span>;

        const value = row[column.key];
        const issEditing = isRowEditing(row);

        if (column.render) return column.render(value, row, rowIndex);

        if (issEditing && column.editable !== false && column.key !== 'actions') {
            // Find the index within editable columns for correct navigation
            const editableColIndex = editableColKeys.indexOf(column.key);

            const handleSaveCell = async (newValue: any) => {
                const updatedRow = { ...row, [column.key]: newValue };
                onUpdateRow?.(rowIndex, updatedRow);
            };

            return (
                <div className="min-w-0">
                    <EditableCell
                        value={value}
                        type={column.type || 'text'}
                        onClassUse={column.onClassUse}
                        onSave={handleSaveCell}
                        options={column.options}
                        collection={column.collection}
                        getLabelByValue={column.getLabelByValue}
                        inputRef={(el) => setCellRef(rowIndex, column.key, el)}
                        onEnter={() => focusNextCell(rowIndex, editableColIndex)}
                    />
                </div>
            );
        }

        const displayValue = getDisplayValue(column, value);

        if (isMobile && typeof displayValue === "string" && displayValue.length > 18) {
            return <span className="block truncate" title={displayValue}>{displayValue}</span>;
        }

        return displayValue;
    }, [isEmptyRow, isRowEditing, onUpdateRow, isMobile, focusNextCell, getDisplayValue, setCellRef, editableColKeys]);

    const renderActions = (row: any, rowIndex: number) => {
        if (isEmptyRow(row, rowIndex)) return null;
        const issEditing = isRowEditing(row);

        if (issEditing) {
            return (
                <div className="flex items-center justify-center gap-2">
                    <button onClick={() => handleSave(row)} className="p-1 text-green-600 hover:bg-green-50 rounded transition-colors" title="Save">
                        <Save size={16} className="p-1 text-green-600 hover:bg-green-50 rounded transition-colors" />
                    </button>
                    {!isEditing && (
                        <button onClick={handleCancel} className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors" title="Cancel">
                            <X size={16} className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors" />
                        </button>
                    )}
                </div>
            );
        }

        return (
            <div className="flex items-center justify-center gap-2">
                <button onClick={() => handleRowClick(row)} className="p-1 text-blue-600 hover:bg-blue-50 rounded transition-colors" title="Edit">
                    <Edit2 size={16} className="p-1 text-blue-600 hover:bg-blue-50 rounded transition-colors" />
                </button>
                {onDelete && !isEditing && (
                    <button onClick={() => onDelete(row)} className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors" title="Delete">
                        <Trash2 size={16} className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors" />
                    </button>
                )}
            </div>
        );
    };

    if (loading) {
        return (
            <div className="animate-pulse rounded-lg border border-[#555]">
                <div className="px-3 py-2 bg-gray-100 dark:bg-gray-800">
                    <div className="h-4 w-1/3 bg-gray-300 dark:bg-gray-600 rounded" />
                </div>
                {[...Array(5)].map((_, i) => (
                    <div key={i} className="px-3 py-2 border-t border-[#555]">
                        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded" />
                    </div>
                ))}
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {showAddButton && (
                <div className="flex justify-end mb-2">
                    <Button onClick={handleAddNew} colorPalette="cyan" size="2xs" className="flex items-center text-[var(--primary-text-size)] gap-1">
                        <Plus size={10} />
                        {addButtonText}
                    </Button>
                </div>
            )}
            <Box marginTop={2}>
                <div className={`overflow-hidden border border-[#555] shadow-sm ${className}`} style={{ borderCollapse: 'collapse' as const }}>
                    <div className="overflow-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100 dark:scrollbar-thumb-gray-600 dark:scrollbar-track-gray-800" style={fixedHeight ? { maxHeight: fixedHeight } : {}}>
                        <table className="w-full border-collapse border border-[#222]" style={{ borderCollapse: 'collapse', tableLayout: 'fixed' }}>
                            <thead className={`sticky top-0 ${tableStyles.headerBg} ${headerClassName}`}>
                                <tr>
                                    {finalColumns.map((column) => (
                                        <th
                                            key={column.key}
                                            className={`${getPaddingClass()} ${getHeadTextSizeClass()} font-semibold table-header-10 ${tableStyles.headerText} uppercase tracking-wider whitespace-nowrap border-b border-[#000] border-r border-[#000] ${getHeadAlignmentClass(column.headalign)} last:border-r-0`}
                                            style={getResponsiveWidth(column.width) ? { width: getResponsiveWidth(column.width), minWidth: getResponsiveWidth(column.width) } : {}}
                                            scope="col"
                                        >
                                            <div className={getHeadAlignmentClass(column.headalign)}>{column.label}</div>
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className={`${tableStyles.bodyBg} ${bodyClassName}`}>
                                {displayData.map((row, rowIndex) => (
                                    <tr
                                        key={rowIndex}
                                        className={`
                                            transition-colors duration-200
                                            ${rowIndex !== displayData.length - 1 ? 'border-b border-[#555]' : ''}
                                            ${striped && rowIndex % 2 === 0 ? tableStyles.stripedBg : ""}
                                            ${hoverable && !isEmptyRow(row, rowIndex) ? 'cursor-pointer ' + tableStyles.hoverBg : ""}
                                            ${isRowEditing(row) ? 'bg-blue-50 dark:bg-blue-900/20' : ''}
                                        `}
                                        onClick={() => handleRowClick(row)}
                                        role="row"
                                    >
                                        {finalColumns.map((column, colIndex) => (
                                            <td
                                                key={column.key}
                                                className={`${getPaddingClass()} ${getTextSizeClass()} whitespace-nowrap ${isEmptyRow(row, rowIndex) ? "text-transparent" : tableStyles.bodyText} ${getAlignmentClass(column.align)} border-r border-[#555] last:border-r-0 table-body-10`}
                                                style={getResponsiveWidth(column.width) ? { width: getResponsiveWidth(column.width), minWidth: getResponsiveWidth(column.width) } : {}}
                                                role="cell"
                                            >
                                                {column.key === 'actions' ? (
                                                    renderActions(row, rowIndex)
                                                ) : (
                                                    <div className={getAlignmentClass(column.align)}>
                                                        {renderCell(column, row, rowIndex, colIndex)}
                                                    </div>
                                                )}
                                            </td>
                                        ))}
                                    </tr>
                                ))}
                            </tbody>
                            {renderFooter && renderFooter()}
                        </table>

                        {displayData.length === 0 && !loading && (
                            <div className={`text-center p-2 ${tableStyles.bodyBg} border-t border-[#555]`}>
                                <div className={`${tableStyles.bodyText} ${isMobile ? 'text-sm' : 'text-sm'} table-footer-text font-medium`}>{emptyMessage}</div>
                                <div className="text-gray-500 dark:text-gray-400 table-footer-text mt-1">There are no records to display</div>
                            </div>
                        )}
                    </div>
                </div>
            </Box>
        </div>
    );
};

export default EditableTable;