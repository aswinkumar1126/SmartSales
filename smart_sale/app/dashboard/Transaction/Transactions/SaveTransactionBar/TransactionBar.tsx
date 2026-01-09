"use client";

import React from "react";
import { Flex, Button, Text } from "@chakra-ui/react";
import { Save, RefreshCw } from "lucide-react";
import Image from "next/image";
import saveIcon from '@/asserts/icons/save.png';
import clearIcon from '@/asserts/icons/clear.jpeg';

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

            <Flex gap={1}>
                <Button
                    size="xs"
                    fontSize='2xs'
                    onClick={onReset}
                    disabled={draftCount === 0}
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
                    disabled={draftCount === 0}
                    variant='ghost'
                    p={0}
                 
                >
                   <Image src={saveIcon} width={60} alt="save" />
                </Button>
            </Flex>
        </Flex>
    );
}