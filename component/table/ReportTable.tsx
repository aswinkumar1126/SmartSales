"use client";

import { ReactNode, useState, useEffect, useMemo } from "react";
import { Box, Checkbox, Flex, Text, Button, HStack } from "@chakra-ui/react";
import { Table } from "@chakra-ui/react/table";
import { NativeSelectWrapper } from "@/components/ui/NativeSelectWrapper";

export type ReportTableHeader = {
    key: string;
    label: string;
    align?: "start" | "center" | "end";
    bg?: string;
    color?: string;
    width?: string;
    sticky?: "left" | "right";
};

export type ReportSubHeader = {
    key: string;
    label: string;
    align?: "start" | "center" | "end";
    headerKey: string;
    bg?: string;
    color?: string;
    width?: string;
    sticky?: "left" | "right";
    isNumeric?: boolean; 
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
    pageSizeOptions?: { label: string; value: string }[];
    showPageSizeSelector?: boolean;
    showPageNumbers?: boolean;
    showTotalCount?: boolean;
    onPageChange?: (page: number, pageSize: number) => void;

};

type TotalConfig = {
    enabled: boolean;
    calculateTotals?: (data: any[]) => Record<string, any>;
    totalLabel?: string;
    totalBg?: string;
    totalColor?: string;
    sticky?: boolean; // Make total row sticky at bottom
};

type ReportTableProps<T> = {
    header: ReportTableHeader[];
    subHeader?: ReportSubHeader[];
    data: T[];
    renderRow: (row: T, index: number, isSelected: boolean) => ReactNode;

    highlightRowId?: string | number | null;
    rowIdKey?: keyof T;
    selection?: SelectionConfig<T>;
    pagination?: PaginationConfig;
    totals?: TotalConfig; // New: totals configuration

    // Styling
    headerBg?: string;
    bodyBg?: string;
    headerColor?: string;
    borderColor?: string;
    size?: "sm" | "md" | "lg";
    emptyText?: string;
    maxWidth?: string | number;
    maxHeight?: string | number;
    overflow?: "auto" | "scroll" | "hidden" | "visible";
};

