"use client";

import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { Eye, Edit2, MapPin, Phone, IndianRupee, Trash2, Save, X, Plus } from 'lucide-react';
import { useTheme } from '@/context/theme/themeContext';
import EditableCell from './EditableCell';
import { Button, Box } from '@chakra-ui/react';
import { Toaster,toaster } from '@/components/ui/toaster';
import { formatToFixed } from '@/utils/format/numberFormat';

export interface TableColumn {
    key: string;
    label: string;
    align?: 'left' | 'center' | 'right';
    width?: string;
    sortable?: boolean;
    responsive?: 'always' | 'xs'|'sm' | 'md' | 'lg' | 'xl';
    render?: (value: any, row: any, index: number) => React.ReactNode;
    headalign?: 'left' | 'center' | 'right';
    editable?: boolean;
    type?: 'text' | 'number' | 'date' | 'select' | 'combobox' | 'password' | 'numbers';
    options?: any[];
    collection?: any;
    getLabelByValue?: (collection: any, value: any) => string;
    sum?:number|boolean;
    onClassUse?: boolean;
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
 
}

const EditableTable: React.FC<TableProps> = ({
    columns,
    data,
    onView,
    onEdit,
    onDelete,
    onRowClick,
    onUpdateRow,
    onAddNew,
    onSaveRow,
    onCancelEdit,
    editingRowId,
    striped = true,
    hoverable = true,
    compact = 'auto',
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
   
}) => {
    const [windowWidth, setWindowWidth] = useState(
        typeof window !== "undefined" ? window.innerWidth : 1024
    );

    useEffect(() => {
        const handleResize = () => setWindowWidth(window.innerWidth);
        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, []);

    const { theme, mode } = useTheme();
    const isMobile = windowWidth < 640;
    const isTablet = windowWidth >= 640 && windowWidth < 1024;

    const tableStyles = {
        border: "border-[#555]",
        headerBg: "bg-[var(--table-header-bg)]",
        headerText: "text-[var(--table-header-text)]",
        bodyBg: "bg-[var(--table-body-bg)]",
        bodyText: "text-[var(--table-body-text)]",
        stripedBg: "bg-[var(--table-striped-bg)]",
        hoverBg: "hover:bg-[var(--table-hover-bg)]",
    };

    const [sortKey, setSortKey] = useState(defaultSortKey);
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>(defaultSortDirection);
    const [localEditingRowId, setLocalEditingRowId] = useState<any>(null);
    const [isNewRow, setIsNewRow] = useState(false);

    const getResponsiveWidth = (width?: string) => {
        if (!width) return undefined;
        if (isMobile && width.endsWith("px")) {
            return `${Math.max(60, parseInt(width) * 0.25)}px`;
        }
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
    const getTextSizeClass = () => isMobile ? "text-xs" : "text-xs";
    const getHeadTextSizeClass = () => isMobile ? "text-xs" : "text-xs";

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

    const handleSort = useCallback((key: string) => {
        if (sortKey === key) {
            setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
        } else {
            setSortKey(key);
            setSortDirection('asc');
        }
    }, [sortKey]);

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
        const rowId = row.__rowId ?? row.SNO ?? row.id ?? row._id;  // Prefer __rowId if present
        return editingRowId === rowId || localEditingRowId === rowId;
    }, [editingRowId, localEditingRowId]);

    const handleAddNew = () => {
        if (onAddNew) {
            onAddNew();
        } else {
            const newRow: any = {};
            columns.forEach(col => {
                if (col.key !== 'actions') {
                    newRow[col.key] = '';
                }
            });
            newRow.SNO = `new-${Date.now()}`;
            setLocalEditingRowId(newRow.SNO);
            setIsNewRow(true);
        }
    };

    const handleRowClick = (row: any) => {
        if (!enableInlineEditing || isEmptyRow(row, data.length)) return;

        const rowId = row.SNO || row.id || row._id;
        if (onRowClick) {
            onRowClick(row);
           
        } else if (!isRowEditing(row)) {
            setLocalEditingRowId(rowId);
            setIsNewRow(false);
        }
    };

    const handleSave = (row: any) => {
        if (onSaveRow) {
            onSaveRow(row, isNewRow);
        }
        setLocalEditingRowId(null);
        setIsNewRow(false);
        
    };

    const handleCancel = () => {
        if (onCancelEdit) {
            onCancelEdit(localEditingRowId);
        }
        setLocalEditingRowId(null);
        setIsNewRow(false);
    };

    const getDisplayValue = (column: TableColumn, value: any) => {
      
        console.log(column.type ,value ,'valuess')

        if (value == null || value === "") return "-";

        if (column.type === 'combobox' && column.collection && column.getLabelByValue) {
            return column.getLabelByValue(column.collection, value);
        }

        if (column.type === 'select' && column.options) {
            const option = column.options.find(opt => opt.value === value);
            return option?.label || value;
        }

        if (column.type == 'numbers') {
            return formatToFixed(value , 3) ;
        }
        if (column.type == 'number') {
            console.log(formatToFixed(value,3) ,'formated')
            return formatToFixed(value, 3);
        }

        if (column.type === 'date') {
            return new Date(value).toLocaleDateString("en-GB");
        }

        return value;
    };

    const renderCell = useCallback((column: TableColumn, row: any, rowIndex: number) => {
        if (isEmptyRow(row, rowIndex)) {
            return <span className="opacity-0">--</span>;
        }

        const value = row[column.key];
        const isEditing = isRowEditing(row);

        if (column.render) {
            return column.render(value, row, rowIndex);
        }

        if (isEditing && column.editable !== false && column.key !== 'actions') {
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
                        
                    />
                </div>
            );
        }

        const displayValue = getDisplayValue(column, value);

        if (isMobile && typeof displayValue === "string" && displayValue.length > 18) {
            return (
                <span className="block truncate " title={displayValue}>
                    {displayValue}
                </span>
            );
        }

        return displayValue;
    }, [isEmptyRow, isRowEditing, onUpdateRow, isMobile]);

    const renderActions = (row: any, rowIndex: number) => {
        if (isEmptyRow(row, rowIndex)) return null;

        const isEditing = isRowEditing(row);

        if (isEditing) {
            return (
                <div className="flex items-center justify-center gap-2">
                    <button
                        onClick={() => handleSave(row)}
                        className="p-1 text-green-600 hover:bg-green-50 rounded transition-colors"
                        title="Save"
                    >
                        <Save size={16} className='p-1 text-green-600 hover:bg-green-50 rounded transition-colors' />
                    </button>
                    <button
                        onClick={handleCancel}
                        className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors"
                        title="Cancel"
                    >
                        <X size={16} className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors" />
                    </button>
                </div>
            );
        }

        return (
            <div className="flex items-center justify-center gap-2">
                <button
                    onClick={() => handleRowClick(row)}
                    className="p-1 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                    title="Edit"
                >
                    <Edit2 size={16} className="p-1 text-blue-600 hover:bg-blue-50 rounded transition-colors" />
                </button>
                {onDelete && (
                    <button
                        onClick={() => onDelete(row)}
                        className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors"
                        title="Delete"
                    >
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

    const finalColumns = shouldShowActions
        ? [...visibleColumns, {
            key: 'actions',
            label: actionsHeader,
            align: 'center' as const,
            width: '25px',
            headalign: 'center' as const,
            render: (_: any, row: any, index: any) => renderActions(row, index),
        }]
        : visibleColumns;

    return (
        <div className="space-y-4">
            {showAddButton && (
                <div className="flex justify-end mb-2">
                    <Button
                        onClick={handleAddNew}
                        colorPalette='cyan'
                        size="2xs"
                        className="flex items-center text-[var(--primary-text-size)] gap-1"
                    >
                        <Plus size={10} />
                        {addButtonText}
                    </Button>
                </div>
            )}
            <Box marginTop={2}>
                <div
                    className={`overflow-hidden border border-[#555] shadow-sm  ${className}`}
                    style={{ borderCollapse: 'collapse' as const }}
                >
                    <div
                        className="overflow-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100 dark:scrollbar-thumb-gray-600 dark:scrollbar-track-gray-800"
                        style={fixedHeight ? { maxHeight: fixedHeight } : {}}
                    >
                        <table className="w-full border-collapse  border border-[#222]" style={{ borderCollapse: 'collapse' ,tableLayout:'fixed' }}>
                            <thead className={`sticky top-0  ${tableStyles.headerBg} ${headerClassName}`}>
                                <tr>
                                    {finalColumns.map((column) => (
                                        <th
                                            key={column.key}
                                            className={`
                                                ${getPaddingClass()}
                                              
                                                ${getHeadTextSizeClass()}
                                                font-semibold
                                                table-header-10
                                                ${tableStyles.headerText}
                                                uppercase tracking-wider
                                                whitespace-nowrap
                                                border-b border-[#000]
                                                border-r border-[#000]
                                                ${getHeadAlignmentClass(column.headalign)}
                                                last:border-r-0
                                            `}
                                            style={getResponsiveWidth(column.width) ? {
                                                width: getResponsiveWidth(column.width),
                                                minWidth: getResponsiveWidth(column.width)
                                            } : {}}
                                            scope="col"
                                        >
                                            <div className={getHeadAlignmentClass(column.headalign)}>
                                                {column.label}
                                            </div>
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
                                                className={`
                                                    ${getPaddingClass()}
                                                    ${getTextSizeClass()}
                                                    whitespace-nowrap
                                                    ${isEmptyRow(row, rowIndex) ? "text-transparent" : tableStyles.bodyText}
                                                    ${getAlignmentClass(column.align)}
                                                    border-r border-[#555]
                                                    last:border-r-0
                                                    table-body-10
                                                `}
                                                style={getResponsiveWidth(column.width) ? {
                                                    width: getResponsiveWidth(column.width),
                                                    minWidth: getResponsiveWidth(column.width)
                                                } : {}}
                                                role="cell"
                                            >
                                                {column.key === 'actions' ? (
                                                    renderActions(row, rowIndex)
                                                ) : (
                                                    <div className={getAlignmentClass(column.align)}>
                                                        {renderCell(column, row, rowIndex)}
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
                                <div className={`${tableStyles.bodyText} ${isMobile ? 'text-xs' : 'text-xs'} table-footer-text  font-medium`}>
                                    {emptyMessage}
                                </div>
                                <div className="text-gray-500  dark:text-gray-400 table-footer-text mt-1">
                                    There are no records to display
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </Box>
        </div>
    );
};

export default EditableTable;