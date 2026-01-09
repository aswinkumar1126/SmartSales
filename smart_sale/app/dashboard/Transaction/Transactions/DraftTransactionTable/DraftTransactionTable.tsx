"use client";

import React, { useMemo, useCallback, useState } from "react";
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
import { issueColumns } from "../../Transaction/Issue/isseColumns";

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
    isEditing
}: DraftTransactionTableProps) {
    console.log("DraftTable - rows:", rows.length, "editingRowId:", editingRowId, "isEditing:", isEditing);

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
            console.log("Updating row", rowIndex, "with:", updatedRow);

            const currentRow = rows[rowIndex];
            if (!currentRow) return;

            // Check if any non-editable fields are being changed during edit mode
            if (isEditing) {
                const nonEditableFields = ['ITEMID', 'ITEMCODE', 'TRANSACTION_TYPE'];
                const changedNonEditable = nonEditableFields.filter(field =>
                    updatedRow[field] !== undefined &&
                    updatedRow[field] !== currentRow[field]
                );

                if (changedNonEditable.length > 0) {
                    console.warn("Attempted to change non-editable fields during edit:", changedNonEditable);
                    // Don't allow changes to non-editable fields during edit
                    return;
                }
            }

            let hasChanges = false;
            Object.keys(updatedRow).forEach((field) => {
                if (field.startsWith("__")) return;

                const currentValue = currentRow[field];
                const newValue = updatedRow[field];

                if (currentValue !== newValue) {
                    console.log(
                        `Field ${field} changed from ${currentValue} to ${newValue}`
                    );
                    onUpdateRow(rowIndex, field, newValue);
                    hasChanges = true;
                }
            });

            // Track if there are any changes (for warning purposes)
            if (hasChanges && isEditing) {
                setHasChanges(true);
            }
        },
        [rows, onUpdateRow, isEditing]
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
                // Show warning when trying to add new rows during edit
                const confirmAdd = window.confirm(
                    "You are editing an existing transaction. Adding new items will modify the transaction. Continue?"
                );
                if (!confirmAdd) return;

                setHasChanges(true);
            }

            // NETWT and PUREWT are already calculated in the form
            const newRow: any = {
                ...formData,
                __rowId: `form-${Date.now()}`,
                __isNew: true,
                __previewSno: rows.length + 1,
            };

            onAddRow(newRow);
            // Close form after successful submission
            // setShowForm(false);
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
            "PCS",
            "GRSWT",
            "LESSWT",
            "PURITY",
            "RATE",
            "MCHARGE",
            "WASTAGE",
            "AMOUNT",
            "IGST",
            "CGST",
            "SGST",
        ];

        return issueColumns
            .filter(
                (col) =>
                    col.key !== "SNO" &&
                    col.key !== "ACTIONS" &&
                    !hiddenFields.includes(col.key)
            )
            .map((col): FormField => {
                const isNumeric = numericFields.includes(col.key);
                const isRequired =
                    col.key === "ITEMID" || col.key === "PURITY" || col.key === "GRSWT";

                const baseField: FormField = {
                    key: col.key,
                    label: col.label || col.key,
                    placeholder: `Enter ${col.label || col.key}`,
                    type: isNumeric ? "number" : "capitalized",
                    isRequired,
                    size: "xs",
                };

                // Special handling for specific fields with custom grid columns
                if (col.key === "ITEMID") {
                    return {
                        ...baseField,
                        type: "combobox",
                        collection: itemsCollection,
                        isRequired: true,
                        disabled: isEditing, // Disable ITEMID during edit
                    };
                } else if (col.key === "PURITY") {
                    return {
                        ...baseField,
                        type: "number",
                        min: 0,
                        max: 100,
                        step: 0.001,
                        precision: 3,
                        isRequired: true,
                    };
                } else if (col.key === "LESSWT" || col.key === "WASTAGE") {
                    return {
                        ...baseField,
                        type: "number",
                        allowNegative: true,
                        confirmNegative: false,
                    };
                } else if (col.key === "ITEMCODE" || col.key === "HSNCODE") {
                    return {
                        ...baseField,
                        type: "capitalized",
                        disabled: isEditing, // Disable ITEMCODE during edit
                    };
                } else if (col.key === "RATE" || col.key === "AMOUNT") {
                    return {
                        ...baseField,
                        type: "number",
                    };
                }

                return baseField;
            });
    }, [itemsCollection, isEditing]);

    // Memoize columns for table
    const columns = useMemo(() => {
        const numeric = [
            "PCS",
            "GRSWT",
            "LESSWT",
            "NETWT",
            "PURITY",
            "PUREWT",
            "RATE",
            "MCHARGE",
            "WASTAGE",
            "AMOUNT",
            "IGST",
            "CGST",
            "SGST",
        ];

        return issueColumns.map((col) => {
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
    }, [itemsCollection, itemsFilter, isEditing, isFieldEditable]);

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
                        </>
                    )}

                    {/* Show Add buttons with warning during edit */}
                    {/* {!isEditing && (
                        <>
                            {!showForm ? (
                                <Button
                                    size="xs"
                                    variant="solid"
                                    colorPalette="cyan"
                                    onClick={() => {
                                        const confirm = window.confirm(
                                            "You are editing an existing transaction. Adding new items will modify the transaction. Continue?"
                                        );
                                        if (confirm) {
                                            setShowForm(true);
                                            setHasChanges(true);
                                        }
                                    }}
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
                                onClick={() => {
                                    const confirm = window.confirm(
                                        "You are editing an existing transaction. Adding new items will modify the transaction. Continue?"
                                    );
                                    if (confirm) {
                                        handleAddInline();
                                    }
                                }}
                                fontSize="2xs"
                                height="24px"
                            >
                                Add Inline
                            </Button>
                        </>
                    )} */}
                </HStack>
            </Flex>

            {/* Warning message when editing */}
            {isEditing && (
                <Box
                    bg="yellow.50"
                    borderWidth="1px"
                    borderColor="yellow.200"
                    borderRadius="md"
                    p={2}
                    mb={2}
                >
                    <Text fontSize="xs" color="yellow.800" fontWeight="medium">
                        ⚠️ Editing Mode: You can only modify weights, purity, rates, and charges.
                        Item ID and Item Code cannot be changed. Save your changes before leaving.
                    </Text>
                </Box>
            )}

            {/* Form Section - Only shown when showForm is true */}
            {showForm && (
                <Box mb={1}>
                    <AddTransactionItemForm
                        fields={formFields}
                        onSubmit={handleAddViaForm}
                        onCancel={() => setShowForm(false)}
                        compact={true}
                        isEditing={isEditing}
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
                    fixedHeight="300px"
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