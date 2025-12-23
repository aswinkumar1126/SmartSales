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
    size?: "sm" | "md" | "lg";
    emptyText?: string;
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
}: CustomTableProps<T>) {
    return (
        <Box w="100%" overflowX="auto">
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
                            >
                                {col.label}
                            </Table.ColumnHeader>
                        ))}
                    </Table.Row>
                </Table.Header>

                {/* BODY */}
                <Table.Body>
                    {data.length === 0 ? (
                        <Table.Row bg={bodyBg}>
                            <Table.Cell
                                colSpan={columns.length}
                                textAlign="center"
                            >
                                {emptyText}
                            </Table.Cell>
                        </Table.Row>
                    ) : (
                        data.map((row, index) => {
                            const rowId = rowIdKey ? row[rowIdKey] : null;
                            const isHighlighted =
                                highlightRowId != null &&
                                rowId === highlightRowId;

                            return (
                                <Table.Row
                                    key={rowId}
                                    bg={isHighlighted ? "blue.100" : bodyBg} // ✅ HERE
                                    animation={
                                        isHighlighted
                                            ? "blink 1.2s ease-in-out 2"
                                            : undefined
                                    }
                                    transition="background-color 0.3s ease"
                                >
                                    {renderRow(row, index)}
                                </Table.Row>
                            );
                        })
                    )}
                </Table.Body>
            </Table.Root>
        </Box>
    );
}


