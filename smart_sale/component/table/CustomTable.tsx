"use client";

import { ReactNode } from "react";
import { Box } from "@chakra-ui/react";
import { Table } from "@chakra-ui/react/table";

export type TableColumn = {
    key: string;
    label: string;
    align?: "start" | "center" | "end";
};

type CustomTableProps<T> = {
    columns: TableColumn[];
    data: T[];
    renderRow: (row: T, index: number) => ReactNode;

    /** Optional highlight support */
    highlightRowId?: string | number | null;
    rowIdKey?: keyof T; // 👈 which field is the row id

    /** Styling */
    headerBg?: string;
    bodyBg?: string;
    headerColor?: string;
    borderColor?: string;
    size?:"sm" | "md" | "lg";
    emptyText?: string;
    showTotal?: boolean;
    maxWidth?: string | number;
};


export function CustomTable<T extends Record<string, any>>({
    columns,
    data,
    renderRow,
    headerBg,
    bodyBg,
    headerColor,
    borderColor = "gray.200",
    size = "sm",
    emptyText = "No records found",
    highlightRowId = null,
    rowIdKey,
    maxWidth = "100%",
}: CustomTableProps<T>) {

   const enableScroll = data.length > 10;
    const rowHeight = 44; // approx for size="sm"
    const maxBodyHeight = rowHeight * 10;



    return (
        <Box w={maxWidth} overflowX="auto">
            <Box
                maxH={enableScroll ? `${maxBodyHeight}px` : "auto"}
                overflowY={enableScroll ? "auto" : "visible"}
            >
                <Table.Root
                    size={size}
                    minW="max-content"
                    border="1px solid"
                    borderColor={borderColor}
                    showColumnBorder
                >
                    {/* HEADER */}
                    <Table.Header>
                        <Table.Row bg={headerBg}>
                            {columns.map((col) => (
                                <Table.ColumnHeader
                                    key={col.key}
                                    textAlign={col.align ?? "start"}
                                    color={headerColor}
                                    borderColor={borderColor}
                                    whiteSpace="nowrap"
                                    fontSize="xs"
                                    py={1}
                                >
                                    {col.label}
                                </Table.ColumnHeader>
                            ))}
                        </Table.Row>
                    </Table.Header>

                    {/* BODY */}
                    <Table.Body>
                        {data.length === 0 ? (
                            <Table.Row bg={bodyBg} py={0.5}>
                                <Table.Cell colSpan={columns.length} textAlign="center" py={0.5}>
                                    {emptyText}
                                </Table.Cell>
                            </Table.Row>
                        ) : (
                            data.map((row, index) => {
                                const rowId = rowIdKey ? row[rowIdKey] : null;
                                const isHighlighted =
                                    highlightRowId != null &&
                                    String(rowId) === String(highlightRowId); // ensure string comparison

                              
                                return (
                                    <Table.Row
                                        key={rowId ?? index}
                                        fontSize="xs"
                                        fontWeight="400"
                                        py={0.5}
                                        style={
                                            isHighlighted
                                                ? {
                                                    backgroundColor: "#bee3f8", // initial highlight
                                                    animation: "blink 1s 3", // 0.5s per cycle × 6 = 3s total
                                                }
                                                : { backgroundColor: bodyBg }
                                        }
                                    >
                                        {renderRow(row, index)}
                                    </Table.Row>
                                );
                            })
                        )}
                    </Table.Body>
                </Table.Root>
            </Box>
        </Box>

    );
}


