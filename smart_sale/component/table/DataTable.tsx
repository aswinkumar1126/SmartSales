"use client";

import { ReactNode, useCallback, useEffect, useMemo, useState } from "react";
import { Box, Checkbox, Flex, Text, Button, HStack, Heading } from "@chakra-ui/react";
import { Table } from "@chakra-ui/react/table";
import { motion, AnimatePresence } from "framer-motion";
import {
    tableFeatures,
    rowSelectionFeature,
    rowSortingFeature,
    rowPaginationFeature,
    createSortedRowModel,
    createPaginatedRowModel,
    sortFns,
    useTable,
    createColumnHelper,
    functionalUpdate,
    type ColumnDef,
    type RowData,
    type RowSelectionState,
    type SortingState,
    type PaginationState,
    type OnChangeFn,
} from "@tanstack/react-table";
import { NativeSelectWrapper } from "@/components/ui/NativeSelectWrapper";

/** Per-column alignment/width, available on every column's `meta`. */
type DataTableColumnMeta = {
    align?: "start" | "center" | "end";
    width?: string;
};

/** The fixed feature set every DataTable instance is built with. */
export const dataTableFeatures = tableFeatures({
    rowSelectionFeature,
    rowSortingFeature,
    rowPaginationFeature,
    sortedRowModel: createSortedRowModel(),
    paginatedRowModel: createPaginatedRowModel(),
    sortFns,
    columnMeta: {} as DataTableColumnMeta,
});

type DataTableFeatures = typeof dataTableFeatures;

// `TFeatures` is intentionally `any` here: pinning it to `DataTableFeatures` makes
// TS re-derive the (deeply generic) feature-set type at every import site, and it
// occasionally resolves two structurally identical instantiations as "unrelated"
// types across module boundaries. `TValue` defaults to `any` (not `unknown`) so a
// heterogeneous array of columns — each with its own inferred value type — is still
// assignable to `DataTableColumn<T>[]`, matching TanStack's own recommended typing.
export type DataTableColumn<TData extends RowData, TValue = any> = ColumnDef<
    any,
    TData,
    TValue
>;

/** The concrete column type used internally, bound to the real feature set. */
type InternalColumn<TData extends RowData> = ColumnDef<DataTableFeatures, TData, any>;

/** Creates a strongly-typed column helper bound to DataTable's feature set. */
export function createDataTableColumns<TData extends RowData>() {
    return createColumnHelper<DataTableFeatures, TData>();
}

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
    pageSizeOptions?: { label: string; value: string }[];
    showPageSizeSelector?: boolean;
    showPageNumbers?: boolean;
    showTotalCount?: boolean;
    onPageChange?: (page: number, pageSize: number) => void;
    color?: string;
};

type DataTableProps<T extends Record<string, any>> = {
    /** Optional heading rendered above the table. Not required. */
    title?: ReactNode;

    columns: DataTableColumn<T>[];
    data: T[];
    onRowClick?: (row: T, index: number) => void;

    /** Row currently being edited — rendered with a distinct background/color */
    editingRowId?: string | number | null;
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
    maxHeight?: string | number;
    overflow?: "auto" | "scroll" | "hidden" | "visible";

    /** Colors used to highlight the row being edited */
    editingRowBg?: string;
    editingRowColor?: string;
};

const MotionRow = motion.tr;

