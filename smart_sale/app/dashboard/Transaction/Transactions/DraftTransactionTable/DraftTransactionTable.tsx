"use client";

import React, { useMemo, useCallback } from "react";
import { Box, Text } from "@chakra-ui/react";
import EditableTable from "@/component/table/EditableTable";
import { issueColumns } from "../../Transaction/Issue/isseColumns";

interface DraftTransactionTableProps {
    rows: any[];
    editingRowId: string | number | null;
    onAddRow: () => void;
    onUpdateRow: (rowIndex: number, field: string, value: any) => void;
    onRemoveRow: (rowId: string) => void;
    onRowClick: (row: any) => void;
    onCancelEdit: (rowId?: string) => void;
    onSaveRow: (row: any, isNew: boolean) => void;
    itemsCollection: any;
    totals: any;
    transactionTitle: string | undefined;
    theme: any;
    itemsFilter:any;
}

export default function DraftTransactionTable({
    rows,
    editingRowId,
    onAddRow,
    onUpdateRow,
    onRemoveRow,
    onRowClick,
    onCancelEdit,
    onSaveRow,
    itemsCollection,
    totals,
    transactionTitle,
    theme,
    itemsFilter
}: DraftTransactionTableProps) {
    console.log("DraftTable - rows:", rows.length, "editingRowId:", editingRowId);

    // Create adapter function for updating rows
    const handleUpdateRowAdapter = useCallback((rowIndex: number, updatedRow: any) => {
        console.log("Updating row", rowIndex, "with:", updatedRow);

        // Get the current row
        const currentRow = rows[rowIndex];
        if (!currentRow) return;

        // Find which fields changed
        Object.keys(updatedRow).forEach(field => {
            if (field.startsWith('__')) return; // Skip internal fields

            const currentValue = currentRow[field];
            const newValue = updatedRow[field];

            // Check if value actually changed
            if (currentValue !== newValue) {
                console.log(`Field ${field} changed from ${currentValue} to ${newValue}`);
                onUpdateRow(rowIndex, field, newValue);
            }
        });
    }, [rows, onUpdateRow]);

    // Handle delete row
    const handleDeleteRow = useCallback((row: any) => {
        const rowId = row.__rowId;
        console.log("Deleting row:", rowId);
        
        if (rowId) {
            const canDelete = window.confirm("Are you sure you want to delete this row?")
            canDelete ? onRemoveRow(rowId) : null;
        }
    }, [onRemoveRow]);

    const columns = useMemo(() => {
        const numeric = [
            "PCS", "GRSWT", "LESSWT", "NETWT",
            "PURITY", "PUREWT", "RATE", "MCHARGE", "WASTAGE",
        ];

        return issueColumns.map((col) => {
            if (col.key === "SNO") {
                return {
                    ...col,
                    editable: false,
                    render: (_: any, row: any) => (
                        <span className="text-gray-500">
                            {row.__previewSno || "New"}
                        </span>
                    ),
                };
            }

            if (col.key === "ITEMID") {
                return {
                    ...col,
                    type: "combobox" as const,
                    collection: itemsCollection,
                    filter: itemsFilter,
                    align: "left" as const,
                    headalign: "left" as const,
                    getLabelByValue: (collection: any, value: any) => {
                        if (!collection?.items) return value || "";
                        const item = collection.items.find((i: any) => i.value === value?.toString());
                        return item?.label || value || "";
                    },
              
                    
                };
            }

            return {
                ...col,
                editable: true,
                type: numeric.includes(col.key) ? "number" as const : "text" as const,
                align: numeric.includes(col.key) ? "right" as const : "center" as const,
                headalign: numeric.includes(col.key) ? "right" as const : "center" as const,
                sum: numeric.includes(col.key),
             
            };
        });
    }, [itemsCollection]);

    const handleRowClick = useCallback((row: any) => {
        console.log("Row clicked:", row.__rowId);
        onRowClick(row);
    }, [onRowClick]);

    return (
        <Box marginTop={1}>
            <EditableTable
                columns={columns}
                data={rows}
            
                editingRowId={editingRowId}
                enableInlineEditing
                striped
                hoverable
                showAddButton
                showActions="responsive"
                addButtonText={`Add ${transactionTitle} Item`}
                onAddNew={onAddRow}
                onUpdateRow={handleUpdateRowAdapter}
                onSaveRow={onSaveRow}
                onCancelEdit={onCancelEdit}
                onDelete={handleDeleteRow} // Pass delete handler
                onRowClick={handleRowClick}
                fixedHeight="300px"
                renderFooter={
                    rows.length > 0
                        ? () => (
                            <tfoot className="sticky bottom-0 bg-gray-500 dark:bg-gray-800 border-t border-[#555]">
                                <tr>
                                    {columns.map((column, index) => (
                                        <td
                                            key={column.key}
                                            className={`
                                                px-2 py-2 font-semibold
                                                ${column.align === "right" ? "text-right" : "text-left"}
                                                border-r border-[#555]
                                                last:border-r-0
                                                text-white
                                                table-footer-10
                                            `}
                                        >
                                            {index === 0
                                                ? "TOTAL"
                                                : totals[column.key] != null
                                                    ? Number(totals[column.key]).toFixed(3)
                                                    : ""}
                                        </td>
                                    ))}
                                </tr>
                            </tfoot>
                        )
                        : undefined
                }
            />
        </Box>
    );
}