export function ReportTable<T extends Record<string, any>>({
    header,
    subHeader = [],
    data,
    renderRow,
    headerBg = "gray.50",
    bodyBg,
    headerColor = "gray.700",
    borderColor = "gray.200",
    size = "sm",
    emptyText = "No records found",
    highlightRowId = null,
    rowIdKey,
    selection,
    pagination,
    totals,
    maxWidth = "100%",
    maxHeight,
    overflow = "auto",
}: ReportTableProps<T>) {
    const [internalSelectedIds, setInternalSelectedIds] = useState<(string | number)[]>([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(pagination?.pageSize ?? 10);

    const pageSizeOptions = pagination?.pageSizeOptions ?? [
        { label: "5", value: "5" },
        { label: "10", value: "10" },
        { label: "25", value: "25" },
        { label: "50", value: "50" },
        { label: "100", value: "100" },
    ];

    const isSelectionEnabled = selection?.enabled ?? false;
    const isPaginationEnabled = pagination?.enabled ?? false;
    const isTotalsEnabled = totals?.enabled ?? false;
    const selectableKey = selection?.selectableKey ?? rowIdKey ?? ("id" as keyof T);
    const hasSelectionColumn = isSelectionEnabled; // Add this line

    // Calculate paginated data
    const paginatedData = isPaginationEnabled
        ? data.slice((currentPage - 1) * pageSize, currentPage * pageSize)
        : data;

    const totalPages = Math.ceil(data.length / pageSize);
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = Math.min(startIndex + pageSize, data.length);

    const selectedIds = selection?.selectedRowIds ?? internalSelectedIds;
    const allRowIds = data.map(row => String(row[selectableKey]));
    const isAllSelected = selectedIds.length === data.length && data.length > 0;

    // Group sub-headers by their parent header key
    const subHeadersGrouped = useMemo(() => {
        const groups: Record<string, ReportSubHeader[]> = {};
        subHeader.forEach(sh => {
            if (!groups[sh.headerKey]) {
                groups[sh.headerKey] = [];
            }
            groups[sh.headerKey].push(sh);
        });
        return groups;
    }, [subHeader]);

    // Build flattened column structure with proper colspan
    const columnStructure = useMemo(() => {
        const structure: Array<{
            header: ReportTableHeader;
            subHeaders: ReportSubHeader[];
            colSpan: number;
        }> = [];

        header.forEach(h => {
            const subs = subHeadersGrouped[h.key] || [];
            structure.push({
                header: h,
                subHeaders: subs,
                colSpan: Math.max(subs.length, 1)
            });
        });

        return structure;
    }, [header, subHeadersGrouped]);

    // Total number of leaf columns
    const totalLeafColumns = columnStructure.reduce((sum, col) => sum + col.colSpan, 0);

    // Calculate totals for numeric columns
    const calculatedTotals = useMemo(() => {
        if (!isTotalsEnabled) return {};

        if (totals?.calculateTotals) {
            return totals.calculateTotals(data);
        }

        // Default total calculation for numeric values
        const defaultTotals: Record<string, any> = {};
        subHeader.forEach(sh => {
            if (sh.isNumeric !== false) {
                const sum = data.reduce((acc, row) => {
                    const value = row[sh.key];
                    return acc + (typeof value === 'number' ? value : 0);
                }, 0);
                defaultTotals[sh.key] = sum;
            }
        });
        return defaultTotals;
    }, [data, subHeader, isTotalsEnabled, totals]);

    // Get sticky column styles
    const getStickyStyles = (sticky?: "left" | "right", index?: number) => {
        if (!sticky) return {};

        const baseStyles = {
            position: 'sticky' as const,
            zIndex: 1,
            bg: 'inherit',
        };

        if (sticky === 'left') {
            return {
                ...baseStyles,
                left: index === 0 ? 0 : undefined,
            };
        }

        if (sticky === 'right') {
            return {
                ...baseStyles,
                right: 0,
            };
        }

        return {};
    };

    // Check if any column is sticky
    const hasStickyColumns = useMemo(() => {
        return header.some(h => h.sticky) || subHeader.some(sh => sh.sticky);
    }, [header, subHeader]);

    // Generate a color palette for different columns
    const getColumnColor = (index: number, baseColor?: string): string => {
        if (baseColor) return baseColor;

        const colorPalette = [
            "blue.50", "green.50", "purple.50", "orange.50",
            "teal.50", "pink.50", "cyan.50", "yellow.50"
        ];
        return colorPalette[index % colorPalette.length];
    };

    useEffect(() => {
        setCurrentPage(1);
    }, [data.length, pageSize]);

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

    const handlePageChange = (page: number) => {
        setCurrentPage(page);
        pagination?.onPageChange?.(page, pageSize);
    };

    const handlePageSizeChange = (newSize: number) => {
        setPageSize(newSize);
        setCurrentPage(1);
        pagination?.onPageChange?.(1, newSize);
    };

    const getRowBgColor = (isSelected: boolean) => {
        if (isSelected && selection?.selectionBgColor) {
            return selection.selectionBgColor;
        }
        return bodyBg;
    };

   
    // Render total cell value
    const renderTotalCell = (subHeaderKey: string, align?: string) => {
        const value = calculatedTotals[subHeaderKey];
        if (value === undefined || value === null) return '-';

        // Format number to 3 decimal places if it's a number
        if (typeof value === 'number') {
            return value.toFixed(3);
        }

        return value;
    };

    return (
        <Box
            w={maxWidth}
            border="1px solid"
            borderColor={borderColor}
            borderRadius="md"
            position="relative"
            boxShadow="sm"
        >
            <Box
                overflow={overflow}
                maxH={maxHeight || "400px"}
                position="relative"
                css={{
                    '&::-webkit-scrollbar': {
                        width: '8px',
                        height: '8px',
                    },
                    '&::-webkit-scrollbar-track': {
                        background: '#f1f1f1',
                        borderRadius: '4px',
                    },
                    '&::-webkit-scrollbar-thumb': {
                        background: '#c1c1c1',
                        borderRadius: '4px',
                        '&:hover': {
                            background: '#a8a8a8',
                        },
                    },
                }}
            >
                <Table.Root
                    size={size}
                    minW="max-content"
                    variant={'line'}
                >
                    {/* Main Header Row */}
                    <Table.Header>
                        <Table.Row bg={headerBg} position="sticky" top={0} zIndex={4}>
                            {hasSelectionColumn && (
                                <Table.ColumnHeader
                                    textAlign="center"
                                    borderColor={borderColor}
                                    whiteSpace="nowrap"
                                    fontSize="xs"
                                    fontWeight="semibold"
                                    py={2}
                                    px={3}
                                    bg={headerBg}
                                    width={selection?.selectionColumnWidth ?? "40px"}
                                    {...getStickyStyles('left', 0)}
                                >
                                    {selection?.showSelectAll !== false && (
                                        <Checkbox.Root
                                            size="sm"
                                            checked={isAllSelected}
                                            onCheckedChange={(e) => handleSelectAll(!!e.checked)}
                                            colorPalette="blue"
                                        >
                                            <Checkbox.HiddenInput />
                                            <Checkbox.Control />
                                        </Checkbox.Root>
                                    )}
                                </Table.ColumnHeader>
                            )}
                            {columnStructure.map((col, idx) => {
                                const isSticky = col.header.sticky;
                                const stickyIndex = hasSelectionColumn ? idx + 1 : idx;

                                return (
                                    <Table.ColumnHeader
                                        key={col.header.key}
                                        textAlign={col.header.align ?? "start"}
                                        color={col.header.color || headerColor}
                                        borderColor={borderColor}
                                        whiteSpace="nowrap"
                                        fontSize="xs"
                                        fontWeight="semibold"
                                        py={2}
                                        px={3}
                                        bg={col.header.bg || getColumnColor(idx)}
                                        width={col.header.width}
                                        colSpan={col.colSpan}
                                        textTransform="uppercase"
                                        letterSpacing="wider"
                                        {...getStickyStyles(isSticky, stickyIndex)}
                                    >
                                        {col.header.label}
                                    </Table.ColumnHeader>
                                );
                            })}
                        </Table.Row>

                        {/* Sub Header Row */}
                        {subHeader.length > 0 && (
                            <Table.Row
                                bg={headerBg}
                                position="sticky"
                                top="41px"
                                zIndex={3}
                                borderBottom="2px solid"
                                borderColor={borderColor}
                            >
                                {hasSelectionColumn && (
                                    <Table.ColumnHeader
                                        textAlign="center"
                                        borderColor={borderColor}
                                        whiteSpace="nowrap"
                                        fontSize="xs"
                                        py={1.5}
                                        px={3}
                                        bg={headerBg}
                                        {...getStickyStyles('left', 0)}
                                    />
                                )}
                                {columnStructure.map((col, parentIdx) => {
                                    const stickyIndex = hasSelectionColumn ? parentIdx + 1 : parentIdx;

                                    return col.subHeaders.length > 0 ? (
                                        col.subHeaders.map((sub, subIdx) => {
                                            const isSticky = sub.sticky || col.header.sticky;
                                            return (
                                                <Table.ColumnHeader
                                                    key={sub.key}
                                                    textAlign={sub.align ?? "start"}
                                                    color={sub.color || headerColor}
                                                    borderColor={borderColor}
                                                    whiteSpace="nowrap"
                                                    fontSize="xs"
                                                    fontWeight="medium"
                                                    py={1.5}
                                                    px={3}
                                                    bg={sub.bg || getColumnColor(parentIdx + subIdx)}
                                                    width={sub.width}
                                                    {...getStickyStyles(isSticky, stickyIndex)}
                                                >
                                                    {sub.label}
                                                </Table.ColumnHeader>
                                            );
                                        })
                                    ) : (
                                        <Table.ColumnHeader
                                            key={`${col.header.key}-empty`}
                                            textAlign="center"
                                            borderColor={borderColor}
                                            whiteSpace="nowrap"
                                            fontSize="xs"
                                            py={1.5}
                                            px={3}
                                            bg={getColumnColor(parentIdx)}
                                            {...getStickyStyles(col.header.sticky, stickyIndex)}
                                        >
                                            —
                                        </Table.ColumnHeader>
                                    );
                                })}
                            </Table.Row>
                        )}
                    </Table.Header>

                    {/* Table Body */}
                    <Table.Body>
                        {paginatedData.length === 0 ? (
                            <Table.Row bg={bodyBg}>
                                <Table.Cell
                                    colSpan={hasSelectionColumn ? totalLeafColumns + 1 : totalLeafColumns}
                                    textAlign="center"
                                    py={8}
                                    color="gray.500"
                                >
                                    {emptyText}
                                </Table.Cell>
                            </Table.Row>
                        ) : (
                            paginatedData.map((row, index) => {
                                const rowId = rowIdKey ? row[rowIdKey] : null;
                                const isHighlighted = highlightRowId != null && String(rowId) === String(highlightRowId);
                                const selectionId = String(row[selectableKey]);
                                const isSelected = isSelectionEnabled && selectedIds.includes(selectionId);
                                const actualIndex = startIndex + index;

                                // Determine row background color
                                let rowBgColor = bodyBg;
                                if (isSelected) {
                                    rowBgColor = selection?.selectionBgColor || "blue.50";
                                } else if (isHighlighted) {
                                    rowBgColor = "yellow.100";
                                }

                                return (
                                    <Table.Row
                                        key={rowId ?? actualIndex}
                                        fontSize="xs"
                                        fontWeight="400"
                                        bg={rowBgColor}
                                        color={isSelected && selection?.selectionTextColor ? selection.selectionTextColor : "inherit"}
                                        _hover={{
                                            bg: isSelected
                                                ? "blue.100"
                                                : isHighlighted
                                                    ? "yellow.200"
                                                    : "gray.50"
                                        }}
                                        transition="background-color 0.2s"
                                        style={{
                                            ...(isHighlighted && !isSelected ? {
                                                animation: "highlightPulse 1s ease-in-out 3",
                                                borderLeft: "3px solid #ECC94B"
                                            } : {})
                                        }}
                                    >
                                        {isSelectionEnabled && (
                                            <Table.Cell
                                                textAlign="center"
                                                py={2}
                                                {...getStickyStyles('left', 0)}
                                                bg={rowBgColor}
                                            >
                                                <Checkbox.Root
                                                    size="sm"
                                                    checked={isSelected}
                                                    onCheckedChange={(e) => handleSelectionChange(selectionId, !!e.checked)}
                                                    colorPalette="blue"
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

                    {/* Sticky Total Row */}
                    {isTotalsEnabled && paginatedData.length > 0 && (
                        <Table.Footer>
                            <Table.Row
                                bg={totals?.totalBg || "gray.100"}
                                position="sticky"
                                bottom={0}
                                zIndex={2}
                                borderTop="2px solid"
                                borderColor={borderColor}
                                fontWeight="semibold"
                            >
                                {hasSelectionColumn && (
                                    <Table.Cell
                                        textAlign="center"
                                        py={2}
                                        {...getStickyStyles('left', 0)}
                                        bg={totals?.totalBg || "gray.100"}
                                        fontWeight="bold"
                                        fontSize="xs"
                                    >
                                        {totals?.totalLabel || "Total"}
                                    </Table.Cell>
                                )}
                                {subHeader.map((sub, idx) => {
                                    const stickyIndex = hasSelectionColumn ? idx + 1 : idx;
                                    const isSticky = sub.sticky;

                                    return (
                                        <Table.Cell
                                            key={sub.key}
                                            textAlign={sub.align ?? (sub.isNumeric !== false ? "end" : "start")}
                                            py={2}
                                            px={3}
                                            {...getStickyStyles(isSticky, stickyIndex)}
                                            bg={totals?.totalBg || "gray.100"}
                                            color={totals?.totalColor || "gray.800"}
                                            fontWeight="bold"
                                            fontSize="xs"
                                            borderTop="1px solid"
                                            borderColor={borderColor}
                                        >
                                            {renderTotalCell(sub.key, sub.align)}
                                        </Table.Cell>
                                    );
                                })}
                            </Table.Row>
                        </Table.Footer>
                    )}
                </Table.Root>
            </Box>

            {/* Pagination Footer */}
            {isPaginationEnabled && data.length > 0 && (
                <Flex
                    justify="space-between"
                    align="center"
                    p={3}
                    borderTop="1px solid"
                    borderColor={borderColor}
                    bg={headerBg}
                    fontSize="xs"
                    flexWrap="wrap"
                    gap={3}
                >
                    {(pagination?.showTotalCount ?? true) && (
                        <Text fontSize="xs" color="gray.600" fontWeight="medium">
                            Showing {startIndex + 1} to {endIndex} of {data.length} entries
                        </Text>
                    )}

                    <Flex align="center" gap={3} flexWrap="wrap">
                        {(pagination?.showPageSizeSelector ?? true) && (
                            <HStack gap={2}>
                                <Text fontSize="xs" color="gray.600">Show</Text>
                                <NativeSelectWrapper
                                    value={String(pageSize)}
                                    onChange={(e) => handlePageSizeChange(Number(e.target.value))}
                                    items={pageSizeOptions}
                                    size="xs"
                                    minW="70px"
                                    maxWidth="70px"
                                    fontSize="10px"
                                    placeholder="Show"
                                    disabled={false}
                                    onEnter={() => { }}
                                    onBlur={() => { }}
                                />
                                <Text fontSize="xs" color="gray.600">entries</Text>
                            </HStack>
                        )}

                        {(pagination?.showPageNumbers ?? true) && totalPages > 0 && (
                            <HStack gap={1}>
                                <Button
                                    size="xs"
                                    variant="outline"
                                    onClick={() => handlePageChange(currentPage - 1)}
                                    disabled={currentPage === 1}
                                    colorScheme="gray"
                                >
                                    Previous
                                </Button>

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
                                    colorScheme="gray"
                                >
                                    Next
                                </Button>
                            </HStack>
                        )}
                    </Flex>
                </Flex>
            )}

            {/* Add CSS animations */}
            <style jsx>{`
                @keyframes highlightPulse {
                    0%, 100% { opacity: 1; }
                    50% { opacity: 0.7; }
                }
            `}</style>
        </Box>
    );
}