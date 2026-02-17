"use client";

import React from "react";
import { Button ,Box } from "@chakra-ui/react";
import { ActionBar, Portal } from "@chakra-ui/react";

export default function TransactionTypeSelector({
    transactionTypes,
    selectedTypes = [], // Changed from selectedType to selectedTypes array
    onSelectTypes, // Changed from onSelectType
    theme,
    open = true,
}: any) {

    const handleTypeClick = (clickedType: any) => {
        // Check if the type is already selected
        const isSelected = selectedTypes.some((type: any) => type.value === clickedType.value);

        let newSelectedTypes;
        if (isSelected) {
            // Remove if already selected
            newSelectedTypes = selectedTypes.filter((type: any) => type.value !== clickedType.value);
        } else {
            // Add if not selected
            newSelectedTypes = [...selectedTypes, clickedType];
        }

        onSelectTypes(newSelectedTypes);
    };

    const isTypeSelected = (typeValue: string) => {
        return selectedTypes.some((type: any) => type.value === typeValue);
    };

    return (
     
                    <Box
                        p={2}
                        gap={2}
                        display="flex"
                        rounded='2xl'
                        bg={theme.colors.formColor}
                    >

                        {transactionTypes.map((btn: any) => {
                            const Icon = btn.icon;
                            const isSelected = isTypeSelected(btn.value);

                            return (
                                <Button
                                    key={btn.value}
                                    size="xs"
                                    fontSize="2xs"
                                    variant={isSelected ? "solid" : "outline"}
                                    bg={isSelected ? theme.colors.green : theme.colors.primary}
                                    color={isSelected ? "white" : "inherit"}
                                    px={2}
                                    rounded="full"
                                    onClick={() => handleTypeClick(btn)}
                                    display="flex"
                                    gap={1}
                                    alignItems="center"
                                    className="transition-transform hover:scale-105 active:scale-95"
                                    _hover={{
                                        bg: isSelected ? theme.colors.green : theme.colors.primaryHover || theme.colors.primary,
                                        opacity: 0.9,
                                    }}
                                >
                                    <Icon size={12} />
                                    {btn.label}
                                    {isSelected && (
                                        <span style={{ marginLeft: '2px', fontSize: '10px' }}>✓</span>
                                    )}
                                </Button>
                            );
                        })}
        </Box>
      
    );
}