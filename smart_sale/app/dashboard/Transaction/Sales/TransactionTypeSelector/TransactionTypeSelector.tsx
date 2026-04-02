"use client";

import React from "react";
import { Button, Box, Text, Flex } from "@chakra-ui/react";
import { GiGoldBar } from "react-icons/gi";
import { HiFilter, HiX } from "react-icons/hi";
import { Save, RefreshCw } from "lucide-react";
import Image from "next/image";
import saveIcon from '@/asserts/icons/save.png';
import clearIcon from '@/asserts/icons/clear.jpeg';
import updateIcon from '@/asserts/icons/update.png';

export default function TransactionTypeSelector({
    transactionTypes,
    selectedTypes = [],
    onSelectTypes,
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
    draftRows,
    setDraftRows
    
}: any) {
    console.log(transactionTypes,'TRANSACTIONTYPES_ORDER');
    console.log(TRANSACTIONTYPES_ORDER,'TRANSACTIONTYPES_ORDER');
        console.log(transactionTypes,'transactionTypes');
    
    

    /* ---------- ORDER BY CODE ---------- */
    const orderedTypes = TRANSACTIONTYPES_ORDER
        .map((value: string) => transactionTypes.find((t: any) => t.value === value))
        .filter(Boolean);

    console.log(orderedTypes,'orderedTypes')

    /* ---------- CLICK HANDLER ---------- */
    const handleTypeClick = (clickedType: any) => {

        const isSelected = selectedTypes.some(
            (type: any) => type.value === clickedType.value
        );

        let newSelectedTypes = [...selectedTypes];

        // REMOVE
        if (isSelected) {


            const confirmRemove = window.confirm(
                `Remove "${clickedType.label}" from filter ?`
            );

            if (!confirmRemove) return;

            newSelectedTypes = selectedTypes.filter(
                (type: any) => type.value !== clickedType.value
            );
        }
        // ADD
        else {
            newSelectedTypes.push(clickedType);
        }

        onSelectTypes(newSelectedTypes);
    };

    const isTypeSelected = (code: string) =>
        selectedTypes.some((type: any) => type.value === code);

    const TYPE_COLORS: Record<string, { bg: string; active: string; text: string }> = {
        SA: { bg: "#E6FFFA", active: "#2F855A", text: "#1C4532" },  // Blue
        SR: { bg: "#FFEAEA", active: "#C53030", text: "#742A2A" },   // Red
        IS: { bg: "#FFF4E5", active: "#DD6B20", text: "#7B341E" },   // Orange
        RE: { bg: "#ffe8fd", active: "#c729ba", text: "#8f1084" }   // Green
    };

    const handleDeselectAll = () => {

        if (draftRows && draftRows.length > 0) {

            const confirmClear = window.confirm(
                "Table contains rows. Clear table and deselect transaction types?"
            );

            if (!confirmClear) return;

            setDraftRows([])
        }

        onSelectTypes([]); // clear selection
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
                    console.log(selected,'selected')

                    const colors = TYPE_COLORS[btn.value] || {
                        bg: "#F1F1F1",
                        active: "#444",
                        text: "#222"
                    };

                    return (
                        <Button
                            key={btn.value}
                            size="xs"
                            fontSize="2xs"
                            px={3}
                            rounded="full"
                            onClick={() => handleTypeClick(btn)}
                            display="flex"
                            alignItems="center"
                            gap={1}
                            transition="all .15s ease"

                            /* -------- COLORS -------- */
                            bg={selected ? colors.active : colors.bg}
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
                            <Icon size={12} />
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
                        onClick={onReset}
                        variant='ghost'
                        bg={theme.colors.formColor}
                        p={0}
                    >
                        <Image src={clearIcon} width={58} alt="save" />
                    </Button>

                    <Button
                        size="xs"
                        bg={theme.colors.formColor}
                        onClick={onSave}
                        loading={isSaving}
                        loadingText="Saving..."
                        variant='ghost'
                        p={0}

                    >
                        <Image src={isEditing ? updateIcon : saveIcon} width={60} alt="save" />
                    </Button>

                    {draftRows.length > 0 &&
                        <Button
                            size="2xs"
                            fontSize="2xs"
                            onClick={handleDeselectAll}
                            bg="red.600"
                            color="white"
                            rounded="full"
                        >
                            <HiX size={10} /> DESELECT
                        </Button>
                    }
                </Box> }
            
            <Box display='flex' gap={4}>

                {/* ALL STOCK */}
                <Box
                    className="flex flex-col items-center cursor-pointer gap-1"
                    onClick={() => setIsStockDrawerOpen(true)}
                >
                    <GiGoldBar size={20} />
                    <Text fontSize="x-small" fontWeight="semibold">
                        ALL STOCK
                    </Text>
                </Box>

                {/* SHOW / HIDE FILTER */}
                <Box
                    className="flex flex-col items-center cursor-pointer animate__animated animate__fadeInUp gap-1"
                    onClick={() => handleShowFilter(!showFilter)}
                >
                    {showFilter ? <HiX size={20} className="text-red-500" /> : <HiFilter size={20} className="text-blue-500" />}
                    <Text fontSize="x-small" fontWeight="semibold">
                        {showFilter ? "HIDE FILTER" : "SHOW FILTER"}
                    </Text>
                </Box>
            </Box>
        </Box>
    );

}
