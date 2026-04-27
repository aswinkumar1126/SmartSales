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
    Span,
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

type StockAvailable = {
    total: number;
    used: number;
    remaining: number;
    totalPieces?: number;
    usedPieces?: number;
    remainingPieces?: number;
}

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
    getStockAvailability?: (id: string, options?: {
        excludeRowId?: string,
        transactionTypeCode: string,
        isEditing?: boolean,
        originalValue?: number
    }) => any;
};

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
                { key: "stockStatus", label: "Stock Status", align: "end" },
                { key: "action", label: "Action", align: "center" },
            ]
            : [
                { key: "ITEMNAME", label: "Item" },
                { key: "METALNAME", label: "Metal" },
                { key: "PCS", label: "Pcs", align: "end" },
                { key: "GRSWT", label: "Gross Wt", align: "end" },
                { key: "STNWT", label: "Stone Wt", align: "end" },
                { key: "NETWT", label: "Net Wt", align: "end" },
                { key: "STOCKSTATUS", label: "Stock Status", align: "end" },
                { key: "TOUCH", label: "Touch", align: "end" },
                { key: "PUREWT", label: "Pure Wt", align: "end" },
                // { key: "ACTION", label: "Action", align: "center" },
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

                            {/* Table */}
                            <CustomTable
                                columns={columns}
                                data={stockData}
                                rowIdKey="id"
                                headerBg={theme.colors.accient}
                                headerColor={theme.colors.whiteColor}
                                renderRow={(row) => {

                                  

                                    const stockId = getStockId(row);

                        
                                 
                                    // Get availability for this row based on stock type
                                    const availability = getStockAvailability && stockId
                                        ? getStockAvailability(stockId, {
                                            transactionTypeCode: showStock === "PURE" ? "IS" : "SA",
                                            isEditing: false,
                                        })
                                        : undefined;

                                    console.log(availability, stockId, 'availability');

                                    const isOutOfStock = showStock === "PURE"
                                        ? (availability?.remaining ?? 0) <= 0
                                        : (availability?.remainingPieces ?? 0) <= 0;

                                    if (showStock === "PURE") {
                                        return (
                                            <>
                                                <Box as="td">{row.pureGoldName}</Box>
                                                <Box as="td">{row.metalName}</Box>
                                                <Box as="td" textAlign="end" >
                                                    <Stack gap={0}>
                                                        <Text fontWeight="medium">
                                                            {Number(row.weight).toFixed(3)}g
                                                        </Text>
                                                    </Stack>
                                                </Box>
                                                <Box as="td" textAlign="end" fontWeight="medium">{row.actualTouch}</Box>
                                                <Box as="td" textAlign="end" fontWeight="medium">
                                                    {Number(row.actualPure).toFixed(3)}
                                                </Box>
                                                <Box as="td" textAlign="end">
                                                    {availability ? (
                                                        <Stack gap={0} align="end">
                                                            <Text
                                                                fontSize="sm"
                                                                fontWeight="bold"
                                                                color={getStockStatusColor(availability.remaining, availability.total)}
                                                            >
                                                                Available: {availability.remaining.toFixed(3)}g
                                                            </Text>
                                                            <Text fontSize="xs" color="gray.500">
                                                                Total: {availability.total.toFixed(3)}g | Used: {availability.used.toFixed(3)}g
                                                            </Text>
                                                        </Stack>
                                                    ) : (
                                                        <Text fontSize="sm" color="gray.500">
                                                            {Number(row.weight).toFixed(3)}g available
                                                        </Text>
                                                    )}
                                                </Box>
                                                <Box as="td" textAlign="center">
                                                    <IconButton
                                                        size="2xs"
                                                        onClick={() => onIssue(row)}
                                                        disabled={isOutOfStock}
                                                        title={isOutOfStock ? "Out of stock" : "Add to transaction"}
                                                        colorScheme={isOutOfStock ? "gray" : "blue"}
                                                    >
                                                        <FaArrowUp />
                                                    </IconButton>
                                                </Box>
                                            </>
                                        );
                                    } else {
                                        const netwt = getNetWeight(row);
                                        return (
                                            <>
                                                <Box as="td">{row.ITEMNAME}</Box>
                                                <Box as="td">{row.METALNAME}</Box>
                                                <Box as="td" textAlign="end">
                                                    <Stack gap={0}>
                                                        <Text fontWeight="medium">
                                                            {row.PCS} pcs
                                                        </Text>
                                                    </Stack>
                                                </Box>
                                                <Box as="td" textAlign="end">
                                                    {Number(row.GRSWT || 0).toFixed(3)}g
                                                </Box>
                                                <Box as="td" textAlign="end">
                                                    {Number(row.STNWT || 0).toFixed(3)}g
                                                </Box>
                                                <Box as="td" textAlign="end" fontWeight="medium">
                                                    <Text >
                                                        {netwt.toFixed(3)}g
                                                    </Text>
                                                </Box>
                                                <Box as="td" textAlign="end">
                                                    {availability ? (
                                                        <Stack gap={0} align="end">
                                                            <Text
                                                                fontSize="sm"
                                                                fontWeight="bold"
                                                                color={getStockStatusColor(availability.remainingPieces || 0, availability.totalPieces || 0)}
                                                            >
                                                                Available: {availability.remainingPieces || 0} pcs
                                                            </Text>
                                                            <Text fontSize="xs" color="gray.500">
                                                                Total: {availability.pieces.total || 0} pcs | Used: {availability.pieces.used || 0} pcs
                                                            </Text>
                                                            {availability.remaining > 0 && (
                                                                <Text fontSize="xs" color="green.500">
                                                                    Net Wt Available: {availability.remaining.toFixed(3)}g
                                                                </Text>
                                                            )}
                                                        </Stack>
                                                    ) : (
                                                        <Stack gap={0} align="end">
                                                            <Text fontSize="xs" color="gray.500">
                                                                    {row.PCS ? `${row.PCS} pcs available` : "0 pcs available"}
                                                            </Text>
                                                            <Text fontSize="xs" color="gray.400">
                                                                Net Wt: {netwt.toFixed(3)}g
                                                            </Text>
                                                        </Stack>
                                                    )}
                                                </Box>
                                                <Box as="td" textAlign="end">
                                                    {row.TOUCH || row.touch || ""}
                                                </Box>
                                                <Box as="td" textAlign="end" fontWeight="bold" color="blue.600">
                                                    {Number(row.PUREWT || row.purewt || 0).toFixed(3)}g
                                                </Box>
                                                {/* <Box as="td" textAlign="center">
                                                    <IconButton
                                                        size="2xs"
                                                        onClick={() => onIssue(row)}
                                                        disabled={isOutOfStock}
                                                        title={isOutOfStock ? "Out of stock" : "Add to transaction"}
                                                        colorScheme={isOutOfStock ? "gray" : "blue"}
                                                    >
                                                        <FaArrowUp />
                                                    </IconButton>
                                                </Box> */}
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