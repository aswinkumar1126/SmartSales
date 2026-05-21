"use client";

import React, { useRef, useState } from "react";
import {
    Box,
    Grid,
    GridItem,
    Text,
    VStack,
    HStack,
    Checkbox,
    Badge,
} from "@chakra-ui/react";

import { CapitalizedInput } from "@/components/ui/CapitalizedInput";
import { formatToFixed } from "@/utils/format/numberFormat";
// import { BankTransactionModal } from "./BankTransactionModal";

import { useSalesBalanceSummary } from "@/store/sales/useSalesBalanceSummaryStore";

import { ApprovalHeaderForm } from "@/types/TransactionTypes/approval/ApprovalHeaderType";


interface BalanceSummaryProps {
    theme: any;
    openBalance: { openCash: number; openPure: number };
    accCode: number;
    rate: number;
    closingCash: number;
    closingPure: number;
    transactionResetSignal?: boolean;
    bankAccList?: { label: string; value: string }[];
    headerForm: ApprovalHeaderForm;
    onFormChange: <K extends keyof ApprovalHeaderForm>(
        field: K,
        value: ApprovalHeaderForm[K]
    ) => void;
}

const BalanceSummary = ({
    theme,
    openBalance,
    accCode,
    rate,
    closingCash,
    closingPure,
    bankAccList,
    headerForm,
    onFormChange

}: BalanceSummaryProps) => {
    // =====================
    // ZUSTAND STORE
    // =====================
    // const {
    //     closingDetails,
    //     setClosingField,
    //     bankModalType,
    //     openBankModal,
    //     closeBankModal,
    //     setBankPaid,
    //     setBankRcvd,
    // } = useSalesBalanceSummary();

    // console.log(closingDetails, 'closingDetailsclosingDetails')


    // const conversionType = closingDetails.CONVTYPE;


    // =====================
    // REFS
    // =====================
    // const bankPaidModalOpenedRef = useRef(false);
    // const bankRcvdModalOpenedRef = useRef(false);

    // =====================
    // FORMAT VALUES
    // =====================
    const openingPure = openBalance.openPure
        ? formatToFixed(openBalance.openPure, 3)
        : "0.000";

    const openingCash = openBalance.openCash
        ? formatToFixed(openBalance.openCash, 2)
        : "0.00";

    // =====================
    // HANDLERS
    // =====================
    // const handleChange = (field: any, value: any) => {
    //     setClosingField(field, value);
    // };

    // const handleConvTypeChange = (type: "P" | "C" | "") => {
    //     const newType = conversionType === type ? "" : type;

    //     setClosingField("CONVTYPE", newType);
    //     setClosingField("CONVAMT", "");
    //     setClosingField("CONVWT", "");
    // };

    // const handleOpenBankPaidModal = () => {
    //     if (!accCode || bankPaidModalOpenedRef.current) return;

    //     bankPaidModalOpenedRef.current = true;
    //     openBankModal("paid");

    //     setTimeout(() => {
    //         bankPaidModalOpenedRef.current = false;
    //     }, 500);
    // };

    // const handleOpenBankRcvdModal = () => {
    //     if (!accCode || bankRcvdModalOpenedRef.current) return;

    //     bankRcvdModalOpenedRef.current = true;
    //     openBankModal("received");

    //     setTimeout(() => {
    //         bankRcvdModalOpenedRef.current = false;
    //     }, 500);
    // };

    // const closeActiveModal = () => closeBankModal();

    // =====================
    // UI
    // =====================
    return (
        <Box p={1} bg={theme.colors.formColor} borderRadius="md">
            <Grid templateColumns="50px 1fr 1fr" gap={2} alignItems="center">
                <GridItem />
                <Text textAlign="center" fontSize="xs" fontWeight="semibold">
                    Pure
                </Text>
                <Text textAlign="center" fontSize="xs" fontWeight="semibold">
                    Pcs
                </Text>

                {/* Opening Balance */}
                <Text fontSize="xs" fontWeight="semibold">
                    Opening Balance
                </Text>
                <CapitalizedInput
                    value={openingPure}
                    field="openPure"
                    onChange={() => { }}
                    type="number"
                    allowDecimal
                    decimalScale={3}
                    size="xs"
                    rounded="sm"
                    disabled
                />
                <CapitalizedInput
                    value={openingCash}
                    field="openCash"
                    onChange={() => { }}
                    type="number"
                    size="xs"
                    rounded="sm"
                    disabled
                />


                {/* CLOSING */}
                <Text fontWeight="semibold" fontSize="xs">
                    Closing Balance
                </Text>

                <CapitalizedInput
                    field="closingPure"
                    value={formatToFixed(closingPure.toString(), 3)}
                    onChange={() => null}
                    type="number"
                    allowDecimal
                    decimalScale={3}
                    size="sm"

                    rounded="sm"
                    disabled
                    color={Number(closingPure) > 0 ? "red.600" : "green.800"}
                    fontSize="sm"
                />
                <CapitalizedInput
                    field="closingCash"
                    value={formatToFixed(closingCash.toString(), 2)}
                    onChange={() => null}
                    type="number"
                    size="sm"
                    rounded="sm"
                    disabled
                    color={Number(closingCash) > 0 ? "red.600" : "green.800"}
                    fontSize="sm"
                />
            </Grid>
            {headerForm.CUSTOMER &&
                <Box
                    display={'flex'}
                    flexDirection={'column'}
                    mt={2}
                    p={1}
                    bg="gray.50"
                    borderRadius="md"
                    border="1px solid"
                    borderColor="gray.200"
                    gap={2}
                >

                    <Box display={'flex'} alignItems={'center'} >
                        <Text as="span" fontWeight="semibold" fontSize={'xs'} minW={'70px'}>
                            REMARK:
                        </Text>
                        <CapitalizedInput
                            value={headerForm.REMARK}
                            onChange={(_, value) => onFormChange("REMARK", value)}
                            field={"REMARK"}
                            size="xs"

                        />
                    </Box>
                    <Box display={'flex'} alignItems={'center'}>
                        <Text as="span" fontWeight="semibold" fontSize={'xs'} minW={'70px'}>

                            THRU:
                        </Text>
                        <CapitalizedInput
                            value={headerForm.THRU}
                            onChange={(_, value) => onFormChange("THRU", value)}
                            field={"THRU"}
                            size="xs"
                        />
                    </Box>

                </Box>
            }

            {/* =====================
          MODAL (ZUSTAND CONTROLLED)
      ===================== */}
            {/* <BankTransactionModal
                key={bankModalType ?? "none"}
                draftRowId={
                    bankModalType === "paid"
                        ? `bank-paid-${accCode}`
                        : `bank-rcvd-${accCode}`
                }
                isOpen={bankModalType !== null}
                onClose={closeActiveModal}
                onSave={bankModalType === "paid" ? setBankPaid : setBankRcvd}
                type={bankModalType ?? "paid"}
                theme={theme}
                accCode={accCode}
                initialTransactions={
                    bankModalType === "paid"
                        ? closingDetails.BANKPAIDDETAILS
                        : closingDetails.BANKRCVDDETAILS
                }
                bankAccList={bankAccList}
                escapeId="bankModal"
            /> */}
        </Box>
    );
};

export default BalanceSummary;