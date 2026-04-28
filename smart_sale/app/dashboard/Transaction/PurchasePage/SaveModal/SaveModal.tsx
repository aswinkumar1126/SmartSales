"use client";

import React from "react";
import { Box , Dialog ,Portal ,Button, Text , CloseButton} from "@chakra-ui/react";
import { CapitalizedInput } from "@/components/ui/CapitalizedInput";
import { PurchaseHeaderForm } from "@/types/TransactionTypes/purchase/PurchaseHeaderType";


type SaveModalProps ={
    headerForm: PurchaseHeaderForm;
    onFormChange: <K extends keyof PurchaseHeaderForm>(
        field: K,
        value: string
    ) => void;
    isOpen:boolean;
    isClose: ()=>void;
    onConfirm: ()=>void;
}

function SaveModal({
    headerForm,
    onFormChange,
    isOpen,
    isClose,
    onConfirm
}: SaveModalProps) {
    return (
      

        <Dialog.Root open={isOpen} placement={'center'}>
            <Portal >
                <Dialog.Backdrop />
                <Dialog.Positioner>
                <Dialog.Content p={0}>
                    <Dialog.Header>
                        Are you sure you want to save this transaction?

                        
                    </Dialog.Header>

                    <Dialog.Body>
                        <Box mb={2} display={'flex'} alignItems={'center'}>
                                <Text minW={'80px'} fontSize={'xs'}> REMARK : </Text>
                            <CapitalizedInput
                                type="text"
                                placeholder="Enter Remark (Optional)"
                                field={"REMARK"}
                                value={headerForm.REMARK}
                                onChange={(field ,value) => onFormChange(field, value)}
                                size="xs"
                            />
                        </Box>

                        <Box  display={'flex'} alignItems={'center'}>
                            <Text minW={'80px'} fontSize={'xs'} >THRU : </Text>
                            <CapitalizedInput
                                type="text"
                                placeholder="Enter Thru (Optional)"
                                field={"THRU"}
                                value={headerForm.THRU}
                                onChange={(field, value) => onFormChange(field, value)}
                                size="xs"
                                
                            />
                        </Box>
                    </Dialog.Body>

                    <Dialog.Footer>
                        <Dialog.CloseTrigger asChild>
                                <Dialog.CloseTrigger asChild>
                                    <CloseButton size="sm" onClick={isClose}/>
                                </Dialog.CloseTrigger>
                        </Dialog.CloseTrigger>

                            <Button
                                colorScheme="green"
                                size="xs"
                                onClick={onConfirm}
                                px={2}
                                fontWeight="semibold"
                                borderRadius="lg"
                                boxShadow="md"
                                _hover={{
                                    bg: "green.600",
                                    transform: "translateY(-1px)",
                                    boxShadow: "lg"
                                }}
                                _active={{
                                    transform: "scale(0.96)"
                                }}
                            >
                                Continue ➠
                            </Button>
                    </Dialog.Footer>
                </Dialog.Content>
                </Dialog.Positioner>
            </Portal>
        </Dialog.Root>
     
    );
}
export default SaveModal;