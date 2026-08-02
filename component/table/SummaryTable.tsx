import { Table } from "@chakra-ui/react";

interface ColumnConfig {
    key: string;
    label: string;
    align?: "left" | "center" | "right" | "end";
    format?: (value: any) => string | number;
    isBold?: boolean;
    color?: string;
}

interface RowConfig {
    key: string;
    label: string;
    // data will be looked up by row.key + column.key
}

interface SummaryTableProps{
    title?: string;
    rowLabels: RowConfig[];                // e.g. [{ key: "pieces", label: "Pieces" }, ...]
    columnLabels: ColumnConfig[];          // e.g. [{ key: "lot", label: "Lot 150" }, ...]
    data: Record<string, Record<string, any>>;  // data[rowKey][colKey] → value
    renderCell?: (value: any, row: RowConfig, col: ColumnConfig) => React.ReactNode;
    emptyText?: string;
    lotNumber?: string | number;           // optional — if you want to show "Lot XXX" dynamically
    size?: "sm" | "md" | "lg";
    headerBg?: string;
    rowLabelWidth?: string;
    numberFormat?: (num: number) => string; // custom number formatter
    headerFontSize?: string;
}

export default function SummaryTable({
    title,
    rowLabels,
    columnLabels,
    data,
    renderCell,
    emptyText = "No data available",
    lotNumber,
    size = "sm",
    headerBg = "gray.100",
    rowLabelWidth = "120px",
    headerFontSize = "12px",
    
    numberFormat = (num: number) => num.toLocaleString("en-IN"),
    ...tableProps
}: SummaryTableProps) {
    // If lotNumber is provided, override the first column label
    const effectiveColumns = columnLabels.map((col, idx) =>
        idx === 0 && lotNumber ? { ...col, label: `Lot ${lotNumber}` } : col
    );

    const hasData = rowLabels.length > 0 && effectiveColumns.length > 0;

    return (
        <Table.Root
            size={size}
            minW="max-content"
            border="1px solid #EEE"
            // borderColor={borderColor}
            showColumnBorder
            {...tableProps} 
        >
            {/* {title && (
                <Table.Caption placeContent="top" fontWeight="bold" mb={2}>
                    {title}
                </Table.Caption>
            )} */}

            <Table.Header>
                <Table.Row bg={headerBg} py={0.1}>
                    {/* Empty cell for row labels column */}
                    <Table.ColumnHeader width={rowLabelWidth} />

                    {effectiveColumns.map((col) => (
                        <Table.ColumnHeader
                            key={col.key}
                            textAlign={col.align === "end" ? "right" : col.align || "center"}
                            fontWeight="semibold"
                            fontSize={headerFontSize}
                            py={1}
                            color={"#ffffff"}

                        >
                            {col.label}
                        </Table.ColumnHeader>
                    ))}
                </Table.Row>
            </Table.Header>

            <Table.Body >
                {hasData ? (
                    rowLabels.map((row) => (
                        <Table.Row key={row.key} >
                            {/* Row label */}
                            <Table.Cell fontWeight="semibold" fontSize={headerFontSize} px={2} py={1}>
                                {row.label}
                            </Table.Cell>

                            {/* Data cells */}
                            {effectiveColumns.map((col) => {
                                const value = data[row.key]?.[col.key];

                                // Custom renderCell if provided
                                if (renderCell) {
                                    return (
                                        <Table.Cell
                                            key={`${row.key}-${col.key}`}
                                            textAlign={col.align === "end" ? "right" : col.align || "center"}
                                           
                                        >
                                            {renderCell(value, row, col)}
                                        </Table.Cell>
                                    );
                                }

                                // Default rendering
                                let displayValue: React.ReactNode = "-";

                                if (value !== undefined && value !== null) {
                                    if (typeof value === "number" && col.format) {
                                        displayValue = col.format(value);
                                    } else if (typeof value === "number") {
                                        displayValue = numberFormat(value);
                                    } else {
                                        displayValue = value;
                                    }
                                }

                                return (
                                    <Table.Cell
                                        key={`${row.key}-${col.key}`}
                                        textAlign={col.align === "end" ? "right" : col.align || "center"}
                                        fontWeight={col.isBold ? "semibold" : undefined}
                                        color={col.color}
                                        py={1}
                                    >
                                        {displayValue}
                                    </Table.Cell>
                                );
                            })}
                        </Table.Row>
                    ))
                ) : (
                    <Table.Row>
                        <Table.Cell colSpan={effectiveColumns.length + 1} textAlign="center" py={6} color="gray.500">
                            {emptyText}
                        </Table.Cell>
                    </Table.Row>
                )}
            </Table.Body>
        </Table.Root>
    );
}