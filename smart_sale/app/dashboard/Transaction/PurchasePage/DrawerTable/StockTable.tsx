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
import { CustomTable } from "@/component/table/CustomTable"; // Updated import path
import { SelectCombobox } from "@/components/ui/selectComboBox";
import { useTheme } from "@/context/theme/themeContext";

type TableColumn = {
    key: string;
    label: string;
    align?: "start" | "center" | "end";
};

type StockAvailable = {
    total: number;
    used: number;
    remaining: number;
    totalPieces?: number;
    usedPieces?: number;
    remainingPieces?: number;
}
// 1. Fix the prop type first
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
    // ✅ Clean signature — just id, touch, options (no transactionTypeCode)
    getStockAvailability?: (
        id: string,
        touch: number | null,
        options?: { excludeRowId?: string }
    ) => any;
};;

export default function StockDrawer({
    isIssue,
    showStock,
    setShowStock,
    stockData,
    open,
    onClose,
    onIssue,
    metalId,
    setMetalId,
    metalCollection,
    selectedName,
    setSelectedName,
    pureGoldCollection,
    itemCollection,
    getStockAvailability
}: StockDrawerProps) {

    console.log(stockData,'stockData')

    const { theme } = useTheme();

    const columns: TableColumn[] = useMemo(() => {
        return showStock === "PURE"
            ? [
                { key: "pureGoldName", label: "Pure Gold" },
                { key: "metalName", label: "Metal" },
                { key: "weight", label: "Weight", align: "end" },
                { key: "actualTouch", label: "Touch", align: "end" },
                { key: "actualPure", label: "Pure", align: "end" },
                // { key: "stockStatus", label: "Stock Status", align: "end" },
                { key: "action", label: "Action", align: "center" },
            ]
            : [
                { key: "ITEMNAME", label: "Item" },
                { key: "METALNAME", label: "Metal" },
                { key: "PCS", label: "Pcs", align: "end" },
                { key: "GRSWT", label: "Gross Wt", align: "end" },
                { key: "STNWT", label: "Stone Wt", align: "end" },
                { key: "NETWT", label: "Net Wt", align: "end" },
                // { key: "STOCKSTATUS", label: "Stock Status", align: "end" },
                { key: "TOUCH", label: "Touch", align: "end" },
                { key: "PUREWT", label: "Pure Wt", align: "end" },
                { key: "ACTION", label: "Action", align: "center" },
            ];
    }, [showStock]);

    const secondaryCollection = showStock === "PURE"
        ? pureGoldCollection
        : itemCollection;

    // Helper function to get stock status color
    const getStockStatusColor = (remaining: number, total: number) => {
        const percentage = (remaining / total) * 100;
        if (remaining <= 0) return "red.500";
        if (percentage < 20) return "orange.500";
        if (percentage < 50) return "yellow.500";
        return "green.500";
    };

    // Calculate NETWT for item display
    const getNetWeight = (row: any) => {
        const grswt = Number(row.GRSWT || row.grswt || 0);
        const stnwt = Number(row.STNWT || row.stnwt || 0);
        return grswt - stnwt;
    };

    // Get the appropriate ID based on stock type
    const getStockId = (row: any) => {
        if (showStock === "PURE") {
            return row.pureId || row.PUREID || row.id;
        } else {
            return row.ITEMID || row.itemId || row.id;
        }
    };

    const getTouch = (row:any) =>{
        if(showStock === "PURE"){
            return row.aTouch || row.touch || row.at;
        }
        else{
            return row.TOUCH || row.touch || row.ATOUCH
        }
    }

    return (
        <Drawer.Root open={open} onOpenChange={(e) => !e.open && onClose()} size="xl">
            <Portal>
                <Drawer.Positioner zIndex={10}>
                    <Drawer.Content>
                        <Drawer.Header bg={theme.colors.accient}>
                            <HStack justify="space-between" w='full' h={3}>
                                <Drawer.Title color={theme.colors.whiteColor}>
                                    Stock Details
                                </Drawer.Title>

                                <HStack marginRight={6} bg={theme.colors.yellow} rounded='full'>
                                    <Button
                                        size="xs"
                                        rounded='full'
                                        variant={showStock === "PURE" ? "solid" : "ghost"}
                                        bg={showStock === "PURE" ? theme.colors.whiteColor : "transparent"}
                                        color={showStock === "PURE" ? theme.colors.accient : "white"}
                                        onClick={() => setShowStock("PURE")}
                                    >
                                        <GiGoldBar /> Pure
                                    </Button>

                                    <Button
                                        size="xs"
                                        rounded='full'
                                        variant={showStock === "ITEM" ? "solid" : "ghost"}
                                        bg={showStock === "ITEM" ? theme.colors.whiteColor : "transparent"}
                                        color={showStock === "ITEM" ? theme.colors.accient : "white"}
                                        onClick={() => setShowStock("ITEM")}
                                    >
                                        <FaArrowUp /> Item
                                    </Button>
                                </HStack>
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
                                    placeholder={
                                        showStock === "PURE"
                                            ? "Select Pure Gold"
                                            : "Select Item"
                                    }
                                    value={selectedName}
                                    onChange={setSelectedName}
                                />
                            </HStack>

                            {/* Updated Table with CustomTable component */}
                            <CustomTable
                                columns={columns}
                                data={stockData}
                                rowIdKey="id"
                                headerBg={theme.colors.accient}
                                headerColor={theme.colors.whiteColor}
                                renderRow={(row, index, isSelected) => {
                                    const stockId = getStockId(row);   // pureId for PURE, itemId for ITEM
                                    const touch = getTouch(row);       // aTouch for PURE, TOUCH for ITEM

                                    // ✅ Just pass id + touch — hook already knows stock type from transactionCodes
                                    const availability = getStockAvailability && stockId
                                        ? getStockAvailability(String(stockId), touch ?? null)
                                        : undefined;
                                        console.log(availability,stockId, 'availabilityinstock')

                                    // ✅ PURE stock → check weight remaining
                                    // ✅ ITEM stock → check pieces remaining
                                    const isOutOfStock = showStock === "PURE"
                                        ? (availability?.weight?.remaining ?? 0) <= 0
                                        : (availability?.pieces?.remaining ?? 0) <= 0;

                                    if (showStock === "PURE") {
                                        return (
                                            <>
                                                <Table.Cell as="td">{row.pureGoldName}</Table.Cell>
                                                <Table.Cell as="td">{row.metalName}</Table.Cell>
                                                <Table.Cell as="td" textAlign="end">
                                                    <Stack gap={0}>
                                                        <Text fontWeight="medium">{Number(row.aWt).toFixed(3)}g</Text>
                                                        {/* ✅ Show live remaining weight from draft */}
                                                        {availability && (
                                                            <Text fontSize="xs" color={isOutOfStock ? "red.500" : "green.600"}>
                                                                Avail: {availability.weight.remaining.toFixed(3)}g
                                                            </Text>
                                                        )}
                                                    </Stack>
                                                </Table.Cell>
                                                <Table.Cell as="td" textAlign="end" fontWeight="medium">
                                                    {Number(row.aTouch).toFixed(1)}
                                                </Table.Cell>
                                                <Table.Cell as="td" textAlign="end" fontWeight="medium">
                                                    {Number(row.aPureWt).toFixed(3)}
                                                </Table.Cell>
                                                <Table.Cell as="td" textAlign="center">
                                                    <IconButton
                                                        size="2xs"
                                                        onClick={() => onIssue(row)}
                                                        disabled={isOutOfStock}
                                                        title={isOutOfStock ? "Out of stock" : "Add to transaction"}
                                                    >
                                                        <FaArrowUp />
                                                    </IconButton>
                                                </Table.Cell>
                                            </>
                                        );
                                    } else {
                                        const netwt = getNetWeight(row);
                                        return (
                                            <>
                                                <Table.Cell as="td" px={1}>{row.ITEMNAME}</Table.Cell>
                                                <Table.Cell as="td">{row.METALNAME}</Table.Cell>
                                                <Table.Cell as="td" textAlign="end">
                                                    <Stack gap={0}>
                                                        <Text fontWeight="bold">{row.PCS} pcs</Text>
                                                        {/* ✅ Show live remaining pieces from draft */}
                                                        {availability && (
                                                            <Text fontSize="xs" color={isOutOfStock ? "red.500" : "green.600"}>
                                                                Avail: {availability.pieces.remaining} pcs
                                                            </Text>
                                                        )}
                                                    </Stack>
                                                </Table.Cell>
                                                <Table.Cell as="td" textAlign="end">
                                                    {Number(row.GRSWT || 0).toFixed(3)}g
                                                </Table.Cell>
                                                <Table.Cell as="td" textAlign="end">
                                                    {Number(row.STNWT || 0).toFixed(3)}g
                                                </Table.Cell>
                                                <Table.Cell as="td" textAlign="end">
                                                    <Stack gap={0}>
                                                        <Text fontWeight="bold">{netwt.toFixed(3)}g</Text>
                                                        {/* ✅ Show live remaining weight */}
                                                        {availability && (
                                                            <Text fontSize="xs" color="blue.500">
                                                                Avail: {availability.weight.remaining.toFixed(3)}g
                                                            </Text>
                                                        )}
                                                    </Stack>
                                                </Table.Cell>
                                                <Table.Cell as="td" textAlign="end">
                                                    {row.TOUCH || row.touch || ""}
                                                </Table.Cell>
                                                <Table.Cell as="td" textAlign="end" fontWeight="bold" color="blue.600" px={1}>
                                                    {Number(row.PUREWT || row.purewt || 0).toFixed(3)}g
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
                                    }
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