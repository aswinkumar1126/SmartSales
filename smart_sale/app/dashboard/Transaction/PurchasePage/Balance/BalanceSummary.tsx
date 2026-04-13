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
import { BankTransactionModal } from "./BankTransactionModal";

import { useSalesBalanceSummary } from "@/store/sales/useSalesBalanceSummaryStore";



interface BalanceSummaryProps {
    theme: any;
    openBalance: { openCash: number; openPure: number };
    accCode: number;
    rate: number;
    closingCash: number;
    closingPure: number;
    transactionResetSignal?: boolean;
    bankAccList?: { label: string; value: string }[];
}

const BalanceSummary = ({
    theme,
    openBalance,
    accCode,
    rate,
    closingCash,
    closingPure,
    bankAccList,
}: BalanceSummaryProps) => {
    // =====================
    // ZUSTAND STORE
    // =====================
    const {
        closingDetails,
        setClosingField,
        bankModalType,
        openBankModal,
        closeBankModal,
        setBankPaid,
        setBankRcvd,
    } = useSalesBalanceSummary();

    const conversionType = closingDetails.convType;
    console.log(closingDetails,'closingDetails')

    // =====================
    // REFS
    // =====================
    const bankPaidModalOpenedRef = useRef(false);
    const bankRcvdModalOpenedRef = useRef(false);

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
    const handleChange = (field: any, value: any) => {
        setClosingField(field, value);
    };

    const handleConvTypeChange = (type: "P" | "C" | "") => {
        const newType = conversionType === type ? "" : type;

        setClosingField("convType", newType);
        setClosingField("convAmt", "");
        setClosingField("convWt", "");
    };

    const handleOpenBankPaidModal = () => {
        if (!accCode || bankPaidModalOpenedRef.current) return;

        bankPaidModalOpenedRef.current = true;
        openBankModal("paid");

        setTimeout(() => {
            bankPaidModalOpenedRef.current = false;
        }, 500);
    };

    const handleOpenBankRcvdModal = () => {
        if (!accCode || bankRcvdModalOpenedRef.current) return;

        bankRcvdModalOpenedRef.current = true;
        openBankModal("received");

        setTimeout(() => {
            bankRcvdModalOpenedRef.current = false;
        }, 500);
    };

    const closeActiveModal = () => closeBankModal();

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
                    Cash
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

                {/* Conversion Type */}
                <Text fontSize="xs" fontWeight="semibold">
                    Conv By
                </Text>

                <HStack>
                    <Checkbox.Root
                        disabled={!accCode}
                        size="xs"
                        checked={conversionType === "P"}
                        onCheckedChange={() => handleConvTypeChange("P")}
                    >
                        <Checkbox.HiddenInput />
                        <Checkbox.Control>
                            <Checkbox.Indicator />
                        </Checkbox.Control>
                        <Checkbox.Label fontSize="2xs">Pure</Checkbox.Label>
                    </Checkbox.Root>
                </HStack>

                <HStack>
                    <Checkbox.Root
                        disabled={!accCode}
                        size="xs"
                        checked={conversionType === "C"}
                        onCheckedChange={() => handleConvTypeChange("C")}
                    >
                        <Checkbox.HiddenInput />
                        <Checkbox.Control>
                            <Checkbox.Indicator />
                        </Checkbox.Control>
                        <Checkbox.Label fontSize="2xs">Cash</Checkbox.Label>
                    </Checkbox.Root>
                </HStack>

                {/* Conversion Inputs */}
                <Text fontSize="xs" fontWeight="semibold">
                    Conv
                </Text>

                <CapitalizedInput
                    field="convWt"
                    value={closingDetails.convWt}
                    onChange={(_, v) => handleChange("convWt", v)}
                    type="number"
                    allowDecimal
                    decimalScale={3}
                    size="xs"
                    rounded="sm"
                    disabled={
                        !accCode || conversionType === "C" || conversionType === ""
                    }
                />

                <CapitalizedInput
                    field="convAmt"
                    value={closingDetails.convAmt}
                    onChange={(_, v) => handleChange("convAmt", v)}
                    type="number"
                    allowDecimal
                    decimalScale={2}
                    size="xs"
                    rounded="sm"
                    disabled={
                        !accCode || conversionType === "P" || conversionType === ""
                    }
                />

                <Box />
                <Box />
                <Box />

                {/* BANK RECEIVED */}
                <Text />
                <Text />
                <VStack align="start" gap={0}>
                    <HStack justify="space-between" width="100%">
                        <Text fontSize="2xs" fontWeight="medium">
                            Bank Received
                        </Text>
                    </HStack>
                    <Box
                        onClick={handleOpenBankRcvdModal}
                        cursor={accCode ? "pointer" : "not-allowed"}
                        width="100%"
                    >
                        <CapitalizedInput
                            field="bankRcvd"
                            onChange={() => null}
                            value={closingDetails.bankRcvd}
                            type="number"
                            decimalScale={2}
                            size="xs"
                            rounded="sm"
                            disabled={!accCode}
                        />
                    </Box>

                    {closingDetails.bankRcvdDetails.length > 0 && (
                        <Badge size="xs" colorPalette="blue" fontSize="2xs">
                            {closingDetails.bankRcvdDetails.length} transaction(s)
                        </Badge>
                    )}
                </VStack>

                {/* CASH RECEIVED */}
                <Text />
                <Text />
                <VStack align="start" gap={0}>
                    <Text fontSize="2xs" fontWeight="medium">
                        Cash Received
                    </Text>
                    <CapitalizedInput
                        field="cashRcvd"
                        value={closingDetails.cashRcvd}
                        onChange={(_, v) => handleChange("cashRcvd", v)}
                        type="number"
                        decimalScale={2}
                        size="xs"
                        rounded="sm"
                        disabled={!accCode}
                    />
                </VStack>

                {/* BANK PAID */}
                <Text />
                <Text />
                <VStack align="start" gap={0}>
                    <HStack justify="space-between" width="100%">
                        <Text fontSize="2xs" fontWeight="medium">
                            Bank Paid
                        </Text>
                    </HStack>
                    <Box
                        onClick={handleOpenBankPaidModal}
                        cursor={accCode ? "pointer" : "not-allowed"}
                        width="100%"
                    >
                        <CapitalizedInput
                            value={closingDetails.bankPaid}
                            field="bankPaid"
                            onChange={() => null}
                            type="number"
                            decimalScale={2}
                            size="xs"
                            rounded="sm"
                            disabled={!accCode}
                        />
                    </Box>

                    {closingDetails.bankPaidDetails.length > 0 && (
                        <Badge size="xs" colorPalette="red" fontSize="2xs">
                            {closingDetails.bankPaidDetails.length} transaction(s)
                        </Badge>
                    )}
                </VStack>

                {/* CASH PAID */}
                <Text />
                <Text />
                <VStack align="start" gap={0}>
                    <Text fontSize="2xs" fontWeight="medium">
                        Cash Paid
                    </Text>
                    <CapitalizedInput
                        field="cashPaid"
                        value={closingDetails.cashPaid}
                        onChange={(_, v) => handleChange("cashPaid", v)}
                        type="number"
                        decimalScale={2}
                        size="xs"
                        rounded="sm"
                        disabled={!accCode}
                    />
                </VStack>

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
                    size="xs"
                    rounded="sm"
                    disabled
                />
                <CapitalizedInput
                    field="closingCash"
                    value={formatToFixed(closingCash.toString(), 2)}
                    onChange={() => null}
                    type="number"
                    size="xs"
                    rounded="sm"
                    disabled
                />
            </Grid>

            {/* =====================
          MODAL (ZUSTAND CONTROLLED)
      ===================== */}
            <BankTransactionModal
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
                        ? closingDetails.bankPaidDetails
                        : closingDetails.bankRcvdDetails
                }
                bankAccList={bankAccList}
                escapeId="bankModal"
            />
        </Box>
    );
};

export default BalanceSummary;