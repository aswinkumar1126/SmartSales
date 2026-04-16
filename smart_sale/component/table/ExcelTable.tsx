"use client";

import React, { useState, useRef } from "react";
import { Box, Input } from "@chakra-ui/react";

export type Align = "left" | "center" | "right";

export interface Column {
    key: string;
    label: string;
    width?: number;

    align?: Align;

    // styling
    headerBg?: string;
    headerColor?: string;

    bodyBg?: string;
    bodyColor?: string;

    footerBg?: string;
    footerColor?: string;

    editable?: boolean;
    type?: "text" | "number" | "select";
}

export interface GridRow {
    id: string;
    [key: string]: any;
}

export interface GridFooter {
    [key: string]: any;
}

export interface GridProps {
    columns: Column[];
    rows: GridRow[];
    footer?: GridFooter;

    onChange?: (rows: GridRow[]) => void;
    onCellEnter?: (rowIndex: number, colIndex: number) => void;
}

export const ExcelGrid: React.FC<GridProps> = ({
    columns,
    rows,
    footer,
    onChange,
    onCellEnter,
}) => {
    const [data, setData] = useState(rows);

    const inputRefs = useRef<Record<string, HTMLInputElement | null>>({});

    const setCellValue = (rowIndex: number, key: string, value: any) => {
        const updated = [...data];
        updated[rowIndex] = {
            ...updated[rowIndex],
            [key]: value,
        };

        setData(updated);
        onChange?.(updated);
    };

    const focusCell = (row: number, col: number) => {
        const key = `${row}-${col}`;
        inputRefs.current[key]?.focus();
    };

    const handleKeyDown = (
        e: React.KeyboardEvent,
        rowIndex: number,
        colIndex: number,
        key: string
    ) => {
        if (e.key === "Enter") {
            e.preventDefault();

            const isLastCol = colIndex === columns.length - 1;
            const isLastRow = rowIndex === data.length - 1;

            if (!isLastCol) {
                focusCell(rowIndex, colIndex + 1);
            } else if (!isLastRow) {
                focusCell(rowIndex + 1, 0);
            }

            onCellEnter?.(rowIndex, colIndex);
        }

        if (e.key === "ArrowRight") {
            focusCell(rowIndex, Math.min(colIndex + 1, columns.length - 1));
        }

        if (e.key === "ArrowLeft") {
            focusCell(rowIndex, Math.max(colIndex - 1, 0));
        }

        if (e.key === "ArrowDown") {
            focusCell(Math.min(rowIndex + 1, data.length - 1), colIndex);
        }

        if (e.key === "ArrowUp") {
            focusCell(Math.max(rowIndex - 1, 0), colIndex);
        }
    };

    return (
        <Box border="1px solid #ddd" overflow="auto">
            {/* HEADER */}
            <Box display="flex" bg="gray.200">
                {columns.map((col) => (
                    <Box
                        key={col.key}
                        flex="1"
                        p={2}
                        textAlign={col.align || "left"}
                        bg={col.headerBg || "gray.300"}
                        color={col.headerColor || "black"}
                        fontWeight="bold"
                        border="1px solid #ccc"
                    >
                        {col.label}
                    </Box>
                ))}
            </Box>

            {/* BODY */}
            {data.map((row, rowIndex) => (
                <Box key={row.id} display="flex">
                    {columns.map((col, colIndex) => (
                        <Box
                            key={col.key}
                            flex="1"
                            border="1px solid #eee"
                            bg={col.bodyBg || "white"}
                            color={col.bodyColor}
                        >
                            <Input
                                size="sm"
                                border="none"
                                borderRadius={0}
                                value={row[col.key] || ""}
                                textAlign={col.align || "left"}
                                ref={(el) => {
                                    inputRefs.current[`${rowIndex}-${colIndex}`] =
                                        el;
                                }}
                                onChange={(e) =>
                                    setCellValue(rowIndex, col.key, e.target.value)
                                }
                                onKeyDown={(e) =>
                                    handleKeyDown(e, rowIndex, colIndex, col.key)
                                }
                            />
                        </Box>
                    ))}
                </Box>
            ))}

            {/* FOOTER */}
            {footer && (
                <Box display="flex" bg="gray.100" fontWeight="bold">
                    {columns.map((col) => (
                        <Box
                            key={col.key}
                            flex="1"
                            p={2}
                            textAlign={col.align || "left"}
                            bg={col.footerBg || "gray.200"}
                            color={col.footerColor}
                            border="1px solid #ccc"
                        >
                            {footer[col.key] ?? ""}
                        </Box>
                    ))}
                </Box>
            )}
        </Box>
    );
};