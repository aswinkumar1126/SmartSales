"use client";

import React from "react";
import { Button } from "@chakra-ui/react";
import { ActionBar, Portal } from "@chakra-ui/react";

export default function TransactionTypeSelector({
    transactionTypes,
    selectedType,
    onSelectType,
    theme,
    open = true,
}: any) {
    return (
        <ActionBar.Root open={open}>
            <Portal>
                <ActionBar.Positioner
                >
                    <ActionBar.Content
                        className={`
                          animate__animated 
                          animate__fadeInUp 
                          animate__faster
                          flex gap-2 justify-center items-center
                          px-3 py-2
                          rounded-full
                          shadow-xl
                          backdrop-blur-md
                        `}
                        bg={theme.colors.formColor}
                    >
                        {transactionTypes.map((btn: any) => {
                            const Icon = btn.icon;

                            return (
                                <Button
                                    key={btn.value}
                                    size="xs"
                                    fontSize={{base: "2xs", md: "xs"}}
                                    variant={
                                        selectedType?.value === btn.value
                                            ? "solid"
                                            : "outline"
                                    }
                                    bg={
                                        selectedType?.value === btn.value
                                            ? theme.colors.accient
                                            : theme.colors.primary
                                    }
                                    color={
                                        selectedType?.value === btn.value
                                            ? "white"
                                            : "inherit"
                                    }
                                    px={3}
                                    rounded="full"
                                    onClick={() => onSelectType(btn)}
                                    display="flex"
                                    gap={1}
                                    alignItems="center"
                                    className="transition-transform hover:scale-105 active:scale-95"
                                >
                                    <Icon size={12} />
                                    {btn.label}
                                </Button>
                            );
                        })}
                    </ActionBar.Content>
                </ActionBar.Positioner>
            </Portal>
        </ActionBar.Root>
    );
}
