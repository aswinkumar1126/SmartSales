"use client";

import {
    Box,
    Table,
    Dialog,
    Portal,
    Text,
    Button,
    Badge,
    Span
} from "@chakra-ui/react";
import { useState } from "react";
import { CustomTable, TableColumn } from "@/component/table/CustomTable";
import { useTheme } from "@/context/theme/themeContext";
import { CapitalizedInput } from "@/components/ui/CapitalizedInput";
import { DatePickerInput } from "@/components/ui/DatePickerInput";
import { formatDateForShow } from "@/utils/format/formatDateForAPI";

import { billDetailsParams } from "../page";
import { formatToFixed } from "@/utils/format/numberFormat";
import loadImg from '@/asserts/icons/download.png';
import Image from "next/image";

import { useLoadSalesReturnItems } from "@/hooks/Transaction/sales/useLoadSalesReturnItems";

interface SalesBillViewModalProps {
    isOpen: boolean;
    billParams: billDetailsParams;
    onBillParamChange: (field: keyof billDetailsParams, value: any) => void;
    billDetails: any[];
    loading: boolean;
    highlightedId?: number | string;
    onClose: () => void;

}

export default function SalesBillViewModal({
    isOpen,
    billParams,
    onClose,
    onBillParamChange,
    billDetails,
    loading,
    highlightedId,

}: SalesBillViewModalProps) {
    const today = new Date().toISOString().split("T")[0];

    const { loadSalesReturnItems } = useLoadSalesReturnItems();


    // State to store selected IDs and rows
    const [selectedItemIds, setSelectedItemIds] = useState<(string | number)[]>([]);
    const [selectedItems, setSelectedItems] = useState<any[]>([]);


    // Handle selection change from CustomTable and pass to parent
    const onSelectionChange = (selectedIds: (string | number)[], selectedRows: any[]) => {

        setSelectedItemIds(selectedIds);
        setSelectedItems(selectedRows);
    };

    const { theme } = useTheme();

    const columns: TableColumn[] = [
        { key: "BILLNO", label: "BILL NO" },
        { key: "BILLDATE", label: "BILL DATE" },
        { key: 'TAGNO', label: 'TAG NO' },
        { key: "ITEMID", label: 'ITEM ID' },
        { key: "ITEMNAME", label: "ITEMNAME" },
        { key: "GRSWT", label: "GRS WT", align: "center" },
        { key: "STNWT", label: "STN WT", align: "center" },
        { key: "NETWT", label: "NET WT", align: "center" },
        { key: "TOUCH", label: "TOUCH", align: "center" },
        { key: "STNAMT", label: "STN AMT", align: "center" },
        { key: "MC", label: "MC", align: "center" },
        { key: "DESCRIPTION", label: "DESCRIPTION" },
    ];

    // Helper function to safely render cell value
    const renderCellValue = (value: any, defaultValue: string = "-") => {
        if (value === null || value === undefined || value === "") {
            return defaultValue;
        }
        return value;
    };

    // Helper function to render row cells safely
    const renderRowCells = (row: any) => {
        return (
            <>
                <Table.Cell>{renderCellValue(row.BILLNO)}</Table.Cell>
                <Table.Cell>{renderCellValue(formatDateForShow(row.TRANDATE))}</Table.Cell>
                <Table.Cell>{renderCellValue(row.TAGNO)}</Table.Cell>
                <Table.Cell>{renderCellValue(row.ITEMID)}</Table.Cell>
                <Table.Cell>{renderCellValue(row.ITEMNAME)}</Table.Cell>
                <Table.Cell textAlign="end">{renderCellValue(formatToFixed(row.GRSWT, 3), "0")}</Table.Cell>
                <Table.Cell textAlign="end">{renderCellValue(formatToFixed(row.STNWT, 3), "0")}</Table.Cell>
                <Table.Cell textAlign="end">{renderCellValue(formatToFixed(row.NETWT, 3), "0")}</Table.Cell>
                <Table.Cell textAlign="end">{renderCellValue(formatToFixed(row.TOUCH, 1), "0")}</Table.Cell>
                <Table.Cell textAlign="end">{renderCellValue(formatToFixed(row.STNAMT, 2), "0")}</Table.Cell>
                <Table.Cell textAlign="end">{renderCellValue(formatToFixed(row.MC, 2), "0")}</Table.Cell>
                <Table.Cell>{renderCellValue(row.DESCRIPTION)}</Table.Cell>
            </>
        );
    };

    return (
        <Dialog.Root open={isOpen}
            onOpenChange={(e) => {

                if (!e.open) onClose?.();
            }}

        >
            <Portal>
                <Dialog.Backdrop />
                <Dialog.Positioner>
                    <Dialog.Content minW={'80vw'} bg={theme.colors.bg}>
                        <Dialog.Header display={'flex'} alignItems={'center'} justifyContent={'center'} p={2}>
                            <Dialog.Title fontSize={'md'}>SALES BILL VIEW</Dialog.Title>
                        </Dialog.Header>

                        <Dialog.Body p={4} >
                            <Box mb={4} display="flex" gap={3}>
                                <Box display={'flex'} alignItems={'center'}>
                                    <Text minWidth="70px" fontWeight={'500'} fontSize={'xs'}>
                                        ENTRY NO:
                                    </Text>
                                    <CapitalizedInput<billDetailsParams>
                                        value={billParams.ENTRYNO}
                                        field="ENTRYNO"
                                        onChange={onBillParamChange}
                                        placeholder="ENTRY NO"
                                        size="sm"
                                        maxWidth="100px"
                                        type="number"
                                    />
                                </Box>
                                <Box display={'flex'} alignItems={'center'}>
                                    <Text minWidth="70px" fontWeight={'500'} fontSize={'xs'}>
                                        BILL DATE:
                                    </Text>
                                    <DatePickerInput
                                        value={billParams.BILLDATE}
                                        onChange={(date) =>
                                            onBillParamChange("BILLDATE", date)
                                        }
                                        placeholder="Select Date"
                                        maxWidth="120px"
                                        maxDate={today}
                                    />
                                </Box>
                                <Box display={'flex'} alignItems={'center'}>
                                    <Text minWidth="70px" fontWeight={'500'} fontSize={'xs'}>
                                        TAG NO:
                                    </Text>
                                    <CapitalizedInput<billDetailsParams>
                                        value={billParams.TAGNO}
                                        field="TAGNO"
                                        onChange={onBillParamChange}
                                        placeholder="enter tag number"
                                        size="sm"
                                        maxWidth="200px"
                                    />
                                </Box>
                            </Box>

                            {loading ? (
                                <p>Loading...</p>
                            ) : (
                                <CustomTable
                                    columns={columns}
                                    data={billDetails || []}
                                    highlightRowId={
                                        highlightedId
                                            ? Number(highlightedId)
                                            : null
                                    }
                                    rowIdKey="SNO"
                                    bodyBg={theme.colors.formColor}
                                    selection={{
                                        enabled: true,
                                        selectionBgColor: "red",
                                        selectionTextColor: "#EEE",
                                        showSelectAll: true,
                                        onSelectionChange: onSelectionChange // Pass the callback
                                    }}
                                    renderRow={renderRowCells}
                                    headerBg={theme.colors.primary}
                                    headerColor="white"
                                    maxHeight="400px"

                                />

                            )}
                            <Box mt={2} p={2} bg={theme.colors.formColor} rounded={'xl'}>
                                <Span fontSize={'xs'}> SELECTED IDS :</Span>
                                {selectedItemIds.map((i) =>
                                    <Badge key={i} colorPalette={'red'} variant={'subtle'} >
                                        {i}
                                    </Badge>
                                )}
                            </Box>




                        </Dialog.Body>
                        <Dialog.Footer m={0}>
                            <Image
                                src={loadImg}
                                alt={'LOAD ITEMS'}
                                width={40}
                                height={40}
                                onClick={() => {
                                    loadSalesReturnItems(selectedItems)
                                    setSelectedItems([]);
                                    setSelectedItemIds([]);

                                    onClose();
                                }
                                } />

                        </Dialog.Footer>
                    </Dialog.Content>
                </Dialog.Positioner>
            </Portal>
        </Dialog.Root>
    );
}