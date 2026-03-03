"use client";

import {
    Button,
    CloseButton,
    Drawer,
    Portal,
    Box,
    Stack,
    HStack,
    Input,
    Select,
    Text,
    IconButton,
    List,
} from "@chakra-ui/react";
import { useMemo, useState } from "react";
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
    getStockAvailability?: (id: string) => StockAvailable | undefined;
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

    const { theme } = useTheme();

    const columns: TableColumn[] = useMemo(() => {
        return showStock === "PURE"
            ? [
                { key: "pureGoldName", label: "Pure Gold" },
                { key: "metalName", label: "Metal" },
                { key: "weight", label: "Weight", align: "end" },
                { key: "actualTouch", label: "Touch", align: "end" },
                { key: "actualPure", label: "Pure", align: "end" },
                { key: "action", label: "Action", align: "center" },
            ]
            : [
                { key: "itemName", label: "Item" },
                { key: "metalName", label: "Metal" },
                { key: "pcs", label: "Pcs" },
                { key: "grswt", label: "Gross Wt", align: "end" },
                { key: "stnwt", label: "Stone Wt", align: "end" },
                { key: "netwt", label: "Net Wt", align: "end" },
                { key: "touch", label: "Touch", align: "end" },
                { key: "purewt", label: "Pure Wt", align: "end" },
                { key: "action", label: "Action", align: "center" },
            ];
    }, [showStock]);

    const secondaryCollection = showStock === "PURE"
        ? pureGoldCollection
        : itemCollection;

    console.log(itemCollection, 'itemCollection');

    // Helper function to get stock status color
    const getStockStatusColor = (remaining: number) => {
        if (remaining <= 0) return "red.500";
        if (remaining < 10) return "orange.500";
        return "green.500";
    };

    // Calculate NETWT for item display
    const getNetWeight = (row: any) => {
        const grswt = Number(row.GRSWT || row.grswt || 0);
        const stnwt = Number(row.STNWT || row.stnwt || 0);
        return grswt - stnwt;
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
                                    // Get availability for this row if it's a pure gold item
                                    const availability = showStock === "PURE" && getStockAvailability
                                        ? getStockAvailability(row.pureId || row.PUREID)
                                        : undefined;

                                    const isOutOfStock = (availability?.remaining ?? Infinity) <= 0;

                                    if (showStock === "PURE") {
                                        return (
                                            <>
                                                <Box as="td">{row.pureGoldName}</Box>
                                                <Box as="td">{row.metalName}</Box>
                                                <Box as="td" textAlign="end">
                                                    <Stack gap={0}>
                                                        <Text fontWeight="medium">
                                                            {Number(row.weight).toFixed(3)}g
                                                        </Text>
                                                        {availability && (
                                                            <Text
                                                                fontSize="xs"
                                                                color={getStockStatusColor(availability.remaining)}
                                                            >
                                                                Available: {availability.remaining.toFixed(3)}g
                                                                {availability.used > 0 && (
                                                                    <Text as="span" color="gray.500" ml={1}>
                                                                        (Used: {availability.used.toFixed(3)}g)
                                                                    </Text>
                                                                )}
                                                            </Text>
                                                        )}
                                                    </Stack>
                                                </Box>
                                                <Box as="td" textAlign="end">{row.actualTouch}</Box>
                                                <Box as="td" textAlign="end">
                                                    {Number(row.actualPure).toFixed(3)}
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
                                                <Box as="td">{row.itemName}</Box>
                                                <Box as="td">{row.metalName}</Box>
                                                <Box as="td">{row.pcs}</Box>
                                                <Box as="td" textAlign="end">
                                                    {Number(row.grswt || 0).toFixed(3)}
                                                </Box>
                                                <Box as="td" textAlign="end">
                                                    {Number(row.stnwt || 0).toFixed(3)}
                                                </Box>
                                                <Box as="td" textAlign="end">
                                                    <Stack gap={0}>
                                                        <Text fontWeight="bold" color="blue.600">
                                                            {row.netwt.toFixed(3)}g
                                                        </Text>
                                                        
                                                    </Stack>
                                                </Box>
                                                <Box as="td" textAlign="end">
                                                    {row.TOUCH || row.touch || ""}
                                                </Box>
                                                <Box as="td" textAlign="end">
                                                    {Number(row.PUREWT || row.purewt || 0).toFixed(3)}
                                                </Box>
                                                <Box as="td" textAlign="center">
                                                    <IconButton
                                                        size="2xs"
                                                        onClick={() => onIssue(row)}
                                                        colorScheme="blue"
                                                        title="Add to transaction"
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