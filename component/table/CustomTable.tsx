"use client";

import { ReactNode, useState, useEffect } from "react";
import { Box, Checkbox, Flex, Text, Select, Button, HStack } from "@chakra-ui/react";
import { Table } from "@chakra-ui/react/table";
import { NativeSelectWrapper } from "@/components/ui/NativeSelectWrapper";

export type TableColumn = {
    key: string;
    label: string;
    align?: "start" | "center" | "end";
};

type SelectionConfig<T> = {
    enabled: boolean;
    selectedRowIds?: (string | number)[];
    onSelectionChange?: (selectedIds: (string | number)[], selectedRows: T[]) => void;
    selectableKey?: keyof T;
    selectionColumnWidth?: string;
    selectionBgColor?: string;
    selectionTextColor?: string;
    showSelectAll?: boolean;
};

type PaginationConfig = {
    enabled: boolean;
    pageSize?: number;
    pageSizeOptions?: {label:string,value:string}[];
    showPageSizeSelector?: boolean;
    showPageNumbers?: boolean;
    showTotalCount?: boolean;
    onPageChange?: (page: number, pageSize: number) => void;
    color?:string;

};

type CustomTableProps<T> = {
    columns: TableColumn[];
    data: T[];
    renderRow: (row: T, index: number, isSelected: boolean) => ReactNode;
    onRowClick?: (row: T, index: number) => void;

    /** Optional highlight support */
    highlightRowId?: string | number | null;
    rowIdKey?: keyof T;

    /** Row selection configuration */
    selection?: SelectionConfig<T>;

    /** Pagination configuration */
    pagination?: PaginationConfig;

    /** Styling */
    headerBg?: string;
    bodyBg?: string;
    headerColor?: string;
    borderColor?: string;
    size?: "sm" | "md" | "lg";
    emptyText?: string;
    maxWidth?: string | number;
    maxHeight?: string | number; // For scrollable table
    overflow?: "auto" | "scroll" | "hidden" | "visible";
};

