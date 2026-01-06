"use client";

import React from "react";
import { Button, Flex } from "@chakra-ui/react";




export default function TransactionTypeSelector({
    transactionTypes,
    selectedType,
    onSelectType,
    theme,
}:any) {
    return (
        <Flex
            gap={2}
            wrap="wrap"
            bg={theme.colors.formColor}
            p={2}
            rounded="md"
        >
            {transactionTypes.map((btn:any) => {
                const Icon = btn.icon;
                return (
                    <Button
                        key={btn.value}
                        size="xs"
                        variant={selectedType?.value === btn.value ? "solid" : "outline"}
                        bg={
                            selectedType?.value === btn.value
                                ? theme.colors.accient
                                : theme.colors.primary
                        }
                        color={selectedType?.value === btn.value ? "white" : "inherit"}
                        px={2}
                        onClick={() => onSelectType(btn)}
                    >
                        <Icon size={12} /> {btn.label}
                    </Button>
                );
            })}
        </Flex>
    );
}