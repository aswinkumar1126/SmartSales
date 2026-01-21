"use client";

import {
    Button,
    CloseButton,
    Drawer,
    Portal,
    Box,
    HStack,
    Input,
    Select,
    Text,
    IconButton,
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
    stockData: any[];
    open: boolean;
    onClose: () => void;
    onIssue: (row: any) => void;

    metalId?: string;
    setMetalId: (val?: string) => void;
    metalCollection?:any

    pureGoldName?: string;
    setPureGoldName: (val?: string) => void;
    pureGoldCollection?:any
};
export default function StockDrawer({
    stockData,
    open,
    onClose,
    onIssue,
    metalId,
    setMetalId,
    metalCollection,
    pureGoldName,
    setPureGoldName,
    pureGoldCollection
}: StockDrawerProps) {

    
    console.log(metalCollection, pureGoldCollection,'metalCollection');
const {theme} = useTheme()

    return (
        <Drawer.Root open={open} onOpenChange={(e) => !e.open && onClose()} size="xl" >
            <Portal >
            
                <Drawer.Positioner zIndex={10}>
                    <Drawer.Content>
                        <Drawer.Header bg={theme.colors.accient}>
                            <Drawer.Title color={theme.colors.whiteColor}>Stock Details</Drawer.Title>
                        </Drawer.Header>

                        <Drawer.Body >
                            {/* Filters */}
                            <HStack mb={3} gap={2}>
                               <SelectCombobox
                                    items={metalCollection}
                                    placeholder="Selct Metal"
                                    value={metalId}
                                    onChange={(val)=>setMetalId(val)}

                               />
                                <SelectCombobox
                                    items={pureGoldCollection}
                                    placeholder="Selct PureGoldNmae"
                                    value={pureGoldName}
                                    onChange={(val) => setPureGoldName(val)}
                                />

                               
                            </HStack>

                            {/* Table */}
                            <CustomTable
                            headerBg="blue.800"
                            headerColor="white"
                            bodyBg="gray.200"
                            borderColor="white"
                                columns={columns}
                                data={stockData}
                                rowIdKey="id"
                                renderRow={(row) => (
                                    <>
                                        <Box as="td">{row.pureGoldName}</Box>
                                        <Box as="td">{row.metalName}</Box>
                                        <Box as="td" textAlign="end">
                                            {row.weight}
                                        </Box>
                                        <Box as="td" textAlign="end">{row.actualTouch}</Box>
                                        <Box as="td" textAlign="end" >{row.actualPure}</Box>
                                       
                                        <Box as="td" textAlign="center">
                                            <IconButton
                                                aria-label="Issue"
                                                size="2xs"
                                                colorPalette="red"
                                                onClick={() => onIssue(row)}
                                                title="Issue"
                                            >
                                                <FaArrowUp />
                                            </IconButton>
                                        </Box>
                                    </>
                                )}
                            />
                        </Drawer.Body>

                        <Drawer.Footer bg={theme.colors.accient}>
                            <Button variant='plain' color={theme.colors.whiteColor} onClick={onClose} size="xs">
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