export function DataTable<T extends Record<string, any>>({
    title,
    columns,
    data,
    onRowClick,
    editingRowId = null,
    rowIdKey,
    selection,
    pagination,
    headerBg,
    bodyBg,
    headerColor,
    borderColor = "gray.200",
    size = "sm",
    emptyText = "No records found",
    maxWidth = "100%",
    maxHeight,
    overflow = "auto",
    editingRowBg = "#FEF3C7",
    editingRowColor,
}: DataTableProps<T>) {
    const isSelectionEnabled = selection?.enabled ?? false;
    const isPaginationEnabled = pagination?.enabled ?? false;

    const idKey = (rowIdKey ?? selection?.selectableKey ?? ("id" as keyof T)) as keyof T;
    const getRowId = useCallback(
        (row: T, index: number) => String(row[idKey] ?? index),
        [idKey]
    );

    // Sorting state
    const [sorting, setSorting] = useState<SortingState>([]);

    // Pagination state
    const pageSizeOptions = pagination?.pageSizeOptions ?? [
        { label: "5", value: "5" },
        { label: "10", value: "10" },
        { label: "25", value: "25" },
        { label: "50", value: "50" },
        { label: "100", value: "100" },
    ];
    const [paginationState, setPaginationState] = useState<PaginationState>({
        pageIndex: 0,
        pageSize: pagination?.pageSize ?? 10,
    });
    const effectivePagination: PaginationState = isPaginationEnabled
        ? paginationState
        : { pageIndex: 0, pageSize: Math.max(data.length, 1) };

    useEffect(() => {
        setPaginationState((prev) => ({ ...prev, pageIndex: 0 }));
    }, [data.length, paginationState.pageSize]);

    const handlePaginationChange: OnChangeFn<PaginationState> = (updater) => {
        setPaginationState((prev) => {
            const next = functionalUpdate(updater, prev);
            pagination?.onPageChange?.(next.pageIndex + 1, next.pageSize);
            return next;
        });
    };

    // Row selection state
    const [internalRowSelection, setInternalRowSelection] = useState<RowSelectionState>({});
    const isSelectionControlled = !!selection?.selectedRowIds;
    const rowSelection: RowSelectionState = isSelectionControlled
        ? Object.fromEntries((selection!.selectedRowIds as (string | number)[]).map((id) => [String(id), true]))
        : internalRowSelection;

    const handleRowSelectionChange: OnChangeFn<RowSelectionState> = (updater) => {
        const next = functionalUpdate(updater, rowSelection);
        if (!isSelectionControlled) setInternalRowSelection(next);
        if (selection?.onSelectionChange) {
            const selectedIds = Object.keys(next).filter((key) => next[key]);
            const selectedRows = data.filter((row, index) => selectedIds.includes(getRowId(row, index)));
            selection.onSelectionChange(selectedIds, selectedRows);
        }
    };

    // Selection column, prepended when selection is enabled
    const selectionColumn = useMemo<InternalColumn<T> | null>(() => {
        if (!isSelectionEnabled) return null;
        return {
            id: "_selection",
            meta: { align: "center", width: selection?.selectionColumnWidth ?? "40px" },
            header: ({ table }) =>
                selection?.showSelectAll !== false ? (
                    <Checkbox.Root
                        size="sm"
                        checked={table.getIsAllPageRowsSelected()}
                        onCheckedChange={(e) => table.toggleAllPageRowsSelected(!!e.checked)}
                        colorPalette={table.getIsAllPageRowsSelected() ? "green" : "blue"}
                    >
                        <Checkbox.HiddenInput />
                        <Checkbox.Control />
                    </Checkbox.Root>
                ) : null,
            cell: ({ row }) => (
                <Checkbox.Root
                    size="sm"
                    checked={row.getIsSelected()}
                    onCheckedChange={(e) => row.toggleSelected(!!e.checked)}
                    colorPalette={row.getIsSelected() ? "green" : "gray"}
                >
                    <Checkbox.HiddenInput />
                    <Checkbox.Control />
                </Checkbox.Root>
            ),
        };
    }, [isSelectionEnabled, selection?.showSelectAll, selection?.selectionColumnWidth]);

    const finalColumns = useMemo<InternalColumn<T>[]>(
        () => (selectionColumn ? [selectionColumn, ...columns] : columns) as InternalColumn<T>[],
        [selectionColumn, columns]
    );

    const table = useTable({
        features: dataTableFeatures,
        columns: finalColumns,
        data,
        getRowId,
        state: { sorting, rowSelection, pagination: effectivePagination },
        onSortingChange: (updater) => setSorting((prev) => functionalUpdate(updater, prev)),
        onRowSelectionChange: handleRowSelectionChange,
        onPaginationChange: handlePaginationChange,
        enableRowSelection: isSelectionEnabled,
        enableMultiRowSelection: selection?.showSelectAll !== false,
    });

    const rows = table.getPaginatedRowModel().rows;
    const totalPages = table.getPageCount();
    const currentPage = effectivePagination.pageIndex + 1;
    const startIndex = effectivePagination.pageIndex * effectivePagination.pageSize;
    const endIndex = Math.min(startIndex + effectivePagination.pageSize, data.length);

    const handlePageChange = (page: number) => table.setPageIndex(page - 1);
    const handlePageSizeChange = (newSize: number) =>
        setPaginationState({ pageIndex: 0, pageSize: newSize });

    return (
        <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
        >
        <Box
            w={maxWidth}
            border="1px solid"
            borderColor={borderColor}
            borderRadius="md"
            position="relative"
        >
            {title && (
                <Box px={3} py={2} borderBottom="1px solid" borderColor={borderColor}>
                    <Heading size="sm">{title}</Heading>
                </Box>
            )}

            <Box overflow={overflow} maxH={maxHeight || "400px"} position="relative">
                <Table.Root size={size} minW="max-content" showColumnBorder>
                    <Table.Header>
                        {table.getHeaderGroups().map((headerGroup) => (
                            <Table.Row key={headerGroup.id} bg={headerBg} position="sticky" top={0} zIndex={2}>
                                {headerGroup.headers.map((header) => {
                                    const align = header.column.columnDef.meta?.align ?? "start";
                                    const canSort = header.column.getCanSort();
                                    const sortDir = header.column.getIsSorted();
                                    return (
                                        <Table.ColumnHeader
                                            key={header.id}
                                            textAlign={align}
                                            color={headerColor}
                                            borderColor={borderColor}
                                            whiteSpace="nowrap"
                                            fontSize="xs"
                                            py={1}
                                            bg={headerBg ?? "white"}
                                            width={header.column.columnDef.meta?.width}
                                            cursor={canSort ? "pointer" : undefined}
                                            userSelect="none"
                                            onClick={header.column.getToggleSortingHandler()}
                                        >
                                            <Flex align="center" gap={1} justify={align === "end" ? "flex-end" : align === "center" ? "center" : "flex-start"}>
                                                <table.FlexRender header={header} />
                                                {canSort && (
                                                    <Text as="span" fontSize="10px" opacity={sortDir ? 1 : 0.35}>
                                                        {sortDir === "desc" ? "▼" : "▲"}
                                                    </Text>
                                                )}
                                            </Flex>
                                        </Table.ColumnHeader>
                                    );
                                })}
                            </Table.Row>
                        ))}
                    </Table.Header>

                    <Table.Body>
                        {rows.length === 0 ? (
                            <Table.Row bg={bodyBg}>
                                <Table.Cell colSpan={finalColumns.length} textAlign="center" py={2}>
                                    {emptyText}
                                </Table.Cell>
                            </Table.Row>
                        ) : (
                            <AnimatePresence initial={false} mode="popLayout">
                                {rows.map((row) => {
                                    const isSelected = isSelectionEnabled && row.getIsSelected();
                                    const isEditing = editingRowId != null && String(row.id) === String(editingRowId);

                                    let rowBg = bodyBg;
                                    let rowColor: string | undefined;
                                    if (isSelected) {
                                        rowBg = selection?.selectionBgColor ?? rowBg;
                                        rowColor = selection?.selectionTextColor;
                                    } else if (isEditing) {
                                        rowBg = editingRowBg;
                                        rowColor = editingRowColor;
                                    }

                                    return (
                                        <MotionRow
                                            key={row.id}
                                            layout
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1, backgroundColor: rowBg ?? "rgba(0,0,0,0)" }}
                                            exit={{ opacity: 0 }}
                                            transition={{ duration: 0.18 }}
                                            style={{
                                                fontSize: "var(--chakra-fontSizes-xs)",
                                                fontWeight: 400,
                                                color: rowColor,
                                                cursor: onRowClick ? "pointer" : undefined,
                                            }}
                                            onClick={() => onRowClick && onRowClick(row.original, row.index)}
                                        >
                                            {row.getAllCells().map((cell) => {
                                                const align = cell.column.columnDef.meta?.align ?? "start";
                                                return (
                                                    <Table.Cell key={cell.id} textAlign={align} borderColor={borderColor}>
                                                        <table.FlexRender cell={cell} />
                                                    </Table.Cell>
                                                );
                                            })}
                                        </MotionRow>
                                    );
                                })}
                            </AnimatePresence>
                        )}
                    </Table.Body>
                </Table.Root>
            </Box>

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
                    {(pagination?.showTotalCount ?? true) && (
                        <Text fontSize="xs" color={pagination?.color || "gray.500"}>
                            Showing {startIndex + 1} to {endIndex} of {data.length} entries
                        </Text>
                    )}

                    <Flex align="center" gap={2} flexWrap="wrap">
                        {(pagination?.showPageSizeSelector ?? true) && (
                            <HStack gap={1}>
                                <Text fontSize="xs" color={pagination?.color || "gray.500"}>Show</Text>
                                <NativeSelectWrapper
                                    value={String(effectivePagination.pageSize)}
                                    onChange={(e) => handlePageSizeChange(Number(e.target.value))}
                                    items={pageSizeOptions.map((option) => ({ value: option.value, label: option.label }))}
                                    size="xs"
                                    minW="70px"
                                    maxWidth="70px"
                                    fontSize="10px"
                                    placeholder="Show"
                                    disabled={false}
                                   css={{height:"25px"}}
                                    

                                />
                                <Text fontSize="xs" color={pagination?.color || "gray.500"}>entries</Text>
                            </HStack>
                        )}

                        {(pagination?.showPageNumbers ?? true) && totalPages > 0 && (
                            <HStack gap={1}>
                                <Button
                                    size="2xs"
                                    variant="outline"
                                    onClick={() => handlePageChange(currentPage - 1)}
                                    disabled={!table.getCanPreviousPage()}
                                    color={pagination?.color || "gray.200"}
                                    _active={{ transform: "scale(0.94)" }}
                                >
                                    Previous
                                </Button>

                                <HStack gap={1}>
                                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                                        let pageNum;
                                        if (totalPages <= 5) pageNum = i + 1;
                                        else if (currentPage <= 3) pageNum = i + 1;
                                        else if (currentPage >= totalPages - 2) pageNum = totalPages - 4 + i;
                                        else pageNum = currentPage - 2 + i;

                                        return (
                                            <Button
                                                key={pageNum}
                                                size="2xs"
                                                variant={currentPage === pageNum ? "solid" : "outline"}
                                                colorPalette={currentPage === pageNum ?  "blue" : "gray"}
                                                onClick={() => handlePageChange(pageNum)}
                                                minW="28px"
                                                _active={{ transform: "scale(0.94)" }}
                                            >
                                                {pageNum}
                                            </Button>
                                        );
                                    })}
                                </HStack>

                                <Button
                                    size="2xs"
                                    variant="outline"
                                    onClick={() => handlePageChange(currentPage + 1)}
                                    disabled={!table.getCanNextPage()}
                                    color={pagination?.color || "gray.500"}
                                    _active={{ transform: "scale(0.94)" }}
                                >
                                    Next
                                </Button>
                            </HStack>
                        )}
                    </Flex>
                </Flex>
            )}
        </Box>
        </motion.div>
    );
}