export function CustomTable<T extends Record<string, any>>({
    columns,
    data,
    renderRow,
    onRowClick,
    headerBg,
    bodyBg,
    headerColor,
    borderColor = "gray.200",
    size = "sm",
    emptyText = "No records found",
    highlightRowId = null,
    rowIdKey,
    selection,
    pagination,
    maxWidth = "100%",
    maxHeight,
    overflow = "auto",
}: CustomTableProps<T>) {

    // Internal state for selection when not controlled externally
    const [internalSelectedIds, setInternalSelectedIds] = useState<(string | number)[]>([]);

    // Pagination state
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(pagination?.pageSize ?? 10);
    const pageSizeOptions = pagination?.pageSizeOptions ?? [
        { label: "5", value: "5" },
        { label: "10", value: "10" },
        { label: "25", value: "25" },
        { label: "50", value: "50" },
        { label: "100", value: "100" },
    ];;

    const isSelectionEnabled = selection?.enabled ?? false;
    const isPaginationEnabled = pagination?.enabled ?? false;
    const selectableKey = selection?.selectableKey ?? rowIdKey ?? ("id" as keyof T);

    // Calculate paginated data
    const paginatedData = isPaginationEnabled
        ? data.slice((currentPage - 1) * pageSize, currentPage * pageSize)
        : data;

    const totalPages = Math.ceil(data.length / pageSize);
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = Math.min(startIndex + pageSize, data.length);

    // Use external selected IDs if provided, otherwise use internal state
    const selectedIds = selection?.selectedRowIds ?? internalSelectedIds;

    const allRowIds = data.map(row => String(row[selectableKey]));
    const isAllSelected = selectedIds.length === data.length && data.length > 0;
    const isIndeterminate = selectedIds.length > 0 && selectedIds.length < data.length;

    // Reset to first page when data changes or page size changes
    useEffect(() => {
        setCurrentPage(1);
    }, [data.length, pageSize]);

    // Handle selection change
    const handleSelectionChange = (rowId: string | number, checked: boolean) => {
        let newSelectedIds: (string | number)[];

        if (checked) {
            newSelectedIds = [...selectedIds, rowId];
        } else {
            newSelectedIds = selectedIds.filter(id => String(id) !== String(rowId));
        }

        if (!selection?.selectedRowIds) {
            setInternalSelectedIds(newSelectedIds);
        }

        if (selection?.onSelectionChange) {
            const selectedRows = data.filter(row =>
                newSelectedIds.includes(String(row[selectableKey]))
            );
            selection.onSelectionChange(newSelectedIds, selectedRows);
        }
    };

    // Handle select all
    const handleSelectAll = (checked: boolean) => {
        let newSelectedIds: (string | number)[];

        if (checked) {
            newSelectedIds = allRowIds;
        } else {
            newSelectedIds = [];
        }

        if (!selection?.selectedRowIds) {
            setInternalSelectedIds(newSelectedIds);
        }

        if (selection?.onSelectionChange) {
            const selectedRows = checked ? data : [];
            selection.onSelectionChange(newSelectedIds, selectedRows);
        }
    };

    // Handle page change
    const handlePageChange = (page: number) => {
        setCurrentPage(page);
        pagination?.onPageChange?.(page, pageSize);
    };

    // Handle page size change
    const handlePageSizeChange = (newSize: number) => {
        setPageSize(newSize);
        setCurrentPage(1);
        pagination?.onPageChange?.(1, newSize);
    };

    // Get row background color
    const getRowBgColor = (isSelected: boolean) => {
        if (isSelected && selection?.selectionBgColor) {
            return selection.selectionBgColor;
        }
        return bodyBg;
    };

    // Prepare columns with selection column if enabled
    const displayColumns = isSelectionEnabled
        ? [{ key: "_selection", label: "", align: "center" as const, width: selection?.selectionColumnWidth ?? "40px" }, ...columns]
        : columns;

    return (
        <Box
            w={maxWidth}
            border="1px solid"
            borderColor={borderColor}
            borderRadius="md"
            position="relative"
        >
            <Box
                overflow="auto"
                maxH={maxHeight || "400px"}
                position="relative"
            >
                <Table.Root
                    size={size}
                    minW="max-content"
                    showColumnBorder
                >
                    {/* HEADER */}
                    <Table.Header>
                        <Table.Row bg={headerBg} position="sticky" top={0} zIndex={2}>
                            {displayColumns.map((col) => (
                                <Table.ColumnHeader
                                    key={col.key}
                                    textAlign={col.align ?? "start"}
                                    color={headerColor}
                                    borderColor={borderColor}
                                    whiteSpace="nowrap"
                                    fontSize="xs"
                                    py={1}
                                    bg={headerBg ?? "white"}
                                    width={(col as any).width}
                                >
                                    {col.key === "_selection" && isSelectionEnabled && selection?.showSelectAll !== false ? (
                                        <Checkbox.Root
                                            size="sm"
                                            checked={isAllSelected}
                                            onCheckedChange={(e) => handleSelectAll(!!e.checked)}
                                            colorPalette={isAllSelected ? "green" : "blue"}
                                        >
                                            <Checkbox.HiddenInput />
                                            <Checkbox.Control />
                                        </Checkbox.Root>
                                    ) : (
                                        col.label
                                    )}
                                </Table.ColumnHeader>
                            ))}
                        </Table.Row>
                    </Table.Header>
                    {/* BODY */}
                    <Table.Body>
                        {paginatedData.length === 0 ? (
                            <Table.Row bg={bodyBg} py={0.5}>
                                <Table.Cell colSpan={displayColumns.length} textAlign="center" py={0.5}>
                                    {emptyText}
                                </Table.Cell>
                            </Table.Row>
                        ) : (
                            paginatedData.map((row, index) => {
                                const rowId = rowIdKey ? row[rowIdKey] : null;
                                const isHighlighted = highlightRowId != null && String(rowId) === String(highlightRowId);
                                const selectionId = String(row[selectableKey]);
                                const isSelected = isSelectionEnabled && selectedIds.includes(selectionId);
                                const rowBgColor = isSelected ? getRowBgColor(true) : (isHighlighted ? "#bee3f8" : bodyBg);
                                const actualIndex = startIndex + index;

                                return (
                                    <Table.Row
                                        key={rowId ?? actualIndex}
                                        fontSize="xs"
                                        fontWeight="400"
                                        py={0.5}
                                        style={{
                                            backgroundColor: rowBgColor,
                                            ...(isHighlighted && !isSelected ? { animation: "blink 1s 3" } : {}),
                                            ...(isSelected && selection?.selectionTextColor ? { color: selection.selectionTextColor } : {})
                                        }}
                                        onClick={() => onRowClick && onRowClick(row, actualIndex)}
                                    >
                                        {isSelectionEnabled && (
                                            <Table.Cell textAlign="center">
                                                <Checkbox.Root
                                                    size="sm"
                                                    checked={isSelected}
                                                    onCheckedChange={(e) => handleSelectionChange(selectionId, !!e.checked)}
                                                    colorPalette={isSelected ? "green" : "gray"}
                                                >
                                                    <Checkbox.HiddenInput />
                                                    <Checkbox.Control />
                                                </Checkbox.Root>
                                            </Table.Cell>
                                        )}
                                        {renderRow(row, actualIndex, isSelected)}
                                    </Table.Row>
                                );
                            })
                        )}
                    </Table.Body>
                </Table.Root>
            </Box>

            {/* PAGINATION FOOTER */}
            {isPaginationEnabled && data.length > 0 && (
                <Flex
                    justify="space-between"
                    align="center"
                    p={2}
                    borderTop="1px solid"
                    borderColor={borderColor}
                    bg={headerBg ?? "white"}
                    fontSize="xs"
                    flexWrap="wrap"
                    gap={2}
                >
                    {/* Left side - Total count */}
                    {(pagination?.showTotalCount ?? true) && (
                        <Text fontSize="xs" color={pagination?.color || "gray.500"}>
                            Showing {startIndex + 1} to {endIndex} of {data.length} entries
                        </Text>
                    )}

                    {/* Right side - Pagination controls */}
                    <Flex align="center" gap={2} flexWrap="wrap">
                        {/* Page size selector */}
                        {(pagination?.showPageSizeSelector ?? true) && (
                            <HStack gap={1}>
                                <Text fontSize="xs" color={pagination?.color || "gray.500"}>Show</Text>
                                <NativeSelectWrapper
                                    value={String(pageSize)}
                                    onChange={(e) => handlePageSizeChange(Number(e.target.value))}
                                    items={pageSizeOptions.map(option => ({
                                        value: option.value,
                                        label: option.label
                                    }))}
                                    size="xs"
                                    minW="70px"
                                    maxWidth="70px"
                                    fontSize="10px"
                                    placeholder="Show"
                                    disabled={false}
                                    onEnter={() => { }}
                                    onBlur={() => { }}
                                />
                                <Text fontSize="xs" color={pagination?.color || "gray.500"}>entries</Text>
                            </HStack>
                        )}

                        {/* Page navigation buttons */}
                        {(pagination?.showPageNumbers ?? true) && totalPages > 0 && (
                            <HStack gap={1}>
                                <Button
                                    size="xs"
                                    variant="outline"
                                    onClick={() => handlePageChange(currentPage - 1)}
                                    disabled={currentPage === 1}
                                    color={pagination?.color || "gray.500"}
                                >
                                    Previous
                                </Button>

                                {/* Page numbers */}
                                <HStack gap={1}>
                                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                                        let pageNum;
                                        if (totalPages <= 5) {
                                            pageNum = i + 1;
                                        } else if (currentPage <= 3) {
                                            pageNum = i + 1;
                                        } else if (currentPage >= totalPages - 2) {
                                            pageNum = totalPages - 4 + i;
                                        } else {
                                            pageNum = currentPage - 2 + i;
                                        }

                                        return (
                                            <Button
                                                key={pageNum}
                                                size="xs"
                                                variant={currentPage === pageNum ? "solid" : "outline"}
                                                colorScheme={currentPage === pageNum ? "blue" : "gray"}
                                                onClick={() => handlePageChange(pageNum)}
                                                minW="28px"
                                            >
                                                {pageNum}
                                            </Button>
                                        );
                                    })}
                                </HStack>

                                <Button
                                    size="xs"
                                    variant="outline"
                                    onClick={() => handlePageChange(currentPage + 1)}
                                    disabled={currentPage === totalPages}
                                    color={pagination?.color || "gray.500"}
                                >
                                    Next
                                </Button>
                            </HStack>
                        )}
                    </Flex>
                </Flex>
            )}
        </Box>
    );
}