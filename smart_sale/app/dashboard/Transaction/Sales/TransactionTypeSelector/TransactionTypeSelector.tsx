"use client";

import React from "react";
import { Button, Box, Text, Flex } from "@chakra-ui/react";
import { GiGoldBar } from "react-icons/gi";
import { HiFilter, HiX } from "react-icons/hi";
import Image from "next/image";
import saveIcon from '@/asserts/icons/save.png';
import clearIcon from '@/asserts/icons/clear.jpeg';
import updateIcon from '@/asserts/icons/update.png';
import modifyIcon from '@/asserts/icons/modify.png';
import { useSaleTransactionStore } from "@/store/sales/useSaleTransactionStore";
import { toaster } from "@/components/ui/toaster";
import { HiPrinter } from "react-icons/hi2";

export default function TransactionTypeSelector({
    transactionTypes,
    theme,
    TRANSACTIONTYPES_ORDER,
    showFilter,
    handleShowFilter,
    setIsStockDrawerOpen,
    isEditing = false,
    onSave,
    onReset,
    isSaving,
    acCode,
    onPrint,
    isModifying ,
    startModify ,
    stopModify
}: any) {
    // Get from Zustand store
    const {
        selectedTransactionTypes,
        setSelectedTransactionTypes,
        removeTransactionType,
        clearAllTransactionTypes,
        draftRows,
        clearDraftRows,
    } = useSaleTransactionStore();

    /* ---------- ORDER BY CODE ---------- */
    const orderedTypes = TRANSACTIONTYPES_ORDER
        .map((value: string) => transactionTypes.find((t: any) => t.value === value))
        .filter(Boolean);

    /* ---------- CLICK HANDLER ---------- */
    const handleTypeClick = (clickedType: any) => {


        if(!acCode) return toaster.create({ title: "Please select customer", type: "info" });

        const isSelected = selectedTransactionTypes.some(
            (type: any) => type.value === clickedType.value
        );

        // REMOVE
        if (isSelected) {

            const isDraftRowsExists = draftRows.some((row: any) => row.TRANSACTION_TYPE === clickedType.value);

        
            if (isDraftRowsExists){
                toaster.create({
                    title: "Transaction rows exist",
                    description: `You have transaction row(s) of selected ${clickedType.label} .`,
                    type: "warning",
                    duration: 2000,
                });
                return;
            };
           

            const confirmRemove = window.confirm(
                `Remove "${clickedType.label}" from filter?`
            );

            if (!confirmRemove) return;

            removeTransactionType(clickedType.value);
        }
        // ADD
        else {
            setSelectedTransactionTypes([...selectedTransactionTypes, clickedType]);
        }
    };

    const isTypeSelected = (code: string) =>
        selectedTransactionTypes.some((type: any) => type.value === code);

    const TYPE_COLORS: Record<string, { bg: string; active: string; text: string }> = {
        SA: { bg: "#E6FFFA", active: "#2F855A", text: "#1C4532" },
        SR: { bg: "#FFEAEA", active: "#C53030", text: "#742A2A" },
        IS: { bg: "#FFF4E5", active: "#DD6B20", text: "#7B341E" },
        RE: { bg: "#ffe8fd", active: "#c729ba", text: "#8f1084" }
    };

    const handleDeselectAll = () => {
        if (draftRows && draftRows.length > 0) {
            const confirmClear = window.confirm(
                "Table contains rows. Clear table and deselect transaction types?"
            );

            if (!confirmClear) return;

            clearDraftRows();
        }

        clearAllTransactionTypes();
    };

    return (
        <Box p={2}
            gap={2}
            display="flex"
            bg={theme.colors.formColor}
            rounded="2xl"
            justifyContent='space-between'
            alignItems='center'
        >
            <Box
                display="flex"
                flexWrap="wrap"
                gap={2}
            >
                {orderedTypes.map((btn: any) => {
                    const Icon = btn.icon;
                    const selected = isTypeSelected(btn.value);
                    const colors = TYPE_COLORS[btn.value] || {
                        bg: "#F1F1F1",
                        active: "#444",
                        text: "#222"
                    };

                    return (
                        <Button
                            key={btn.value}
                            size="xs"
                            fontSize="9px"
                            px={2}
                            rounded="full"
                            onClick={() => handleTypeClick(btn)}
                            display="flex"
                            alignItems="center"
                            gap={1}
                            transition="all .15s ease"
                            bg={selected ? colors.active : colors.bg}
                            fontWeight={selected ? 'bold' : 'semibold'}
                            color={selected ? "white" : colors.text}
                            borderWidth="1px"
                            borderColor={selected ? colors.active : "transparent"}
                            _hover={{
                                bg: selected ? colors.active : `${colors.bg}`,
                                transform: "translateY(-1px)"
                            }}
                            _active={{
                                transform: "scale(.96)"
                            }}
                        >
                            <Icon size={10} />
                            {btn.label}
                        </Button>
                    );
                })}
            </Box>

            {acCode &&
                <Box gap={2}>
                    <Button
                        size="xs"
                        fontSize='2xs'
                        onClick={onReset || handleDeselectAll}
                        variant='ghost'
                        bg={theme.colors.formColor}
                        p={0}
                    >
                        <Image src={clearIcon} width={54} alt="clear" />
                    </Button>

                    <Button
                        size="xs"
                        bg={theme.colors.formColor}
                        onClick={onSave}
                        loading={isSaving}
                        loadingText="Saving..."
                        variant='ghost'
                        p={0}
                        disabled={isEditing && !isModifying}
                    >
                        <Image src={isEditing ? updateIcon : saveIcon} width={55} alt="save" />
                    </Button>
                    {isEditing && 
                        <>
                            <Button 
                            size="xs"
                            bg={theme.colors.formColor}
                            onClick={isModifying ? stopModify : startModify}
                        
                            loadingText="Saving..."
                            variant='ghost'
                            p={0}
                        >
                            <Image src={modifyIcon} width={72} alt="save" />
                        </Button>
                    
                        </>
                     }
                </Box>
            }

            <Box display='flex' gap={4}>
                {/* ALL STOCK */}
                <Box
                    className="flex flex-col items-center cursor-pointer gap-1"
                    onClick={() => setIsStockDrawerOpen(true)}
                >
                    <GiGoldBar size={18} />
                    <Text fontSize="2xs" fontWeight="semibold">
                        ALL STOCK
                    </Text>
                </Box>

                 {/* PRINT — show when rows are loaded (same as DESELECT) */}
                                {isEditing && (
                                    <Box
                                        className="flex flex-col items-center cursor-pointer gap-1"
                                        onClick={onPrint}
                                    >
                                        <HiPrinter size={18} className="text-gray-600" />
                                        <Text fontSize="2xs" fontWeight="semibold">
                                            PRINT
                                        </Text>
                                    </Box>
                                )}

                {/* SHOW / HIDE FILTER */}
                <Box
                    className="flex flex-col items-center cursor-pointer animate__animated animate__fadeInUp gap-1"
                    onClick={() => handleShowFilter(!showFilter)}
                >
                    {showFilter ? <HiX size={18} className="text-red-500" /> : <HiFilter size={15} className="text-blue-500" />}
                    <Text fontSize="2xs" fontWeight="semibold">
                        {showFilter ? "HIDE FILTER" : "SHOW FILTER"}
                    </Text>
                </Box>
            </Box>
        </Box>
    );
}