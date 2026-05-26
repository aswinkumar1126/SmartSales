
import React from "react";
import { Box, Table, Text } from "@chakra-ui/react";
import type { StockSummaryRow } from "@/hooks/barcode/useStockLimits";

interface Props {
    summary: StockSummaryRow[];
   
    headerBg?: string;
}

export default function StockSummaryPanel({ summary, headerBg = "#4A5568" }: Props) {
    const thStyle: React.CSSProperties = {
        background: headerBg,
        color: "white",
        fontSize: "11px",
        fontWeight: 500,
        padding: "4px 8px",
        textAlign: "right",
        whiteSpace: "nowrap",
    };
    const tdStyle: React.CSSProperties = {
        fontSize: "12px",
        padding: "3px 8px",
        textAlign: "right",
    };
    const labelStyle: React.CSSProperties = {
        ...tdStyle,
        textAlign: "left",
        fontWeight: 500,
    };

    console.log(summary,'summary')
    return (
        <Box w="30%" overflowX="auto">
            <Text fontSize="xs" fontWeight={600} mb={1} color="gray.600">
                STOCK SUMMARY
            </Text>
            <Table.Root size="sm" variant="outline">
                <Table.Header>
                    <Table.Row>
                        <Table.ColumnHeader style={{ ...thStyle, textAlign: "left" }}>
                            
                        </Table.ColumnHeader>
                        <Table.ColumnHeader style={thStyle}>LOT</Table.ColumnHeader>

                        <Table.ColumnHeader style={{ ...thStyle, background: "#276749" }}>
                          COMPLETED
                        </Table.ColumnHeader>

                        <Table.ColumnHeader style={{ ...thStyle, background: "#C53030" }}>
                            BALANCE
                        </Table.ColumnHeader>
                    </Table.Row>
                </Table.Header>

                <Table.Body>
                    {summary.map((row) => (

                       
                        <Table.Row key={row.key}>
                            <Table.Cell style={labelStyle}>{row.label}</Table.Cell>
                            <Table.Cell style={tdStyle}>{row.total}</Table.Cell>

                         

                            <Table.Cell style={{ ...tdStyle, color:"inherit" }}>
                                {row.newRows}   
                            </Table.Cell>

                            <Table.Cell
                                style={{
                                    ...tdStyle,
                                    color: Number(row.balance) === 0 ? "#C53030" : "inherit",
                                    fontWeight: Number(row.balance) === 0 ? 600 : 400,
                                }}
                            >
                                {row.balance}
                            </Table.Cell>
                        </Table.Row>
                    ))}
                </Table.Body>
            </Table.Root>
        </Box>
    );
}