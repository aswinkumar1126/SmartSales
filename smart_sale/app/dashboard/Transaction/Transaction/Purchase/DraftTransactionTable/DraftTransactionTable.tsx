"use client";

import React, { useMemo, useCallback, useState ,useEffect } from "react";
import {
    Box,
    Text,
    Button,
    Flex,
    Badge,
    HStack,
    Stack,
    Icon,
} from "@chakra-ui/react";
import { LuPlus, LuX } from "react-icons/lu";
import EditableTable from "@/component/table/EditableTable";
import AddTransactionItemForm, { FormField } from "./AddTransactionItemForm";
import { issueColumns, issueDataColumns } from "../../Issue/isseColumns";
import { applyWeightTouchLogic } from "@/hooks/pure/applyWeightTouchLogic";
import { toaster } from "@/components/ui/toaster";

interface DraftTransactionTableProps {
    rows: any[];
    editingRowId: string | number | null;
    onAddRow: (formData?: any) => void;
    onUpdateRow: (rowIndex: number, field: string, value: any) => void;
    onRemoveRow: (rowId: string) => void;
    onRowClick: (row: any) => void;
    onCancelEdit: (rowId?: string) => void;
    onSaveRow: (row: any, isNew: boolean) => void;
    itemsCollection: any;
    totals: any;
    transactionTitle: string | undefined;
    theme: any;
    itemsFilter: any;
    handleClearForm?: any;
    isEditing: boolean;
    isIssue?:boolean;
    getAvailableWeight?: (id: string | number ) => number | null;
    onClear?: () => void;
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
    itemsFilter,
    handleClearForm,
    isEditing,
    isIssue,
    getAvailableWeight,
    onClear,

}: DraftTransactionTableProps) {
    console.log("DraftTable - rows:", rows, "editingRowId:", editingRowId, "isEditing:", isEditing);

    const [showForm, setShowForm] = useState(false);
    const [hasChanges, setHasChanges] = useState(false);

    // Function to check if a field should be editable based on edit mode
    const isFieldEditable = (field: string) => {
        if (!isEditing) return true;

        // Fields that CANNOT be edited during transaction edit
        const nonEditableFields = ['ITEMID', 'ITEMCODE', 'TRANSACTION_TYPE'];
        return !nonEditableFields.includes(field);
    };

    // Create adapter function for updating rows
   const handleUpdateRowAdapter = useCallback(
  (rowIndex: number, updatedRow: any) => {
    const currentRow = rows[rowIndex];
    if (!currentRow) return;

    console.log("🟡 Adapter called");
    console.log("Row index:", rowIndex);
    console.log("Current row:", currentRow);
    console.log("Updated row:", updatedRow);

    Object.keys(updatedRow).forEach((field) => {
      const newValue = updatedRow[field];
      const oldValue = currentRow[field];

      console.log(`➡️ Field: ${field}`);
      console.log("Old:", oldValue);
      console.log("New:", newValue);

      // ⛔ Prevent wiping values on focus
      if (newValue === undefined || newValue === null) {
        console.warn(`⛔ Blocked wipe for field: ${field}`);
        return;
      }

      if (newValue !== oldValue) {
        console.log(`✅ Calling onUpdateRow(${rowIndex}, ${field}, ${newValue})`);
        onUpdateRow(rowIndex, field, newValue);
      } else {
        console.log(`⚪ No change for field: ${field}`);
      }
    });
  },
  [rows, onUpdateRow]
);


    // Handle delete row
    const handleDeleteRow = useCallback(
        (row: any) => {
            if (isEditing) {
                // Show warning when trying to delete during edit
                const canDelete = window.confirm(
                    "Are you sure you want to delete this item? You must save the transaction first."
                );
                if (!canDelete) return;
            }

            const rowId = row.__rowId;
            console.log("Deleting row:", rowId);

            if (rowId) {
                const confirmDelete = window.confirm(
                    "Are you sure you want to delete this row?"
                );
                if (confirmDelete) {
                    onRemoveRow(rowId);
                    if (isEditing) {
                        setHasChanges(true);
                    }
                }
            }
        },
        [onRemoveRow, isEditing]
    );

    // Handle row click
    const handleRowClick = useCallback(
        (row: any) => {
            console.log("Row clicked:", row.__rowId);
            onRowClick(row);
        },
        [onRowClick]
    );

    // Handle add via form submission
    const handleAddViaForm = useCallback(
        (formData: any) => {
            if (isEditing) {
                const confirmAdd = window.confirm(
                    "You are editing an existing transaction. Adding new items will modify the transaction. Continue?"
                );
                if (!confirmAdd) return;

                setHasChanges(true);
            }

            // 🔥 Check duplicate PUREID
            // const isDuplicate = rows.some(
            //     (row) => row.PUREID === formData.PUREID
            // );

            // if (isDuplicate) {
            //     toaster.create({
            //         title:"This PURE ID already exists.",
            //         type:'error'
            //     });
            //     return;
            // }

            const newRow: any = {
                ...formData,
                __rowId: `form-${Date.now()}`,
                __isNew: true,
                __previewSno: rows.length + 1,
            };

            onAddRow(newRow);
        },
        [rows, onAddRow, isEditing]
    );


    // Handle inline add
    const handleAddInline = useCallback(() => {
        if (isEditing) {
            // Show warning when trying to add new rows during edit
            const confirmAdd = window.confirm(
                "You are editing an existing transaction. Adding new items will modify the transaction. Continue?"
            );
            if (!confirmAdd) return;

            setHasChanges(true);
        }
        onAddRow();
    }, [onAddRow, isEditing]);

    // Define fields that should be hidden from form (calculated fields)
    const hiddenFields = ["NETWT", "PUREWT"];

    // Prepare form fields from columns with proper grid column spans
    const formFields = useMemo(() => {
        const numericFields = [
            "PCS", "GRSWT", "LESSWT", "PURITY", "RATE",
            "MCHARGE", "WASTAGE", "AMOUNT", "IGST", "CGST", "SGST",
            "WT" , "A_WT" , "TOUCH" ,"A_TOUCH" , "PURE" ,"A_PURE"
        ];

        const baseColumns = isIssue ? issueDataColumns : issueColumns;

        return baseColumns
            .filter(
                (col) =>
                    col.key !== "SNO" &&
                    col.key !== "ACTIONS" &&
                    !hiddenFields.includes(col.key)
            )
            .map((col): FormField => {
                const isNumeric = numericFields.includes(col.key);

                const isRequired = isIssue
                    ? ["PUREID", "TOUCH", "WT" ,"PURE"].includes(col.key)
                    : ["ITEMID", "PURITY", "GRSWT"].includes(col.key);

                const baseField: FormField = {
                    key: col.key,
                    label: col.label || col.key,
                    placeholder: `Enter ${col.label || col.key}`,
                    type: isNumeric ? "number" : "capitalized",
                    isRequired,
                    size: "xs",
                    // ...(isNumeric && 'max' in col && typeof col.max === 'number' ? { max: col.max } : {}),
                    ...(isNumeric && 'decimalScale' in col && typeof col.decimalScale === 'number' ? { decimalScale: col.decimalScale } : {}),
                };

                if (col.key === "ITEMID") {
                    return {
                        ...baseField,
                        type: "combobox",
                        collection: itemsCollection,
                        isRequired: true,
                        disabled: isEditing,
                    };
                }

                if (col.key === "PUREID") {
                    return {
                        ...baseField,
                        type: "combobox",
                        collection: itemsCollection,
                        isRequired: true,
                        disabled: isEditing,
                    };
                }
                if (col.key === "PURITY") {
                    return {
                        ...baseField,
                        type: "number",
                        min: 0,
                        max: 100,
                        step: 0.001,
                        precision: 3,
                        isRequired: true,
                    };
                }

                if (col.key === "LESSWT" || col.key === "WASTAGE") {
                    return {
                        ...baseField,
                        type: "number",
                        allowNegative: true,
                        confirmNegative: false,
                    };
                }

                if (col.key === "ITEMCODE" || col.key === "HSNCODE") {
                    return {
                        ...baseField,
                        type: "capitalized",
                        disabled: isEditing,
                    };
                }

                if (col.key === "RATE" || col.key === "AMOUNT") {
                    return {
                        ...baseField,
                        type: "number",
                    };
                }

                return baseField;
            });
    }, [itemsCollection, isEditing, isIssue]);


    // Memoize columns for table
    const activeColumns = isIssue ? issueDataColumns : issueColumns;

    const columns = useMemo(() => {
        const numeric = [
            "PCS", "GRSWT", "LESSWT", "NETWT",
            "PURITY", "PUREWT", "RATE",
            "MCHARGE", "WASTAGE", "AMOUNT",
            "IGST", "CGST", "SGST",
            "WT" , "A_WT" , "TOUCH" ,"A_TOUCH" , "PURE" ,"A_PURE"
        ];

        return activeColumns.map((col) => {
            if (col.key === "SNO") {
                return {
                    ...col,
                    editable: false,
                    render: (_: any, row: any) => (
                        <span className="text-gray-500 text-xs">
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
                        const item = collection.items.find(
                            (i: any) => i.value === value?.toString()
                        );
                        return item?.label || value || "";
                    },
                    editable: !isEditing, // Make ITEMID non-editable during edit
                    disabled: isEditing, // Visual disable during edit
                };
            }
            if (col.key === "PUREID") {
                return {
                    ...col,
                    type: "combobox" as const,
                    collection: itemsCollection,
                    filter: itemsFilter,
                    align: "left" as const,
                    headalign: "left" as const,
                    getLabelByValue: (collection: any, value: any) => {
                        if (!collection?.items) return value || "";
                        const item = collection.items.find(
                            (i: any) => i.value === value?.toString()
                        );
                        return item?.label || value || "";
                    },
                    editable: !isEditing, // Make ITEMID non-editable during edit
                    disabled: isEditing, // Visual disable during edit
                };
            }

            if (col.key === "ITEMCODE") {
                return {
                    ...col,
                    editable: !isEditing, // Make ITEMCODE non-editable during edit
                    disabled: isEditing, // Visual disable during edit
                };
            }

            return {
                editable: isEditing ? isFieldEditable(col.key) : true, // Control editability based on mode
                ...col,
                type: numeric.includes(col.key) ? ("number" as const) : ("text" as const),
                align: numeric.includes(col.key) ? ("right" as const) : ("center" as const),
                headalign: numeric.includes(col.key) ? ("right" as const) : ("center" as const),
                sum: numeric.includes(col.key),
                onClassUse: true,
            };
        });
    }, [activeColumns, itemsCollection, itemsFilter, isEditing, isFieldEditable]);

    // Handle cancel edit
    const handleCancelEdit = useCallback((rowId?: string) => {
        if (isEditing && hasChanges) {
            const confirmCancel = window.confirm(
                "You have unsaved changes. Are you sure you want to cancel editing? All changes will be lost."
            );
            if (!confirmCancel) return;
        }
        onCancelEdit(rowId);
    }, [onCancelEdit, isEditing, hasChanges]);

    // Handle save row
    const handleSaveRow = useCallback((row: any, isNew: boolean) => {
        if (isEditing) {
            setHasChanges(true);
        }
        onSaveRow(row, isNew);
    }, [onSaveRow, isEditing]);

    return (
        <Box>
            {/* Header with Action Buttons */}
            <Flex
                justifyContent="space-between"
                alignItems="center"
                px={2}
                py={1}
                bg={theme.colors.formColor}
                rounded="md"
                borderWidth="1px"
                borderColor={theme.colors.borderColor}
            >
                <Flex alignItems="center" gap={3}>
                    <Text
                        fontSize="xs"
                        fontWeight="semibold"
                        color={theme.colors.primaryText}
                    >
                        {transactionTitle || "Transaction"} Items
                        {isEditing && " (Editing Mode)"}
                    </Text>
                    <Badge
                        colorScheme={rows.length > 0 ? "green" : "gray"}
                        variant="subtle"
                        fontSize="2xs"
                        px={2}
                        py={0.5}
                    >
                        {rows.length} item{rows.length !== 1 ? "s" : ""}
                    </Badge>

                    {/* Warning badge if changes made during edit */}
                    {isEditing && hasChanges && (
                        <Badge
                            colorScheme="orange"
                            variant="solid"
                            fontSize="2xs"
                            px={2}
                            py={0.5}
                        >
                            Unsaved Changes
                        </Badge>
                    )}
                </Flex>

                <HStack>
                    {/* Only show Add buttons when NOT in edit mode OR show with warning */}
                    {!isEditing && (
                        <>
                            {!showForm ? (
                                <Button
                                    size="xs"
                                    variant="solid"
                                    colorPalette="cyan"
                                    onClick={() => setShowForm(true)}
                                    fontSize="2xs"
                                    height="24px"
                                >
                                    Add via Form
                                </Button>
                            ) : (
                                <Button
                                    size="xs"
                                    variant="outline"
                                    colorPalette="red"
                                    onClick={() => setShowForm(false)}
                                    fontSize="2xs"
                                    height="24px"
                                >
                                    <Icon as={LuX} boxSize={2} /> Close Form
                                </Button>
                            )}

                            <Button
                                size="xs"
                                variant="outline"
                                colorPalette="green"
                                onClick={handleAddInline}
                                fontSize="2xs"
                                height="24px"
                            >
                                Add Inline
                            </Button>
                            <Button
                                size="2xs"
                                colorPalette="red"
                                variant="outline"
                                onClick={() => onClear?.()}
                                fontSize='2xs'
                            >
                                Clear All
                            </Button>
                        </>
                    )}

                   
                </HStack>
            </Flex>

           

            {/* Form Section - Only shown when showForm is true */}
            {showForm && !isEditing && (
                <Box mb={1}>
                    <AddTransactionItemForm
                        fields={formFields}
                        onSubmit={handleAddViaForm}
                        onCancel={() => setShowForm(false)}
                        compact={true}
                        isEditing={isEditing}
                        getAvailableWeight={getAvailableWeight}
                    />
                </Box>
            )}

            {/* Table Section */}
            <Box
                borderWidth="1px"
                borderColor={theme.colors.borderColor}
                borderRadius="lg"
                overflow="hidden"
                bg="white"
            >
                <EditableTable
                    columns={columns}
                    isEditing={isEditing}
                    data={rows}
                    editingRowId={editingRowId}
                    enableInlineEditing
                    striped
                    hoverable
                    showActions="responsive"
                    onUpdateRow={handleUpdateRowAdapter}
                    onSaveRow={handleSaveRow}
                    onCancelEdit={handleCancelEdit}
                    onDelete={handleDeleteRow}
                    onRowClick={handleRowClick}
                    fixedHeight="200px"
                    renderFooter={
                        rows.length > 0
                            ? () => (
                                <tfoot className="sticky bottom-0 bg-gray-600 border-t border-gray-500">
                                    <tr>
                                        {columns.map((column, index) => (
                                            <td
                                                key={column.key}
                                                className={`
                            px-3 py-2 font-semibold text-xs
                            ${column.align === "right" ? "text-right" : "text-left"}
                            border-r border-gray-500
                            last:border-r-0
                            text-white
                            table-footer-10
                          `}
                                            >
                                                {index === 1
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
        </Box>
    );
}