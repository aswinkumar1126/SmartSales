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


const columns: TableColumn[] = [
    { key: "pureGoldName", label: "Pure Gold" },
    { key: "metalName", label: "Metal" },
    { key: "weight", label: "Weight", align: "end" },
    { key: "actualTouch", label: "Touch", align: "end" },
    { key: "actualPure", label: "Pure", align: "end" },
    { key: "action", label: "Action", align: "center" },
];


type StockDrawerProps = {
    isIssue:boolean;
    showStock:string;
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
    itemCollection
}: StockDrawerProps) {

    
    console.log(metalCollection, pureGoldCollection,'metalCollection');
const {theme} = useTheme();


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
                { key: "grossWeight", label: "Gross Wt", align: "end" },
                { key: "TOUCH", label: "TOUCH", align: "end" },
                { key: "action", label: "Action", align: "center" },
            ];
    }, [showStock]);

    const secondaryCollection = showStock === "PURE"
        ? pureGoldCollection
        : itemCollection;
    return (
        <Drawer.Root open={open} onOpenChange={(e) => !e.open && onClose()} size="xl" >
            <Portal >
            
                <Drawer.Positioner zIndex={10}>
                    <Drawer.Content>
                        <Drawer.Header bg={theme.colors.accient}>
                            <HStack justify="space-between" w='full'>
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
                                        <GiGoldBar />  Pure
                                    </Button>

                                    <Button
                                        size="xs"
                                        rounded='full'
                                        variant={showStock === "ITEM" ? "solid" : "ghost"}
                                        bg={showStock === "ITEM" ? theme.colors.whiteColor : "transparent"}
                                        color={showStock === "ITEM" ? theme.colors.accient : "white"}
                                        onClick={() => setShowStock("ITEM")}
                                    >
                                        <FaArrowUp />  Item
                                    </Button>
                                </HStack>
                            </HStack>
                        </Drawer.Header>


                        <Drawer.Body >
                            {/* Filters */}
                            <HStack mb={3} gap={2}>
                                <SelectCombobox
                                    items={metalCollection??[]}
                                    placeholder="Select Metal"
                                    value={metalId}
                                    onChange={setMetalId}
                                />

                                <SelectCombobox
                                    items={secondaryCollection??[]}
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
                                renderRow={(row) =>
                                    showStock === "PURE" ? (
                                        <>
                                            <Box as="td">{row.pureGoldName}</Box>
                                            <Box as="td">{row.metalName}</Box>
                                            <Box as="td" textAlign="end">{row.weight}</Box>
                                            <Box as="td" textAlign="end">{row.actualTouch}</Box>
                                            <Box as="td" textAlign="end">{row.actualPure}</Box>
                                            <Box as="td" textAlign="center">
                                                <IconButton size="2xs" onClick={() => onIssue(row)}>
                                                    <FaArrowUp />
                                                </IconButton>
                                            </Box>
                                        </>
                                    ) : (
                                        <>
                                            <Box as="td">{row.itemName}</Box>
                                            <Box as="td">{row.metalName}</Box>
                                            <Box as="td" textAlign="end">{row.grossWeight}</Box>
                                            <Box as="td" textAlign="end">{row.TOUCH}</Box>
                                            <Box as="td" textAlign="center">
                                                <IconButton size="2xs" onClick={() => onIssue(row)}>
                                                    <FaArrowUp />
                                                </IconButton>
                                            </Box>
                                        </>
                                    )
                                }
                            />


                        </Drawer.Body>

                        <Drawer.Footer >
                            <Button onClick={onClose} variant="outline"  size="sm">
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
