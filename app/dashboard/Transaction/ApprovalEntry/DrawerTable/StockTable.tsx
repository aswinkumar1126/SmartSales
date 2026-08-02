"use client";

import {
    Button,
    CloseButton,
    Drawer,
    Portal,
    Box,
    Stack,
    HStack,
    Text,
    IconButton,
    Table
} from "@chakra-ui/react";
import { useMemo } from "react";
import { FaArrowUp } from "react-icons/fa";
import { GiGoldBar } from "react-icons/gi";
import { CustomTable } from "@/component/table/CustomTable";
import { SelectCombobox } from "@/components/ui/selectComboBox";
import { useTheme } from "@/context/theme/themeContext";

type TableColumn = {
    key: string;
    label: string;
    align?: "start" | "center" | "end";
};

type StockDrawerProps = {
    isIssue: boolean;
    showStock: string;
    setShowStock: (val: "PURE" | "ITEM") => void;
    stockData: any[];
    open: boolean;
    onClose: () => void;
    onIssue: (row: any) => void;
    metalId?: string;
    setMetalId: (val?: string) => void;
    metalCollection?: any[];
    selectedName?: string;
    setSelectedName: (val?: string) => void;
    pureGoldCollection?: any[];
    itemCollection?: any[];
    // ✅ Clean signature — id, touch, no transactionTypeCode (hook resolves internally)
    getStockAvailability?: (
        id: string,
        touch: number | null,
        options?: { excludeRowId?: string }
    ) => any;
};

