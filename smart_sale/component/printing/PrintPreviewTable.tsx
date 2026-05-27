"use client";

import React, { forwardRef, useMemo } from "react";
import { Box, Text } from "@chakra-ui/react";
import type { PrintColumn } from "@/component/screens/PrintPreviewScreen";

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────

type Customization = {
    fontSize: "xs" | "sm" | "md" | "lg";
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
// Helper functions for nested headers
// ─────────────────────────────────────────────────────────────

const hasGroups = (columns: PrintColumn[]): boolean => {
    return columns.some(col => col.subColumns && col.subColumns.length > 0);
};

const getLeafColumns = (columns: PrintColumn[]): PrintColumn[] => {
    const leaves: PrintColumn[] = [];
    columns.forEach(col => {
        if (col.subColumns && col.subColumns.length > 0) {
            leaves.push(...col.subColumns);
        } else {
            leaves.push(col);
        }
    });
    return leaves;
};

const getNestedHeaders = (columns: PrintColumn[]) => {
    if (!hasGroups(columns)) {
        return [columns.map((c) => c.label)];
    }

    const topRow: (string | { label: string; colspan: number })[] = [];
    const subRow: string[] = [];

    for (const col of columns) {
        const visibleSubs = col.subColumns ?? [];

        if (visibleSubs.length > 0) {
            topRow.push({
                label: col.label,
                colspan: visibleSubs.length,
            });

            for (const sub of visibleSubs) {
                subRow.push(sub.label ?? "");
            }
        } else {
            topRow.push({
                label: col.label,
                colspan: 1,
            });
            subRow.push("");
        }
    }

    return [topRow, subRow];
};

// Helper function to get decimal scale for a column
const getDecimalScale = (column: PrintColumn): number => {
    // Check if the column has a decimalScale property (you may need to add this to your PrintColumn type)
    // For now, we'll try to infer from renderCell or printValue
    if ((column as any).decimalScale !== undefined) {
        return (column as any).decimalScale;
    }

    // Default decimal scales based on type
    if (column.isNumeric) {
        return 2; // Default for numeric columns
    }
    return 0;
};

// ─────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────

export const PrintPreviewTable = forwardRef<HTMLDivElement, PrintPreviewTableProps>(
    ({ data, columns, customization, showSno }, ref) => {
        const { fontSize, headerBg, headerColor, rowStriped, title, showTotals, totalColumns } =
            customization;

        // Fix: Better font size mapping for print
        const getFontSize = () => {
            switch (fontSize) {
                case "xs": return "11px";
                case "sm": return "12px";
                case "md": return "14px";
                case "lg": return "16px";
                default: return "12px";
            }
        };

        const chakraFontSize = getFontSize();

        const hasGroupedColumns = useMemo(() => hasGroups(columns), [columns]);
        const leafColumns = useMemo(() => getLeafColumns(columns), [columns]);
        const nestedHeaders = useMemo(() => getNestedHeaders(columns), [columns]);

        // Fix: Include sub-column totals with proper decimal scale
        const totals = useMemo(() => {
            if (!showTotals || totalColumns.length === 0) return null;

            // Get all totalable columns including sub-columns
            const allTotalableColumns = leafColumns.filter(col =>
                totalColumns.includes(col.key) && col.allowTotal
            );

            return allTotalableColumns.reduce<Record<string, { value: number; decimalScale: number } | null>>((acc, col) => {
                const decimalScale = getDecimalScale(col);
                const total = data.reduce((sum, row) => {
                    const raw = col.printValue
                        ? col.printValue(row[col.key], row)
                        : row[col.key];
                    const num = parseFloat(String(raw));
                    return sum + (isNaN(num) ? 0 : num);
                }, 0);

                acc[col.key] = {
                    value: total,
                    decimalScale: decimalScale
                };
                return acc;
            }, {});
        }, [showTotals, totalColumns, leafColumns, data]);

        // Shared cell style
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
            fontSize: "0.85em",
            letterSpacing: "0.04em",
            textTransform: "uppercase",
            whiteSpace: "nowrap",
        };

        return (
            <Box ref={ref} fontSize={chakraFontSize}>
              
                <Box overflowX="auto">
                    <table
                        style={{
                            borderCollapse: "collapse",
                            width: "100%",
                            tableLayout: "auto",
                        }}
                    >
                        <thead>
                            {/* Top header row */}
                            {hasGroupedColumns && nestedHeaders[0].length > 0 && (
                                <tr>
                                    {showSno && (
                                        <th
                                            rowSpan={2}
                                            style={{
                                                ...headerCellStyle,
                                                textAlign: "center",
                                                width: 50,
                                                verticalAlign: "middle"
                                            }}
                                        >
                                            S.No
                                        </th>
                                    )}
                                    {nestedHeaders[0].map((header, idx) => {
                                        if (typeof header === 'string') {
                                            return (
                                                <th
                                                    key={`parent-${idx}`}
                                                    colSpan={1}
                                                    style={{
                                                        ...headerCellStyle,
                                                        textAlign: "center",
                                                        fontSize: "0.9em",
                                                        fontWeight: "bold",
                                                    }}
                                                >
                                                    {header}
                                                </th>
                                            );
                                        } else {
                                            return (
                                                <th
                                                    key={`parent-${header.label}`}
                                                    colSpan={header.colspan}
                                                    style={{
                                                        ...headerCellStyle,
                                                        textAlign: "center",
                                                        fontSize: "0.9em",
                                                        fontWeight: "bold",
                                                    }}
                                                >
                                                    {header.label}
                                                </th>
                                            );
                                        }
                                    })}
                                </tr>
                            )}

                            {/* Sub header row */}
                            <tr>
                                {!hasGroupedColumns && showSno && (
                                    <th
                                        style={{
                                            ...headerCellStyle,
                                            textAlign: "center",
                                            width: 50
                                        }}
                                    >
                                        S.No
                                    </th>
                                )}

                                {(hasGroupedColumns ? nestedHeaders[1] : columns).map((col, idx) => {
                                    const column = hasGroupedColumns
                                        ? leafColumns[idx]
                                        : col as PrintColumn;

                                    const textAlign = column.align
                                        ? column.align === "end"
                                            ? "right"
                                            : column.align === "start"
                                                ? "left"
                                                : "center"
                                        : column.isNumeric
                                            ? "right"
                                            : "left";

                                    return (
                                        <th
                                            key={column.key}
                                            style={{
                                                ...headerCellStyle,
                                                textAlign,
                                            }}
                                        >
                                            {typeof col === 'string' ? col : column.label}
                                        </th>
                                    );
                                })}

                            </tr>
                        </thead>

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
                                                color: "#475569",
                                                fontVariantNumeric: "tabular-nums",
                                            }}
                                        >
                                            {rowIndex + 1}
                                        </td>
                                    )}

                                    {leafColumns.map((col) => {
                                        const rawValue = row[col.key];

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
                                        const displayValue =
                                            col.isNumeric 
                                                ? rawValue > 0
                                                    ? cellContent
                                                    : ""
                                                : cellContent;

                                        return (
                                            <td
                                                key={col.key}
                                                style={{
                                                    ...cellStyle,
                                                    textAlign,
                                                    color: "#1e293b",
                                                }}
                                            >
                                                {displayValue}
                                            </td>
                                        );
                                    })}
                                </tr>
                            ))}
                        </tbody>

                        {/* Footer with totals including sub-columns - respecting decimal scale */}
                        {showTotals && totals && Object.keys(totals).length > 0 && (
                            <tfoot>
                                <tr style={{ background: "#f8fafc", fontWeight: "bold" }}>
                                    {showSno && (
                                        <td
                                            style={{
                                                ...cellStyle,
                                                fontWeight: 700,
                                                borderTop: "2px solid #cbd5e1",
                                                background: "#f1f5f9",
                                            }}
                                        >
                                            Total
                                        </td>
                                    )}
                                    {leafColumns.map((col, colIndex) => {
                                        const totalData = totals[col.key];
                                        const isFirstCol = !showSno && colIndex === 0;
                                        const textAlign = col.align
                                            ? col.align === "end"
                                                ? "right"
                                                : col.align === "start"
                                                    ? "left"
                                                    : "center"
                                            : col.isNumeric
                                                ? "right"
                                                : "left";

                                        // Fix: Format total with column's decimal scale
                                        const formatTotalWithScale = (value: number, decimalScale: number): string => {
                                            if (value === null || value === undefined) return "";
                                            if (typeof value !== 'number') return "";

                                            return value.toLocaleString(undefined, {
                                                minimumFractionDigits: decimalScale,
                                                maximumFractionDigits: decimalScale
                                            });
                                        };

                                        return (
                                            <td
                                                key={col.key}
                                                style={{
                                                    ...cellStyle,
                                                    fontWeight: 700,
                                                    borderTop: "2px solid #cbd5e1",
                                                    textAlign,
                                                    background: "#f1f5f9",
                                                    color: "#0f172a",
                                                }}
                                            >
                                                {isFirstCol && (!totalData || totalData.value === 0) ? "Total" :
                                                    (totalData && totalData.value !== undefined) ?
                                                        formatTotalWithScale(totalData.value, totalData.decimalScale) : ""}
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