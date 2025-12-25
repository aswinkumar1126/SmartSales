"use client";

import React, { ReactNode } from "react";
import { Box, Table } from "@chakra-ui/react";


type PrintColumn<T> = {
    key: keyof T;
    label: string;
    align?: "start" | "center" | "end";
    showTotals?: boolean;
    isNumeric?: boolean;
    /** Render value for preview */
    render?: (row: T, index: number) => ReactNode;

    /** Value used for totals & export */
    value?: (row: T) => number | string;
};
type PrintCustomization = {
    fontSize: "sm" | "md" | "lg";
    headerBg: string;
    showTotals: boolean;
    isNumeric?:boolean;
    headerColor: string;
    totalColumns: (string | number)[];
    title:string;
};
type PrintPreviewTableProps<T> = {
    columns: PrintColumn<T>[];
    data: T[];
    customization: PrintCustomization;
};

export function PrintPreviewTable<T extends Record<string, any>>({
    columns,
    data,
    customization,
}: PrintPreviewTableProps<T>) {
    const { fontSize, headerBg, showTotals, totalColumns ,headerColor ,title , isNumeric, } = customization;

    const totals = showTotals
        ? columns.reduce<Record<string, number>>((acc, col) => {
            if (!totalColumns.includes(col.key as string)) return acc;

            acc[col.key as string] = data.reduce((sum, row) => {
                const value =
                    col.value?.(row) ?? Number(row[col.key] ?? 0);
                return sum + (Number(value) || 0);
            }, 0);

            return acc;
        }, {})
        : null;
    

    return (
        <Box w="100%" overflowX="auto">

            <Box>
                <header>{title} </header>
            </Box>

            <Table.Root size={fontSize}  border="1px solid " showColumnBorder borderColor="gray.200" >
                {/* HEADER */}
                <Table.Header>
                    <Table.Row bg={headerBg} color={headerColor}>
                        {columns.map((col) => (
                            <Table.ColumnHeader
                                key={String(col.key)}
                                textAlign={col.align ?? "start"}
                                whiteSpace="nowrap"
                                color={headerColor}
                            >
                                {col.label}
                            </Table.ColumnHeader>
                        ))}
                    </Table.Row>
                </Table.Header>

                {/* BODY */}
                <Table.Body >
                    {data.map((row, index) => (
                        <Table.Row key={index}>
                            {columns.map((col) => (
                                <Table.Cell
                                    key={String(col.key)}
                                    textAlign={col.align ?? "start"}
                                >
                                    {col.render
                                        ? col.render(row, index)
                                        : String(row[col.key] ?? "")}
                                </Table.Cell>
                            ))}
                        </Table.Row>
                    ))}

                    {/* TOTAL ROW */}
                    {totals && (
                        <Table.Row
                            bg="gray.100"
                            fontWeight="semibold"
                            borderTop="2px solid"
                            borderColor="gray.300"
                        >
                            {columns.map((col, index) => {
                                const colKey = col.key as string;

                                // First column → show "Total"
                                if (index === 0) {
                                    return (
                                        <Table.Cell key={colKey}>
                                            Total
                                        </Table.Cell>
                                    );
                                }

                                // Show total only for allowed columns
                                if (totalColumns.includes(colKey)) {
                                    return (
                                        <Table.Cell
                                            key={colKey}
                                            textAlign="end"
                                        >
                                            {totals[colKey]?.toFixed(2)}
                                        </Table.Cell>
                                    );
                                }

                                // Other columns → empty
                                return <Table.Cell key={colKey} />;
                            })}
                        </Table.Row>
                    )}



                </Table.Body>
            </Table.Root>
        </Box>
    );
}
