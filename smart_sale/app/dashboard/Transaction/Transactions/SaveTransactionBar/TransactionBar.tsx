"use client";

import React from "react";
import { Flex, Button, Text } from "@chakra-ui/react";
import { Save, RefreshCw } from "lucide-react";

interface SaveTransactionBarProps {
    draftCount: number;
    onSave: () => void;
    onReset: () => void;
    isSaving: boolean;
    theme: any;
}

export default function SaveTransactionBar({
    draftCount,
    onSave,
    onReset,
    isSaving,
    theme,
}: SaveTransactionBarProps) {
    return (
        <Flex
            justify="space-between"
            align="center"
            bg={theme.colors.formColor}
            p={2}
            rounded="md"
            border="1px"
            borderColor={theme.colors.accient}
        >
            <Text fontSize="xs" fontWeight="bold">
                Draft Items: {draftCount}
            </Text>

            <Flex gap={2}>
                <Button
                    size="xs"
                    variant="outline"
                    fontSize='2xs'
                    onClick={onReset}
                    disabled={draftCount === 0}
                >
                    <RefreshCw size={8} />  Clear 
                </Button>

                <Button
                    size="xs"
                    bg={theme.colors.accient}
                    color="white"
                    onClick={onSave}
                    loading={isSaving}
                    loadingText="Saving..."
                    disabled={draftCount === 0}
                    fontSize='2xs'
                >
                    <RefreshCw size={8}/> Save 
                </Button>
            </Flex>
        </Flex>
    );
}