export default function StockDrawer({
 
 
    stockData,
    open,
    onClose,
    onIssue,
    metalId,
    setMetalId,
    metalCollection,
    selectedName,
    setSelectedName,
    itemCollection,
    getStockAvailability
}: StockDrawerProps) {

    const { theme } = useTheme();

    const columns: TableColumn[] = useMemo(() => {
        return [
                { key: "ITEMNAME", label: "Item" },
                { key: "METALNAME", label: "Metal" },
                { key: "PCS", label: "Pcs", align: "end" },
                { key: "GRSWT", label: "Gross Wt", align: "end" },
                { key: "STNWT", label: "Stone Wt", align: "end" },
                { key: "NETWT", label: "Net Wt", align: "end" },
                { key: "TOUCH", label: "Touch", align: "end" },
                { key: "PUREWT", label: "Pure Wt", align: "end" },
                { key: "available", label: "Available", align: "end" },
                { key: "ACTION", label: "Action", align: "center" },
            ];
    }, []);

    const secondaryCollection = itemCollection;

    // Stock status color based on remaining %
    const getStockStatusColor = (remaining: number, total: number) => {
        if (remaining <= 0) return "red.500";
        const pct = total > 0 ? (remaining / total) * 100 : 0;
        if (pct < 20) return "orange.500";
        if (pct < 50) return "yellow.600";
        return "green.600";
    };

    const getNetWeight = (row: any) => {
        return Number(row.GRSWT || 0) - Number(row.STNWT || 0);
    };

    // ✅ ID: pureId for PURE, itemId for ITEM
    const getStockId = (row: any): string | null => {
        return String(row.ITEMID ?? row.itemId ?? row.id ?? '');
    };


    return (
        <Drawer.Root open={open} onOpenChange={(e) => !e.open && onClose()} size="xl">
            <Portal>
                <Drawer.Positioner zIndex={10}>
                    <Drawer.Content>
                        <Drawer.Header bg={theme.colors.accient}>
                            <HStack justify="space-between" w="full" h={3}>
                                <Drawer.Title color={theme.colors.whiteColor}>
                                    Stock Details
                                </Drawer.Title>

                            </HStack>
                        </Drawer.Header>

                        <Drawer.Body>
                            {/* Filters */}
                            <HStack mb={3} gap={2}>
                                <SelectCombobox
                                    items={metalCollection ?? []}
                                    placeholder="Select Metal"
                                    value={metalId}
                                    onChange={setMetalId}
                                />
                                <SelectCombobox
                                    items={secondaryCollection ?? []}
                                    placeholder={"Select Item"}
                                    value={selectedName}
                                    onChange={setSelectedName}
                                />
                            </HStack>

                            <CustomTable
                                columns={columns}
                                data={stockData}
                                rowIdKey="id"
                                headerBg={theme.colors.accient}
                                headerColor={theme.colors.whiteColor}
                                renderRow={(row) => {
                                    const stockId = getStockId(row);
                    

                                    // ✅ Just id + touch — no transactionTypeCode needed
                                    const availability = getStockAvailability && stockId
                                        ? getStockAvailability(stockId ,null)
                                        : undefined;

                                    console.log(availability,'availabilityinstock');
                                        const netwt = getNetWeight(row);
                                        const remainingPcs = availability?.pieces?.remaining ?? null;
                                        const totalPcs = availability?.pieces?.total ?? 0;
                                        const remainingWt = availability?.weight?.remaining ?? null;
                                        const isOutOfStock = remainingPcs !== null && remainingPcs <= 0;

                                        return (
                                            <>
                                                <Table.Cell as="td">{row.ITEMNAME}</Table.Cell>
                                                <Table.Cell as="td">{row.METALNAME}</Table.Cell>
                                                <Table.Cell as="td" textAlign="end">
                                                    <Text fontWeight="medium">{row.PCS} pcs</Text>
                                                </Table.Cell>
                                                <Table.Cell as="td" textAlign="end">
                                                    {Number(row.GRSWT || 0).toFixed(3)}g
                                                </Table.Cell>
                                                <Table.Cell as="td" textAlign="end">
                                                    {Number(row.STNWT || 0).toFixed(3)}g
                                                </Table.Cell>
                                                <Table.Cell as="td" textAlign="end" fontWeight="medium">
                                                    {netwt.toFixed(3)}g
                                                </Table.Cell>
                                                <Table.Cell as="td" textAlign="end">
                                                    {row.TOUCH || row.touch || ""}
                                                </Table.Cell>
                                                <Table.Cell as="td" textAlign="end" fontWeight="bold" color="blue.600">
                                                    {Number(row.PUREWT || row.purewt || 0).toFixed(3)}g
                                                </Table.Cell>

                                                {/* ✅ Available pcs + netwt — shown only when availability present */}
                                                <Table.Cell as="td" textAlign="end">
                                                    {remainingPcs !== null ? (
                                                        <Stack gap={0} align="end">
                                                            <Text
                                                                fontSize="sm"
                                                                fontWeight="bold"
                                                                color={getStockStatusColor(remainingPcs, totalPcs)}
                                                            >
                                                                {remainingPcs} pcs
                                                            </Text>
                                                            <Text fontSize="xs" color="gray.500">
                                                                of {totalPcs} pcs
                                                            </Text>
                                                            {remainingWt !== null && (
                                                                <Text fontSize="xs" color="blue.500">
                                                                    {remainingWt.toFixed(3)}g avail
                                                                </Text>
                                                            )}
                                                        </Stack>
                                                    ) : (
                                                        <Text fontSize="xs" color="gray.400">—</Text>
                                                    )}
                                                </Table.Cell>

                                                <Box as="td" textAlign="center">
                                                    <IconButton
                                                        size="2xs"
                                                        onClick={() => onIssue(row)}
                                                        disabled={isOutOfStock}
                                                        title={isOutOfStock ? "Out of stock" : "Add to transaction"}
                                                    >
                                                        <FaArrowUp />
                                                    </IconButton>
                                                </Box>
                                            </>
                                        );
                                    
                                }}
                            />
                        </Drawer.Body>

                        <Drawer.Footer>
                            <Button onClick={onClose} variant="outline" size="sm">
                                Close
                            </Button>
                        </Drawer.Footer>

                        <Drawer.CloseTrigger asChild>
                            <CloseButton size="xs" />
                        </Drawer.CloseTrigger>
                    </Drawer.Content>
                </Drawer.Positioner>
            </Portal>
        </Drawer.Root>
    );
}