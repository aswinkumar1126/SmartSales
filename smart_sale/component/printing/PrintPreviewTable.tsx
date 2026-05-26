"use client";

import React, { forwardRef, useMemo } from "react";
import { Box, Text } from "@chakra-ui/react";
import type { PrintColumn } from "@/component/screens/PrintPreviewScreen";

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────

type Customization = {
    fontSize: "xs"| "sm" | "md" | "lg";
    headerBg: string;
    headerColor: string;
    rowStriped: boolean;
    title?: string;
    showTotals: boolean;
    totalColumns: string[];
};

type PrintPreviewTableProps = {
    data: any[];
    columns: PrintColumn[];
    customization: Customization;
    showSno?: boolean;
};

// ─────────────────────────────────────────────────────────────
// Font size map
// ─────────────────────────────────────────────────────────────

const fontSizeMap = {
    xs : "xs",
    sm: "xs",
    md: "sm",
    lg: "md",
} as const;

// ─────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────

export const PrintPreviewTable = forwardRef<HTMLDivElement, PrintPreviewTableProps>(
    ({ data, columns, customization, showSno }, ref) => {
        const { fontSize, headerBg, headerColor, rowStriped, title, showTotals, totalColumns } =
            customization;

        const chakraFontSize = fontSizeMap[fontSize] ?? "sm";

        // ── Column totals ─────────────────────────────────────
        const totals = useMemo(() => {
            if (!showTotals || totalColumns.length === 0) return null;

            return columns.reduce<Record<string, number | null>>((acc, col) => {
                if (totalColumns.includes(col.key)) {
                    acc[col.key] = data.reduce((sum, row) => {
                        const raw = col.printValue
                            ? col.printValue(row[col.key], row)
                            : row[col.key];
                        const num = parseFloat(String(raw));
                        return sum + (isNaN(num) ? 0 : num);
                    }, 0);
                } else {
                    acc[col.key] = null;
                }
                return acc;
            }, {});
        }, [showTotals, totalColumns, columns, data]);

        // ── Shared cell style ─────────────────────────────────
        const cellStyle: React.CSSProperties = {
            border: "1px solid #e2e8f0",
            padding: "8px 12px",
            verticalAlign: "middle",
        };

        const headerCellStyle: React.CSSProperties = {
            ...cellStyle,
            background: headerBg,
            color: headerColor,
            fontWeight: 600,
            fontSize: "0.78em",
            letterSpacing: "0.04em",
            textTransform: "uppercase",
            whiteSpace: "nowrap",
        };

        // ─────────────────────────────────────────────────────
        // Render
        // ─────────────────────────────────────────────────────
        return (
            <Box ref={ref} fontSize={chakraFontSize} height={'400px'}>
                {/* Title row */}
                {title && (
                    <Box px={4} pt={5} pb={3}>
                        <Text fontWeight="700" fontSize="md" color="gray.800" letterSpacing="tight">
                            {title}
                        </Text>
                        <Text fontSize="xs" color="gray.400" mt={0.5}>
                            {data.length} record{data.length !== 1 ? "s" : ""}
                        </Text>
                    </Box>
                )}

                <Box overflowX="auto">
                    <table
                        style={{
                            borderCollapse: "collapse",
                            width: "100%",
                            tableLayout: "auto",
                        }}
                    >
                        {/* ── HEAD ── */}
                        <thead>
                            <tr>
                                {showSno && (
                                    <th style={{ ...headerCellStyle, textAlign: "center", width: 48 }}>
                                        #
                                    </th>
                                )}
                                {columns.map((col) => (
                                    <th
                                        key={col.key}
                                        style={{
                                            ...headerCellStyle,
                                            textAlign: col.align
                                                ? col.align === "end"
                                                    ? "right"
                                                    : col.align === "start"
                                                        ? "left"
                                                        : "center"
                                                : col.isNumeric
                                                    ? "right"
                                                    : "left",
                                        }}
                                    >
                                        {col.label}
                                    </th>
                                ))}
                            </tr>
                        </thead>

                        {/* ── BODY ── */}
                        <tbody>
                            {data.map((row, rowIndex) => (
                                <tr
                                    key={rowIndex}
                                    style={{
                                        background:
                                            rowStriped && rowIndex % 2 === 1
                                                ? "#f8fafc"
                                                : "#ffffff",
                                    }}
                                >
                                    {showSno && (
                                        <td
                                            style={{
                                                ...cellStyle,
                                                textAlign: "center",
                                                color: "#94a3b8",
                                                fontVariantNumeric: "tabular-nums",
                                            }}
                                        >
                                            {rowIndex + 1}
                                        </td>
                                    )}

                                    {columns.map((col) => {
                                        const rawValue = row[col.key];

                                        // Use renderCell for rich preview; else fall back to printValue or raw
                                        const cellContent = col.renderCell
                                            ? col.renderCell(rawValue, row)
                                            : col.printValue
                                                ? col.printValue(rawValue, row)
                                                : rawValue ?? "—";

                                        const textAlign = col.align
                                            ? col.align === "end"
                                                ? "right"
                                                : col.align === "start"
                                                    ? "left"
                                                    : "center"
                                            : col.isNumeric
                                                ? "right"
                                                : "left";

                                        return (
                                            <td
                                                key={col.key}
                                                style={{
                                                    ...cellStyle,
                                                    textAlign,
                                                    color: "#1e293b",
                                                }}
                                            >
                                                {cellContent}
                                            </td>
                                        );
                                    })}
                                </tr>
                            ))}
                        </tbody>

                        {/* ── FOOT (totals) ── */}
                        {showTotals && totals && (
                            <tfoot>
                                <tr style={{ background: "#f1f5f9" }}>
                                    {showSno && (
                                        <td
                                            style={{
                                                ...cellStyle,
                                                fontWeight: 700,
                                                borderTop: "2px solid #cbd5e1",
                                            }}
                                        />
                                    )}
                                    {columns.map((col, colIndex) => {
                                        const isFirst = !showSno && colIndex === 0;
                                        const total = totals[col.key];
                                        return (
                                            <td
                                                key={col.key}
                                                style={{
                                                    ...cellStyle,
                                                    fontWeight: 700,
                                                    borderTop: "2px solid #cbd5e1",
                                                    textAlign: col.isNumeric ? "right" : "left",
                                                    color: "#0f172a",
                                                }}
                                            >
                                                {isFirst
                                                    ? "Total"
                                                    : total !== null
                                                        ? total.toLocaleString()
                                                        : ""}
                                            </td>
                                        );
                                    })}
                                </tr>
                            </tfoot>
                        )}
                    </table>
                </Box>
            </Box>
        );
    }
);

PrintPreviewTable.displayName = "PrintPreviewTable";