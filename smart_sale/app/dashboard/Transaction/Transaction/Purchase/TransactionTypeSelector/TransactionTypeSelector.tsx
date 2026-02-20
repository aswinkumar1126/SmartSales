"use client";

import React from "react";
import { Button, Box } from "@chakra-ui/react";

export default function TransactionTypeSelector({
    transactionTypes,
    selectedTypes = [],
    onSelectTypes,
    theme,
    TRANSACTIONTYPES_ORDER
}: any) {

    /* ---------- ORDER BY CODE ---------- */
    const orderedTypes = TRANSACTIONTYPES_ORDER
        .map((code: string) => transactionTypes.find((t: any) => t.code === code))
        .filter(Boolean);

    /* ---------- CLICK HANDLER ---------- */
    const handleTypeClick = (clickedType: any) => {

        const isSelected = selectedTypes.some(
            (type: any) => type.code === clickedType.code
        );

        let newSelectedTypes = [...selectedTypes];

        // REMOVE
        if (isSelected) {

          
            const confirmRemove = window.confirm(
                `Remove "${clickedType.label}" from filter ?`
            );

            if (!confirmRemove) return;

            newSelectedTypes = selectedTypes.filter(
                (type: any) => type.code !== clickedType.code
            );
        }
        // ADD
        else {
            newSelectedTypes.push(clickedType);
        }

        onSelectTypes(newSelectedTypes);
    };

    const isTypeSelected = (code: string) =>
        selectedTypes.some((type: any) => type.code === code);

    const TYPE_COLORS: Record<string, { bg: string; active: string; text: string }> = {
        PU:{ bg: "#E6FFFA", active: "#2F855A", text: "#1C4532" },  // Blue
        PR: { bg: "#FFEAEA", active: "#C53030", text: "#742A2A" },   // Red
        ISP: { bg: "#FFF4E5", active: "#DD6B20", text: "#7B341E" },   // Orange
        REC: { bg: "#ffe8fd", active: "#c729ba", text: "#8f1084" }   // Green
    };


    return (
        <Box
            p={2}
            gap={2}
            display="flex"
            rounded="2xl"
            bg={theme.colors.formColor}
            flexWrap="wrap"
        >
            {orderedTypes.map((btn: any) => {
                const Icon = btn.icon;
                const selected = isTypeSelected(btn.code);

                const colors = TYPE_COLORS[btn.code] || {
                    bg: "#F1F1F1",
                    active: "#444",
                    text: "#222"
                };

                return (
                    <Button
                        key={btn.code}
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
    );

}
