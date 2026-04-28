"use client";

import React from "react";
import { Box , Dialog ,Portal ,Button, Text} from "@chakra-ui/react";
import { CapitalizedInput } from "@/components/ui/CapitalizedInput";
import { SalesHeaderForm } from "@/types/TransactionTypes/sales/SalesHeaderType";


type SaveModalProps ={
    headerForm: SalesHeaderForm;
    onFormChange: <K extends keyof SalesHeaderForm>(
        field: K,
        value: string
    ) => void;
    isOpen:boolean;
    isClose: ()=>void;
    onConfirm: ()=>void;
}

function SalesSaveModal({
    headerForm,
    onFormChange,
    isOpen,
    isClose,
    onConfirm
}: SaveModalProps) {
    return (
      

        <Dialog.Root open={isOpen} >
            <Portal>
                <Dialog.Backdrop />
                <Dialog.Positioner>
                <Dialog.Content>
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

                    <Dialog.Footer gapX="3">
                        <Dialog.CloseTrigger asChild>
                            <Button onClick={isClose}>Cancel</Button>
                        </Dialog.CloseTrigger>

                        <Button colorScheme="green" onClick={onConfirm}>
                            Continue
                        </Button>
                    </Dialog.Footer>
                </Dialog.Content>
                </Dialog.Positioner>
            </Portal>
        </Dialog.Root>
     
    );
}
export default SalesSaveModal;